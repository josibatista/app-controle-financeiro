const dadosDemonstracao = {
  mesReferencia: '2026-11',
  poupanca: {
    percentual: 4,
  },
  categorias: [
    { id: 1, nome: 'Alimentação', variacaoPercentual: 35 },
    { id: 2, nome: 'Transporte', variacaoPercentual: -8 },
    {id: 3, nome: 'namorada', variacaoPercentual: 0}
  ],
  cartoes: {
    meses: 3,
    percentual: 24,
  },
  parcelas: {
    totalCentavos: 124000,
    ultimoVencimento: '2027-03',
    porMes: [
      { mes: '2026-12', totalCentavos: 40000 },
      { mes: '2027-01', totalCentavos: 32000 },
      { mes: '2027-02', totalCentavos: 32000 },
      { mes: '2027-03', totalCentavos: 20000 },
    ],
  },
  projecao: {
    inicio: '2026-11',
    fim: '2027-10',
    saidasCentavos: 3600000,
    entradasFixasCentavos: 4800000,
    percentualComprometido: 75,
  },
};

export async function buscarSaudeFinanceira() {
  return dadosDemonstracao;
}