import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icone from '../Icone.jsx';
import { consultarResumo } from '../../services/resumo.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import './Inicio.css';

const meses = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Inicio() {
  const { usuario } = useAuth();
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);

  const anos = [];
  for (let valor = hoje.getFullYear() - 2; valor <= hoje.getFullYear() + 2; valor += 1) {
    anos.push(valor);
  }

  useEffect(() => {
    document.title = 'Resumo do mês';
  }, []);

  // Busca o resumo sempre que o mês ou o ano mudam.
  useEffect(() => {
    setCarregando(true);
    setErro('');

    consultarResumo(ano, mes)
      .then((dados) => setResumo(dados))
      .catch((erroConsulta) => {
        setResumo(null);
        setErro(erroConsulta.message);
      })
      .finally(() => setCarregando(false));
  }, [ano, mes, tentativa]);

  const indicadores = [
    { rotulo: 'Entradas', valor: resumo?.totalEntradas, icone: 'entrada' },
    { rotulo: 'Saídas', valor: resumo?.totalSaidas, icone: 'saida' },
    { rotulo: 'Saldo do mês', valor: resumo?.saldo, icone: 'saldo', saldo: true },
  ];

  const semMovimentacao =
    !carregando && resumo && resumo.totalEntradas === 0 && resumo.totalSaidas === 0;

  return (
    <section className="fl-inicio">
      <div className="fl-inicio-cabecalho">
        <div>
          <h1>Resumo do mês</h1>
          <p className="fl-inicio-descricao">
            Olá, {usuario.nome.split(' ')[0]}! Veja como estão suas finanças.
          </p>
        </div>
        <Link className="fl-novo-lancamento" to="/lancamentos">
          <Icone nome="seta" />
          <span>Ver lançamentos</span>
        </Link>
      </div>
      <div className="fl-inicio-periodo">
        <label className="fl-inicio-mes">
          <Icone nome="calendario" />
          <span className="fl-inicio-sr">Mês</span>
          <select value={mes} onChange={(event) => setMes(Number(event.target.value))}>
            {meses.map((nome, indice) => (
              <option key={nome} value={indice + 1}>
                {nome}
              </option>
            ))}
          </select>
        </label>
        <label className="fl-inicio-ano">
          <span className="fl-inicio-sr">Ano</span>
          <select value={ano} onChange={(event) => setAno(Number(event.target.value))}>
            {anos.map((valor) => (
              <option key={valor} value={valor}>
                {valor}
              </option>
            ))}
          </select>
        </label>
      </div>
      <dl className="fl-inicio-resumo">
        {indicadores.map(({ rotulo, valor, icone, saldo }) => (
          <div
            className={saldo ? 'fl-resumo-item fl-resumo-item--saldo' : 'fl-resumo-item'}
            key={rotulo}
          >
            <dt>
              <span>{rotulo}</span>
              <Icone nome={icone} />
            </dt>
            <dd>{carregando || valor === undefined ? '—' : moeda.format(valor)}</dd>
          </div>
        ))}
      </dl>
      {carregando && <p className="fl-inicio-status">Carregando o resumo...</p>}
      {erro && (
        <div className="fl-inicio-retorno">
          <p className="fl-alert">{erro}</p>
          <button
            className="fl-text-button"
            type="button"
            onClick={() => setTentativa(tentativa + 1)}
          >
            Tentar novamente
          </button>
        </div>
      )}
      {semMovimentacao && (
        <p className="fl-inicio-status">Nenhuma movimentação neste período.</p>
      )}
      <div className="fl-inicio-area-reservada" />
    </section>
  );
}
