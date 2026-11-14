import { useEffect, useMemo, useRef, useState } from 'react';
import Campo from '../Campo.jsx';
import SeletorTema from '../SeletorTema.jsx';
import {
  categoriasDemo,
  fontesDestinosDemo,
  criarLancamentosDemo,
  dataLocal,
  dataValida,
  formatarData,
  formatarMoeda,
  paraCentavos,
  periodoMesAtual,
  simularCadastro,
  validarLancamento,
} from '../../services/lancamentosDemo.js';
import './Lancamentos.css';

const POR_PAGINA = 5;

function novosFiltros() {
  return {
    ...periodoMesAtual(),
    tipo: '',
    categoria_id: '',
    fonte_destino_id: '',
  };
}

function novoFormulario() {
  return {
    tipo: '',
    descricao: '',
    valor: '',
    data: dataLocal(new Date()),
    categoria_id: '',
    fonte_destino_id: '',
    total_parcelas: '1',
  };
}

function nomeCategoria(id) {
  return categoriasDemo.find((item) => item.id === Number(id))?.nome ?? '—';
}

function nomeFonte(id) {
  return fontesDestinosDemo.find((item) => item.id === Number(id))?.nome ?? '—';
}

function Selecao({ id, label, erro, children, required = false, ...props }) {
  return (
    <div className="fl-field">
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>

      <select
        {...props}
        id={id}
        className="fl-input"
        required={required}
        aria-invalid={Boolean(erro)}
        aria-describedby={erro ? `${id}-erro` : undefined}
      >
        {children}
      </select>

      {erro && (
        <p id={`${id}-erro`} className="fl-field-error" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}

export default function Lancamentos() {
  const [lancamentos, setLancamentos] = useState(criarLancamentosDemo);
  const [filtros, setFiltros] = useState(novosFiltros);
  const [pagina, setPagina] = useState(1);
  const [modo, setModo] = useState(null);
  const [selecionado, setSelecionado] = useState(null);
  const [dados, setDados] = useState(novoFormulario);
  const [erros, setErros] = useState({});
  const [mensagem, setMensagem] = useState('');
  const dialogRef = useRef(null);

  useEffect(() => {
    document.title = 'Meus lançamentos';
  }, []);

  const aberto = modo !== null;

  useEffect(() => {
    const dialog = dialogRef.current;

    if (aberto && !dialog.open) dialog.showModal();
    if (!aberto && dialog.open) dialog.close();
  }, [aberto]);

  const erroPeriodo =
    (filtros.dataInicial && !dataValida(filtros.dataInicial)) ||
    (filtros.dataFinal && !dataValida(filtros.dataFinal))
      ? 'Informe datas válidas para o período.'
      : filtros.dataInicial &&
          filtros.dataFinal &&
          filtros.dataInicial > filtros.dataFinal
        ? 'A data inicial deve ser anterior ou igual à data final.'
        : '';

  const filtrados = useMemo(() => {
    if (erroPeriodo) return [];

    return lancamentos
      .filter((item) => (
        (!filtros.dataInicial || item.data >= filtros.dataInicial) &&
        (!filtros.dataFinal || item.data <= filtros.dataFinal) &&
        (!filtros.tipo || item.tipo === filtros.tipo) &&
        (!filtros.categoria_id ||
          item.categoria_id === Number(filtros.categoria_id)) &&
        (!filtros.fonte_destino_id ||
          item.fonte_destino_id === Number(filtros.fonte_destino_id))
      ))
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [lancamentos, filtros, erroPeriodo]);

  const totais = filtrados.reduce(
    (resultado, item) => {
      resultado[item.tipo] += paraCentavos(item.valor);
      return resultado;
    },
    { entrada: 0, saida: 0 },
  );

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const visiveis = filtrados.slice(inicio, inicio + POR_PAGINA);

  const fonteSelecionada = fontesDestinosDemo.find(
    (item) => item.id === Number(dados.fonte_destino_id),
  );
  const editando = modo === 'editar';
  const formularioAberto = modo === 'novo' || editando;
  const categoriasFormulario = categoriasDemo.filter(
    (item) => item.tipo === dados.tipo,
  );
  const categoriasFiltro = categoriasDemo.filter(
    (item) => !filtros.tipo || item.tipo === filtros.tipo,
  );

  const tituloModal = {
    novo: 'Novo lançamento',
    detalhes: 'Detalhes do lançamento',
    editar: 'Editar lançamento',
    excluir: 'Excluir lançamento',
  }[modo] ?? '';

  function alterarFiltro(event) {
    const { name, value } = event.target;

    setFiltros((atuais) => ({
      ...atuais,
      [name]: value,
      ...(name === 'tipo' ? { categoria_id: '' } : {}),
    }));
    setPagina(1);
  }

  function alterarCampo(event) {
    const { name, value } = event.target;

    setDados((atuais) => ({
      ...atuais,
      [name]: value,
      ...(name === 'tipo' ? { categoria_id: '' } : {}),
      ...(name === 'fonte_destino_id' ? { total_parcelas: '1' } : {}),
    }));
    setErros({});
  }

  function abrirNovo() {
    setSelecionado(null);
    setDados(novoFormulario());
    setErros({});
    setModo('novo');
  }

  function abrirDetalhes(item) {
    setSelecionado(item);
    setModo('detalhes');
  }

  function abrirEdicao() {
    setDados({
      tipo: selecionado.tipo,
      descricao: selecionado.descricao,
      valor: selecionado.valor,
      data: selecionado.data,
      categoria_id: String(selecionado.categoria_id),
      fonte_destino_id: String(selecionado.fonte_destino_id),
      total_parcelas: String(selecionado.total_parcelas),
    });
    setErros({});
    setModo('editar');
  }

  function fecharModal() {
    setModo(null);
    setSelecionado(null);
    setErros({});
  }

  function salvar(event) {
    event.preventDefault();

    const novosErros = validarLancamento(dados, editando);
    setErros(novosErros);

    const primeiroErro = Object.keys(novosErros)[0];

    if (primeiroErro) {
      event.currentTarget.elements.namedItem(primeiroErro)?.focus();
      return;
    }

    if (editando) {
      const atualizado = {
        ...selecionado,
        tipo: dados.tipo,
        descricao: dados.descricao.trim(),
        valor: (paraCentavos(dados.valor) / 100).toFixed(2),
        data: dados.data,
        categoria_id: Number(dados.categoria_id),
        fonte_destino_id: Number(dados.fonte_destino_id),
      };

      setLancamentos((atuais) =>
        atuais.map((item) =>
          item.id === selecionado.id ? atualizado : item,
        ),
      );
      setMensagem('Lançamento atualizado nesta demonstração.');
    } else {
      const novos = simularCadastro(dados);

      setLancamentos((atuais) => [...atuais, ...novos]);
      setMensagem(
        novos.length > 1
          ? `${novos.length} parcelas criadas nesta demonstração.`
          : 'Lançamento criado nesta demonstração.',
      );
    }

    setPagina(1);
    fecharModal();
  }

  function excluir(todas) {
    setLancamentos((atuais) =>
      atuais.filter((item) => {
        if (todas && selecionado.grupo_parcelamento) {
          return item.grupo_parcelamento !== selecionado.grupo_parcelamento;
        }

        return item.id !== selecionado.id;
      }),
    );
    setMensagem(
      todas
        ? 'Todas as parcelas da compra foram excluídas nesta demonstração.'
        : 'Lançamento excluído nesta demonstração.',
    );
    setPagina(1);
    fecharModal();
  }

  return (
    <div className="fl-page lc-page">
      <header className="fl-header">
        <span className="lc-marca">Controle financeiro</span>
        <SeletorTema />
      </header>

      <main className="lc-main">
        <div className="lc-cabecalho">
          <div>
            <h1 className="fl-heading">Meus lançamentos</h1>
            <p className="fl-description">
              Acompanhe suas entradas e saídas.
            </p>
          </div>

          <button
            className="lc-botao lc-botao--principal"
            type="button"
            onClick={abrirNovo}
          >
            <span aria-hidden="true">＋</span> Novo lançamento
          </button>
        </div>

        <p className="lc-aviso">
          Demonstração do frontend: os dados são temporários e não são
          enviados ao banco.
        </p>

        <section className="lc-painel" aria-labelledby="titulo-filtros">
          <div className="lc-secao-topo">
            <h2 id="titulo-filtros">Filtros</h2>
            <button
              type="button"
              className="fl-text-button"
              onClick={() => {
                setFiltros(novosFiltros());
                setPagina(1);
              }}
            >
              Restaurar mês atual
            </button>
          </div>

          <div className="lc-filtros">
            <Campo
              id="filtro-inicial"
              name="dataInicial"
              label="Data inicial"
              type="date"
              value={filtros.dataInicial}
              onChange={alterarFiltro}
            />
            <Campo
              id="filtro-final"
              name="dataFinal"
              label="Data final"
              type="date"
              value={filtros.dataFinal}
              onChange={alterarFiltro}
            />
            <Selecao
              id="filtro-tipo"
              name="tipo"
              label="Tipo"
              value={filtros.tipo}
              onChange={alterarFiltro}
            >
              <option value="">Todos</option>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </Selecao>
            <Selecao
              id="filtro-categoria"
              name="categoria_id"
              label="Categoria"
              value={filtros.categoria_id}
              onChange={alterarFiltro}
            >
              <option value="">Todas</option>
              {categoriasFiltro.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </Selecao>
            <Selecao
              id="filtro-fonte"
              name="fonte_destino_id"
              label="Fonte/Destino"
              value={filtros.fonte_destino_id}
              onChange={alterarFiltro}
            >
              <option value="">Todas</option>
              {fontesDestinosDemo.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </Selecao>
          </div>

          {erroPeriodo && (
            <p className="fl-field-error" role="alert">{erroPeriodo}</p>
          )}
        </section>

        <section className="lc-resumo" aria-label="Resumo dos resultados filtrados">
          {[
            ['Total de entradas', totais.entrada],
            ['Total de saídas', totais.saida],
            ['Saldo', totais.entrada - totais.saida],
          ].map(([titulo, valor]) => (
            <article className="lc-painel lc-total" key={titulo}>
              <h2>{titulo}</h2>
              <strong>{erroPeriodo ? '—' : formatarMoeda(valor)}</strong>
            </article>
          ))}
        </section>

        <p className="lc-status" role="status">{mensagem}</p>

        <section className="lc-painel" aria-labelledby="titulo-listagem">
          <div className="lc-secao-topo">
            <h2 id="titulo-listagem">Lançamentos</h2>
            <span className="lc-texto-secundario">
              {filtrados.length} resultado(s)
            </span>
          </div>

          <div className="lc-tabela-wrap">
            <table className="lc-tabela">
              <caption className="lc-sr-only">
                Lançamentos correspondentes aos filtros selecionados
              </caption>
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Descrição</th>
                  <th scope="col" className="lc-numero">Valor</th>
                  <th scope="col">Categoria</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((item) => (
                  <tr key={item.id}>
                    <td>{formatarData(item.data)}</td>
                    <td>
                      <span className={`lc-tipo lc-tipo--${item.tipo}`}>
                        {item.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td>{item.descricao}</td>
                    <td className="lc-numero">
                      {formatarMoeda(paraCentavos(item.valor))}
                    </td>
                    <td>{nomeCategoria(item.categoria_id)}</td>
                    <td>
                      <button
                        type="button"
                        className="fl-text-button"
                        aria-label={`Ver detalhes de ${item.descricao}, ${formatarData(item.data)}`}
                        onClick={() => abrirDetalhes(item)}
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}

                {visiveis.length === 0 && (
                  <tr>
                    <td colSpan={6} className="lc-vazio">
                      {erroPeriodo
                        ? 'Corrija o período para consultar os lançamentos.'
                        : 'Nenhum lançamento encontrado para estes filtros.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <nav className="lc-paginacao" aria-label="Paginação dos lançamentos">
            <span className="lc-texto-secundario">
              {filtrados.length > 0
                ? `${inicio + 1}–${Math.min(inicio + POR_PAGINA, filtrados.length)} de ${filtrados.length}`
                : '0 resultados'}
            </span>

            <div className="lc-acoes">
              <button
                type="button"
                className="lc-botao"
                disabled={paginaAtual === 1}
                onClick={() => setPagina(paginaAtual - 1)}
              >
                Anterior
              </button>
              <span aria-live="polite">
                {paginaAtual} de {totalPaginas}
              </span>
              <button
                type="button"
                className="lc-botao"
                disabled={paginaAtual === totalPaginas}
                onClick={() => setPagina(paginaAtual + 1)}
              >
                Próxima
              </button>
            </div>
          </nav>
        </section>
      </main>

      <dialog
        ref={dialogRef}
        className="lc-modal"
        aria-labelledby="titulo-modal"
        onCancel={(event) => {
          event.preventDefault();
          fecharModal();
        }}
      >
        <div className="lc-modal-topo">
          <h2 id="titulo-modal">{tituloModal}</h2>
          <button
            type="button"
            className="lc-botao lc-fechar"
            aria-label="Fechar janela"
            onClick={fecharModal}
          >
            ×
          </button>
        </div>

        {formularioAberto && (
          <form onSubmit={salvar} noValidate>
            <p className="lc-texto-secundario lc-introducao">
              Todos os campos marcados com * são obrigatórios.
            </p>

            <div className="lc-form-grid">
              <Selecao
                id="lancamento-tipo"
                name="tipo"
                label="Tipo"
                value={dados.tipo}
                onChange={alterarCampo}
                erro={erros.tipo}
                required
              >
                <option value="">Selecione</option>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </Selecao>

              <Campo
                id="lancamento-data"
                name="data"
                label="Data"
                type="date"
                value={dados.data}
                onChange={alterarCampo}
                erro={erros.data}
                marcarObrigatorio
                required
              />

              <div className="lc-largura-total">
                <Campo
                  id="lancamento-descricao"
                  name="descricao"
                  label="Descrição"
                  maxLength={120}
                  value={dados.descricao}
                  onChange={alterarCampo}
                  erro={erros.descricao}
                  marcarObrigatorio
                  required
                />
              </div>

              <Campo
                id="lancamento-valor"
                name="valor"
                label={
                  editando && selecionado.total_parcelas > 1
                    ? 'Valor desta parcela (R$)'
                    : 'Valor total (R$)'
                }
                inputMode="decimal"
                placeholder="0,00"
                value={dados.valor}
                onChange={alterarCampo}
                erro={erros.valor}
                marcarObrigatorio
                required
              />

              <Selecao
                id="lancamento-categoria"
                name="categoria_id"
                label="Categoria"
                value={dados.categoria_id}
                onChange={alterarCampo}
                erro={erros.categoria_id}
                disabled={!dados.tipo}
                required
              >
                <option value="">
                  {dados.tipo ? 'Selecione' : 'Selecione primeiro o tipo'}
                </option>
                {categoriasFormulario.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </Selecao>

              <Selecao
                id="lancamento-fonte"
                name="fonte_destino_id"
                label="Fonte/Destino"
                value={dados.fonte_destino_id}
                onChange={alterarCampo}
                erro={erros.fonte_destino_id}
                required
              >
                <option value="">Selecione</option>
                {fontesDestinosDemo.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </Selecao>

              {!editando && fonteSelecionada?.tipo === 'cartao_credito' && (
                <Campo
                  id="lancamento-parcelas"
                  name="total_parcelas"
                  label="Número de parcelas"
                  type="number"
                  min="1"
                  max="48"
                  step="1"
                  value={dados.total_parcelas}
                  onChange={alterarCampo}
                  erro={erros.total_parcelas}
                  ajuda="De 1 a 48. Informe o valor total da compra."
                  marcarObrigatorio
                  required
                />
              )}
            </div>

            {editando && selecionado.total_parcelas > 1 && (
              <p className="lc-aviso">
                Parcela {selecionado.parcela_atual} de{' '}
                {selecionado.total_parcelas}. A edição altera somente este
                lançamento e preserva o grupo de parcelamento.
              </p>
            )}

            <div className="lc-modal-acoes">
              <button
                type="button"
                className="lc-botao"
                onClick={() => {
                  if (editando) setModo('detalhes');
                  else fecharModal();
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="lc-botao lc-botao--principal"
              >
                {editando ? 'Salvar alterações' : 'Salvar'}
              </button>
            </div>
          </form>
        )}

        {modo === 'detalhes' && selecionado && (
          <>
            <dl className="lc-detalhes">
              {[
                ['ID', selecionado.id],
                ['Tipo', selecionado.tipo === 'entrada' ? 'Entrada' : 'Saída'],
                ['Descrição', selecionado.descricao],
                ['Valor', formatarMoeda(paraCentavos(selecionado.valor))],
                ['Data', formatarData(selecionado.data)],
                ['Categoria', nomeCategoria(selecionado.categoria_id)],
                ['Fonte/Destino', nomeFonte(selecionado.fonte_destino_id)],
                [
                  'Parcelamento',
                  selecionado.total_parcelas > 1
                    ? `Parcela ${selecionado.parcela_atual} de ${selecionado.total_parcelas}`
                    : 'À vista / parcela única',
                ],
                ...(selecionado.grupo_parcelamento
                  ? [['Grupo de parcelamento', selecionado.grupo_parcelamento]]
                  : []),
              ].map(([rotulo, valor]) => (
                <div key={rotulo}>
                  <dt>{rotulo}</dt>
                  <dd>{valor}</dd>
                </div>
              ))}
            </dl>

            <div className="lc-modal-acoes">
              <button
                type="button"
                className="lc-botao lc-botao--perigo"
                onClick={() => setModo('excluir')}
              >
                Excluir
              </button>
              <button
                type="button"
                className="lc-botao lc-botao--principal"
                onClick={abrirEdicao}
              >
                Editar
              </button>
            </div>
          </>
        )}

        {modo === 'excluir' && selecionado && (
          <>
            <p>
              Confirma a exclusão de <strong>{selecionado.descricao}</strong>,
              no valor de{' '}
              <strong>
                {formatarMoeda(paraCentavos(selecionado.valor))}
              </strong>?
            </p>

            {selecionado.total_parcelas > 1 && (
              <p className="lc-introducao">
                Você pode excluir apenas esta parcela ou todas as parcelas
                da compra, incluindo as que estão fora do período filtrado.
              </p>
            )}

            <div className="lc-modal-acoes">
              <button
                type="button"
                className="lc-botao"
                onClick={() => setModo('detalhes')}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="lc-botao lc-botao--perigo"
                onClick={() => excluir(false)}
              >
                {selecionado.total_parcelas > 1
                  ? 'Excluir apenas esta'
                  : 'Confirmar exclusão'}
              </button>
              {selecionado.total_parcelas > 1 && (
                <button
                  type="button"
                  className="lc-botao lc-botao--perigo"
                  onClick={() => excluir(true)}
                >
                  Excluir todas as parcelas
                </button>
              )}
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}