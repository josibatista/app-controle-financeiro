import { useTheme } from '../contexts/ThemeContext.jsx';
import Icone from './Icone.jsx';

export default function SeletorTema() {
  const { tema, alterarTema } = useTheme();
  return (
    <div className="fl-theme-switch" role="group" aria-label="Tema da interface">
      <button className="fl-theme-option" type="button" aria-pressed={tema === 'light'} onClick={() => alterarTema('light')}>
        <Icone nome="sol" />Claro
      </button>
      <button className="fl-theme-option" type="button" aria-pressed={tema === 'dark'} onClick={() => alterarTema('dark')}>
        <Icone nome="lua" />Escuro
      </button>
    </div>
  );
}
