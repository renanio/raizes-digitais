/*
  Modal de proteção de menores usando o elemento nativo <dialog>.
  Abre com showModal(); fecha pelo botão Fechar, pela tecla Esc (nativa do
  dialog) e ao clicar no fundo; devolve o foco ao botão que o abriu.
*/
export function ligarModal(raiz) {
  const dialog = raiz.querySelector('#modal-protecao');
  const abrir = raiz.querySelector('.link-modal');
  if (!dialog || !abrir) return;

  const fechar = dialog.querySelector('.modal-fechar');
  let gatilho = null;

  abrir.addEventListener('click', () => {
    gatilho = abrir;
    dialog.showModal();
  });

  if (fechar) {
    fechar.addEventListener('click', () => dialog.close());
  }

  // Clique no fundo (fora da caixa) fecha o modal.
  dialog.addEventListener('click', (evento) => {
    if (evento.target === dialog) dialog.close();
  });

  // Ao fechar (botão, Esc ou fundo), devolve o foco ao gatilho.
  dialog.addEventListener('close', () => {
    if (gatilho) gatilho.focus();
  });
}
