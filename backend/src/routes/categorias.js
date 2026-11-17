import { Router } from 'express';
import { pool } from '../config/db.js';
import * as Categoria from '../models/categoria.js';
import { identificarUsuarioDev } from '../middlewares/identificarUsuarioDev.js';

const router = Router();

router.use(identificarUsuarioDev);

function erroHttp(status, mensagem) {
  return Object.assign(new Error(mensagem), { status });
}

function lerId(valor) {
  if (!/^[1-9]\d*$/.test(valor)) {
    throw erroHttp(400, 'ID da categoria inválido.');
  }

  const id = Number(valor);

  if (!Number.isInteger(id) || id > 2147483647) {
    throw erroHttp(400, 'ID da categoria inválido.');
  }

  return id;
}

function validarDados(body) {
  const nome = typeof body?.nome === 'string' ? body.nome.trim() : '';
  const tipo = body?.tipo;
  const erros = {};

  if (!nome) {
    erros.nome = 'Informe o nome da categoria.';
  } else if (Array.from(nome).length > 60) {
    erros.nome = 'Use até 60 caracteres.';
  }

  if (!['entrada', 'saida'].includes(tipo)) {
    erros.tipo = 'Selecione Entrada ou Saída.';
  }

  return {
    dados: { nome, tipo },
    erros,
  };
}

router.get('/', async (req, res) => {
  const categorias = await Categoria.listar(req.usuarioId);
  res.json(categorias);
});

router.post('/', async (req, res) => {
  const { dados, erros } = validarDados(req.body);

  if (Object.keys(erros).length) {
    return res.status(400).json({
      mensagem: 'Confira os campos informados.',
      erros,
    });
  }

  const categoria = await Categoria.criar(req.usuarioId, dados);

  return res.status(201).json(categoria);
});

router.put('/:id', async (req, res) => {
  const id = lerId(req.params.id);
  const { dados, erros } = validarDados(req.body);

  if (Object.keys(erros).length) {
    return res.status(400).json({
      mensagem: 'Confira os campos informados.',
      erros,
    });
  }

  const client = await pool.connect();
  let categoria;

  try {
    await client.query('BEGIN');

    const atual = await Categoria.bloquearPorId(
      id,
      req.usuarioId,
      client
    );

    if (!atual) {
      throw erroHttp(404, 'Categoria não encontrada.');
    }

    if (
      atual.tipo !== dados.tipo &&
      await Categoria.temLancamentos(id, client)
    ) {
      throw erroHttp(
        409,
        'Não é possível alterar o tipo de uma categoria com lançamentos associados.'
      );
    }

    categoria = await Categoria.atualizar(
      id,
      req.usuarioId,
      dados,
      client
    );

    await client.query('COMMIT');
  } catch (erro) {
    await client.query('ROLLBACK');
    throw erro;
  } finally {
    client.release();
  }

  return res.json(categoria);
});

router.delete('/:id', async (req, res) => {
  const id = lerId(req.params.id);

  // A chave estrangeira do banco impede a exclusão quando existem lançamentos associados.
  const excluiu = await Categoria.excluir(id, req.usuarioId);

  if (!excluiu) {
    return res.status(404).json({
      mensagem: 'Categoria não encontrada.',
    });
  }

  return res.status(204).end();
});

export default router;