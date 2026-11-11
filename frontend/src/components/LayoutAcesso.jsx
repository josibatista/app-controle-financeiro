import { useEffect } from 'react';
import SeletorTema from './SeletorTema.jsx';

export default function LayoutAcesso({ titulo, descricao, children }) {
  useEffect(() => { document.title = titulo; }, [titulo]);

  return (
    <div className="fl-page">
      <header className="fl-header">
        <SeletorTema />
      </header>
      <main className="fl-main">
        <h1 className="fl-heading">{titulo}</h1>
        {descricao && <p className="fl-description">{descricao}</p>}
        {children}
      </main>
    </div>
  );
}
