import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './components/pages/Login.jsx';
import Cadastro from './components/pages/Cadastro.jsx';
import Lancamentos from './components/pages/Lancamentos.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/lancamentos" element={<Lancamentos />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ThemeProvider>
  );
}