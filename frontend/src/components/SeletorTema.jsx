import { useTheme } from '../contexts/ThemeContext.jsx';
import Icone from './Icone.jsx';

export default function SeletorTema({ somenteIcones = false }) {
  const { tema, alterarTema } = useTheme();
  return (
    <div
      className={`fl-theme-switch${somenteIcones ? ' fl-theme-switch--icones' : ''}`}
      role="group"
      aria-label="Tema da interface"
    >
      <button
        className="fl-theme-option"
        type="button"
        aria-label="Tema claro"
        data-tema="light"
        aria-pressed={tema === 'light'}
        onClick={() => alterarTema('light')}
      >
        <Icone nome="sol" />
        {!somenteIcones && 'Claro'}
      </button>
      <button
        className="fl-theme-option"
        type="button"
        aria-label="Tema escuro"
        data-tema="dark"
        aria-pressed={tema === 'dark'}
        onClick={() => alterarTema('dark')}
      >
        <Icone nome="lua" />
        {!somenteIcones && 'Escuro'}
      </button>
    </div>
  );
}
