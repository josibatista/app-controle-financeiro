import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './components/pages/Login.jsx';
import Cadastro from './components/pages/Cadastro.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import RotaProtegida from './components/RotaProtegida.jsx';
import LayoutPrincipal from './components/LayoutPrincipal.jsx';
import Inicio from './components/pages/Inicio.jsx';
import Perfil from './components/pages/Perfil.jsx';
import Categorias from './components/pages/Categorias.jsx';
import FontesDestinos from './components/pages/FontesDestinos.jsx';
import Lancamentos from './components/pages/Lancamentos.jsx';
import Faturas from './components/pages/Faturas.jsx';
import Relatorio from './components/pages/Relatorio.jsx';
import SaudeFinanceira from './components/pages/SaudeFinanceira.jsx';

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
              <Route path="/categorias" element={<Categorias />} />
              <Route path="/fontes-destinos" element={<FontesDestinos />} />
              <Route path="/lancamentos" element={<Lancamentos />} />
              <Route path="/faturas" element={<Faturas />} />
              <Route path="/relatorios" element={<Relatorio />} />
              <Route path="/relatorio" element={<Navigate to="/relatorios" replace />} />
              <Route path="/saude-financeira" element={<SaudeFinanceira />} />
            </Route>
          </Route>
          <Route path="/" element={<Navigate to="/inicio" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
