import { useState } from 'react';
import { buscarRelatorioCategoria } from '../../services/dadosRelatorio';
import './RelatorioCategoria.css';

import {
    PieChart,
    Pie,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Rectangle
} from 'recharts';

const CORES_GRAFICO = [
    '#B02E67',
    '#D66B96',
    '#E9A3BD',
    '#8B5270',
    '#C58AA4',
    '#A77A91',
];

function RelatorioCategorias() {
    const [inicio, setInicio] = useState('2026-01-01');
    const [fim, setFim] = useState('2026-12-31');
    const [relatorio, setRelatorio] = useState(null);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');

    const formatarMoeda = (valor) => {
        return Number(valor).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };

    async function consultarRelatorio(event) {
        event?.preventDefault();
        setCarregando(true);
        setErro('');

        try {
            const dados = await buscarRelatorioCategoria(inicio, fim);
            setRelatorio(dados);
        } catch (erro) {
            setErro(erro.message);
            setRelatorio(null);
        } finally {
            setCarregando(false);
        }
    }

    //apresenta o resultado da comparação com o período anterior
    function obterComparacao(variacao) {
        if (variacao === null) {
            return {
                texto: 'Sem comparação',
                classe: 'neutra',
            };
        }

        if (variacao === 0) {
            return {
                texto: 'Sem variação',
                classe: 'neutra',
            };
        }

        if (variacao > 0) {
            return {
                texto: `Aumento de ${variacao.toFixed(2)}%`,
                classe: 'aumento',
            };
        }

        return {
            texto: `Redução de ${Math.abs(variacao).toFixed(2)}%`,
            classe: 'reducao',
        };
    }

    const dadosOndeMaisGastou = relatorio?.saidas.categorias
    .filter((categoria) => categoria.total > 0)
    .sort((a, b) => b.total - a.total)
    .map((categoria, indice) => ({
        ...categoria,
        cor: CORES_GRAFICO[indice % CORES_GRAFICO.length]
    })) || [];

    return (
        <div className="relatorio-categorias">
        <section className="rel-painel" aria-labelledby="cat-filtro-titulo">
            <h2 id="cat-filtro-titulo">Relatório por categorias</h2>

            <form className="filtro-periodo" onSubmit={consultarRelatorio}>
            <div className="fl-field">
                <label htmlFor="cat-data-inicial">Data inicial</label>
                <input
                id="cat-data-inicial"
                className="fl-input"
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                />
            </div>

            <div className="fl-field">
                <label htmlFor="cat-data-final">Data final</label>
                <input
                id="cat-data-final"
                className="fl-input"
                type="date"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
                />
            </div>

            <button
                type="submit"
                className="rel-botao rel-botao--principal"
                disabled={carregando}
            >
                {carregando ? 'Consultando...' : 'Consultar relatório'}
            </button>
            </form>
        </section>

        {erro && (
            <p className="rel-erro" role="alert">
            {erro}
            </p>
        )}

        {relatorio && (
            <>
            <section
                className="indicadores-relatorio"
                aria-label="Resumo financeiro do período"
            >
                <article className="rel-painel rel-indicador">
                <h3>Total de entradas</h3>
                <strong>{formatarMoeda(relatorio.entradas.total)}</strong>
                </article>

                <article className="rel-painel rel-indicador">
                <h3>Total de saídas</h3>
                <strong>{formatarMoeda(relatorio.saidas.total)}</strong>
                </article>

                <article className="rel-painel rel-indicador">
                <h3>Saldo do período</h3>
                <strong>{formatarMoeda(relatorio.saldo)}</strong>
                </article>
            </section>

            <div className="graficos-saidas">
                <section className="rel-painel grafico-card">
                <h3>Distribuição das saídas</h3>
                <p className="rel-subtitulo">Participação percentual por categoria</p>

                {relatorio.saidas.categorias.some((c) => c.total > 0) ? (
                    <div className="grafico-area">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                        <Pie
                            data={relatorio.saidas.categorias
                            .filter((c) => c.total > 0)
                            .map((categoria, indice) => ({
                                ...categoria,
                                fill: CORES_GRAFICO[indice % CORES_GRAFICO.length],
                            }))}
                            dataKey="total"
                            nameKey="nome"
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={105}
                            paddingAngle={3}
                        />
                        <Tooltip formatter={(valor) => formatarMoeda(valor)} />
                        <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                    </div>
                ) : (
                    <p className="rel-vazio">Não há despesas registradas neste período.</p>
                )}
                </section>

                <section className="rel-painel grafico-card">
                <h3>Onde você mais gastou</h3>
                <p className="rel-subtitulo">
                    Categorias ordenadas do maior para o menor
                </p>

                {dadosOndeMaisGastou.length > 0 ? (
                    <div className="grafico-area">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                        data={dadosOndeMaisGastou}
                        layout="vertical"
                        margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                        >
                        <XAxis type="number" hide domain={[0, 'dataMax']} />
                        <YAxis
                            type="category"
                            dataKey="nome"
                            width={110}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            formatter={(valor) => formatarMoeda(valor)}
                            cursor={{ fill: 'var(--fl-muted)' }}
                        />
                        <Bar
                            dataKey="total"
                            radius={[0, 6, 6, 0]}
                            barSize={14}
                            shape={(props) => (
                            <Rectangle {...props} fill={props.payload.cor} />
                            )}
                        />
                        </BarChart>
                    </ResponsiveContainer>
                    </div>
                ) : (
                    <p className="rel-vazio">Não há despesas registradas neste período.</p>
                )}
                </section>
            </div>

            <section className="rel-secao" aria-labelledby="cat-tabela-titulo">
                <div className="rel-secao-topo">
                <div>
                    <h2 id="cat-tabela-titulo">Detalhamento por categoria</h2>
                    <p className="rel-subtitulo">Comparação com o período anterior</p>
                </div>
                </div>

                <div className="rel-tabela-wrap">
                <table className="rel-tabela">
                    <thead>
                    <tr>
                        <th scope="col">Categoria</th>
                        <th scope="col" className="rel-numero">Saídas</th>
                        <th scope="col" className="rel-numero">Participação</th>
                        <th scope="col" className="rel-numero">Período anterior</th>
                        <th scope="col">Variação</th>
                    </tr>
                    </thead>

                    <tbody>
                    {relatorio.saidas.categorias.map((categoria) => {
                        const comparacao = obterComparacao(
                        categoria.variacaoPercentual
                        );

                        return (
                        <tr key={categoria.id}>
                            <td>{categoria.nome}</td>
                            <td className="rel-numero">
                            {formatarMoeda(categoria.total)}
                            </td>
                            <td className="rel-numero">
                            {Number(categoria.percentual).toFixed(2)}%
                            </td>
                            <td className="rel-numero">
                            {categoria.periodoAnterior === null
                                ? '—'
                                : formatarMoeda(categoria.periodoAnterior)}
                            </td>
                            <td>
                            <span className={`variacao ${comparacao.classe}`}>
                                {comparacao.texto}
                            </span>
                            </td>
                        </tr>
                        );
                    })}
                    </tbody>

                    <tfoot>
                    <tr>
                        <th>Total</th>
                        <th className="rel-numero">
                        {formatarMoeda(relatorio.saidas.total)}
                        </th>
                        <th className="rel-numero">100,00%</th>
                        <th className="rel-numero">
                        {relatorio.saidas.categorias.some(
                            (categoria) => categoria.periodoAnterior !== null
                        )
                            ? formatarMoeda(
                                relatorio.saidas.categorias.reduce(
                                (total, categoria) =>
                                    total + Number(categoria.periodoAnterior ?? 0),
                                0
                                )
                            )
                            : '—'}
                        </th>
                        <th>—</th>
                    </tr>
                    </tfoot>
                </table>
                </div>
            </section>

            <section className="rel-secao" aria-labelledby="cat-entradas-titulo">
                <h2 id="cat-entradas-titulo">Entradas por categoria</h2>

                {relatorio.entradas.categorias.length > 0 ? (
                <div className="rel-grade-cards">
                    {relatorio.entradas.categorias.map((categoria) => (
                    <article className="rel-painel rel-card-secundario" key={categoria.id}>
                        <h3>{categoria.nome}</h3>
                        <dl className="rel-valores">
                        <div>
                            <dt>Total</dt>
                            <dd>{formatarMoeda(categoria.total)}</dd>
                        </div>
                        <div>
                            <dt>Participação</dt>
                            <dd>{Number(categoria.percentual).toFixed(2)}%</dd>
                        </div>
                        </dl>
                    </article>
                    ))}
                </div>
                ) : (
                <p className="rel-vazio">Não há entradas registradas neste período.</p>
                )}
            </section>
            </>
        )}
        </div>
    );
}

export default RelatorioCategorias;
