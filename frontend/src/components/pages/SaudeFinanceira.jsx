import { useEffect, useState } from 'react';
import { buscarSaudeFinanceira } from '../../services/saudeFinanceira.js';
import { formatarMoeda } from '../../services/lancamentosUtils.js';
import './SaudeFinanceira.css';

const numero = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
});

const icones = {
  // Saquinho de dinheiro
  poupanca: 'M9 7h6l2-4H7l2 4ZM9 7c-1 2-5 5-5 9a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5c0-4-4-7-5-9M12 10v8m2-6h-3a1.5 1.5 0 0 0 0 3h2a1.5 1.5 0 0 1 0 3h-3',
  // Gráfico de barras com linha de referência
  categoria: 'M4 3v17h17M8 16v-3m5 3V9m5 7V5M7 10h2m2 0h2m2 0h2m2 0h2',
  // Cartão de crédito
  cartoes: 'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM3 10h18M7 15h4',
  // Calendário de vencimentos
  parcelas: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM8 3v4m8-4v4M3 10h18m-13 5h1m3 0h1m3 0h1',
};

function IconeIndicador({ nome }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{
        color: 'var(--fl-accent)',
        marginInlineEnd: '8px',
        verticalAlign: 'middle',
      }}
    >
      <path d={icones[nome]} />
    </svg>
  );
}

function percentual(valor) {
  return valor == null ? 'Indisponível' : `${numero.format(valor)}%`;
}

function mesAno(referencia) {
  const [ano, mes] = referencia.split('-').map(Number);
  const nome = new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
  });

  return `${nome}/${ano}`;
}

export default function SaudeFinanceira() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(false);
  const [categoriaId, setCategoriaId] = useState('');

  useEffect(() => {
    document.title = 'Saúde financeira';
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    buscarSaudeFinanceira(controller.signal)
      .then((resultado) => {
        if (!controller.signal.aborted) setDados(resultado);
      })
      .catch(() => {
        if (!controller.signal.aborted) setErro(true);
      });

    return () => controller.abort();
  }, []);

  const referencia = dados?.mesReferencia
    ? mesAno(dados.mesReferencia)
    : '';

  const categorias = dados?.categorias ?? [];
  const categoria =
    categorias.find((item) => String(item.id) === categoriaId) ?? categorias[0];
  const variacao = categoria?.variacaoPercentual;

  let textoCategoria = 'Ainda não há histórico suficiente para comparar os gastos.';
  if (variacao === 0) {
    textoCategoria = `Seus gastos com ${categoria.nome} estão na média dos três meses anteriores.`;
  } else if (variacao != null) {
    const direcao = variacao > 0 ? 'acima' : 'abaixo';
    textoCategoria = (
        <>
            Seus gastos com {categoria.nome} estão{' '}
            <strong>
            {percentual(Math.abs(variacao))} {direcao}
            </strong>{' '}
            da sua média dos três meses anteriores.
        </>
    );
  }

  const taxaPoupanca = dados?.poupanca?.percentual;

  let textoPoupanca = 'Ainda não há dados suficientes para calcular sua taxa de poupança.';
  if (taxaPoupanca > 0) {
    textoPoupanca = `Você guardou ${percentual(taxaPoupanca)} da sua renda em ${referencia}.`;
  } else if (taxaPoupanca === 0) {
    textoPoupanca = `Você não guardou parte da sua renda em ${referencia}.`;
  } else if (taxaPoupanca < 0) {
    textoPoupanca = `Em ${referencia}, seus gastos superaram sua renda em ${percentual(
      Math.abs(taxaPoupanca),
    )}.`;
  }

  const cartoes = dados?.cartoes;
  const parcelas = dados?.parcelas;
  const projecao = dados?.projecao;

  return (
    <section className="sf-page" aria-labelledby="sf-titulo">
      <header>
        <h1 id="sf-titulo" className="fl-heading">Saúde financeira</h1>
        <p className="fl-description">
          Acompanhe como estão suas finanças e controle seus gastos com mais precisão.
        </p>
      </header>

      {erro && <p role="alert">Não foi possível carregar os indicadores.</p>}
      {!dados && !erro && <p role="status">Carregando indicadores…</p>}

      {dados && (
        <>
          <section className="sf-secao" aria-labelledby="sf-mes">
            <h2 id="sf-mes">Este mês{referencia && ` (${referencia})`}</h2>

            <div className="sf-grade">
              <article className="sf-painel">
                <h3><IconeIndicador nome="poupanca" />Taxa de poupança</h3>
                <p className="sf-valor">{percentual(taxaPoupanca)}</p>
                <p className="sf-secundario">{textoPoupanca}</p>
                {taxaPoupanca != null && (
                  <p>
                    Uma meta comum é guardar 10% da renda. Se quiser poupar mais, comece revisando suas despesas.
                  </p>
                )}
              </article>

              <article className="sf-painel">
                <h3><IconeIndicador nome="categoria" />Categoria fora da curva</h3>
                <p aria-live="polite">{textoCategoria}</p>

                {categorias.length > 1 && (
                  <div className="fl-field">
                    <label htmlFor="sf-categoria">Consultar outras categorias</label>
                    <select
                      id="sf-categoria"
                      className="fl-input"
                      value={String(categoria.id)}
                      onChange={(event) => setCategoriaId(event.target.value)}
                    >
                      {categorias.map((item) => (
                        <option key={item.id} value={item.id}>{item.nome}</option>
                      ))}
                    </select>
                  </div>
                )}
              </article>
            </div>
          </section>

          <section className="sf-secao" aria-labelledby="sf-proximos">
            <h2 id="sf-proximos">Próximos meses</h2>

            <div className="sf-grade">
              <article className="sf-painel">
                <h3><IconeIndicador nome="cartoes" />Comprometimento com cartões</h3>
                <p className="sf-valor">{percentual(cartoes?.percentual)}</p>
                <p className="sf-secundario">
                  {cartoes?.percentual == null
                    ? 'Ainda não há dados suficientes para comparar as faturas com sua renda.'
                    : `As faturas dos próximos ${cartoes.meses ?? 3} meses comprometem ${percentual(
                        cartoes.percentual,
                      )} da sua renda estimada para o mesmo período.`}
                </p>
              </article>

              <article className="sf-painel">
                <h3><IconeIndicador nome="parcelas" />Parcelas futuras</h3>

                {parcelas?.totalCentavos == null ? (
                  <p>O total de parcelas futuras está indisponível.</p>
                ) : parcelas.totalCentavos === 0 ? (
                  <p>Você não tem parcelas a vencer.</p>
                ) : (
                  <p>
                    Você tem <strong>{formatarMoeda(parcelas.totalCentavos)}</strong>
                    {' em parcelas futuras'}
                    {parcelas.ultimoVencimento && ` até ${mesAno(parcelas.ultimoVencimento)}`}.
                  </p>
                )}

                {parcelas?.porMes?.length > 0 && (
                  <dl className="sf-valores">
                    {parcelas.porMes.map((item) => (
                      <div key={item.mes}>
                        <dt>{mesAno(item.mes)}</dt>
                        <dd>{formatarMoeda(item.totalCentavos)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </article>
            </div>
          </section>

          <section className="sf-secao" aria-labelledby="sf-projecao">
            <h2 id="sf-projecao">
              Projeção para os próximos 12 meses
              {projecao?.inicio && projecao?.fim && (
                <span className="sf-periodo">
                  {' '}({mesAno(projecao.inicio)} a {mesAno(projecao.fim)})
                </span>
              )}
            </h2>

            <div className="sf-painel">
             <dl className="sf-projecao">
               <div>
                 <dt>Saídas projetadas</dt>
                 <dd>
                   {projecao?.saidasCentavos == null
                     ? 'Indisponível'
                     : formatarMoeda(projecao.saidasCentavos)}
                 </dd>
               </div>
                                   <div>
                 <dt>Entradas fixas previstas</dt>
                 <dd>
                   {projecao?.entradasFixasCentavos == null
                     ? 'Indisponível'
                     : formatarMoeda(projecao.entradasFixasCentavos)}
                 </dd>
               </div>
                                   <div className="sf-projecao-destaque">
                 <dt>Previsão de comprometimento das entradas fixas</dt>
                 <dd>{percentual(projecao?.percentualComprometido)}</dd>
               </div>
             </dl>
                                 <div className="sf-projecao-texto">
               {projecao?.saidasCentavos == null ? (
                 <p>Ainda não há dados suficientes para projetar suas saídas.</p>
               ) : (
                 <p>
                   Com base nos seus gastos, a projeção de saídas para esse período
                   é de <strong>{formatarMoeda(projecao.saidasCentavos)}</strong>.
                 </p>
               )}
                           {projecao?.entradasFixasCentavos == null ? (
                 <p>O total previsto de entradas fixas está indisponível.</p>
               ) : (
                 <p>
                   Suas entradas fixas previstas somam{' '}
                   <strong>{formatarMoeda(projecao.entradasFixasCentavos)}</strong>
                   {' no mesmo período.'}
                 </p>
               )}
                           {projecao?.percentualComprometido != null && (
                 <p>
                   A projeção indica que essas saídas vão comprometer{' '}
                   <strong>{percentual(projecao.percentualComprometido)}</strong>
                   {' das suas entradas fixas.'}
                 </p>
               )}
             </div>
            </div> 
          </section>
        </>
      )}
    </section>
  );
}