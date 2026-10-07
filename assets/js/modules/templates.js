/*
  Fábrica de componentes: clona os <template> do index.html e preenche os
  campos marcados com data-campo.
  Regra de segurança: dados (do JSON ou digitados) entram SEMPRE por textContent,
  nunca por innerHTML.
*/
const tplCard = document.getElementById('tpl-card-projeto');
const tplBadge = document.getElementById('tpl-badge');
const tplAlerta = document.getElementById('tpl-alerta');

/* Preenche os elementos [data-campo] da raiz com textContent. */
function preencherCampos(raiz, dados) {
  raiz.querySelectorAll('[data-campo]').forEach((el) => {
    const chave = el.dataset.campo;
    if (chave in dados && dados[chave] != null) {
      el.textContent = dados[chave];
    }
  });
}

/* Cria uma badge; tipo pode ser "online", "presencial", "hibrido" ou null (neutra). */
export function criarBadge(badge) {
  const el = tplBadge.content.firstElementChild.cloneNode(true);
  el.textContent = badge.texto;
  if (badge.tipo) el.classList.add(`badge--${badge.tipo}`);
  return el;
}

/* Cria o card de um projeto a partir de um objeto do projetos.json. */
export function criarCardProjeto(projeto) {
  const card = tplCard.content.firstElementChild.cloneNode(true);
  preencherCampos(card, projeto);
  const badges = card.querySelector('.badges');
  (projeto.badges || []).forEach((badge) => badges.append(criarBadge(badge)));
  return card;
}

/* Cria um alerta; tipo: "info", "sucesso", "aviso" ou "erro". */
export function criarAlerta({ tipo, titulo, mensagem }) {
  const alerta = tplAlerta.content.firstElementChild.cloneNode(true);
  alerta.classList.add(`alerta--${tipo}`);
  preencherCampos(alerta, { titulo, mensagem });
  return alerta;
}
