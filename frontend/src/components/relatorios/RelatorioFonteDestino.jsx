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
    Rectangle
} from 'recharts';

function RelatorioFontesDestinos() {
    //período selecionado para consulta
    const [inicio, setInicio] = useState('2026-01-01');
    const [fim, setFim] = useState('2026-12-31');

    //dados retornados pela API
    const [relatorio, setRelatorio] = useState(null);

    //estados para carregamento e erros
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');

    //formata valores monetários
    const formatarMoeda = (valor) => {
        return Number(valor).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };

    //consulta o relatório no backend
    async function consultarRelatorio() {
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
            <h2>Relatório por fontes e destinos</h2>

            <div className="filtro-periodo">
                <label>
                    Data inicial:
                    <input
                        type="date"
                        value={inicio}
                        onChange={(e) => setInicio(e.target.value)}
                    />
                </label>

                <label>
                    Data final:
                    <input
                        type="date"
                        value={fim}
                        onChange={(e) => setFim(e.target.value)}
                    />
                </label>

                <button
                    onClick={consultarRelatorio}
                    disabled={carregando}
                >
                    {carregando ? 'Consultando...' : 'Consultar relatório'}
                </button>
            </div>

            {erro && <p role="alert">{erro}</p>}

            {relatorio && (
                <>
                    <section className="indicadores-relatorio">
                        <div>
                            <h3>Total de entradas</h3>
                            <p>{formatarMoeda(relatorio.fontes.total)}</p>
                        </div>

                        <div>
                            <h3>Total de saídas</h3>
                            <p>{formatarMoeda(relatorio.destinos.total)}</p>
                        </div>

                        <div>
                            <h3>Saldo do período</h3>
                            <p>
                                {formatarMoeda(
                                    relatorio.fontes.total - relatorio.destinos.total
                                )}
                            </p>
                        </div>
                    </section>

                    <section className="grafico-fontes">
                        <h3>Entradas por fonte</h3>
                        <p>Valores recebidos em cada fonte no período selecionado</p>

                        {relatorio.fontes.itens.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={relatorio.fontes.itens}
                                    layout="vertical"
                                    margin={{
                                        top: 10,
                                        right: 20,
                                        left: 10,
                                        bottom: 10
                                    }}
                                >
                                    <XAxis
                                        type="number"
                                        hide
                                    />

                                    <YAxis
                                        type="category"
                                        dataKey="nome"
                                        width={110}
                                        axisLine={false}
                                        tickLine={false}
                                    />

                                    <Tooltip
                                        formatter={(valor) => formatarMoeda(valor)}
                                    />

                                    <Bar
                                        dataKey="total"
                                        name="Total recebido"
                                        fill="#B02E67"
                                        radius={[0, 6, 6, 0]}
                                        barSize={18}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p>Não há entradas registradas neste período.</p>
                        )}
                    </section>

                    <section className="grafico-destinos">
                        <h3>Saídas por destino</h3>
                        <p>Valores gastos em cada destino no período selecionado</p>

                        {relatorio.destinos.itens.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={relatorio.destinos.itens}
                                    layout="vertical"
                                    margin={{
                                        top: 10,
                                        right: 20,
                                        left: 10,
                                        bottom: 10
                                    }}
                                >
                                    <XAxis
                                        type="number"
                                        hide
                                    />

                                    <YAxis
                                        type="category"
                                        dataKey="nome"
                                        width={110}
                                        axisLine={false}
                                        tickLine={false}
                                    />

                                    <Tooltip
                                        formatter={(valor) => formatarMoeda(valor)}
                                    />

                                    <Bar
                                        dataKey="total"
                                        name="Total gasto"
                                        fill="#B02E67"
                                        radius={[0, 6, 6, 0]}
                                        barSize={18}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p>Não há saídas registradas neste período.</p>
                        )}
                    </section>

                    <section className="saldos-contas">
                        <h3>Saldo por conta</h3>
                        <p>
                            Diferença entre as entradas e saídas de cada conta
                            no período selecionado.
                        </p>

                        {relatorio.contas.length > 0 ? (
                            <div className="lista-saldos-contas">
                                {relatorio.contas.map((conta) => (
                                    <div className="card-saldo-conta" key={conta.id}>
                                        <h4>{conta.nome}</h4>

                                        <p>
                                            Entradas:
                                            <strong>
                                                {formatarMoeda(conta.totalEntradas)}
                                            </strong>
                                        </p>

                                        <p>
                                            Saídas:
                                            <strong>
                                                {formatarMoeda(conta.totalSaidas)}
                                            </strong>
                                        </p>

                                        <div className="valor-saldo-conta">
                                            <span>Saldo do período</span>
                                            <strong>
                                                {formatarMoeda(conta.saldo)}
                                            </strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>Não há contas com movimentações cadastradas.</p>
                        )}
                    </section>

                    <section className="tabela-fontes-destinos">
                        <h3>Detalhamento por fonte e destino</h3>
                        <p>
                            Entradas, saídas e saldo de cada fonte ou destino
                            no período selecionado.
                        </p>

                        {relatorio.registros.length > 0 ? (
                            <div className="tabela-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Tipo</th>
                                            <th>Entradas</th>
                                            <th>Saídas</th>
                                            <th>Saldo</th>
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

                                                <td>
                                                    {formatarMoeda(registro.totalEntradas)}
                                                </td>

                                                <td>
                                                    {formatarMoeda(registro.totalSaidas)}
                                                </td>

                                                <td>
                                                    {registro.tipo === 'conta'
                                                        ? formatarMoeda(registro.saldo)
                                                        : 'Não se aplica'}
                                                </td>
                                            </tr>
                                        ))}

                                        {/* Total geral */}
                                        <tr className="linha-total">
                                            <td><strong>Total</strong></td>
                                            <td>—</td>

                                            <td>
                                                <strong>{formatarMoeda(relatorio.fontes.total)}</strong>
                                            </td>

                                            <td>
                                                <strong>{formatarMoeda(relatorio.destinos.total)}</strong>
                                            </td>

                                            <td>—</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p>Não há fontes ou destinos cadastrados neste período.</p>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

export default RelatorioFontesDestinos;
