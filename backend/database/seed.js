import bcrypt from 'bcrypt';
import { createHash } from 'node:crypto';
import { pool } from '../src/config/db.js';

/**
 * Seed de demonstração do App Financeiro.
 *
 * Execute na pasta backend: node database/seed.js
 *
 * ACESSO AOS USUÁRIOS FICTÍCIOS (somente desenvolvimento):
 *   E-mail: demo1@example.com | Senha: Teste1234
 *   E-mail: demo2@example.com | Senha: Teste1234
 *
 * A senha é armazenada como hash bcrypt. Cada execução redefine a senha
 * desses DOIS usuários de demonstração para Teste1234.
 *
 */

const SENHA_DEMO = 'Teste1234';

const USUARIOS = [
  {
    nome: 'Usuário Demo 1',
    email: 'demo1@example.com',
    cpf: '52998224725',
    salario: 4300,
    bolsa: 750,
    fatorDespesas: 1,
  },
  {
    nome: 'Usuário Demo 2',
    email: 'demo2@example.com',
    cpf: '11144477735',
    salario: 3200,
    bolsa: 1100,
    fatorDespesas: 0.8,
  },
];

const CATEGORIAS = {
  entrada: ['Salário', 'Bolsa', 'Renda extra', 'Reembolso', 'Outros'],
  saida: [
    'Alimentação', 'Moradia', 'Saúde', 'Mobilidade', 'Lazer',
    'Educação', 'Compras', 'Assinaturas', 'Serviços', 'Viagem', 'Outros',
  ],
};

const FONTES_DESTINOS = [
  { nome: 'Trabalho', tipo: 'renda' },
  { nome: 'Bolsa de estudos', tipo: 'renda' },
  { nome: 'Serviços autônomos', tipo: 'renda' },
  { nome: 'Conta corrente', tipo: 'conta' },
  { nome: 'Conta digital', tipo: 'conta' },
  { nome: 'Poupança', tipo: 'conta' },
  { nome: 'Cartão Nubank', tipo: 'cartao_credito', fechamento: 10, vencimento: 17, limite: 7000 },
  { nome: 'Cartão Inter', tipo: 'cartao_credito', fechamento: 25, vencimento: 5, limite: 5000 },
  { nome: 'Cartão C6', tipo: 'cartao_credito', fechamento: 6, vencimento: 13, limite: 3500 },
  { nome: 'Cartão Viagens', tipo: 'cartao_credito', fechamento: 20, vencimento: 27, limite: 10000 },
];

const DESPESAS_MENSAIS = [
  ['Aluguel', 'Moradia', 'Conta corrente', 5, 1250],
  ['Condomínio', 'Moradia', 'Conta corrente', 7, 260],
  ['Supermercado', 'Alimentação', 'Conta digital', 9, 430],
  ['Feira e hortifruti', 'Alimentação', 'Conta digital', 12, 115],
  ['Conta de energia', 'Serviços', 'Conta corrente', 11, 145],
  ['Internet residencial', 'Serviços', 'Conta corrente', 13, 110],
  ['Transporte público', 'Mobilidade', 'Conta digital', 4, 175],
  ['Farmácia', 'Saúde', 'Conta digital', 15, 65],
  ['Cinema', 'Lazer', 'Conta digital', 16, 70],
  ['Material de estudos', 'Educação', 'Conta corrente', 14, 95],
  ['Streaming', 'Assinaturas', 'Conta digital', 8, 45],
  ['Roupas', 'Compras', 'Conta digital', 17, 120],
];

const COMPRAS_CARTAO_MENSAIS = [
  ['Mercado no crédito', 'Alimentação', 'Cartão Nubank', 8, 260],
  ['Restaurante', 'Alimentação', 'Cartão Nubank', 15, 95],
  ['Combustível', 'Mobilidade', 'Cartão Inter', 9, 190],
  ['Academia', 'Saúde', 'Cartão Inter', 18, 105],
  ['Compras online', 'Compras', 'Cartão C6', 5, 145],
  ['Aplicativos', 'Assinaturas', 'Cartão C6', 12, 38],
  ['Passeio de fim de semana', 'Lazer', 'Cartão Viagens', 14, 130],
  ['Hotel e passeios', 'Viagem', 'Cartão Viagens', 22, 210],
];

const COMPRAS_PARCELADAS = [
  { nome: 'Notebook', categoria: 'Educação', cartao: 'Cartão Nubank', mes: -4, dia: 12, total: 3600, parcelas: 10 },
  { nome: 'Celular', categoria: 'Compras', cartao: 'Cartão Inter', mes: -2, dia: 16, total: 2400, parcelas: 8 },
  { nome: 'Passagens aéreas', categoria: 'Viagem', cartao: 'Cartão Viagens', mes: -1, dia: 18, total: 1800, parcelas: 6 },
  { nome: 'Curso online', categoria: 'Educação', cartao: 'Cartão C6', mes: 0, dia: 5, total: 920, parcelas: 4 },
  { nome: 'Móveis para casa', categoria: 'Moradia', cartao: 'Cartão Nubank', mes: 0, dia: 13, total: 2100, parcelas: 12 },
];

function obterMesAtualNoBrasil() {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());

  const ano = Number(partes.find((p) => p.type === 'year').value);
  const mes = Number(partes.find((p) => p.type === 'month').value);
  return { ano, mes };
}

function dataNoMes(base, deslocamento, dia) {
  const primeiroDia = new Date(Date.UTC(base.ano, base.mes - 1 + deslocamento, 1));
  const ano = primeiroDia.getUTCFullYear();
  const mes = primeiroDia.getUTCMonth();
  const ultimoDia = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  const data = new Date(Date.UTC(ano, mes, Math.min(dia, ultimoDia)));
  return data.toISOString().slice(0, 10);
}

function moeda(valor) {
  return Number(valor).toFixed(2);
}

function centavosParaMoeda(centavos) {
  return `${Math.floor(centavos / 100)}.${String(centavos % 100).padStart(2, '0')}`;
}

// UUID fixo por compra parcelada: evita criar outro grupo ao executar novamente.
function uuidDaCompra(chave) {
  const hex = createHash('sha1').update(chave).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

async function obterOuCriarUsuario(client, usuario, senhaHash) {
  const resultado = await client.query(
    `INSERT INTO usuarios (nome, email, cpf, senha_hash)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email)
     DO UPDATE SET nome = EXCLUDED.nome, senha_hash = EXCLUDED.senha_hash
     RETURNING id`,
    [usuario.nome, usuario.email, usuario.cpf, senhaHash]
  );
  return resultado.rows[0].id;
}

async function prepararCategorias(client, usuarioId) {
  const ids = new Map();

  for (const [tipo, nomes] of Object.entries(CATEGORIAS)) {
    for (const nome of nomes) {
      const resultado = await client.query(
        `INSERT INTO categorias (usuario_id, nome, tipo)
         VALUES ($1, $2, $3)
         ON CONFLICT (usuario_id, nome, tipo)
         DO UPDATE SET nome = EXCLUDED.nome
         RETURNING id`,
        [usuarioId, nome, tipo]
      );
      ids.set(`${tipo}|${nome}`, resultado.rows[0].id);
    }
  }
  return ids;
}

async function prepararFontesDestinos(client, usuarioId) {
  const ids = new Map();

  for (const fonte of FONTES_DESTINOS) {
    const resultado = await client.query(
      `INSERT INTO fontes_destinos
         (usuario_id, nome, tipo, dia_fechamento, dia_vencimento, limite)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (usuario_id, nome)
       DO UPDATE SET
         tipo = EXCLUDED.tipo,
         dia_fechamento = EXCLUDED.dia_fechamento,
         dia_vencimento = EXCLUDED.dia_vencimento,
         limite = EXCLUDED.limite
       RETURNING id`,
      [
        usuarioId,
        fonte.nome,
        fonte.tipo,
        fonte.fechamento ?? null,
        fonte.vencimento ?? null,
        fonte.limite == null ? null : moeda(fonte.limite),
      ]
    );
    ids.set(fonte.nome, resultado.rows[0].id);
  }
  return ids;
}

function montarLancamentos(usuario, usuarioId, categorias, fontes, mesBase) {
  const registros = [];

  function adicionar(tipo, descricao, valor, data, categoria, fonte, parcelaAtual = 1, totalParcelas = 1, grupo = null) {
    const categoriaId = categorias.get(`${tipo}|${categoria}`);
    const fonteDestinoId = fontes.get(fonte);

    if (!categoriaId || !fonteDestinoId) {
      throw new Error(`Categoria ou fonte não encontrada: ${categoria} / ${fonte}`);
    }

    registros.push({
      usuarioId,
      tipo,
      descricao: `SEED: ${descricao}`,
      valor,
      data,
      categoriaId,
      fonteDestinoId,
      parcelaAtual,
      totalParcelas,
      grupo,
    });
  }

  // Sete meses: mês atual e seis anteriores. Cada período tem entradas, despesas em contas e compras à vista nos quatro cartões.
  for (let mes = -6; mes <= 0; mes++) {
    const data = (dia) => dataNoMes(mesBase, mes, dia);
    const variacao = 1 + ((mes + 6) % 4) * 0.035;

    adicionar('entrada', 'Salário mensal', moeda(usuario.salario), data(5), 'Salário', 'Trabalho');
    adicionar('entrada', 'Bolsa mensal', moeda(usuario.bolsa), data(8), 'Bolsa', 'Bolsa de estudos');

    if (mes % 2 === 0) {
      adicionar('entrada', 'Projeto freelancer', moeda(320 * usuario.fatorDespesas), data(16), 'Renda extra', 'Serviços autônomos');
    }
    if (mes % 3 === 0) {
      adicionar('entrada', 'Reembolso de despesas', moeda(85), data(17), 'Reembolso', 'Trabalho');
    }

    for (const [nome, categoria, fonte, dia, valor] of DESPESAS_MENSAIS) {
      adicionar('saida', nome, moeda(valor * variacao * usuario.fatorDespesas), data(dia), categoria, fonte);
    }

    for (const [nome, categoria, cartao, dia, valor] of COMPRAS_CARTAO_MENSAIS) {
      adicionar('saida', nome, moeda(valor * variacao * usuario.fatorDespesas), data(dia), categoria, cartao);
    }
  }

  // Todas as parcelas têm a mesma descrição, UUID e datas mensais válidas.
  // Valores são divididos em centavos para evitar diferenças no somatório.
  for (const compra of COMPRAS_PARCELADAS) {
    const inicio = dataNoMes(mesBase, compra.mes, compra.dia);
    const descricao = `Compra parcelada - ${compra.nome}`;
    const grupo = uuidDaCompra(`${usuario.email}|${compra.cartao}|${descricao}|${inicio}`);
    const totalCentavos = Math.round(compra.total * usuario.fatorDespesas * 100);
    const valorBase = Math.floor(totalCentavos / compra.parcelas);
    const resto = totalCentavos % compra.parcelas;

    for (let parcela = 1; parcela <= compra.parcelas; parcela++) {
      const valorCentavos = valorBase + (parcela <= resto ? 1 : 0);
      const dataParcela = dataNoMes(mesBase, compra.mes + parcela - 1, compra.dia);

      adicionar(
        'saida', descricao, centavosParaMoeda(valorCentavos),
        dataParcela, compra.categoria, compra.cartao,
        parcela, compra.parcelas, grupo
      );
    }
  }

  return registros;
}

function chaveLancamento(registro) {
  return [
    registro.descricao,
    registro.data,
    registro.fonteDestinoId,
    registro.parcelaAtual,
    registro.totalParcelas,
  ].join('|');
}

async function inserirLancamentosFaltantes(client, usuarioId, registros) {
  const consulta = await client.query(
    `SELECT descricao,
            TO_CHAR(data, 'YYYY-MM-DD') AS data,
            fonte_destino_id,
            parcela_atual,
            total_parcelas
     FROM lancamentos
     WHERE usuario_id = $1 AND descricao LIKE 'SEED:%'`,
    [usuarioId]
  );

  const existentes = new Set(consulta.rows.map((r) => chaveLancamento({
    descricao: r.descricao,
    data: r.data,
    fonteDestinoId: r.fonte_destino_id,
    parcelaAtual: r.parcela_atual,
    totalParcelas: r.total_parcelas,
  })));

  const novos = registros.filter((r) => {
    const chave = chaveLancamento(r);
    if (existentes.has(chave)) return false;
    existentes.add(chave);
    return true;
  });

  // Inserção em lotes para diminuir as requisições ao Supabase.
  for (let i = 0; i < novos.length; i += 100) {
    const lote = novos.slice(i, i + 100);
    const parametros = [];
    const marcadores = lote.map((r) => {
      const valores = [
        r.usuarioId, r.tipo, r.descricao, r.valor, r.data,
        r.categoriaId, r.fonteDestinoId, r.parcelaAtual,
        r.totalParcelas, r.grupo,
      ];
      const inicio = parametros.length;
      parametros.push(...valores);
      return `(${valores.map((_, idx) => `$${inicio + idx + 1}`).join(', ')})`;
    });

    await client.query(
      `INSERT INTO lancamentos
        (usuario_id, tipo, descricao, valor, data, categoria_id,
         fonte_destino_id, parcela_atual, total_parcelas, grupo_parcelamento)
       VALUES ${marcadores.join(', ')}`,
      parametros
    );
  }

  return novos.length;
}

const client = await pool.connect();

try {
  await client.query('BEGIN');

  const senhaHash = await bcrypt.hash(SENHA_DEMO, 10);
  const mesBase = obterMesAtualNoBrasil();

  for (const usuario of USUARIOS) {
    // Evita duplicação em duas execuções simultâneas do mesmo seed.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`seed:${usuario.email}`]);

    const usuarioId = await obterOuCriarUsuario(client, usuario, senhaHash);
    const categorias = await prepararCategorias(client, usuarioId);
    const fontes = await prepararFontesDestinos(client, usuarioId);
    const lancamentos = montarLancamentos(usuario, usuarioId, categorias, fontes, mesBase);
    const quantidade = await inserirLancamentosFaltantes(client, usuarioId, lancamentos);

    console.log(`${usuario.email}: ${quantidade} novos lançamentos adicionados.`);
  }

  await client.query('COMMIT');
  console.log('Seed concluído! Dados anteriores preservados.');
} catch (erro) {
  await client.query('ROLLBACK');
  console.error('Erro ao executar o seed:', erro);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
