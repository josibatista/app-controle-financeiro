import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import MenuLateral from './MenuLateral.jsx';
import SeletorTema from './SeletorTema.jsx';
import { lerMenuMinimizado, salvarMenuMinimizado } from '../services/menu.js';
import './LayoutPrincipal.css';

export default function LayoutPrincipal() {
  const dialogo = useRef(null);
  const [minimizado, setMinimizado] = useState(lerMenuMinimizado);
  const [telaPequena, setTelaPequena] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 480px)').matches);

  useEffect(() => { salvarMenuMinimizado(minimizado); }, [minimizado]);

  useEffect(() => {
    const consulta = window.matchMedia('(max-width: 480px)');
    function atualizarTela() { setTelaPequena(consulta.matches); }
    atualizarTela();
    consulta.addEventListener('change', atualizarTela);
    return () => consulta.removeEventListener('change', atualizarTela);
  }, []);

  useEffect(() => {
    const modal = dialogo.current;
    if (telaPequena && !minimizado) {
      if (!modal.open) modal.showModal();
    } else if (modal.open) {
      modal.close();
    }
  }, [telaPequena, minimizado]);

  function alternarMenu() { setMinimizado((atual) => !atual); }
  function minimizarMenu() { setMinimizado(true); }

  return (
    <div className="fl-app" data-menu={minimizado ? 'minimizado' : 'fixo'}>
      <a className="fl-pular-menu" href="#conteudo-principal">Ir para o conteúdo</a>
      <aside className="fl-sidebar-desktop" aria-label="Navegação lateral">
        <MenuLateral minimizado={telaPequena || minimizado} aoAlternar={alternarMenu} />
      </aside>
      <div className="fl-app-corpo">
        <header className="fl-barra-principal">
          <SeletorTema somenteIcones />
        </header>
        <main className="fl-conteudo" id="conteudo-principal" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      <dialog className="fl-menu-dialogo" aria-label="Menu principal" ref={dialogo} onCancel={(event) => { event.preventDefault(); minimizarMenu(); }} onClick={(event) => { if (event.target === event.currentTarget) minimizarMenu(); }}>
        <MenuLateral aoAlternar={minimizarMenu} aoNavegar={minimizarMenu} focoInicial />
      </dialog>
    </div>
  );
}
