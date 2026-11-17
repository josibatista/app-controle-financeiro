import { useState } from 'react';
import RelatorioCategoria from '../relatorios/RelatorioCategoria.jsx';
import RelatorioFonteDestino from '../relatorios/RelatorioFonteDestino.jsx';
import './Relatorio.css';

function Relatorios() {
    const [abaAtiva, setAbaAtiva] = useState('categorias');

    return (
        <main className='pagina-relatorios'>
            <h1>Relatórios</h1>

            <nav className='abas-relatorios'>
                <button 
                    className={abaAtiva === 'categorias' ? 'aba ativa' : 'aba'}
                    onClick={() => setAbaAtiva('categorias')}
                >
                    Por categorias
                </button>

                <button
                    className={abaAtiva === 'fontes-destinos' ? 'aba ativa' : 'aba'}
                    onClick={() => setAbaAtiva('fontes-destinos')}
                >
                    Por fontes e destinos
                </button>
            </nav>

            <section className='conteudo-relatorios'>
                {abaAtiva === 'categorias' && <RelatorioCategoria />}

                {abaAtiva === 'fontes-destinos' && <RelatorioFonteDestino />}
            </section>
        </main>     
    );
}

export default Relatorios;