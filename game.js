const $ = (selector) => document.querySelector(selector);
const SAVE_KEY = 'cnc-werkstatt-save-v2';

const materials = [
  ['S235JR', 'Baustahl', 8, 1], ['S355J2', 'Baustahl', 10, 1.1], ['C45', 'Vergütungsstahl', 13, 1.25],
  ['16MnCr5', 'Einsatzstahl', 16, 1.35], ['42CrMo4', 'Vergütungsstahl', 19, 1.5], ['100Cr6', 'Wälzlagerstahl', 22, 1.7],
  ['1.4301', 'Edelstahl', 24, 1.8], ['1.4404', 'Edelstahl', 28, 2], ['1.2312', 'Werkzeugstahl', 32, 2.2],
  ['1.2379', 'Kaltarbeitsstahl', 38, 2.5], ['EN AW-2017A', 'Aluminium', 12, .7], ['EN AW-2024', 'Aluminium', 14, .75],
  ['EN AW-5083', 'Aluminium', 11, .65], ['EN AW-6060', 'Aluminium', 9, .55], ['EN AW-7075', 'Aluminium', 18, .9],
  ['CuZn39Pb3', 'Messing', 17, .7], ['Ti Grade 5', 'Titan', 52, 2.8], ['POM-C', 'Kunststoff', 10, .35],
  ['PA6', 'Kunststoff', 9, .45], ['GFK', 'Verbundwerkstoff', 21, 1.8]
];
const tools = [
  ['HSS-Bohrer 6 mm', 'Bohrer', 65, 100], ['HSS-Drehmeißel', 'Drehmeißel', 80, 100], ['Wendeplatte CNMG', 'Wendeplatte', 120, 100],
  ['Wendeplatte VBMT', 'Wendeplatte', 135, 100]
];
const defaultState = () => ({
  mode: 'free', money: 1200, storyStep: 0, completed: 0, order: null, price: 18,
  materials: { 'S235JR': 10 }, tools: { 'HSS-Bohrer 6 mm': 1, 'HSS-Drehmeißel': 1, 'Wendeplatte CNMG': 2 },
  durability: { 'HSS-Bohrer 6 mm': 100, 'HSS-Drehmeißel': 100, 'Wendeplatte CNMG': 100 }, program: []
});
let state = defaultState();
let toastTimer;

function euro(value) { return `${Math.round(value).toLocaleString('de-DE')} €`; }
function materialData(name) { return materials.find((item) => item[0] === name) || materials[0]; }
function toolData(name) { return tools.find((item) => item[0] === name) || tools[0]; }
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2600); }
function saveGame(notify = false) { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); if (notify) showToast('Spielstand gespeichert.'); }
function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return showToast('Noch kein Spielstand vorhanden.');
  try { state = { ...defaultState(), ...JSON.parse(raw) }; renderGame(); showToast('Spielstand geladen.'); } catch (error) { console.error(error); showToast('Spielstand konnte nicht geladen werden.'); }
}
function setScreen(screen) { $('#start-screen').classList.toggle('hidden', screen !== 'start'); $('#game-screen').classList.toggle('hidden', screen !== 'game'); }
function randomPrice() { return Math.round(14 + Math.random() * 12); }
function makeOrder() {
  const tutorial = state.mode === 'tutorial', step = state.storyStep;
  const names = tutorial ? ['Distanzring für die Spindel', 'Wellenzapfen für den Reitstock', 'Aufnahmeflansch', 'Erste Kundenwelle'] : ['Adapterbuchse', 'Montagebolzen', 'Führungsrolle', 'Flanschring'];
  const difficulty = tutorial ? Math.min(step + 1, 4) : 1 + (state.completed % 4);
  return { name: names[tutorial ? Math.min(step, 3) : Math.floor(Math.random() * names.length)], kg: 5 + difficulty * 2, reward: 180 + difficulty * 90, difficulty, material: tutorial ? 'S235JR' : materials[Math.floor(Math.random() * materials.length)][0], machine: difficulty >= 3 ? 'Fräsmaschine' : 'Drehmaschine' };
}
function storyText() {
  return ['Ida zeigt dir zuerst die alte Drehmaschine. Wähle Material, Werkzeug und einen einfachen Bearbeitungsschritt.', 'Die ersten Teile sitzen. Jetzt lernst du, wie Vorschub und Werkzeugverschleiß zusammenhängen.', 'Nach dem Zeitsprung steht eine Fräsmaschine in der Werkstatt. Neue Werkzeuge eröffnen neue Aufträge.', 'Deine erste Kundenanfrage ist da. Danach kannst du im freien Modus deinen eigenen Betrieb aufbauen.'][Math.min(state.storyStep, 3)];
}
function renderProgramBuilder() {
  const builder = $('#program-builder');
  if (!state.program.length) state.program = [{ action: 'Planen', tool: 'HSS-Drehmeißel', feed: '0.2' }];
  builder.innerHTML = state.program.map((step, index) => `<div class="program-row"><select data-index="${index}" data-key="action"><option ${step.action === 'Planen' ? 'selected' : ''}>Planen</option><option ${step.action === 'Längsdrehen' ? 'selected' : ''}>Längsdrehen</option><option ${step.action === 'Bohren' ? 'selected' : ''}>Bohren</option><option ${step.action === 'Schlichten' ? 'selected' : ''}>Schlichten</option></select><select data-index="${index}" data-key="tool">${tools.map((tool) => `<option ${step.tool === tool[0] ? 'selected' : ''}>${tool[0]}</option>`).join('')}</select><select data-index="${index}" data-key="feed"><option value="0.1" ${step.feed === '0.1' ? 'selected' : ''}>Vorschub 0,1</option><option value="0.2" ${step.feed === '0.2' ? 'selected' : ''}>Vorschub 0,2</option><option value="0.4" ${step.feed === '0.4' ? 'selected' : ''}>Vorschub 0,4</option><option value="0.6" ${step.feed === '0.6' ? 'selected' : ''}>Vorschub 0,6</option></select><button class="remove-step" data-remove="${index}" aria-label="Schritt entfernen">×</button></div>`).join('') + '<button id="add-step">+ Arbeitsschritt hinzufügen</button>';
  builder.querySelectorAll('select').forEach((input) => input.addEventListener('change', (event) => { state.program[Number(event.target.dataset.index)][event.target.dataset.key] = event.target.value; }));
  builder.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => { state.program.splice(Number(button.dataset.remove), 1); renderProgramBuilder(); }));
  $('#add-step').addEventListener('click', () => { state.program.push({ action: 'Schlichten', tool: 'HSS-Drehmeißel', feed: '0.1' }); renderProgramBuilder(); });
}
function renderInventory() {
  $('#material-inventory').innerHTML = Object.entries(state.materials).map(([name, amount]) => `<div class="inventory-item"><strong>${name}</strong><span>${materialData(name)[1]} · ${amount.toFixed(1)} kg</span></div>`).join('');
  $('#tool-inventory').innerHTML = Object.entries(state.tools).map(([name, amount]) => `<div class="inventory-item"><strong>${name}</strong><span>${amount} Stück · Haltbarkeit ${Math.round(state.durability[name] || 100)}%</span></div>`).join('');
}
function renderGame() {
  $('#mode-label').textContent = state.mode === 'tutorial' ? 'Tutorial / Story' : 'Freier Modus';
  $('#story-step').textContent = state.mode === 'tutorial' ? `· Kapitel ${Math.min(state.storyStep + 1, 4)} / 4` : '';
  $('#money').textContent = euro(state.money); $('#completed').textContent = state.completed;
  $('#machine-title').textContent = state.order?.machine === 'Fräsmaschine' ? 'CNC-Fräsmaschine' : 'Alte CNC-Drehmaschine';
  $('#machine-status').textContent = 'Bereit'; $('#machine-status').classList.remove('busy');
  $('#material-price').textContent = `Stahlmarkt: ${state.price} € / kg · Mindestabnahme 5 kg`;
  $('#order-content').innerHTML = state.order ? `<div class="order-line"><span>Bauteil</span><strong>${state.order.name}</strong></div><div class="order-line"><span>Werkstoff</span><strong>${state.order.material} · ${state.order.kg} kg</strong></div><div class="order-line"><span>Vergütung</span><strong>${euro(state.order.reward)}</strong></div>` : '<p>Kein Auftrag aktiv.</p>';
  $('#coach-text').textContent = state.mode === 'tutorial' ? storyText() : 'Stelle deinen Ablauf zusammen. Hoher Vorschub spart Zeit, verschleißt aber das Werkzeug schneller.';
  $('#story-panel').innerHTML = `<h2>${state.mode === 'tutorial' ? 'Deine Geschichte' : 'Betriebshinweis'}</h2><p>${state.mode === 'tutorial' ? storyText() : 'Kaufe Werkstoffe auf Vorrat, beobachte den Markt und halte passende Werkzeuge bereit.'}</p>`;
  renderProgramBuilder(); renderInventory(); drawMachine();
}
function drawMachine() {
  const canvas = $('#machine-canvas'), ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#9bd3d2'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#f5d894'; ctx.fillRect(0, 350, w, 190);
  ctx.fillStyle = '#7eb3b7'; ctx.fillRect(0, 300, w, 50);
  for (let x = 0; x < w; x += 64) { ctx.fillStyle = x % 128 ? '#76a9ad' : '#86bdbe'; ctx.fillRect(x, 300, 64, 50); }
  ctx.fillStyle = '#6e4b54'; ctx.fillRect(80, 345, 650, 90); ctx.fillStyle = '#88606a'; ctx.fillRect(115, 115, 560, 230);
  ctx.fillStyle = '#3e4659'; ctx.fillRect(145, 145, 420, 160); ctx.fillStyle = '#273343'; ctx.fillRect(175, 170, 360, 105);
  ctx.strokeStyle = '#e9c76e'; ctx.lineWidth = 8; ctx.strokeRect(175, 170, 360, 105);
  ctx.fillStyle = '#d7e1d4'; ctx.beginPath(); ctx.arc(275, 222, 54, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#455468'; ctx.beginPath(); ctx.arc(275, 222, 35, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#eabf70'; ctx.fillRect(320, 213, 230, 18); ctx.fillStyle = '#263445'; ctx.fillRect(550, 108, 175, 300); ctx.fillStyle = '#a6d9cd'; ctx.fillRect(575, 140, 125, 90); ctx.fillStyle = '#36515a'; ctx.font = '22px monospace'; ctx.fillText('READY', 595, 195);
  ctx.fillStyle = '#70505a'; ctx.fillRect(750, 230, 130, 170); ctx.fillStyle = '#c87b56'; ctx.fillRect(785, 250, 58, 72); ctx.fillStyle = '#fff0bd'; ctx.font = '20px sans-serif'; ctx.fillText('Ida', 796, 350);
  ctx.fillStyle = '#51404c'; ctx.fillRect(50, 395, 100, 25); ctx.fillRect(205, 395, 100, 25); ctx.fillRect(525, 395, 100, 25); ctx.font = '18px sans-serif'; ctx.fillText('Werkstatt', 82, 485); ctx.fillText(state.order?.machine || 'Maschine', 740, 450);
}
function buyMaterial() {
  const name = state.order?.material || 'S235JR', quantity = 5, cost = quantity * state.price;
  if (state.money < cost) return showToast('Nicht genug Geld für die Mindestmenge.');
  state.money -= cost; state.materials[name] = (state.materials[name] || 0) + quantity; state.price = randomPrice(); renderGame(); saveGame(); showToast(`${quantity} kg ${name} eingelagert.`);
}
function buyTool() {
  const next = tools.find((tool) => !state.tools[tool[0]]), item = next || tools[Math.floor(Math.random() * tools.length)];
  if (state.money < item[2]) return showToast('Nicht genug Geld für dieses Werkzeug.');
  state.money -= item[2]; state.tools[item[0]] = (state.tools[item[0]] || 0) + 1; state.durability[item[0]] = 100; renderGame(); saveGame(); showToast(`${item[0]} gekauft.`);
}
function runProgram() {
  if (!state.order || !state.program.length) return showToast('Erstelle zuerst einen Programmablauf.');
  const material = materialData(state.order.material), amount = state.materials[state.order.material] || 0;
  if (amount < state.order.kg) return showToast(`Nicht genug ${state.order.material} im Lager.`);
  for (const step of state.program) {
    if (!state.tools[step.tool]) return showToast(`Dir fehlt das Werkzeug: ${step.tool}.`);
    const feed = Number(step.feed), maxFeed = Math.max(.1, 1 / material[3]);
    if (feed > maxFeed) return showToast(`${step.feed} ist für ${state.order.material} zu hoher Vorschub.`);
  }
  const used = state.program.reduce((sum, step) => sum + Number(step.feed) * material[3] * 8, 0);
  state.materials[state.order.material] -= state.order.kg; state.money += state.order.reward; state.completed += 1;
  state.program.forEach((step) => { state.durability[step.tool] = Math.max(0, (state.durability[step.tool] || 100) - used); });
  const finished = state.order; if (state.mode === 'tutorial' && state.storyStep < 3) state.storyStep += 1; state.order = makeOrder();
  $('#machine-status').textContent = 'Fertigung läuft'; $('#machine-status').classList.add('busy'); saveGame();
  renderGame(); setTimeout(() => { $('#machine-status').textContent = 'Bereit'; $('#machine-status').classList.remove('busy'); showToast(`Auftrag abgeschlossen: +${euro(finished.reward)}`); }, 900);
}
$('#start-screen').addEventListener('click', (event) => { if (event.target.dataset.mode) { state = defaultState(); state.mode = event.target.dataset.mode; state.order = makeOrder(); setScreen('game'); renderGame(); } });
$('#load-button').addEventListener('click', loadGame); $('#save-button').addEventListener('click', () => saveGame(true)); $('#menu-button').addEventListener('click', () => { saveGame(); setScreen('start'); });
$('#buy-material').addEventListener('click', buyMaterial); $('#buy-tool').addEventListener('click', buyTool); $('#run-program').addEventListener('click', runProgram);
$('#new-order').addEventListener('click', () => { state.order = makeOrder(); renderGame(); saveGame(); showToast('Neue Anfrage eingegangen.'); });
setInterval(() => { if (!$('#game-screen').classList.contains('hidden')) saveGame(); }, 5000);
renderGame();
