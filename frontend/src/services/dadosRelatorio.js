async function buscarDados(url) {
    const resposta = await fetch(url);
    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(
            dados.erro || 'Não foi possível buscar os dados do relatório.'
        );
    }

    return dados;
}

export async function buscarRelatorioCategoria(inicio, fim) {
    const parametros = new URLSearchParams({
        inicio,
        fim
    });

    return buscarDados(
        `/api/relatorios/categorias?${parametros}`
    );
}

export async function buscarRelatorioFonteDestino(inicio, fim) {
    const parametros = new URLSearchParams({
        inicio,
        fim
    });

    return buscarDados(
        `/api/relatorios/fontes-destinos?${parametros}`
    );
}