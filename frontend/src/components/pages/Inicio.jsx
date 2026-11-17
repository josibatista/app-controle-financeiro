import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icone from '../Icone.jsx';
import { consultarResumo } from '../../services/resumo.js';
import './Inicio.css';

const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Inicio() {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [tentativa, setTentativa] = useState(0);
  const [consulta, setConsulta] = useState({ chave: '', status: 'carregando', dados: null, erro: '' });
  const chave = `${ano}-${mes}`;
  const atual = consulta.chave === chave ? consulta : { status: 'carregando', dados: null };
  const anos = Array.from({ length: 5 }, (_, indice) => hoje.getFullYear() - 2 + indice);
  const resumo = atual.dados;
  const indicadores = [
    { rotulo: 'Entradas', valor: resumo?.totalEntradas, icone: 'entrada' },
    { rotulo: 'Saídas', valor: resumo?.totalSaidas, icone: 'saida' },
    { rotulo: 'Saldo do mês', valor: resumo?.saldo, icone: 'saldo', saldo: true },
  ];

  useEffect(() => { document.title = 'Resumo do mês'; }, []);
  useEffect(() => {
    const controlador = new AbortController();
    setConsulta({ chave, status: 'carregando', dados: null, erro: '' });
    consultarResumo(ano, mes, { signal: controlador.signal })
      .then((dados) => {
        if (!controlador.signal.aborted) setConsulta({ chave, status: 'pronto', dados, erro: '' });
      })
      .catch((erro) => {
        if (!controlador.signal.aborted && erro.name !== 'AbortError') {
          setConsulta({ chave, status: 'erro', dados: null, erro: erro.message });
        }
      });
    return () => controlador.abort();
  }, [ano, mes, chave, tentativa]);

  return (
    <section className="fl-inicio" aria-labelledby="titulo-inicio" aria-busy={atual.status === 'carregando'}>
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
            <dd>{valor === undefined ? '—' : moeda.format(valor)}</dd>
          </div>
        ))}
      </dl>
      {atual.status === 'carregando' && <p className="fl-inicio-status" role="status">Carregando o resumo...</p>}
      {atual.status === 'erro' && (
        <div className="fl-inicio-retorno">
          <p className="fl-alert" role="alert">{atual.erro}</p>
          <button className="fl-text-button" type="button" onClick={() => setTentativa((valor) => valor + 1)}>Tentar novamente</button>
        </div>
      )}
      {atual.status === 'pronto' && resumo.totalEntradas === 0 && resumo.totalSaidas === 0 && <p className="fl-inicio-status" role="status">Nenhuma movimentação neste período.</p>}
      <div className="fl-inicio-area-reservada" aria-hidden="true" />
    </section>
  );
}
