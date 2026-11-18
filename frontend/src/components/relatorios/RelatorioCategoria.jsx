import { useState } from 'react';
import { buscarRelatorioCategoria } from '../../services/dadosRelatorio';
import './RelatorioCategoria.css';

import {
    PieChart,
    Pie,
    Sector,
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
    //período selecionado para consulta
    const [inicio, setInicio] = useState('2026-01-01');
    const [fim, setFim] = useState('2026-12-31');

    //dados retornados da API
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
            const dados = await buscarRelatorioCategoria(inicio, fim);

            console.log('Dados recebidos da API:', dados);

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
            <h2>Relatório por categorias</h2>

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
                            <p>{formatarMoeda(relatorio.entradas.total)}</p>
                        </div>

                        <div>
                            <h3>Total de saídas</h3>
                            <p>{formatarMoeda(relatorio.saidas.total)}</p>
                        </div>

                        <div>
                            <h3>Saldo do período</h3>
                            <p>{formatarMoeda(relatorio.saldo)}</p>
                        </div>
                    </section>

                    <div className="graficos-saidas">

                        <div className="grafico-categorias">
                            <h4>Distribuição das saídas</h4>

                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={relatorio.saidas.categorias.map((categoria, indice) => ({
                                            ...categoria,
                                            fill: CORES_GRAFICO[indice % CORES_GRAFICO.length],
                                        }))}
                                        dataKey="total"
                                        nameKey="nome"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={75}
                                        outerRadius={110}
                                        paddingAngle={3}
                                    />

                                    <Tooltip
                                        formatter={(valor) => formatarMoeda(valor)}
                                    />

                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <section className="grafico-maiores-gastos">
                            <h4>Onde você mais gastou</h4>
                            <p>Categorias ordenadas do maior para o menor</p>

                            {dadosOndeMaisGastou.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={dadosOndeMaisGastou}
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
                                            domain={[0, 'dataMax']}
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
                                            cursor={{ fill: '#FAF3F6' }}
                                        />

                                        <Bar
                                            dataKey="total"
                                            radius={[0, 6, 6, 0]}
                                            barSize={12}
                                            shape={(props) => (
                                                <Rectangle
                                                    {...props}
                                                    fill={props.payload.cor}
                                                />
                                            )}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p>Não há despesas registradas neste período.</p>
                            )}
                        </section>

                    </div>
                    <section className="tabela-categorias">
                        <h3>Detalhamento por categoria</h3>
                        <p>
                            Comparação com o período anterior
                        </p>

                        <div className="tabela-categorias-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Categoria</th>
                                        <th>Saídas</th>
                                        <th>Participação</th>
                                        <th>Período anterior</th>
                                        <th>Variação</th>
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

                                                <td>
                                                    {formatarMoeda(categoria.total)}
                                                </td>

                                                <td>
                                                    {Number(categoria.percentual).toFixed(2)}%
                                                </td>

                                                <td>
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

                                        <th>
                                            {formatarMoeda(relatorio.saidas.total)}
                                        </th>

                                        <th>100,00%</th>

                                        <th>
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

                    <section>
                        <h3>Entradas por categoria</h3>

                        {relatorio.entradas.categorias.map((categoria) => (
                            <div key={categoria.id}>
                                <strong>{categoria.nome}</strong>
                                <p>Total: {formatarMoeda(categoria.total)}</p>
                                <p>Participação: {categoria.percentual}%</p>
                            </div>
                        ))}
                    </section>
                </>
            )}

        </div>
    );
}

export default RelatorioCategorias;
