import { useEffect } from 'react';
import SeletorTema from './SeletorTema.jsx';

export default function LayoutAcesso({ titulo, descricao, classePrincipal = '', children }) {
  useEffect(() => { document.title = titulo; }, [titulo]);

  return (
    <div className="fl-page">
      <header className="fl-header">
        <SeletorTema />
      </header>
      <main className={`fl-main${classePrincipal ? ` ${classePrincipal}` : ''}`}>
        <h1 className="fl-heading">{titulo}</h1>
        {descricao && <p className="fl-description">{descricao}</p>}
        {children}
      </main>
    </div>
  );
}

