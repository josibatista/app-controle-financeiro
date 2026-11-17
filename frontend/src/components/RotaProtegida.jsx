import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import LayoutAcesso from './LayoutAcesso.jsx';
import './Acesso.css';

export default function RotaProtegida() {
  const { status, erro, logout, restaurarSessao } = useAuth();
  if (status === 'carregando') {
    return <LayoutAcesso titulo="Verificando acesso" descricao="Aguarde enquanto confirmamos sua sessão."><p className="fl-acesso-status" role="status">Carregando...</p></LayoutAcesso>;
  }
  if (status === 'erro') {
    return (
      <LayoutAcesso titulo="Confirme seu acesso">
        <p className="fl-alert" role="alert">{erro}</p>
        <div className="fl-acesso-acoes">
          <button className="fl-submit" type="button" onClick={restaurarSessao}>Tentar novamente</button>
          <button className="fl-text-button" type="button" onClick={logout}>Voltar ao login</button>
        </div>
      </LayoutAcesso>
    );
  }
  return status === 'autenticada' ? <Outlet /> : <Navigate to="/login" replace />;
}
