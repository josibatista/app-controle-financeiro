import { Router } from 'express';
import {
  listarPorCategoria,
  listarPorFonteDestino
} from '../models/relatorio.js';
import { identificarUsuarioDev } from '../middlewares/identificarUsuarioDev.js';

const router = Router();

router.use(identificarUsuarioDev);

function validarPeriodo(inicio, fim) {
  const formatoData = /^\d{4}-\d{2}-\d{2}$/;

  if (
    typeof inicio !== 'string' ||
    typeof fim !== 'string' ||
    !formatoData.test(inicio) ||
    !formatoData.test(fim)
  ) {
    return false;
  }

  const dataInicio = new Date(`${inicio}T00:00:00Z`);
  const dataFim = new Date(`${fim}T00:00:00Z`);

  return (
    !Number.isNaN(dataInicio.getTime()) &&
    !Number.isNaN(dataFim.getTime()) &&
    dataInicio.toISOString().slice(0, 10) === inicio &&
    dataFim.toISOString().slice(0, 10) === fim &&
    dataInicio <= dataFim
  );
}

//relatório por categoria
router.get('/categorias', async (req, res) => {
  try {
    const { inicio, fim } = req.query;

    //verifica se o período foi informado corretamente.
    if (!validarPeriodo(inicio, fim)) {
      return res.status(400).json({
        erro: 'Informe um período válido com data inicial e final.'
      });
    }

    //busca os dados do relatório no banco.
    const relatorio = await listarPorCategoria(
      req.usuarioId,
      { inicio, fim }
    );

    return res.status(200).json(relatorio);

  } catch (erro) {
    console.error('Erro ao consultar relatório por categoria:', erro);

    return res.status(500).json({
      erro: 'Não foi possível consultar o relatório por categoria.'
    });
  }
});

//relatório por fontes e destinos
router.get('/fontes-destinos', async (req, res) => {
  try {
    const { inicio, fim } = req.query;

    //verifica se o período foi informado corretamente.
    if (!validarPeriodo(inicio, fim)) {
      return res.status(400).json({
        erro: 'Informe um período válido com data inicial e final.'
      });
    }

    //busca os dados do relatório no banco.
    const relatorio = await listarPorFonteDestino(
        req.usuarioId,
      { inicio, fim }
    );

    return res.status(200).json(relatorio);

  } catch (erro) {
    console.error('Erro ao consultar relatório por fontes e destinos:', erro);

    return res.status(500).json({
      erro: 'Não foi possível consultar o relatório por fontes e destinos.'
    });
  }
});

export default router;