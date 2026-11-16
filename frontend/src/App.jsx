import { useEffect } from 'react';
import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import Login from './components/pages/Login.jsx';
import Cadastro from './components/pages/Cadastro.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import LayoutPrincipal from './components/pages/LayoutPrincipal.jsx';
import { itensMenu } from './components/pages/MenuLateral.jsx';
import Inicio from './components/pages/Inicio.jsx';

// As telas do grupo serão conectadas a estas rotas em uma próxima integração.
function AreaReservada({ titulo }) {
  const [parametros] = useSearchParams();
  const tituloAtual = titulo === 'Lançamentos' && parametros.get('novo') === '1' ? 'Novo lançamento' : titulo;
  useEffect(() => { document.title = tituloAtual; }, [tituloAtual]);
  return <section aria-label={tituloAtual}><h1>{tituloAtual}</h1></section>;
}

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route element={<LayoutPrincipal />}>
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/meu-perfil" element={<AreaReservada titulo="Meu perfil" />} />
          {itensMenu.map(({ caminho, rotulo }) => (
            <Route key={caminho} path={caminho} element={<AreaReservada titulo={rotulo} />} />
          ))}
        </Route>
        <Route path="/" element={<Navigate to="/inicio" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

