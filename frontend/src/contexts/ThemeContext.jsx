import { createContext, useContext, useLayoutEffect, useState } from 'react';
import { lerTema, salvarTema } from '../services/tema.js';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(lerTema);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = tema;
    document.documentElement.style.colorScheme = tema;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tema === 'dark' ? '#201a1e' : '#fffcfd');
  }, [tema]);

  function alterarTema(novoTema) {
    if (novoTema !== 'light' && novoTema !== 'dark') return;
    setTema(novoTema);
    salvarTema(novoTema);
  }

  return <ThemeContext.Provider value={{ tema, alterarTema }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const contexto = useContext(ThemeContext);
  if (!contexto) throw new Error('useTheme precisa estar dentro de ThemeProvider.');
  return contexto;
}
