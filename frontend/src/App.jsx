import { useEffect } from 'react';
import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import Login from './components/pages/Login.jsx';
import Cadastro from './components/pages/Cadastro.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import RotaProtegida from './components/RotaProtegida.jsx';
import LayoutPrincipal from './components/LayoutPrincipal.jsx';
import { itensMenu } from './components/MenuLateral.jsx';
import Inicio from './components/pages/Inicio.jsx';
import Perfil from './components/pages/Perfil.jsx';

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
      <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route element={<RotaProtegida />}>
          <Route element={<LayoutPrincipal />}>
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/meu-perfil" element={<Perfil />} />
          {itensMenu.map(({ caminho, rotulo }) => (
            <Route key={caminho} path={caminho} element={<AreaReservada titulo={rotulo} />} />
          ))}
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/inicio" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

