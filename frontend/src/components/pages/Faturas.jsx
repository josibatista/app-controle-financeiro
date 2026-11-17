import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SeletorTema from '../SeletorTema.jsx';
import { listarFaturas } from '../../services/faturas.js';
import {
  formatarData,
  formatarMoeda,
} from '../../services/lancamentosUtils.js';
import './Faturas.css';

function formatarReferencia(referencia) {
  const [ano, mes] = referencia.split('-');
  return `${mes}/${ano}`;
}

export default function Faturas() {
  const navigate = useNavigate();

  const [dados, setDados] = useState(null);
  const [cartaoId, setCartaoId] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    document.title = 'Faturas';
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setCarregando(true);
    setErro('');
    setDados(null);

    listarFaturas(controller.signal)
      .then(setDados)
      .catch((erro) => {
        if (controller.signal.aborted) return;

        if (erro.status === 401) {
          navigate('/login', { replace: true });
        } else {
          setErro(erro.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCarregando(false);
        }
      });

    return () => controller.abort();
  }, [navigate, tentativa]);

  const cartoes = dados?.cartoes ?? [];

  const selecionados = cartoes.filter(
    (cartao) => !cartaoId || cartao.id === Number(cartaoId)
  );

  const pendentes = selecionados.filter(
    (cartao) => cartao.pendencia
  );

  const faturas = selecionados
    .filter((cartao) => !cartao.pendencia)
    .flatMap((cartao) =>
      cartao.faturas.map((fatura) => ({
        ...fatura,
        cartao,
      }))
    )
    .sort((a, b) =>
      a.vencimento.localeCompare(b.vencimento) ||
      a.cartao.nome.localeCompare(b.cartao.nome, 'pt-BR')
    );

  const agrupadasPorMes = new Map();

  for (const fatura of faturas) {
    const grupo = agrupadasPorMes.get(fatura.referencia) ?? {
      referencia: fatura.referencia,
      totalCentavos: 0,
      faturas: [],
    };

    grupo.totalCentavos += fatura.totalCentavos;
    grupo.faturas.push(fatura);

    agrupadasPorMes.set(fatura.referencia, grupo);
  }

  const mesesFaturas = [...agrupadasPorMes.values()].sort(
    (a, b) => a.referencia.localeCompare(b.referencia)
  );

  const resumo = useMemo(() => {
    const escolhidos = (dados?.cartoes ?? []).filter(
      (cartao) => !cartaoId || cartao.id === Number(cartaoId)
    );

    if (escolhidos.some((cartao) => cartao.pendencia)) {
      return [];
    }

    const porReferencia = new Map();

    for (const cartao of escolhidos) {
      for (const fatura of cartao.faturas) {
        const item = porReferencia.get(fatura.referencia) ?? {
          referencia: fatura.referencia,
          totalCentavos: 0,
          abertas: 0,
          previsoes: 0,
        };

        item.totalCentavos += fatura.totalCentavos;

        if (fatura.aberta) {
          item.abertas++;
        } else {
          item.previsoes++;
        }

        porReferencia.set(fatura.referencia, item);
      }
    }

    return [...porReferencia.values()].sort((a, b) =>
      a.referencia.localeCompare(b.referencia)
    );
  }, [dados, cartaoId]);

  // Os cálculos de limite ficam no escopo do componente,
  // fora do useMemo de resumo.
  const limiteTotal = selecionados.reduce(
    (total, cartao) => total + cartao.limiteCentavos,
    0
  );

  const limiteComPendencia = pendentes.length > 0;

  const limiteUtilizado = limiteComPendencia
    ? null
    : selecionados.reduce(
        (total, cartao) => total + cartao.utilizadoCentavos,
        0
      );

  const limiteDisponivel = limiteComPendencia
    ? null
    : limiteTotal - limiteUtilizado;

  const percentualLimite = limiteComPendencia
    ? 0
    : limiteTotal > 0
      ? Math.min(100, (limiteUtilizado / limiteTotal) * 100)
      : limiteUtilizado > 0
        ? 100
        : 0;

  return (
    <div className="fl-page fat-page">
      <header className="fl-header">
        <span>Controle financeiro</span>
        <SeletorTema />
      </header>

      <main className="fat-main">
        <div className="fat-topo">
          <div>
            <h1 className="fl-heading">Faturas</h1>

            <p className="fl-description">
              Acompanhe a fatura aberta e as próximas três
              de cada cartão.
            </p>
          </div>

          <button
            type="button"
            className="fat-botao"
            onClick={() => setTentativa((valor) => valor + 1)}
            disabled={carregando}
          >
            {carregando ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        <div className="fat-filtro">
          <h2>
            {cartaoId && selecionados.length
              ? `Cartão ${selecionados[0].nome}`
              : 'Soma dos cartões'}
          </h2>

          <div className="fl-field">
            <label htmlFor="faturas-cartao">
              Cartão de crédito
            </label>

            <select
              id="faturas-cartao"
              className="fl-input"
              value={cartaoId}
              onChange={(event) => setCartaoId(event.target.value)}
              disabled={carregando}
            >
              <option value="">Todos os cartões</option>

              {cartoes.map((cartao) => (
                <option key={cartao.id} value={cartao.id}>
                  {cartao.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {carregando && (
          <p className="fat-aviso" role="status">
            Carregando faturas...
          </p>
        )}

        {erro && (
          <p className="fat-erro" role="alert">
            {erro}
          </p>
        )}

        {!carregando && dados && cartoes.length === 0 && (
          <div className="fat-aviso">
            <p>
              Você ainda não possui cartões de crédito cadastrados.
            </p>

            <Link
              className="fl-text-button"
              to="/fontes-destinos"
            >
              Cadastrar cartão
            </Link>
          </div>
        )}

        {!carregando && dados && selecionados.length > 0 && (
          <>
            <p className="fat-explicacao">
              A referência corresponde ao mês de vencimento.
              Cada cartão possui seu próprio período de fatura aberta.
            </p>

            {pendentes.length > 0 && (
              <div className="fat-aviso" role="alert">
                <p>
                  Há cartões com pendências nas datas das compras.
                  A soma geral e a utilização do limite não serão
                  exibidas enquanto houver pendências na seleção.
                </p>

                <ul>
                  {pendentes.map((cartao) => (
                    <li key={cartao.id}>
                      <strong>{cartao.nome}:</strong>{' '}
                      {cartao.pendencia}
                    </li>
                  ))}
                </ul>

                <p>
                  Você pode selecionar um cartão sem pendências
                  para consultar seus totais.
                </p>
              </div>
            )}

            {resumo.length > 0 && (
              <section
                className="fat-resumo"
                aria-label="Totais por mês de vencimento"
              >
                {resumo.map((item) => (
                  <article
                    className="fat-painel"
                    key={item.referencia}
                  >
                    <h3>
                      {formatarReferencia(item.referencia)}
                    </h3>

                    <strong>
                      {formatarMoeda(item.totalCentavos)}
                    </strong>

                    <p>
                      {item.abertas > 0 && (
                        <span>{item.abertas} aberta(s)</span>
                      )}

                      {item.abertas > 0 &&
                        item.previsoes > 0 &&
                        ' · '}

                      {item.previsoes > 0 && (
                        <span>
                          {item.previsoes} previsão(ões)
                        </span>
                      )}
                    </p>
                  </article>
                ))}
              </section>
            )}

            <section
              className="fat-limites"
              aria-labelledby="fat-limites-titulo"
            >
              <h2 id="fat-limites-titulo">
                {cartaoId
                  ? 'Limite do cartão'
                  : 'Limite total dos cartões'}
              </h2>

              <div className="fat-limite-barra">
                {limiteComPendencia ? (
                  <p className="fat-erro">
                    Não foi possível calcular a utilização do limite
                    devido às pendências informadas.
                  </p>
                ) : (
                  <>
                    <div className="fat-limite-legendas">
                      <p>
                        Limite comprometido{' '}
                        <strong>
                          {formatarMoeda(limiteUtilizado)}
                        </strong>
                      </p>

                      <p>
                        Disponível{' '}
                        <strong>
                          {formatarMoeda(limiteDisponivel)}
                        </strong>
                      </p>
                    </div>

                    <div
                      className="fat-limite-trilho"
                      role="meter"
                      aria-label={
                        cartaoId
                          ? 'Utilização do limite do cartão'
                          : 'Utilização do limite total dos cartões'
                      }
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percentualLimite}
                      aria-valuetext={
                        `${formatarMoeda(limiteUtilizado)} comprometidos ` +
                        `de ${formatarMoeda(limiteTotal)} de limite total`
                      }
                    >
                      <div
                        className="fat-limite-preenchimento"
                        style={{
                          width: `${percentualLimite}%`,
                        }}
                      />
                    </div>

                    <div className="fat-limite-rodape">
                      <p>
                        Considera todas as parcelas ainda não vencidas em{' '}
                        {formatarData(dados.dataReferencia)}.
                      </p>

                      <p>
                        Limite total:{' '}
                        <strong>
                          {formatarMoeda(limiteTotal)}
                        </strong>
                      </p>
                    </div>

                    {limiteDisponivel < 0 && (
                      <p className="fat-erro">
                        Limite excedido em{' '}
                        {formatarMoeda(Math.abs(limiteDisponivel))}.
                      </p>
                    )}
                  </>
                )}
              </div>
            </section>

            {faturas.length > 0 && (
              <section
                className="fat-listagem"
                aria-labelledby="fat-detalhes-titulo"
              >
                <h2 id="fat-detalhes-titulo">
                  Composição das faturas
                </h2>

                {mesesFaturas.map((mes) => (
                  <section
                    className="fat-mes"
                    key={mes.referencia}
                    aria-labelledby={`fat-mes-${mes.referencia}`}
                  >
                    <div className="fat-mes-topo">
                      <h3 id={`fat-mes-${mes.referencia}`}>
                        Fatura —{' '}
                        {formatarReferencia(mes.referencia)}
                      </h3>

                      <div className="fat-mes-total">
                        <span>
                          {pendentes.length > 0
                            ? 'Total dos cartões sem pendência'
                            : 'Total do mês'}
                        </span>

                        <strong>
                          {formatarMoeda(mes.totalCentavos)}
                        </strong>
                      </div>
                    </div>

                    <div className="fat-tabela-wrap">
                      <table className="fat-tabela">
                        <caption className="fat-sr-only">
                          Lançamentos das faturas com vencimento em{' '}
                          {formatarReferencia(mes.referencia)}
                        </caption>

                        <thead>
                          <tr>
                            <th scope="col">Cartão</th>
                            <th scope="col">Descrição</th>
                            <th scope="col">Compra</th>
                            <th scope="col">Parcela</th>
                            <th scope="col">Fechamento</th>
                            <th scope="col">Vencimento</th>
                            <th scope="col" className="fat-numero">
                              Valor
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {mes.faturas.flatMap((fatura) =>
                            (fatura.lancamentos.length
                              ? fatura.lancamentos
                              : [null]
                            ).map((lancamento) => (
                              <tr
                                key={`${fatura.cartao.id}-${lancamento?.id ?? 'vazia'}`}
                              >
                                <td>
                                  <div className="fat-cartao-celula">
                                    <span>
                                      {fatura.cartao.nome}
                                    </span>

                                    <small>
                                      {fatura.aberta
                                        ? 'Fatura aberta'
                                        : 'Previsão'}
                                    </small>
                                  </div>
                                </td>

                                <td>
                                  {lancamento?.descricao ??
                                    'Sem lançamentos'}
                                </td>

                                <td>
                                  {lancamento
                                    ? formatarData(
                                        lancamento.dataCompra
                                      )
                                    : '—'}
                                </td>

                                <td>
                                  {lancamento
                                    ? `${lancamento.parcelaAtual}/${lancamento.totalParcelas}`
                                    : '—'}
                                </td>

                                <td>
                                  {formatarData(
                                    fatura.fechamento
                                  )}
                                </td>

                                <td>
                                  {formatarData(
                                    fatura.vencimento
                                  )}
                                </td>

                                <td className="fat-numero">
                                  {formatarMoeda(
                                    lancamento?.valorCentavos ?? 0
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {mes.faturas.length > 1 && (
                      <div className="fat-subtotais">
                        <p>Total de cada cartão neste mês:</p>

                        <dl>
                          {mes.faturas.map((fatura) => (
                            <div key={fatura.cartao.id}>
                              <dt>{fatura.cartao.nome}</dt>

                              <dd>
                                {formatarMoeda(
                                  fatura.totalCentavos
                                )}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}
                  </section>
                ))}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}