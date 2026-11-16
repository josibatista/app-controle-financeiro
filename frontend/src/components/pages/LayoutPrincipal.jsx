import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Icone from './Icone.jsx';
import MenuLateral from './MenuLateral.jsx';
import SeletorTema from './SeletorTema.jsx';
import './LayoutPrincipal.css';

export default function LayoutPrincipal() {
  const dialogo = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => { dialogo.current?.close(); }, [pathname]);

  useEffect(() => {
    const telaGrande = window.matchMedia('(min-width: 861px)');
    function fecharAoAmpliar() {
      if (telaGrande.matches) dialogo.current?.close();
    }
    telaGrande.addEventListener('change', fecharAoAmpliar);
    return () => telaGrande.removeEventListener('change', fecharAoAmpliar);
  }, []);

  return (
    <div className="fl-app">
      <a className="fl-pular-menu" href="#conteudo-principal">Ir para o conteúdo</a>
      <aside className="fl-sidebar-desktop" aria-label="Navegação lateral">
        <MenuLateral />
      </aside>
      <div className="fl-app-corpo">
        <header className="fl-barra-principal">
          <button className="fl-abrir-menu" type="button" aria-haspopup="dialog" aria-controls="menu-principal-movel" onClick={() => dialogo.current?.showModal()}>
            <Icone nome="menu" /><span>Menu</span>
          </button>
          <SeletorTema somenteIcones />
        </header>
        <main className="fl-conteudo" id="conteudo-principal" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      <dialog className="fl-menu-dialogo" id="menu-principal-movel" aria-label="Menu principal" ref={dialogo} onClick={(event) => { if (event.target === event.currentTarget) dialogo.current?.close(); }}>
        <button className="fl-fechar-menu" type="button" onClick={() => dialogo.current?.close()} autoFocus>
          <Icone nome="fechar" /><span>Fechar menu</span>
        </button>
        <MenuLateral aoNavegar={() => dialogo.current?.close()} />
      </dialog>
    </div>
  );
}
