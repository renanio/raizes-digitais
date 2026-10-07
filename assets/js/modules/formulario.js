/*
  Interatividade do formulário de cadastro: máscaras, validação de consistência
  e rascunho no localStorage. Os listeners são ligados em iniciarFormulario
  porque a tela é recriada a cada renderização do roteador.
*/
import { criarAlerta } from './templates.js';
import { salvar, recuperar, remover } from './storage.js';

const IDADE_MINIMA = 16;
const IDADE_RESPONSAVEL = 18;

// sinaliza que o reset veio de um envio bem-sucedido, para manter o alerta de sucesso
let sucessoPendente = false;

export function iniciarFormulario() {
  const form = document.querySelector('#app form');
  if (!form) return;

  const feedback = form.querySelector('#form-feedback');

  restaurarRascunho(form);
  atualizarResponsavel(form);

  form.addEventListener('submit', (evento) => aoEnviar(evento, form, feedback));
  form.addEventListener('input', (evento) => aoDigitar(evento, form));
  form.addEventListener('change', (evento) => {
    if (evento.target.name === 'nascimento') atualizarResponsavel(form);
  });
  form.addEventListener('reset', () => aoLimpar(form, feedback));
}

/* Tratar o envio sem back-end, validando tudo antes de confirmar */
function aoEnviar(evento, form, feedback) {
  // o form tem action="#"; sem preventDefault o envio mexeria no hash da SPA
  evento.preventDefault();

  limparValidacoes(form);
  validarNome(form);
  validarCpf(form);
  validarIdade(form);
  validarAreas(form);

  if (!form.checkValidity()) {
    mostrarFeedback(feedback, 'erro', 'Verifique:', 'há campos preenchidos de forma incorreta. Corrija os campos destacados.');
    // reportValidity foca o primeiro campo inválido e exibe a mensagem nativa
    form.reportValidity();
    return;
  }

  remover();
  sucessoPendente = true;
  // reset dispara aoLimpar, que mostra o sucesso após os campos serem redefinidos
  form.reset();
}

/* Tratar a digitação por delegação, aplicando máscara e salvando o rascunho */
function aoDigitar(evento, form) {
  const campo = evento.target;
  aplicarMascara(campo);
  // liberar o campo de um erro de JavaScript assim que o usuário o edita
  campo.setCustomValidity('');
  if (campo.name === 'area') limparErroAreas(form);
  salvarRascunho(form);
}

/* Limpar rascunho e sincronizar a tela após o reset nativo */
function aoLimpar(form, feedback) {
  remover();
  const sucesso = sucessoPendente;
  sucessoPendente = false;
  // os campos só ficam com os valores padrão depois deste evento
  setTimeout(() => {
    limparValidacoes(form);
    atualizarResponsavel(form);
    if (sucesso) mostrarFeedback(feedback, 'sucesso', 'Tudo certo:', 'cadastro enviado. Entraremos em contato em breve.');
    else feedback.replaceChildren();
  }, 0);
}

/* Mostrar ou ocultar os campos do responsável conforme a idade */
function atualizarResponsavel(form) {
  const grupo = form.querySelector('#grupo-responsavel');
  const idade = calcularIdade(form.elements.nascimento.value);
  const menor = idade !== null && idade >= IDADE_MINIMA && idade < IDADE_RESPONSAVEL;
  grupo.hidden = !menor;
  grupo.querySelectorAll('input').forEach((campo) => {
    campo.required = menor;
    if (!menor) campo.setCustomValidity('');
  });
}

/* Exigir nome e sobrenome, normalizando espaços */
function validarNome(form) {
  const campo = form.elements.nome;
  const limpo = campo.value.trim().replace(/\s+/g, ' ');
  campo.value = limpo;
  if (limpo && limpo.split(' ').length < 2) {
    campo.setCustomValidity('Informe nome e sobrenome');
  }
}

function validarCpf(form) {
  const campo = form.elements.cpf;
  if (campo.value && !cpfValido(campo.value)) campo.setCustomValidity('CPF inválido');
}

function validarIdade(form) {
  const campo = form.elements.nascimento;
  const idade = calcularIdade(campo.value);
  if (idade !== null && idade < IDADE_MINIMA) {
    campo.setCustomValidity('É necessário ter ao menos 16 anos');
  }
}

/* Exigir ao menos uma área marcada, usando a primeira como âncora do erro */
function validarAreas(form) {
  const areas = form.querySelectorAll('input[name="area"]');
  const algumMarcado = Array.from(areas).some((caixa) => caixa.checked);
  if (areas.length && !algumMarcado) {
    areas[0].setCustomValidity('Selecione ao menos uma área de interesse');
  }
}

function limparErroAreas(form) {
  const primeira = form.querySelector('input[name="area"]');
  if (primeira) primeira.setCustomValidity('');
}

function limparValidacoes(form) {
  Array.from(form.elements).forEach((el) => {
    if (typeof el.setCustomValidity === 'function') el.setCustomValidity('');
  });
}

function mostrarFeedback(feedback, tipo, titulo, mensagem) {
  feedback.replaceChildren(criarAlerta({ tipo, titulo, mensagem }));
}

/* Aplicar a máscara correspondente ao campo em edição */
function aplicarMascara(campo) {
  if (campo.name === 'cpf') campo.value = mascaraCpf(campo.value);
  else if (campo.name === 'telefone' || campo.name === 'resp-telefone') campo.value = mascaraTelefone(campo.value);
  else if (campo.name === 'cep') campo.value = mascaraCep(campo.value);
}

function soDigitos(valor) {
  return valor.replace(/\D/g, '');
}

function mascaraCpf(valor) {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length > 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length > 6) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  if (d.length > 3) return `${d.slice(0, 3)}.${d.slice(3)}`;
  return d;
}

function mascaraTelefone(valor) {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : '';
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  if (resto.length <= 8) return `(${ddd}) ${resto.slice(0, 4)}-${resto.slice(4)}`;
  return `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5)}`;
}

function mascaraCep(valor) {
  const d = soDigitos(valor).slice(0, 8);
  if (d.length > 5) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return d;
}

/* Validar os dois dígitos verificadores e rejeitar sequências repetidas */
function cpfValido(valor) {
  const d = soDigitos(valor);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  const digito = (base, pesoInicial) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (pesoInicial - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(d.slice(0, 9), 10) === Number(d[9]) && digito(d.slice(0, 10), 11) === Number(d[10]);
}

/* Calcular idade em anos a partir da data ISO, ou null se vazia/inválida */
function calcularIdade(dataIso) {
  if (!dataIso) return null;
  const nascimento = new Date(`${dataIso}T00:00:00`);
  if (Number.isNaN(nascimento.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return idade;
}

/* Restaurar os valores salvos, inclusive radios e checkboxes */
function restaurarRascunho(form) {
  const dados = recuperar();
  if (!dados) return;
  Array.from(form.elements).forEach((el) => {
    if (!el.name || el.name === 'cpf') return;
    if (el.type === 'checkbox') el.checked = Array.isArray(dados[el.name]) && dados[el.name].includes(el.value);
    else if (el.type === 'radio') el.checked = dados[el.name] === el.value;
    else if (dados[el.name] != null) el.value = dados[el.name];
  });
}

/* Coletar os campos e salvar o rascunho, sem o CPF por ser dado sensível */
function salvarRascunho(form) {
  const dados = {};
  Array.from(form.elements).forEach((el) => {
    if (!el.name || el.name === 'cpf' || el.type === 'submit' || el.type === 'reset') return;
    if (el.type === 'checkbox') {
      if (!dados[el.name]) dados[el.name] = [];
      if (el.checked) dados[el.name].push(el.value);
    } else if (el.type === 'radio') {
      if (el.checked) dados[el.name] = el.value;
    } else {
      dados[el.name] = el.value;
    }
  });
  salvar(dados);
}
