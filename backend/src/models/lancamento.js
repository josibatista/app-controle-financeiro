import { pool } from '../config/db.js';

// Função interna: verifica a posse das entidades relacionadas
// e a compatibilidade entre categoria e lançamento.
async function validarRelacionamentos(
  usuarioId,
  tipo,
  categoriaId,
  fonteDestinoId,
  db
) {
  const resultado = await db.query(
    `SELECT
       c.tipo AS categoria_tipo,
       f.tipo AS fonte_tipo
     FROM categorias c
     CROSS JOIN fontes_destinos f
     WHERE c.id = $1
       AND c.usuario_id = $2
       AND f.id = $3
       AND f.usuario_id = $2`,
    [categoriaId, usuarioId, fonteDestinoId]
  );

  const relacionamento = resultado.rows[0];

  if (!relacionamento) {
    const erro = new Error(
      'Categoria ou fonte/destino inexistente ou de outro usuário.'
    );

    erro.code = 'RELACIONAMENTO_INVALIDO';
    throw erro;
  }

  if (relacionamento.categoria_tipo !== tipo) {
    const erro = new Error(
      'O tipo da categoria deve ser igual ao tipo do lançamento.'
    );

    erro.code = 'TIPO_INCOMPATIVEL';
    throw erro;
  }

  return relacionamento;
}

export async function listar(
  usuarioId,
  {
    inicio,
    fim,
    tipo,
    categoriaId,
    fonteDestinoId,
    pagina = 1,
    limite = 20,
  } = {},
  db = pool
) {
  if (!Number.isInteger(pagina) || pagina < 1) {
    throw new Error('A página deve ser um número inteiro positivo.');
  }

  if (!Number.isInteger(limite) || limite < 1 || limite > 100) {
    throw new Error('O limite deve ser um inteiro entre 1 e 100.');
  }

  const condicoes = ['usuario_id = $1'];
  const valores = [usuarioId];

  function adicionarFiltro(condicao, valor) {
    if (valor !== undefined && valor !== null && valor !== '') {
      valores.push(valor);
      condicoes.push(`${condicao} $${valores.length}`);
    }
  }

  adicionarFiltro('data >=', inicio);
  adicionarFiltro('data <=', fim);
  adicionarFiltro('tipo =', tipo);
  adicionarFiltro('categoria_id =', categoriaId);
  adicionarFiltro('fonte_destino_id =', fonteDestinoId);

  valores.push(limite);
  const parametroLimite = `$${valores.length}`;

  valores.push((pagina - 1) * limite);
  const parametroOffset = `$${valores.length}`;

  const resultado = await db.query(
    `SELECT *
     FROM lancamentos
     WHERE ${condicoes.join(' AND ')}
     ORDER BY data DESC, id DESC
     LIMIT ${parametroLimite}
     OFFSET ${parametroOffset}`,
    valores
  );

  return resultado.rows;
}

export async function buscarPorId(id, usuarioId, db = pool) {
  const resultado = await db.query(
    `SELECT *
     FROM lancamentos
     WHERE id = $1 AND usuario_id = $2`,
    [id, usuarioId]
  );

  return resultado.rows[0] ?? null;
}

export async function criar(
  usuarioId,
  {
    tipo,
    descricao,
    valor,
    data,
    categoriaId,
    fonteDestinoId,
    parcelaAtual = 1,
    totalParcelas = 1,
    grupoParcelamento = null,
  },
  db = pool
) {
  await validarRelacionamentos(
    usuarioId,
    tipo,
    categoriaId,
    fonteDestinoId,
    db
  );

  const resultado = await db.query(
    `INSERT INTO lancamentos
       (usuario_id, tipo, descricao, valor, data,
        categoria_id, fonte_destino_id,
        parcela_atual, total_parcelas, grupo_parcelamento)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      usuarioId,
      tipo,
      descricao.trim(),
      valor,
      data,
      categoriaId,
      fonteDestinoId,
      parcelaAtual,
      totalParcelas,
      grupoParcelamento,
    ]
  );

  return resultado.rows[0];
}

export async function atualizar(
  id,
  usuarioId,
  {
    tipo,
    descricao,
    valor,
    data,
    categoriaId,
    fonteDestinoId,
  },
  db = pool
) {
  await validarRelacionamentos(
    usuarioId,
    tipo,
    categoriaId,
    fonteDestinoId,
    db
  );

  const resultado = await db.query(
    `UPDATE lancamentos
     SET tipo = $1,
         descricao = $2,
         valor = $3,
         data = $4,
         categoria_id = $5,
         fonte_destino_id = $6
     WHERE id = $7 AND usuario_id = $8
     RETURNING *`,
    [
      tipo,
      descricao.trim(),
      valor,
      data,
      categoriaId,
      fonteDestinoId,
      id,
      usuarioId,
    ]
  );

  return resultado.rows[0] ?? null;
}

export async function excluir(id, usuarioId, db = pool) {
  const resultado = await db.query(
    `DELETE FROM lancamentos
     WHERE id = $1 AND usuario_id = $2`,
    [id, usuarioId]
  );

  return resultado.rowCount > 0;
}

export async function excluirGrupo(
  grupoParcelamento,
  usuarioId,
  db = pool
) {
  const resultado = await db.query(
    `DELETE FROM lancamentos
     WHERE grupo_parcelamento = $1 AND usuario_id = $2`,
    [grupoParcelamento, usuarioId]
  );

  return resultado.rowCount;
}
