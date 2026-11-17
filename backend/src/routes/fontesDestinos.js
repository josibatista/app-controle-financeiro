import { Router } from 'express';
import { pool } from '../config/db.js';
import * as FonteDestino from '../models/fonteDestino.js';
import {
  identificarUsuarioDev,
} from '../middlewares/identificarUsuarioDev.js';

const router = Router();

router.use(identificarUsuarioDev);

function erroHttp(status, mensagem) {
  return Object.assign(new Error(mensagem), { status });
}

function lerId(valor) {
  if (!/^[1-9]\d*$/.test(valor)) {
    throw erroHttp(400, 'ID inválido.');
  }

  const id = Number(valor);

  if (!Number.isInteger(id) || id > 2147483647) {
    throw erroHttp(400, 'ID inválido.');
  }

  return id;
}

function lerDia(valor) {
  if (
    !['number', 'string'].includes(typeof valor) ||
    !/^\d{1,2}$/.test(String(valor))
  ) {
    return null;
  }

  const dia = Number(valor);

  return dia >= 1 && dia <= 31 ? dia : null;
}

function lerLimite(valor) {
  if (!['number', 'string'].includes(typeof valor)) return null;

  const texto = String(valor).trim().replace(',', '.');

  if (!/^\d{1,10}(\.\d{1,2})?$/.test(texto)) return null;

  const [inteiro, decimal = ''] = texto.split('.');
  const centavos =
    Number(inteiro) * 100 + Number(decimal.padEnd(2, '0'));

  return (centavos / 100).toFixed(2);
}

function validar(body) {
  const nome =
    typeof body?.nome === 'string' ? body.nome.trim() : '';
  const tipo = body?.tipo;
  const erros = {};

  if (!nome) {
    erros.nome = 'Informe o nome.';
  } else if (Array.from(nome).length > 60) {
    erros.nome = 'Use até 60 caracteres.';
  }

  if (!['renda', 'conta', 'cartao_credito'].includes(tipo)) {
    erros.tipo = 'Selecione um tipo válido.';
  }

  let diaFechamento = null;
  let diaVencimento = null;
  let limite = null;

  if (tipo === 'cartao_credito') {
    diaFechamento = lerDia(body.dia_fechamento);
    diaVencimento = lerDia(body.dia_vencimento);
    limite = lerLimite(body.limite);

    if (diaFechamento === null) {
      erros.dia_fechamento = 'Informe um dia inteiro de 1 a 31.';
    }

    if (diaVencimento === null) {
      erros.dia_vencimento = 'Informe um dia inteiro de 1 a 31.';
    }

    if (limite === null) {
      erros.limite =
        'Informe um limite não negativo com até duas casas decimais.';
    }
  }

  return {
    erros,
    dados: {
      nome,
      tipo,
      diaFechamento,
      diaVencimento,
      limite,
    },
  };
}

router.get('/', async (req, res) => {
  res.json(await FonteDestino.listar(req.usuarioId));
});

router.post('/', async (req, res) => {
  const { dados, erros } = validar(req.body);

  if (Object.keys(erros).length) {
    return res.status(400).json({
      mensagem: 'Confira os campos informados.',
      erros,
    });
  }

  const item = await FonteDestino.criar(req.usuarioId, dados);

  return res.status(201).json(item);
});

router.put('/:id', async (req, res) => {
  const id = lerId(req.params.id);
  const { dados, erros } = validar(req.body);

  if (Object.keys(erros).length) {
    return res.status(400).json({
      mensagem: 'Confira os campos informados.',
      erros,
    });
  }

  const client = await pool.connect();
  let atualizado;

  try {
    await client.query('BEGIN');

    const atual = await FonteDestino.bloquearPorId(
      id,
      req.usuarioId,
      client
    );

    if (!atual) {
      throw erroHttp(404, 'Fonte/destino não encontrado.');
    }

    if (
      atual.tipo !== dados.tipo &&
      await FonteDestino.temLancamentos(id, client)
    ) {
      throw erroHttp(
        409,
        'Não é possível alterar o tipo de uma fonte/destino com lançamentos vinculados.'
      );
    }

    atualizado = await FonteDestino.atualizar(
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

  return res.json(atualizado);
});

router.delete('/:id', async (req, res) => {
  const id = lerId(req.params.id);
  const excluiu = await FonteDestino.excluir(id, req.usuarioId);

  if (!excluiu) {
    return res.status(404).json({
      mensagem: 'Fonte/destino não encontrado.',
    });
  }

  return res.status(204).end();
});

// Tratamento específico para não receber mensagens de categorias.
router.use((erro, req, res, next) => {
  if (erro.code === '23505') {
    return res.status(409).json({
      mensagem: 'Já existe uma fonte/destino com esse nome na sua conta.',
    });
  }

  if (erro.code === '23503') {
    return res.status(409).json({
      mensagem:
        'Este registro possui lançamentos vinculados e não pode ser excluído.',
    });
  }

  next(erro);
});

export default router;