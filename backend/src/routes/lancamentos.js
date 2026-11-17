import { Router } from 'express';
import * as Lancamento from '../models/lancamento.js';
import { autenticar } from '../middlewares/autenticar.js';

const router = Router();

router.use(autenticar);

function erroHttp(status, mensagem) {
  return Object.assign(new Error(mensagem), { status });
}

function lerId(valor, entidade = 'lançamento') {
  if (!/^[1-9]\d*$/.test(String(valor))) {
    throw erroHttp(400, `ID de ${entidade} inválido.`);
  }

  const id = Number(valor);

  if (!Number.isInteger(id) || id > 2147483647) {
    throw erroHttp(400, `ID de ${entidade} inválido.`);
  }

  return id;
}

function validarData(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }

  const [ano, mes, dia] = valor.split('-').map(Number);

  const data = new Date(Date.UTC(ano, mes - 1, dia));

  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  );
}

function lerValorEmCentavos(valor) {
  if (
    typeof valor !== 'string' ||
    !/^\d{1,10}([,.]\d{1,2})?$/.test(valor)
  ) {
    return null;
  }

  const texto = valor.replace(',', '.');
  const [inteiro, decimal = ''] = texto.split('.');

  return (
    Number(inteiro) * 100 +
    Number(decimal.padEnd(2, '0'))
  );
}

function validarDados(body) {
  const erros = {};

  const tipo = body?.tipo;
  const descricao =
    typeof body?.descricao === 'string'
      ? body.descricao.trim()
      : '';

  const valorCentavos = lerValorEmCentavos(body?.valor);
  const data = body?.data;

  let categoriaId;
  let fonteDestinoId;

  const totalParcelas =
    body?.totalParcelas === undefined
      ? 1
      : body.totalParcelas;

  if (!['entrada', 'saida'].includes(tipo)) {
    erros.tipo = 'Selecione Entrada ou Saída.';
  }

  if (!descricao) {
    erros.descricao = 'Informe a descrição do lançamento.';
  } else if (Array.from(descricao).length > 120) {
    erros.descricao = 'Use até 120 caracteres.';
  }

  if (
    valorCentavos === null ||
    valorCentavos <= 0
  ) {
    erros.valor = 'Informe um valor positivo com até duas casas decimais.';
  }

  if (!validarData(data)) {
    erros.data = 'Informe uma data válida.';
  }

  try {
    categoriaId = lerId(body?.categoriaId, 'categoria');
  } catch {
    erros.categoriaId = 'Selecione uma categoria válida.';
  }

  try {
    fonteDestinoId = lerId(
      body?.fonteDestinoId,
      'fonte/destino'
    );
  } catch {
    erros.fonteDestinoId = 'Selecione uma fonte ou destino válido.';
  }

  if (
    !Number.isInteger(totalParcelas) ||
    totalParcelas < 1 ||
    totalParcelas > 48
  ) {
    erros.totalParcelas = 'Informe entre 1 e 48 parcelas.';
  }

  return {
    dados: {
      tipo,
      descricao,
      valorCentavos,
      data,
      categoriaId,
      fonteDestinoId,
      totalParcelas,
    },
    erros,
  };
}

function obterPeriodoAtual() {
  const hoje = new Date();

  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');

  const ultimoDia = new Date(
    ano,
    hoje.getMonth() + 1,
    0
  ).getDate();

  return {
    inicio: `${ano}-${mes}-01`,
    fim: `${ano}-${mes}-${String(ultimoDia).padStart(2, '0')}`,
  };
}

function validarGrupoParcelamento(valor) {
  const uuidValido =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidValido.test(valor)) {
    throw erroHttp(400, 'Grupo de parcelamento inválido.');
  }

  return valor;
}

router.get('/', async (req, res) => {
  let {
    inicio,
    fim,
    tipo,
    categoriaId,
    fonteDestinoId,
    pagina = '1',
    limite = '20',
  } = req.query;

  if (inicio === undefined && fim === undefined) {
    const periodo = obterPeriodoAtual();

    inicio = periodo.inicio;
    fim = periodo.fim;
  }

  if (inicio !== undefined && !validarData(inicio)) {
    throw erroHttp(400, 'Data inicial inválida.');
  }

  if (fim !== undefined && !validarData(fim)) {
    throw erroHttp(400, 'Data final inválida.');
  }

  if (inicio && fim && inicio > fim) {
    throw erroHttp(
      400,
      'A data inicial não pode ser posterior à data final.'
    );
  }

  if (
    tipo !== undefined &&
    !['entrada', 'saida'].includes(tipo)
  ) {
    throw erroHttp(400, 'Tipo de lançamento inválido.');
  }

  if (categoriaId !== undefined) {
    categoriaId = lerId(categoriaId, 'categoria');
  }

  if (fonteDestinoId !== undefined) {
    fonteDestinoId = lerId(
      fonteDestinoId,
      'fonte/destino'
    );
  }

  if (
    typeof pagina !== 'string' ||
    !/^[1-9]\d*$/.test(pagina) ||
    !Number.isSafeInteger(Number(pagina))
  ) {
    throw erroHttp(400, 'Página inválida.');
  }

  if (
    typeof limite !== 'string' ||
    !/^[1-9]\d*$/.test(limite) ||
    !Number.isSafeInteger(Number(limite)) ||
    Number(limite) > 100
  ) {
    throw erroHttp(
      400,
      'O limite deve ser um número inteiro entre 1 e 100.'
    );
  }

  const lancamentos = await Lancamento.listar(
    req.usuarioId,
    {
      inicio,
      fim,
      tipo,
      categoriaId,
      fonteDestinoId,
      pagina: Number(pagina),
      limite: Number(limite),
    }
  );

  return res.json(lancamentos);
});

router.get('/resumo', async (req, res) => {
  let {
    inicio,
    fim,
    tipo,
    categoriaId,
    fonteDestinoId,
  } = req.query;

  if (inicio === undefined && fim === undefined) {
    const periodo = obterPeriodoAtual();

    inicio = periodo.inicio;
    fim = periodo.fim;
  }

  if (inicio === undefined || fim === undefined) {
    throw erroHttp(
      400,
      'Informe a data inicial e a data final do período.'
    );
  }

  if (!validarData(inicio)) {
    throw erroHttp(400, 'Data inicial inválida.');
  }

  if (!validarData(fim)) {
    throw erroHttp(400, 'Data final inválida.');
  }

  if (inicio > fim) {
    throw erroHttp(
      400,
      'A data inicial não pode ser posterior à data final.'
    );
  }

  if (
    tipo !== undefined &&
    !['entrada', 'saida'].includes(tipo)
  ) {
    throw erroHttp(400, 'Tipo de lançamento inválido.');
  }

  if (categoriaId !== undefined) {
    categoriaId = lerId(categoriaId, 'categoria');
  }

  if (fonteDestinoId !== undefined) {
    fonteDestinoId = lerId(fonteDestinoId, 'fonte/destino');
  }

  const resumo = await Lancamento.resumo(
    req.usuarioId,
    {
      inicio,
      fim,
      tipo,
      categoriaId,
      fonteDestinoId,
    }
  );

  return res.json(resumo);
});

router.get('/:id', async (req, res) => {
  const id = lerId(req.params.id);

  const lancamento = await Lancamento.buscarPorId(
    id,
    req.usuarioId
  );

  if (!lancamento) {
    return res.status(404).json({
      mensagem: 'Lançamento não encontrado.',
    });
  }

  return res.json(lancamento);
});

router.post('/', async (req, res) => {
  const { dados, erros } = validarDados(req.body);

  if (Object.keys(erros).length) {
    return res.status(400).json({
      mensagem: 'Confira os campos informados.',
      erros,
    });
  }

  const lancamentos = await Lancamento.criarParcelado(
    req.usuarioId,
    dados
  );

  return res.status(201).json(lancamentos);
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

  const lancamento = await Lancamento.atualizar(
    id,
    req.usuarioId,
    dados
  );

  if (!lancamento) {
    return res.status(404).json({
      mensagem: 'Lançamento não encontrado.',
    });
  }

  return res.json(lancamento);
});

router.delete('/grupo/:grupoParcelamento', async (req, res) => {
  const grupoParcelamento = validarGrupoParcelamento(
    req.params.grupoParcelamento
  );

  const excluidas = await Lancamento.excluirGrupo(
    grupoParcelamento,
    req.usuarioId
  );

  if (!excluidas) {
    return res.status(404).json({
      mensagem: 'Grupo de parcelamento não encontrado.',
    });
  }

  return res.status(204).end();
});

router.delete('/:id', async (req, res) => {
  const id = lerId(req.params.id);

  const excluiu = await Lancamento.excluir(
    id,
    req.usuarioId
  );

  if (!excluiu) {
    return res.status(404).json({
      mensagem: 'Lançamento não encontrado.',
    });
  }

  return res.status(204).end();
});

export default router;