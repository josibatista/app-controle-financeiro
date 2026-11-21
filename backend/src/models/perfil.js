import { pool } from '../config/db.js';

export async function buscar(usuarioId, db = pool) {
  const resultado = await db.query(
    `SELECT id, nome, email, cpf
     FROM usuarios
     WHERE id = $1`,
    [usuarioId]
  );

  return resultado.rows[0] ?? null;
}

export async function atualizarDados(usuarioId, { nome, email }, db = pool) {
  const resultado = await db.query(
    `UPDATE usuarios
     SET nome = $1, email = $2
     WHERE id = $3
     RETURNING id, nome, email, cpf`,
    [nome, email, usuarioId]
  );

  return resultado.rows[0] ?? null;
}

export async function buscarSenhaHash(usuarioId, db = pool) {
  const resultado = await db.query(
    'SELECT senha_hash FROM usuarios WHERE id = $1',
    [usuarioId]
  );

  return resultado.rows[0]?.senha_hash ?? null;
}

export async function atualizarSenha(usuarioId, senhaHash, db = pool) {
  const resultado = await db.query(
    'UPDATE usuarios SET senha_hash = $1 WHERE id = $2',
    [senhaHash, usuarioId]
  );

  return resultado.rowCount > 0;
}

export async function excluirConta(usuarioId, senhaHash) {
  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');

    // Bloqueia o usuário e confirma que a senha não foi alterada entre a validação e a exclusão.
    const usuario = await cliente.query(
      `SELECT id
       FROM usuarios
       WHERE id = $1 AND senha_hash = $2
       FOR UPDATE`,
      [usuarioId, senhaHash]
    );

    if (usuario.rowCount === 0) {
      await cliente.query('ROLLBACK');
      return false;
    }

    // Os lançamentos precisam ser removidos antes, pois possuem referências a categorias e fontes.
    await cliente.query(
      'DELETE FROM lancamentos WHERE usuario_id = $1',
      [usuarioId]
    );

    // A exclusão do usuário remove suas categorias e fontes/destinos por meio do ON DELETE CASCADE.
    await cliente.query(
      'DELETE FROM usuarios WHERE id = $1',
      [usuarioId]
    );

    await cliente.query('COMMIT');
    return true;
  } catch (erro) {
    await cliente.query('ROLLBACK');
    throw erro;
  } finally {
    cliente.release();
  }
}