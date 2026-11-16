export default function Icone({ nome }) {
  const caminhos = {
    sol: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5" /></>,
    lua: <path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z" />,
    olho: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    olhoFechado: <><path d="m3 3 18 18M9.8 5.2A12.6 12.6 0 0 1 12 5c6.5 0 10 7 10 7a19 19 0 0 1-3.2 4.2M6.1 6.1A20 20 0 0 0 2 12s3.5 7 10 7a11 11 0 0 0 5.9-1.9M10 10a2.8 2.8 0 0 0 4 4" /></>,
    seta: <path d="M4 12h16m-6-6 6 6-6 6" />,
    ajuda: <><circle cx="12" cy="12" r="9" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4M12 17h.01" /></>,
    perfil: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
    inicio: <><path d="m3 10 9-7 9 7M5 9v12h14V9" /><path d="M9 21v-7h6v7" /></>,
    categorias: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    fontes: <><path d="M3 7V5a2 2 0 0 1 2-2h13v4M3 7h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><path d="M21 11h-6v6h6M17 14h.01" /></>,
    lancamentos: <><path d="M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4" /></>,
    faturas: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
    relatorios: <path d="M4 3v18h17M9 16v-5m5 5V6m5 10v-8" />,
    saude: <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /><path d="M3 12h5l2-4 3 8 2-4h6" /></>,
    sair: <><path d="M9 4H4v16h5M10 12h11m-4-4 4 4-4 4" /></>,
    menu: <path d="M3 6h18M3 12h18M3 18h18" />,
    fechar: <path d="m6 6 12 12M6 18 18 6" />,
    mais: <path d="M12 5v14M5 12h14" />,
    calendario: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    entrada: <path d="M18 6 6 18M6 8v10h10" />,
    saida: <path d="M6 18 18 6M8 6h10v10" />,
    saldo: <path d="M5 9h14M5 15h14" />,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{caminhos[nome]}</svg>;
}

