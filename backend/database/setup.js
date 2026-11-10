import { readFile } from 'node:fs/promises';
import { pool } from '../src/config/db.js';

// Lê o arquivo SQL
const sql = await readFile(
  new URL('./schema.sql', import.meta.url),
  'utf8'
);

try {
  // Executa os comandos SQL no Postgre
  await pool.query(sql);

  console.log('Tabelas criadas com sucesso!');
} catch (erro) {
  console.error('Erro ao criar as tabelas:', erro.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
