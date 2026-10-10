/**
 * AFINADIM - Codigo.gs (versão 0.1)
 * Violão e guitarra que escutam você.
 *
 * Como funciona:
 * - O app roda como "Executar como: usuário que acessa" e "Quem tem acesso: qualquer pessoa com Conta do Google".
 *   Assim cada aluno entra com a própria conta, e o progresso dele fica nas Propriedades do Usuário
 *   (PropertiesService.getUserProperties), sem gastar cota do dono do projeto.
 * - Todo o resto (afinador, reconhecimento de acordes, jogos, lições) roda no navegador do aluno.
 */

var PROP_KEY = 'afinadim_p1';
var MAX_CHARS = 8800; // limite do Apps Script: 9 KB por valor

/** Abre o app. */
function doGet(e) {
  var t = HtmlService.createTemplateFromFile('Index');
  return t.evaluate()
    .setTitle('Afinadim')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Usado dentro de Index.html: <?!= include('Assets'); ?> */
function include(nome) {
  return HtmlService.createHtmlOutputFromFile(nome).getContent();
}

/** Primeira chamada do app: quem é o aluno e qual o progresso salvo. */
function getBoot() {
  var email = '';
  try { email = Session.getActiveUser().getEmail() || ''; } catch (e) { email = ''; }
  var progress = null;
  try { progress = PropertiesService.getUserProperties().getProperty(PROP_KEY); } catch (e) { progress = null; }
  return { email: email, nome: nomeDe_(email), progress: progress };
}

/** Nome de saudação a partir do e-mail (o aluno pode trocar nos Ajustes). */
function nomeDe_(email) {
  if (!email) return 'músico';
  var p = String(email).split('@')[0].replace(/[^A-Za-zÀ-ÿ]+/g, ' ').trim().split(' ')[0];
  if (!p || p.length < 2) return 'músico';
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
}

/** Salva o progresso do aluno (chamado em lote pelo app, a cada poucos segundos de atividade). */
function saveProgress(json) {
  if (typeof json !== 'string' || json.length > 60000) return { ok: false, motivo: 'tamanho' };
  var novo;
  try { novo = JSON.parse(json); } catch (e) { return { ok: false, motivo: 'json' }; }
  if (!novo || novo.v !== 1 || typeof novo !== 'object') return { ok: false, motivo: 'formato' };
  var props = PropertiesService.getUserProperties();
  var atual = null;
  try { atual = JSON.parse(props.getProperty(PROP_KEY) || 'null'); } catch (e) { atual = null; }
  if (atual && atual.t && novo.t && atual.t > novo.t) return { ok: false, motivo: 'desatualizado' };
  var texto = JSON.stringify(novo);
  if (texto.length > MAX_CHARS) {
    // reduz históricos antes de salvar
    if (novo.dias && novo.dias.length > 30) novo.dias = novo.dias.slice(-30);
    if (novo.oui && novo.oui.blind && novo.oui.blind.length > 12) novo.oui.blind = novo.oui.blind.slice(-12);
    texto = JSON.stringify(novo);
    if (texto.length > MAX_CHARS) return { ok: false, motivo: 'muito grande' };
  }
  props.setProperty(PROP_KEY, texto);
  return { ok: true };
}

/** Utilitário opcional: roda no editor para ver o que está salvo para a SUA conta. */
function debugMeuProgresso() {
  Logger.log(PropertiesService.getUserProperties().getProperty(PROP_KEY));
}
