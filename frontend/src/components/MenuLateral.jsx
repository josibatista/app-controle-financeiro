import { NavLink } from 'react-router-dom';
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

export default function MenuLateral({ aoNavegar }) {
  function item(caminho, rotulo, icone, classe = '') {
    return (
      <NavLink
        key={caminho}
        to={caminho}
        end
        onClick={aoNavegar}
        className={({ isActive }) => `fl-menu-item ${classe}${isActive ? ' fl-menu-item--ativo' : ''}`}
      >
        <span className="fl-menu-icone"><Icone nome={icone} /></span>
        <span>{rotulo}</span>
      </NavLink>
    );
  }

  return (
    <div className="fl-menu-lateral">
      <div className="fl-menu-topo">
        <div className="fl-menu-marca-reservada" aria-hidden="true" />
      </div>
      <nav aria-label="Menu principal" className="fl-menu-navegacao">
        <div className="fl-menu-acesso">
          {item('/meu-perfil', 'Meu perfil', 'perfil', 'fl-menu-perfil')}
          {item('/inicio', 'Início', 'inicio')}
        </div>
        <div className="fl-menu-secoes">
          {itensMenu.map(({ caminho, rotulo, icone }) => item(caminho, rotulo, icone))}
        </div>
      </nav>
      <div className="fl-menu-rodape">
        {item('/login', 'Sair da conta', 'sair')}
      </div>
    </div>
  );
}
