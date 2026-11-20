import { useState } from 'react';
import { buscarRelatorioFonteDestino } from '../../services/dadosRelatorio';
import './RelatorioFonteDestino.css';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

function RelatorioFontesDestinos() {
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

    //consulta o relatório no backend
    async function consultarRelatorio(event) {
        event?.preventDefault();
        setCarregando(true);
        setErro('');

        try {
            const dados = await buscarRelatorioFonteDestino(inicio, fim);
            setRelatorio(dados);
        } catch (erro) {
            setErro(erro.message);
            setRelatorio(null);
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className="relatorio-fontes-destinos">
        <section className="rel-painel" aria-labelledby="fd-filtro-titulo">
            <h2 id="fd-filtro-titulo">Relatório por fontes e destinos</h2>

            <form className="filtro-periodo" onSubmit={consultarRelatorio}>
            <div className="fl-field">
                <label htmlFor="fd-data-inicial">Data inicial</label>
                <input
                id="fd-data-inicial"
                className="fl-input"
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                />
            </div>

            <div className="fl-field">
                <label htmlFor="fd-data-final">Data final</label>
                <input
                id="fd-data-final"
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
                aria-label="Resumo financeiro por fontes e destinos"
            >
                <article className="rel-painel rel-indicador">
                <h3>Total de entradas</h3>
                <strong>{formatarMoeda(relatorio.fontes.total)}</strong>
                </article>

                <article className="rel-painel rel-indicador">
                <h3>Total de saídas</h3>
                <strong>{formatarMoeda(relatorio.destinos.total)}</strong>
                </article>

                <article className="rel-painel rel-indicador">
                <h3>Saldo do período</h3>
                <strong>
                    {formatarMoeda(
                    relatorio.fontes.total - relatorio.destinos.total
                    )}
                </strong>
                </article>
            </section>

            <div className="graficos-saidas">
                <section className="rel-painel grafico-card">
                <h3>Entradas por fonte</h3>
                <p className="rel-subtitulo">
                    Valores recebidos em cada fonte no período selecionado
                </p>

                {relatorio.fontes.itens.length > 0 ? (
                    <div className="grafico-area">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                        data={relatorio.fontes.itens}
                        layout="vertical"
                        margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                        >
                        <XAxis type="number" hide />
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
                            name="Total recebido"
                            fill="#B02E67"
                            radius={[0, 6, 6, 0]}
                            barSize={16}
                        />
                        </BarChart>
                    </ResponsiveContainer>
                    </div>
                ) : (
                    <p className="rel-vazio">
                    Não há entradas registradas neste período.
                    </p>
                )}
                </section>

                <section className="rel-painel grafico-card">
                <h3>Saídas por destino</h3>
                <p className="rel-subtitulo">
                    Valores gastos em cada destino no período selecionado
                </p>

                {relatorio.destinos.itens.length > 0 ? (
                    <div className="grafico-area">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                        data={relatorio.destinos.itens}
                        layout="vertical"
                        margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                        >
                        <XAxis type="number" hide />
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
                            name="Total gasto"
                            fill="#B02E67"
                            radius={[0, 6, 6, 0]}
                            barSize={16}
                        />
                        </BarChart>
                    </ResponsiveContainer>
                    </div>
                ) : (
                    <p className="rel-vazio">
                    Não há saídas registradas neste período.
                    </p>
                )}
                </section>
            </div>

            <section className="rel-secao" aria-labelledby="fd-contas-titulo">
                <h2 id="fd-contas-titulo">Saldo por conta</h2>
                <p className="rel-subtitulo">
                Diferença entre as entradas e saídas de cada conta no período selecionado.
                </p>

                {relatorio.contas.length > 0 ? (
                <div className="lista-saldos-contas">
                    {relatorio.contas.map((conta) => (
                    <article className="rel-painel card-saldo-conta" key={conta.id}>
                        <h3>{conta.nome}</h3>

                        <dl className="rel-valores">
                        <div>
                            <dt>Entradas</dt>
                            <dd>{formatarMoeda(conta.totalEntradas)}</dd>
                        </div>
                        <div>
                            <dt>Saídas</dt>
                            <dd>{formatarMoeda(conta.totalSaidas)}</dd>
                        </div>
                        </dl>

                        <div className="valor-saldo-conta">
                        <span>Saldo do período</span>
                        <strong>{formatarMoeda(conta.saldo)}</strong>
                        </div>
                    </article>
                    ))}
                </div>
                ) : (
                <p className="rel-vazio">
                    Não há contas com movimentações cadastradas.
                </p>
                )}
            </section>

            <section className="rel-secao" aria-labelledby="fd-tabela-titulo">
                <h2 id="fd-tabela-titulo">Detalhamento por fonte e destino</h2>
                <p className="rel-subtitulo">
                Entradas, saídas e saldo de cada fonte ou destino no período selecionado.
                </p>

                {relatorio.registros.length > 0 ? (
                <div className="rel-tabela-wrap">
                    <table className="rel-tabela">
                    <thead>
                        <tr>
                        <th scope="col">Nome</th>
                        <th scope="col">Tipo</th>
                        <th scope="col" className="rel-numero">Entradas</th>
                        <th scope="col" className="rel-numero">Saídas</th>
                        <th scope="col" className="rel-numero">Saldo</th>
                        </tr>
                    </thead>

                    <tbody>
                        {relatorio.registros.map((registro) => (
                        <tr key={registro.id}>
                            <td>{registro.nome}</td>
                            <td>
                            {registro.tipo === 'renda'
                                ? 'Fonte de renda'
                                : registro.tipo === 'conta'
                                ? 'Conta'
                                : 'Destino'}
                            </td>
                            <td className="rel-numero">
                            {formatarMoeda(registro.totalEntradas)}
                            </td>
                            <td className="rel-numero">
                            {formatarMoeda(registro.totalSaidas)}
                            </td>
                            <td className="rel-numero">
                            {registro.tipo === 'conta'
                                ? formatarMoeda(registro.saldo)
                                : 'Não se aplica'}
                            </td>
                        </tr>
                        ))}
                    </tbody>

                    <tfoot>
                        <tr>
                        <th>Total</th>
                        <td>—</td>
                        <th className="rel-numero">
                            {formatarMoeda(relatorio.fontes.total)}
                        </th>
                        <th className="rel-numero">
                            {formatarMoeda(relatorio.destinos.total)}
                        </th>
                        <td className="rel-numero">—</td>
                        </tr>
                    </tfoot>
                    </table>
                </div>
                ) : (
                <p className="rel-vazio">
                    Não há fontes ou destinos cadastrados neste período.
                </p>
                )}
            </section>
            </>
        )}
        </div>
    );
}

export default RelatorioFontesDestinos;
