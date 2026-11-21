import { useEffect, useState } from 'react';
import RelatorioCategoria from '../relatorios/RelatorioCategoria.jsx';
import RelatorioFonteDestino from '../relatorios/RelatorioFonteDestino.jsx';
import './Relatorio.css';

function Relatorios() {
    const [abaAtiva, setAbaAtiva] = useState('categorias');

    useEffect(() => {
        document.title = 'Relatórios';
    }, []);

    return (
    <div className="fl-page rel-page">
      <main className="rel-main">
        <header>
          <h1 className="fl-heading">Relatórios</h1>
          <p className="fl-description">
            Analise a distribuição dos seus lançamentos por categoria, fonte e destino.
          </p>
        </header>

        <nav className="abas-relatorios" role="tablist" aria-label="Tipos de relatório">
          <button
            type="button"
            role="tab"
            aria-selected={abaAtiva === 'categorias'}
            className={abaAtiva === 'categorias' ? 'aba ativa' : 'aba'}
            onClick={() => setAbaAtiva('categorias')}
          >
            Por categorias
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={abaAtiva === 'fontes-destinos'}
            className={abaAtiva === 'fontes-destinos' ? 'aba ativa' : 'aba'}
            onClick={() => setAbaAtiva('fontes-destinos')}
          >
            Por fontes e destinos
          </button>
        </nav>

        <section className="conteudo-relatorios">
          {abaAtiva === 'categorias' && <RelatorioCategoria />}
          {abaAtiva === 'fontes-destinos' && <RelatorioFonteDestino />}
        </section>
      </main>
    </div>
  );
}

export default Relatorios;