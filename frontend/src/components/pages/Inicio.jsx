import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icone from '../Icone.jsx';
import './Inicio.css';

const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
// Valores em centavos, usados somente para compor esta prévia do front-end.
const resumosExemplo = { '2026-11': { entradas: 80000, saidas: 10000 } };
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Inicio() {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const anos = Array.from({ length: 5 }, (_, indice) => hoje.getFullYear() - 2 + indice);
  const resumo = resumosExemplo[`${ano}-${String(mes).padStart(2, '0')}`] ?? { entradas: 0, saidas: 0 };
  const indicadores = [
    { rotulo: 'Entradas', valor: resumo.entradas, icone: 'entrada' },
    { rotulo: 'Saídas', valor: resumo.saidas, icone: 'saida' },
    { rotulo: 'Saldo do mês', valor: resumo.entradas - resumo.saidas, icone: 'saldo', saldo: true },
  ];

  useEffect(() => { document.title = 'Resumo do mês'; }, []);

  return (
    <section className="fl-inicio" aria-labelledby="titulo-inicio">
      <div className="fl-inicio-cabecalho">
        <div>
          <h1 id="titulo-inicio">Resumo do mês</h1>
          <p className="fl-inicio-descricao">Olá! Veja como estão suas finanças.</p>
        </div>
        <Link className="fl-novo-lancamento" to="/lancamentos?novo=1">
          <Icone nome="mais" /><span>Novo lançamento</span>
        </Link>
      </div>
      <div className="fl-inicio-periodo" role="group" aria-label="Período do resumo">
        <label className="fl-inicio-mes">
          <Icone nome="calendario" />
          <span className="fl-inicio-sr">Mês</span>
          <select value={mes} onChange={(event) => setMes(Number(event.target.value))}>
            {meses.map((nome, indice) => <option key={nome} value={indice + 1}>{nome}</option>)}
          </select>
        </label>
        <label className="fl-inicio-ano">
          <span className="fl-inicio-sr">Ano</span>
          <select value={ano} onChange={(event) => setAno(Number(event.target.value))}>
            {anos.map((valor) => <option key={valor} value={valor}>{valor}</option>)}
          </select>
        </label>
      </div>
      <dl className="fl-inicio-resumo" aria-live="polite" aria-atomic="true" aria-label={`Resumo de ${meses[mes - 1]} de ${ano}`}>
        {indicadores.map(({ rotulo, valor, icone, saldo }) => (
          <div className={`fl-resumo-item${saldo ? ' fl-resumo-item--saldo' : ''}`} key={rotulo}>
            <dt><span>{rotulo}</span><Icone nome={icone} /></dt>
            <dd>{moeda.format(valor / 100)}</dd>
          </div>
        ))}
      </dl>
      <div className="fl-inicio-area-reservada" aria-hidden="true" />
    </section>
  );
}
