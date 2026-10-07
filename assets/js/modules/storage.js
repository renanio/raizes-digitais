/*
  Persistência do rascunho do cadastro no localStorage.
*/
const CHAVE = 'raizes-digitais:cadastro';

/* Gravar o rascunho como JSON */
export function salvar(dados) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(dados));
  } catch {
    // localStorage pode estar indisponível (janela privada, cota cheia)
  }
}

/* Recuperar o rascunho, devolvendo null quando ausente ou corrompido */
export function recuperar() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

/* Apagar o rascunho */
export function remover() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    // ignorar indisponibilidade do localStorage
  }
}
