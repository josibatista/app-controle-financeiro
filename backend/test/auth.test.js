import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import test from 'node:test';
import pg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validarCadastro, cpfValido } from '../src/models/validarUsuario.js';

process.env.NODE_ENV = 'test';

function gerarCpf() {
  const digitos = Array.from(randomBytes(9), (numero) => numero % 10);
  for (const tamanho of [9, 10]) {
    const soma = digitos.reduce(
      (total, numero, i) => total + numero * (tamanho + 1 - i),
      0,
    );
    digitos.push(((soma * 10) % 11) % 10);
  }
  return digitos.join('');
}

function cadastro(alteracoes = {}) {
  return {
    nome: 'Pessoa Teste',
    email: `${randomBytes(8).toString('hex')}@example.test`,
    cpf: gerarCpf(),
    senha: 'Teste-local-123',
    confirmacaoSenha: 'Teste-local-123',
    ...alteracoes,
  };
}

test('valida os cinco campos, CPF e senha antes de consultar o banco', () => {
  assert.equal(Object.keys(validarCadastro({}).erros).length, 5);
  const dados = cadastro();
  assert.ok(cpfValido(dados.cpf));
  assert.deepEqual(validarCadastro(dados).erros, {});
  for (const cpf of ['0'.repeat(11), dados.cpf.slice(0, 10), `${dados.cpf}abc`]) {
    assert.ok(validarCadastro({ ...dados, cpf }).erros.cpf);
  }
  assert.ok(validarCadastro({ ...dados, email: 'sem-arroba' }).erros.email);
  assert.ok(validarCadastro({ ...dados, nome: {} }).erros.nome);
  assert.ok(validarCadastro({ ...dados, senha: 'apenasletras' }).erros.senha);
  assert.ok(validarCadastro({ ...dados, senha: 'A1'.repeat(40) }).erros.senha);
  assert.ok(
    validarCadastro({ ...dados, confirmacaoSenha: 'Diferente123' }).erros
      .confirmacaoSenha,
  );
});

test(
  'autenticacao com PostgreSQL e rotas integradas',
  {
    skip:
      !process.env.TEST_DATABASE_URL &&
      'Defina TEST_DATABASE_URL para executar a integração.',
  },
  async (t) => {
    const administrador = new pg.Pool({
      connectionString: process.env.TEST_DATABASE_URL,
    });
    const schema = `auth_test_${randomBytes(8).toString('hex')}`;
    const url = new URL(process.env.TEST_DATABASE_URL);
    url.searchParams.set('options', `-c search_path=${schema}`);
    process.env.DATABASE_URL = url.toString();
    const segredo = randomBytes(32).toString('hex');
    const seguranca = {
      jwtSecret: segredo,
      origens: ['http://localhost:5173'],
      duracaoToken: 3600,
    };
    let pool;
    let servidor;

    try {
      await administrador.query(`CREATE SCHEMA ${schema}`);
      ({ pool } = await import('../src/config/db.js'));
      await pool.query(
        await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8'),
      );
      const { criarApp } = await import('../src/server.js');
      servidor = criarApp(seguranca).listen(0, '127.0.0.1');
      await once(servidor, 'listening');
      const base = `http://127.0.0.1:${servidor.address().port}/api`;

      async function chamar(caminho, { body, token, method = 'GET', headers = {} } = {}) {
        const resposta = await fetch(base + caminho, {
          method,
          headers: {
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
        });
        const dados = resposta.status === 204 ? null : await resposta.json();
        assert.ok(!JSON.stringify(dados).includes('senha_hash'));
        if (resposta.status >= 400) {
          assert.equal(typeof dados.mensagem, 'string');
          assert.ok(
            Object.keys(dados).every((chave) => ['mensagem', 'erros'].includes(chave)),
          );
        }
        return { status: resposta.status, dados, headers: resposta.headers };
      }

      const pessoa = cadastro();
      let usuario;
      let token;
      let segundo;
      let tokenSegundo;

      await t.test('cadastro persiste hash, categorias e conta corrente', async () => {
        const resposta = await chamar('/auth/cadastro', { method: 'POST', body: pessoa });
        assert.equal(resposta.status, 201);
        usuario = resposta.dados;
        assert.deepEqual(Object.keys(usuario).sort(), ['email', 'id', 'nome']);
        const gravado = (
          await pool.query('SELECT senha_hash FROM usuarios WHERE id = $1', [usuario.id])
        ).rows[0];
        assert.notEqual(gravado.senha_hash, pessoa.senha);
        assert.equal(await bcrypt.compare(pessoa.senha, gravado.senha_hash), true);
        assert.equal(
          Number(
            (
              await pool.query('SELECT count(*) FROM categorias WHERE usuario_id = $1', [
                usuario.id,
              ])
            ).rows[0].count,
          ),
          9,
        );
        assert.equal(
          (
            await pool.query('SELECT nome FROM fontes_destinos WHERE usuario_id = $1', [
              usuario.id,
            ])
          ).rows[0].nome,
          'Conta corrente',
        );
      });

      await t.test('duplicidade informa o campo e nao grava dados parciais', async () => {
        for (const campo of ['email', 'cpf']) {
          const dados = cadastro({
            [campo]: campo === 'email' ? pessoa.email.toUpperCase() : pessoa.cpf,
          });
          const resposta = await chamar('/auth/cadastro', {
            method: 'POST',
            body: dados,
          });
          assert.equal(resposta.status, 409);
          assert.deepEqual(Object.keys(resposta.dados.erros), [campo]);
        }
        assert.equal(
          Number((await pool.query('SELECT count(*) FROM usuarios')).rows[0].count),
          1,
        );
      });

      await t.test('falha ao criar os padroes desfaz usuario e categorias', async () => {
        const dados = cadastro();
        await pool.query(
          "ALTER TABLE fontes_destinos ADD CONSTRAINT falha_teste CHECK (nome <> 'Conta corrente') NOT VALID",
        );
        try {
          const resposta = await chamar('/auth/cadastro', {
            method: 'POST',
            body: dados,
          });
          assert.equal(resposta.status, 500);
          assert.equal(
            (await pool.query('SELECT id FROM usuarios WHERE email = $1', [dados.email]))
              .rowCount,
            0,
          );
          assert.equal(
            Number((await pool.query('SELECT count(*) FROM categorias')).rows[0].count),
            9,
          );
        } finally {
          await pool.query('ALTER TABLE fontes_destinos DROP CONSTRAINT falha_teste');
        }
      });

      await t.test('validacoes sao realizadas no servidor', async () => {
        const resposta = await chamar('/auth/cadastro', { method: 'POST', body: {} });
        assert.equal(resposta.status, 400);
        assert.equal(Object.keys(resposta.dados.erros).length, 5);
      });

      await t.test('login usa mensagem generica e emite JWT com expiracao', async () => {
        const errada = await chamar('/auth/login', {
          method: 'POST',
          body: { email: pessoa.email, senha: 'Senha-incorreta-1' },
        });
        const inexistente = await chamar('/auth/login', {
          method: 'POST',
          body: { email: 'inexistente@example.test', senha: 'Senha-incorreta-1' },
        });
        assert.equal(errada.status, 401);
        assert.deepEqual(errada.dados, inexistente.dados);
        const resposta = await chamar('/auth/login', {
          method: 'POST',
          body: { email: pessoa.email, senha: pessoa.senha },
        });
        assert.equal(resposta.status, 200);
        token = resposta.dados.token;
        const payload = jwt.verify(token, segredo);
        assert.equal(payload.sub, String(usuario.id));
        assert.equal(payload.exp - payload.iat, 3600);
        const me = await chamar('/auth/me', { token });
        assert.equal(me.dados.id, usuario.id);
        assert.equal(me.dados.expiraEm, payload.exp * 1000);
        assert.equal(me.dados.cpf, undefined);
      });

      await t.test(
        'rotas privadas rejeitam ausencia, adulteracao e expiracao do token',
        async () => {
          for (const caminho of [
            '/auth/me',
            '/categorias',
            '/fontes-destinos',
            '/lancamentos',
            '/faturas',
            '/relatorios/categorias',
          ]) {
            assert.equal((await chamar(caminho)).status, 401);
          }
          const expirado = jwt.sign({}, segredo, {
            subject: String(usuario.id),
            expiresIn: -1,
            issuer: 'controle-financeiro',
            audience: 'controle-financeiro-web',
          });
          for (const invalido of [
            'invalido',
            expirado,
            `${token.slice(0, -8)}xxxxxxxx`,
          ]) {
            assert.equal((await chamar('/auth/me', { token: invalido })).status, 401);
          }
        },
      );

      await t.test(
        'duas contas mantem categorias lancamentos e relatorios separados',
        async () => {
          const dados = cadastro();
          segundo = (await chamar('/auth/cadastro', { method: 'POST', body: dados }))
            .dados;
          tokenSegundo = (await chamar('/auth/login', { method: 'POST', body: dados }))
            .dados.token;
          const categorias = (await chamar('/categorias', { token })).dados;
          const fontes = (await chamar('/fontes-destinos', { token })).dados;
          const dadosLancamento = {
            tipo: 'entrada',
            descricao: 'Entrada de teste',
            valor: '123.45',
            data: '2026-11-16',
            categoriaId: categorias.find((item) => item.tipo === 'entrada').id,
            fonteDestinoId: fontes[0].id,
            usuarioId: segundo.id,
          };
          const resposta = await chamar('/lancamentos', {
            token,
            method: 'POST',
            body: dadosLancamento,
          });
          assert.equal(resposta.status, 201);
          const a = await chamar('/lancamentos/resumo?inicio=2026-11-01&fim=2026-11-30', {
            token,
          });
          const b = await chamar('/lancamentos/resumo?inicio=2026-11-01&fim=2026-11-30', {
            token: tokenSegundo,
          });
          assert.equal(Number(a.dados.totalEntradas), 123.45);
          assert.equal(Number(b.dados.totalEntradas), 0);
          const acessoAlheio = await chamar(`/categorias/${categorias[0].id}`, {
            token: tokenSegundo,
            method: 'PUT',
            body: { nome: 'Outra', tipo: 'entrada' },
          });
          assert.equal(acessoAlheio.status, 404);
          for (const tipo of ['categorias', 'fontes-destinos']) {
            const relatorio = await chamar(
              `/relatorios/${tipo}?inicio=2026-11-01&fim=2026-11-30`,
              { token: tokenSegundo },
            );
            assert.equal(relatorio.status, 200);
            assert.ok(!JSON.stringify(relatorio.dados).includes('123.45'));
          }
        },
      );

      await t.test('rotas usam o mesmo formato de erro', async () => {
        for (const caminho of ['/categorias', '/fontes-destinos', '/lancamentos']) {
          const resposta = await chamar(caminho, { method: 'POST', token, body: {} });
          assert.equal(resposta.status, 400);
          assert.ok(Object.keys(resposta.dados.erros).length > 0);
        }
        assert.equal(
          (await chamar('/relatorios/categorias?inicio=invalido', { token })).status,
          400,
        );
        assert.equal((await chamar('/rota-inexistente', { token })).status, 404);
        const duplicada = await chamar('/categorias', {
          token,
          method: 'POST',
          body: { nome: 'Salário', tipo: 'entrada' },
        });
        assert.equal(duplicada.status, 409);

        for (const [body, status] of [
          ['{', 400],
          [JSON.stringify({ nome: 'a'.repeat(17000) }), 413],
        ]) {
          const resposta = await fetch(base + '/auth/cadastro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
          });
          assert.equal(resposta.status, status);
          assert.equal(typeof (await resposta.json()).mensagem, 'string');
        }
      });

      await t.test(
        'cliente do frontend recebe mensagem e erros do cadastro',
        async () => {
          const fetchOriginal = globalThis.fetch;
          const storageOriginal = globalThis.sessionStorage;
          const armazenamento = new Map();
          globalThis.sessionStorage = {
            getItem: (chave) => armazenamento.get(chave) ?? null,
            setItem: (chave, valor) => armazenamento.set(chave, valor),
            removeItem: (chave) => armazenamento.delete(chave),
          };
          globalThis.fetch = (url, opcoes) => fetchOriginal(new URL(url, base), opcoes);
          try {
            const { api, salvarToken, lerToken } =
              await import('../../frontend/src/services/api.js');
            await assert.rejects(
              api('/auth/cadastro', {
                method: 'POST',
                publica: true,
                body: cadastro({ email: pessoa.email }),
              }),
              (erro) => erro.status === 409 && typeof erro.erros.email === 'string',
            );
            salvarToken(token);
            assert.equal((await api('/auth/me')).id, usuario.id);
            salvarToken('token-invalido');
            await assert.rejects(api('/auth/me'), (erro) => erro.status === 401);
            assert.equal(lerToken(), null);
          } finally {
            globalThis.fetch = fetchOriginal;
            if (storageOriginal === undefined) delete globalThis.sessionStorage;
            else globalThis.sessionStorage = storageOriginal;
          }
        },
      );

      await t.test(
        'chave estrangeira inexistente difere de exclusao com vinculo',
        async () => {
          const fontes = (await chamar('/fontes-destinos', { token })).dados;
          const vinculada = await chamar(`/fontes-destinos/${fontes[0].id}`, {
            token,
            method: 'DELETE',
          });
          assert.equal(vinculada.status, 409);
          assert.match(vinculada.dados.mensagem, /excluído/);

          await pool.query('DELETE FROM usuarios WHERE id = $1', [segundo.id]);
          const inexistente = await chamar('/fontes-destinos', {
            token: tokenSegundo,
            method: 'POST',
            body: { nome: 'Conta de teste', tipo: 'conta' },
          });
          assert.equal(inexistente.status, 400);
          assert.match(inexistente.dados.mensagem, /relacionados não existe/);
          assert.ok(!inexistente.dados.mensagem.includes('excluído'));
        },
      );

      await t.test('CORS permite apenas origens configuradas', async () => {
        const permitido = await chamar('/auth/me', {
          token,
          headers: { Origin: 'http://localhost:5173' },
        });
        assert.equal(
          permitido.headers.get('access-control-allow-origin'),
          'http://localhost:5173',
        );
        const negado = await chamar('/auth/me', {
          token,
          headers: { Origin: 'https://outra-origem.example' },
        });
        assert.equal(negado.status, 403);
        assert.equal(negado.headers.get('access-control-allow-origin'), null);
      });

      await t.test('limita tentativas de login com resposta 429', async () => {
        let resposta;
        for (let i = 0; i < 11; i += 1) {
          resposta = await chamar('/auth/login', {
            method: 'POST',
            body: { email: pessoa.email, senha: 'Errada123' },
          });
          if (resposta.status === 429) break;
        }
        assert.equal(resposta.status, 429);
        assert.ok(resposta.headers.get('retry-after'));
      });
    } finally {
      if (servidor) await new Promise((resolve) => servidor.close(resolve));
      if (pool) await pool.end();
      await administrador.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await administrador.end();
    }
  },
);
