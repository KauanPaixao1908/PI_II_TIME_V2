// Autor: Leonardo Miziara
// Consulta feriados nacionais na BrasilAPI para validar o prazo das demandas.
// Se a API estiver indisponível, o sistema registra um aviso e permite continuar.

interface FeriadoNacional {
    date: string;
    name: string;
}

// Guarda a lista de feriados de cada ano para evitar consultas repetidas.
const cacheFeriados: { [ano: number]: FeriadoNacional[] } = {};

// Confere se a data existe e está no formato AAAA-MM-DD.
export function dataEhReal(texto: string): boolean {
    if (texto.length !== 10 || texto[4] !== '-' || texto[7] !== '-') {
        return false;
    }

    for (let i = 0; i < texto.length; i++) {
        if (i !== 4 && i !== 7) {
            if (texto[i] < '0' || texto[i] > '9') {
                return false;
            }
        }
    }

    const ano = Number(texto.substring(0, 4));
    const mes = Number(texto.substring(5, 7));
    const dia = Number(texto.substring(8, 10));

    if (ano < 1 || mes < 1 || mes > 12 || dia < 1 || dia > 31) {
        return false;
    }

    const data = new Date(Date.UTC(ano, mes - 1, dia));
    if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) {
        return false;
    }

    return true;
}

// Busca a lista de feriados do ano. Só guarda no cache quando a API responde corretamente.
async function carregarFeriados(ano: number): Promise<FeriadoNacional[] | null> {
    if (cacheFeriados[ano]) {
        return cacheFeriados[ano];
    }

    try {
        const resposta = await fetch('https://brasilapi.com.br/api/feriados/v1/' + ano, {
            signal: AbortSignal.timeout(3000)
        });

        if (!resposta.ok) {
            console.warn('Não foi possível consultar a BrasilAPI. O prazo será aceito sem essa conferência.');
            return null;
        }

        const lista = await resposta.json() as FeriadoNacional[];
        if (!Array.isArray(lista)) {
            console.warn('A BrasilAPI retornou uma resposta inesperada. O prazo será aceito sem essa conferência.');
            return null;
        }

        cacheFeriados[ano] = lista;
        return lista;
    } catch (erro) {
        console.warn('BrasilAPI indisponível. O prazo será aceito sem conferir o feriado.');
        return null;
    }
}

// Devolve o nome do feriado nacional ou null quando não for feriado/API indisponível.
export async function nomeDoFeriadoNacional(data: string): Promise<string | null> {
    if (!dataEhReal(data)) {
        return null;
    }

    const ano = Number(data.substring(0, 4));
    const lista = await carregarFeriados(ano);
    if (lista === null) {
        return null;
    }

    for (let i = 0; i < lista.length; i++) {
        if (lista[i].date === data) {
            return lista[i].name;
        }
    }

    return null;
}
