import { useEffect, useRef, useState } from 'react';
import Icone from './Icone.jsx';
import './AjudaCampo.css';

export default function AjudaCampo({ id, campo, texto }) {
  const [aberta, setAberta] = useState(false);
  const container = useRef(null);

  useEffect(() => {
    if (!aberta) return;

    function fecharFora(event) {
      if (!container.current?.contains(event.target)) setAberta(false);
    }

    function fecharComEscape(event) {
      if (event.key === 'Escape') setAberta(false);
    }

    document.addEventListener('pointerdown', fecharFora);
    document.addEventListener('keydown', fecharComEscape);
    return () => {
      document.removeEventListener('pointerdown', fecharFora);
      document.removeEventListener('keydown', fecharComEscape);
    };
  }, [aberta]);

  return (
    <span
      className="fl-field-help"
      ref={container}
      onMouseEnter={() => setAberta(true)}
      onMouseLeave={(event) => {
        if (!event.currentTarget.contains(document.activeElement)) setAberta(false);
      }}
      onFocus={() => setAberta(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setAberta(false);
      }}
    >
      <button
        className="fl-help-button"
        type="button"
        aria-label={`Ajuda sobre ${campo.toLowerCase()}`}
        aria-controls={id}
        aria-expanded={aberta}
        aria-describedby={aberta ? id : undefined}
        onClick={() => setAberta(true)}
      >
        <Icone nome="ajuda" />
      </button>
      <span className="fl-tooltip" id={id} role="tooltip" hidden={!aberta}>{texto}</span>
    </span>
  );
}
