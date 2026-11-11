import { useState } from 'react';
import Icone from './Icone.jsx';

export default function Campo({ id, label, erro, ajuda, type = 'text', ...props }) {
  const [mostrar, setMostrar] = useState(false);
  const senha = type === 'password';
  const descricao = [ajuda && `${id}-ajuda`, erro && `${id}-erro`].filter(Boolean).join(' ') || undefined;

  return (
    <div className="fl-field">
      <label htmlFor={id}>{label}</label>
      <div className="fl-input-wrap">
        <input {...props} id={id} className={`fl-input${senha ? ' fl-password' : ''}`} type={senha && mostrar ? 'text' : type} aria-invalid={Boolean(erro)} aria-describedby={descricao} />
        {senha && (
          <button className="fl-eye" type="button" aria-label={`${mostrar ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`} aria-controls={id} aria-pressed={mostrar} onClick={() => setMostrar((atual) => !atual)}>
            <Icone nome={mostrar ? 'olhoFechado' : 'olho'} />
          </button>
        )}
      </div>
      {ajuda && <p className="fl-help" id={`${id}-ajuda`}>{ajuda}</p>}
      {erro && <p className="fl-field-error" id={`${id}-erro`} role="alert">{erro}</p>}
    </div>
  );
}
