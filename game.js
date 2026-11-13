const $ = (selector) => document.querySelector(selector);
const SAVE_KEY = 'cnc-werkstatt-save-v1';

const defaultState = () => ({ mode: 'free', money: 1200, stock: 0, order: null, price: 18, storyStep: 0, completed: 0, savedAt: null });
let state = defaultState();
let toastTimer;

function formatEuro(value) { return `${Math.round(value).toLocaleString('de-DE')} €`; }
function showToast(message) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}
function saveGame(notify = false) {
  state.savedAt = new Date().toISOString(); localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  if (notify) showToast('Spielstand gespeichert.');
}
function loadGame(notify = true) {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) { showToast('Noch kein Spielstand vorhanden.'); return false; }
  try { state = { ...defaultState(), ...JSON.parse(raw) }; renderGame(); if (notify) showToast('Spielstand geladen.'); return true; }
  catch (error) { console.error(error); showToast('Der Spielstand konnte nicht geladen werden.'); return false; }
}
function setScreen(screen) { $('#start-screen').classList.toggle('hidden', screen !== 'start'); $('#game-screen').classList.toggle('hidden', screen !== 'game'); }
function startGame(mode) { state = defaultState(); state.mode = mode; state.order = makeOrder(); setScreen('game'); renderGame(); showToast(mode === 'tutorial' ? 'Tutorial gestartet.' : 'Freier Modus gestartet.'); }
function randomPrice() { return Math.round(14 + Math.random() * 12); }
function makeOrder() {
  const tutorial = state.mode === 'tutorial';
  const step = state.storyStep;
  const names = tutorial ? ['Distanzring für die Spindel', 'Wellenzapfen für den Reitstock', 'Aufnahmeflansch', 'Erste Kundenwelle'] : ['Adapterbuchse', 'Montagebolzen', 'Führungsrolle', 'Flanschring'];
  const difficulty = tutorial ? Math.min(step + 1, 4) : 1 + (state.completed % 4);
  return { name: names[tutorial ? Math.min(step, names.length - 1) : Math.floor(Math.random() * names.length)], kg: 5 + difficulty * 2, reward: 180 + difficulty * 90, difficulty, machine: difficulty >= 3 ? 'Fräsmaschine' : 'Drehmaschine' };
}
function renderGame() {
  $('#mode-label').textContent = state.mode === 'tutorial' ? 'Tutorial / Story' : 'Freier Modus';
  $('#story-step').textContent = state.mode === 'tutorial' ? `· Kapitel ${Math.min(state.storyStep + 1, 4)} / 4` : '';
  $('#money').textContent = formatEuro(state.money); $('#stock').textContent = `${state.stock.toFixed(1)} kg`;
  $('#machine-title').textContent = state.order?.machine === 'Fräsmaschine' ? 'CNC-Fräsmaschine' : 'Alte CNC-Drehmaschine';
  $('#material-price').textContent = `Aktueller Stahlpreis: ${state.price} € / kg`;
  $('#order-content').innerHTML = state.order ? `<div class="order-line"><span>Bauteil</span><strong>${state.order.name}</strong></div><div class="order-line"><span>Material</span><strong>${state.order.kg} kg Stahl</strong></div><div class="order-line"><span>Vergütung</span><strong>${formatEuro(state.order.reward)}</strong></div><div class="order-line"><span>Anforderung</span><strong>${state.order.machine}, Stufe ${state.order.difficulty}</strong></div>` : '<p>Kein Auftrag aktiv.</p>';
  $('#story-panel').innerHTML = state.mode === 'tutorial' ? `<h2>Deine Geschichte</h2><p>${storyText()}</p>` : '<h2>Betriebshinweis</h2><p>Material muss vor dem Auftrag vorhanden sein. Kaufe günstig ein oder lege Vorräte an.</p>';
  drawMachine();
}
function storyText() {
  return [
    'Die alte Drehmaschine läuft noch, aber einige Teile müssen ersetzt werden. Lerne die Grundlagen mit einfachen Drehteilen.',
    'Gut gemacht. Die Reparatur nimmt Form an. Jetzt werden die Werkstücke etwas anspruchsvoller.',
    'Die Werkstatt wächst: Ein Zeitsprung bringt dir das CNC-Fräsen bei.',
    'Du bietest deine Dienste an und erhältst deine erste Kundenanfrage. Danach steht dir der freie Modus offen.'
  ][Math.min(state.storyStep, 3)];
}
function drawMachine() {
  const canvas = $('#machine-canvas'), ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#0c1116'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#294454'; ctx.lineWidth = 2; for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); } for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  ctx.fillStyle = '#405562'; ctx.fillRect(75, 265, 485, 80); ctx.fillStyle = '#536b76'; ctx.fillRect(120, 115, 370, 150); ctx.fillStyle = '#1c2a32'; ctx.fillRect(145, 140, 320, 95);
  ctx.strokeStyle = '#6f8c99'; ctx.strokeRect(145, 140, 320, 95); ctx.fillStyle = '#90d5db'; ctx.fillRect(265, 183, 155, 10); ctx.fillStyle = '#b7c8ce'; ctx.beginPath(); ctx.arc(245, 188, 42, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#334952'; ctx.beginPath(); ctx.arc(245, 188, 28, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#293c46'; ctx.fillRect(570, 92, 100, 235); ctx.fillStyle = '#a9edb7'; ctx.fillRect(592, 118, 56, 42); ctx.fillStyle = '#14221b'; ctx.font = '14px monospace'; ctx.fillText('READY', 598, 144);
  ctx.fillStyle = '#7b949e'; ctx.font = '16px sans-serif'; ctx.fillText('CNC-WERKSTATT', 90, 385); ctx.fillText(state.order?.machine || 'Maschine', 570, 355);
}
function buyMaterial() {
  const quantity = 5, cost = quantity * state.price;
  if (state.money < cost) { showToast('Nicht genug Geld für den Mindesteinkauf.'); return; }
  state.money -= cost; state.stock += quantity; state.price = randomPrice(); renderGame(); saveGame(); showToast(`${quantity} kg Stahl eingelagert.`);
}
function runProgram() {
  if (!state.order) { showToast('Erstelle zuerst einen Auftrag.'); return; }
  const program = $('#program-input').value.trim();
  if (!program || !/(G00|G01|G02|G03|G90|G91|F\s*\d+)/i.test(program)) { showToast('Das Programm braucht gültige CNC-Befehle, z. B. G00 und G01.'); return; }
  if (state.stock < state.order.kg) { showToast(`Nicht genug Material: ${state.order.kg} kg werden benötigt.`); return; }
  state.stock -= state.order.kg; state.money += state.order.reward; state.completed += 1;
  if (state.mode === 'tutorial' && state.storyStep < 3) state.storyStep += 1;
  $('#machine-status').textContent = 'Fertigung läuft'; $('#machine-status').classList.add('busy'); $('#program-output').textContent = 'Programm akzeptiert. Werkzeug fährt die Kontur ab ...';
  renderGame(); saveGame();
  setTimeout(() => { $('#machine-status').textContent = 'Bereit'; $('#machine-status').classList.remove('busy'); $('#program-output').textContent = `Fertig: ${state.order.name} wurde erfolgreich gefertigt.`; showToast(`Auftrag abgeschlossen: +${formatEuro(state.order.reward)}`); }, 900);
}
$('#start-screen').addEventListener('click', (event) => { const mode = event.target.dataset.mode; if (mode) startGame(mode); });
$('#load-button').addEventListener('click', () => loadGame());
$('#save-button').addEventListener('click', () => saveGame(true));
$('#menu-button').addEventListener('click', () => { saveGame(); setScreen('start'); });
$('#buy-material').addEventListener('click', buyMaterial);
$('#run-program').addEventListener('click', runProgram);
$('#new-order').addEventListener('click', () => { state.order = makeOrder(); state.price = randomPrice(); renderGame(); saveGame(); showToast('Neuer Auftrag eingegangen.'); });
setInterval(() => { if (!$('#game-screen').classList.contains('hidden')) saveGame(); }, 5000);
renderGame();
