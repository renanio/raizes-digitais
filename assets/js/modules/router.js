/*
  Roteador da SPA, baseado em hash (#/tela ou #/tela/subsecao).
  Carrega o HTML de cada tela de templates/<tela>.html e o insere em #app.
  O "#" é exclusivo do roteador: nenhum outro recurso depende de ancora no hash.
*/
import { criarCardProjeto, criarAlerta } from './templates.js';
import { ligarModal } from './modal.js';

const app = document.getElementById('app');
const ROTA_PADRAO = 'inicio';

const TELAS = {
  inicio: {
    titulo: 'Instituto Raízes Digitais | Tecnologia que transforma futuros',
  },
  projetos: {
    titulo: 'Projetos | Instituto Raízes Digitais',
    init: iniciarProjetos,
  },
  cadastro: {
    titulo: 'Faça parte | Instituto Raízes Digitais',
  },
};

/* Lê o hash e devolve { tela, subsecao }, caindo para a rota padrão se invalida. */
function lerRota() {
  const partes = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const tela = partes[0] || ROTA_PADRAO;
  const subsecao = partes[1] || null;
  if (!TELAS[tela]) return { tela: ROTA_PADRAO, subsecao: null };
  return { tela, subsecao };
}

async function renderizar() {
  const { tela, subsecao } = lerRota();
  const config = TELAS[tela];

  try {
    const resposta = await fetch(`templates/${tela}.html`);
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    // HTML de template proprio e confiavel; dados do usuario/JSON nunca entram assim.
    app.innerHTML = await resposta.text();
  } catch (erro) {
    mostrarErro(erro);
    return;
  }

  document.title = config.titulo;
  marcarLinkAtivo(tela);
  fecharMenu();

  if (typeof config.init === 'function') {
    await config.init();
  }

  focarTitulo();

  if (subsecao) rolarAte(subsecao);
}

/* Aplica aria-current="page" no link de nivel superior da tela ativa. */
function marcarLinkAtivo(tela) {
  const alvo = `#/${tela}`;
  document.querySelectorAll('nav a[href^="#/"]').forEach((link) => {
    if (link.getAttribute('href') === alvo) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

/* Fecha o menu hambúrguer (desmarca o checkbox) após navegar. */
function fecharMenu() {
  const toggle = document.getElementById('menu-toggle');
  if (toggle) toggle.checked = false;
}

/* Move o foco para o <h1> da tela, sem rolar a página. */
function focarTitulo() {
  const titulo = app.querySelector('h1');
  if (titulo) titulo.focus({ preventScroll: true });
}

/* Rola suavemente até a seção indicada na subrota. */
function rolarAte(id) {
  const secao = document.getElementById(id);
  if (secao) secao.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* Monta os cards de projeto a partir do JSON e liga o modal. */
async function iniciarProjetos() {
  const frentes = app.querySelector('#frentes');
  if (frentes) {
    try {
      const resposta = await fetch('assets/data/projetos.json');
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      const projetos = await resposta.json();
      projetos.forEach((projeto) => frentes.append(criarCardProjeto(projeto)));
    } catch (erro) {
      frentes.append(criarAlerta({
        tipo: 'erro',
        titulo: 'Erro:',
        mensagem: 'não foi possível carregar os projetos.',
      }));
      console.error('Falha ao carregar os projetos:', erro);
    }
  }
  ligarModal(app);
}

/* Exibe um alerta de erro quando o fetch de uma tela falha. */
function mostrarErro(erro) {
  app.replaceChildren(criarAlerta({
    tipo: 'erro',
    titulo: 'Erro:',
    mensagem: 'não foi possível carregar esta tela. Verifique a conexão e tente novamente.',
  }));
  console.error('Falha ao carregar a tela:', erro);
}

export function iniciarRouter() {
  window.addEventListener('hashchange', renderizar);
  renderizar();
}
