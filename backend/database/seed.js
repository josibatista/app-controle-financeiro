
import bcrypt from 'bcrypt';
import { pool } from '../src/config/db.js';

const usuarios = [
  {
    nome: 'Usuario Demo 1',
    email: 'demo1@example.com',
    cpf: '52998224725',
  },
  {
    nome: 'Usuario Demo 2',
    email: 'demo2@example.com',
    cpf: '11144477735',
  },
];

const datas = [
  '2026-09-10',
  '2026-10-10',
  '2026-11-10',
];

const client = await pool.connect();

try {
  await client.query('BEGIN');

  const senhaHash = await bcrypt.hash('Teste1234', 10);

  for (const usuario of usuarios) {
    // Cria o usuário ou recupera o existente
    const resultadoUsuario = await client.query(
      `INSERT INTO usuarios
       (nome, email, cpf, senha_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email)
       DO UPDATE SET nome = EXCLUDED.nome
       RETURNING id`,
      [
        usuario.nome,
        usuario.email,
        usuario.cpf,
        senhaHash,
      ]
    );

    const usuarioId = resultadoUsuario.rows[0].id;

    // Cria uma categoria de entrada
    const entrada = await client.query(
      `INSERT INTO categorias (usuario_id, nome, tipo)
       VALUES ($1, 'Salário', 'entrada')
       ON CONFLICT (usuario_id, nome, tipo)
       DO UPDATE SET nome = EXCLUDED.nome
       RETURNING id`,
      [usuarioId]
    );

    // Cria uma categoria de saída
    const saida = await client.query(
      `INSERT INTO categorias (usuario_id, nome, tipo)
       VALUES ($1, 'Alimentação', 'saida')
       ON CONFLICT (usuario_id, nome, tipo)
       DO UPDATE SET nome = EXCLUDED.nome
       RETURNING id`,
      [usuarioId]
    );

    // Fonte de renda
    const fonte = await client.query(
      `INSERT INTO fontes_destinos
       (usuario_id, nome, tipo)
       VALUES ($1, 'Trabalho', 'renda')
       ON CONFLICT (usuario_id, nome)
       DO UPDATE SET nome = EXCLUDED.nome
       RETURNING id`,
      [usuarioId]
    );

    // Conta para as despesas
    const conta = await client.query(
      `INSERT INTO fontes_destinos
       (usuario_id, nome, tipo)
       VALUES ($1, 'Conta corrente', 'conta')
       ON CONFLICT (usuario_id, nome)
       DO UPDATE SET nome = EXCLUDED.nome
       RETURNING id`,
      [usuarioId]
    );

    // Evita repetir os lançamentos de demonstração
    const existente = await client.query(
      `SELECT id FROM lancamentos
       WHERE usuario_id = $1
       AND descricao LIKE 'DEMO:%'
       LIMIT 1`,
      [usuarioId]
    );

    if (existente.rowCount > 0) continue;

    for (const data of datas) {
      await client.query(
        `INSERT INTO lancamentos
         (usuario_id, tipo, descricao, valor, data,
          categoria_id, fonte_destino_id)
         VALUES ($1, 'entrada', 'DEMO: Salário', 2500, $2, $3, $4)`,
        [
          usuarioId,
          data,
          entrada.rows[0].id,
          fonte.rows[0].id,
        ]
      );

      await client.query(
        `INSERT INTO lancamentos
         (usuario_id, tipo, descricao, valor, data,
          categoria_id, fonte_destino_id)
         VALUES ($1, 'saida', 'DEMO: Alimentação', 450, $2, $3, $4)`,
        [
          usuarioId,
          data,
          saida.rows[0].id,
          conta.rows[0].id,
        ]
      );
    }
  }

  await client.query('COMMIT');
  console.log('Seed executado com sucesso!');
} catch (erro) {
  await client.query('ROLLBACK');
  console.error('Erro no seed:', erro.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
