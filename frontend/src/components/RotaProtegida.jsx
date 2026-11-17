import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import LayoutAcesso from './LayoutAcesso.jsx';
import './Acesso.css';

// Só mostra as telas internas para quem está logado.
export default function RotaProtegida() {
  const { status } = useAuth();

  if (status === 'carregando') {
    return (
      <LayoutAcesso titulo="Verificando acesso" descricao="Aguarde enquanto confirmamos sua sessão.">
        <p className="fl-acesso-status">Carregando...</p>
      </LayoutAcesso>
    );
  }

  if (status !== 'autenticada') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
