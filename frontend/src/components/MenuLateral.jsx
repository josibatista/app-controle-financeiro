import { useId } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import Icone from './Icone.jsx';
import './MenuLateral.css';

export const itensMenu = [
  { caminho: '/categorias', rotulo: 'Categorias', icone: 'categorias' },
  { caminho: '/fontes-destinos', rotulo: 'Fontes e destinos', icone: 'fontes' },
  { caminho: '/lancamentos', rotulo: 'Lançamentos', icone: 'lancamentos' },
  { caminho: '/faturas', rotulo: 'Faturas', icone: 'faturas' },
  { caminho: '/relatorios', rotulo: 'Relatórios', icone: 'relatorios' },
  { caminho: '/saude-financeira', rotulo: 'Saúde financeira', icone: 'saude' },
];

export default function MenuLateral({ minimizado = false, aoAlternar, aoNavegar, focoInicial = false }) {
  const menuId = useId();
  const { logout } = useAuth();
  const navegar = useNavigate();
  const nomeBotao = minimizado ? 'Fixar menu' : 'Minimizar menu';
  function sair() {
    logout();
    aoNavegar?.();
    navegar('/login', { replace: true });
  }
  function item(caminho, rotulo, icone, classe = '') {
    return (
      <NavLink
        key={caminho}
        to={caminho}
        end
        aria-label={rotulo}
        title={minimizado ? rotulo : undefined}
        onClick={aoNavegar}
        className={({ isActive }) => `fl-menu-item ${classe}${isActive ? ' fl-menu-item--ativo' : ''}`}
      >
        <span className="fl-menu-icone"><Icone nome={icone} /></span>
        <span className="fl-menu-rotulo">{rotulo}</span>
      </NavLink>
    );
  }

  return (
    <div className={`fl-menu-lateral${minimizado ? ' fl-menu-lateral--minimizado' : ''}`}>
      <div className="fl-menu-topo">
        <button className="fl-menu-alternar" type="button" aria-label={nomeBotao} title={nomeBotao} aria-controls={menuId} aria-expanded={!minimizado} onClick={aoAlternar} autoFocus={focoInicial}>
          <Icone nome={minimizado ? 'painelExpandir' : 'painelRecolher'} />
          <span className="fl-menu-rotulo">{nomeBotao}</span>
        </button>
      </div>
      <nav id={menuId} aria-label="Menu principal" className="fl-menu-navegacao">
        <div className="fl-menu-acesso">
          {item('/meu-perfil', 'Meu perfil', 'perfil', 'fl-menu-perfil')}
          {item('/inicio', 'Início', 'inicio')}
        </div>
        <div className="fl-menu-secoes">
          {itensMenu.map(({ caminho, rotulo, icone }) => item(caminho, rotulo, icone))}
        </div>
      </nav>
      <div className="fl-menu-rodape">
        <button className="fl-menu-item fl-menu-sair" type="button" aria-label="Sair da conta" title={minimizado ? 'Sair da conta' : undefined} onClick={sair}>
          <span className="fl-menu-icone"><Icone nome="sair" /></span>
          <span className="fl-menu-rotulo">Sair da conta</span>
        </button>
      </div>
    </div>
  );
}
