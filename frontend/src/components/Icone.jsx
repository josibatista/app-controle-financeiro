export default function Icone({ nome }) {
  const caminhos = {
    sol: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5" /></>,
    lua: <path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z" />,
    olho: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    olhoFechado: <><path d="m3 3 18 18M9.8 5.2A12.6 12.6 0 0 1 12 5c6.5 0 10 7 10 7a19 19 0 0 1-3.2 4.2M6.1 6.1A20 20 0 0 0 2 12s3.5 7 10 7a11 11 0 0 0 5.9-1.9M10 10a2.8 2.8 0 0 0 4 4" /></>,
    seta: <path d="M4 12h16m-6-6 6 6-6 6" />,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{caminhos[nome]}</svg>;
}
