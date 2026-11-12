import { pool } from '../config/db.js';

export async function criar({
    nome,
    email,
    cpf,
    senhaHash
}, db = pool) {
    const resultado = await db.query(
      `INSERT INTO usuarios
       (nome, email, cpf, senha_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, email, cpf, criado_em`,
      [
        nome,
        email.trim().toLowerCase(),
        cpf.replace(/\D/g, ''),
        senhaHash,
      ]
    );

    return resultado.rows[0];
}

export async function buscarPorEmail(email) {
    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    return resultado.rows[0] ?? null;
}

export async function buscarPorId(id) {
    const resultado = await pool.query(
      `SELECT id, nome, email, cpf, criado_em
       FROM usuarios
       WHERE id = $1`,
      [id]
    );

    return resultado.rows[0] ?? null;
}
