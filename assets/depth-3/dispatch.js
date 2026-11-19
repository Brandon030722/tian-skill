const equipment = {
  sonar: { name: '双频声呐', weight: 2 },
  battery: { name: '备用电池', weight: 3 },
  beacon: { name: '回传信标', weight: 2 }
};

const routes = {
  atoll: {
    name: '环礁门',
    zone: '近岸 / 外湾',
    minutes: '04',
    description: '沿潮口做一轮浅水扫测，确认返航浮标位置。',
    image: 'atoll.webp',
    alt: '勘测艇停靠在海峡附近',
    requires: ['sonar']
  },
  trench: {
    name: '静默海沟',
    zone: '断层 / 深水',
    minutes: '09',
    description: '贴着海沟边沿向下扫测，记录地形骤变处的回波。',
    image: 'trench.webp',
    alt: '雾中的深水勘测站',
    requires: ['sonar', 'battery']
  },
  beacon: {
    name: '回声灯塔',
    zone: '离岸 / 夜航',
    minutes: '06',
    description: '跟随短促的灯火校准方向，为下一次夜航留下一段回传链路。',
    image: 'beacon.webp',
    alt: '暮色海面上的灯塔',
    requires: ['beacon']
  }
};

const maximumLoad = 5;
const rehearsalDuration = 3600;
const rehearsalSteps = ['核对航线与设备', '模拟进入航段', '整理派遣回执'];
const phaseTitles = { draft: '装配清单', running: '派遣演练', done: '派遣回执' };
const form = document.getElementById('dispatch-form');
const dispatch = document.getElementById('dispatch');
const dispatchTitle = document.getElementById('dispatch-title');
const routeFields = document.getElementById('route-fields');
const kitFields = document.getElementById('kit-fields');
const routeChoices = [...form.querySelectorAll('input[name="route"]')];
const routeCards = routeChoices.map((choice) => choice.closest('.route-choice'));
const kitChoices = [...form.querySelectorAll('input[name="equipment"]')];
const kitRows = kitChoices.map((choice) => choice.closest('.kit-item'));
const requirementTags = [...form.querySelectorAll('[data-required]')];
const stageMarkers = [...document.querySelectorAll('[data-stage]')];
const runSteps = [...dispatch.querySelectorAll('.run-steps li')];
const phaseViews = {
  draft: document.getElementById('draft'),
  running: document.getElementById('running'),
  done: document.getElementById('done')
};
const chart = document.querySelector('.chart-view');
const chartCaption = chart.querySelector('.chart-caption');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const routeImage = document.getElementById('route-image');
const routeName = document.getElementById('route-name');
const routeZone = document.getElementById('route-zone');
const routeDuration = document.getElementById('route-duration');
const routeDescription = document.getElementById('route-description');
const routeRequirement = document.getElementById('route-requirement');
const payload = document.getElementById('payload');
const payloadValue = document.querySelector('#payload-value strong');
const loadUnits = [...document.querySelectorAll('.load-units span')];
const eligibility = document.getElementById('eligibility');
const reset = document.getElementById('reset-draft');
const start = document.getElementById('start-dispatch');
const cancel = document.getElementById('cancel-dispatch');
const edit = document.getElementById('edit-dispatch');
const screenReaderStatus = document.getElementById('dispatch-status');
const runRoute = document.getElementById('run-route');
const progress = document.getElementById('run-progress');
const percent = document.getElementById('run-percent');
const resultTitle = document.getElementById('result-title');
const resultRoute = document.getElementById('result-route');
const resultKit = document.getElementById('result-kit');
const resultLoad = document.getElementById('result-load');

const state = { phase: 'draft', route: 'atoll', packed: new Set(['sonar']), run: null };
let timer;
let chartEntryFrame;

function configuration() {
  const route = routes[state.route];
  const load = [...state.packed].reduce((total, item) => total + equipment[item].weight, 0);
  const missing = route.requires.filter((item) => !state.packed.has(item));
  const issues = [];

  if (missing.length) issues.push('需要装配' + missing.map((item) => equipment[item].name).join('、'));
  if (load > maximumLoad) issues.push('装载超限，请卸下至少 ' + (load - maximumLoad) + ' 单位');

  return { route, load, issues };
}

function playSceneEntry(newRequirements) {
  cancelAnimationFrame(chartEntryFrame);
  chart.removeAttribute('data-scene-entry');
  chartCaption.getAnimations().forEach((animation) => animation.cancel());
  const animate = !reducedMotion.matches;
  routeCards.forEach((card) => card.toggleAttribute('data-scene-entry', animate && card.dataset.tone === state.route));
  kitRows.forEach((row, index) => row.toggleAttribute('data-route-signal', animate && newRequirements.includes(kitChoices[index].value)));
  if (!animate) return;

  // The single mobile figure is reused between routes. Give its animation
  // a rendered frame without the entry attribute before starting it again.
  chartEntryFrame = requestAnimationFrame(() => {
    chartEntryFrame = requestAnimationFrame(() => chart.setAttribute('data-scene-entry', ''));
  });
  chartCaption.animate(
    [{ opacity: 0.76, translate: '0 5px' }, { opacity: 1, translate: '0 0' }],
    { duration: 300, delay: 145, easing: 'ease-out', fill: 'backwards' }
  );
}

reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) playSceneEntry([]);
});

function render() {
  const { route, load, issues } = configuration();
  const isDraft = state.phase === 'draft';
  const previousRoute = routes[chart.dataset.tone];
  const routeChanged = previousRoute !== route;

  dispatch.dataset.phase = state.phase;
  dispatchTitle.textContent = phaseTitles[state.phase];
  for (const [phase, view] of Object.entries(phaseViews)) {
    view.hidden = phase !== state.phase;
  }
  for (const marker of stageMarkers) {
    if (marker.dataset.stage === state.phase) marker.setAttribute('aria-current', 'step');
    else marker.removeAttribute('aria-current');
  }
  routeFields.disabled = !isDraft;
  kitFields.disabled = !isDraft;
  reset.hidden = !isDraft;
  for (const choice of routeChoices) choice.checked = choice.value === state.route;
  for (const choice of kitChoices) choice.checked = state.packed.has(choice.value);
  for (const tag of requirementTags) tag.hidden = !route.requires.includes(tag.dataset.required);

  if (routeChanged) {
    chart.dataset.tone = state.route;
    routeImage.src = '../showcase/media/' + route.image;
    routeImage.alt = route.alt;
  }
  routeName.textContent = route.name;
  routeZone.textContent = route.zone;
  routeDuration.textContent = route.minutes;
  routeDescription.textContent = route.description;
  routeRequirement.textContent = route.requires.map((item) => equipment[item].name).join('、');
  payload.dataset.limit = load > maximumLoad ? 'over' : 'ok';
  payloadValue.textContent = load;
  loadUnits.forEach((unit, index) => unit.toggleAttribute('data-filled', index < load));
  eligibility.toggleAttribute('data-invalid', issues.length > 0);
  eligibility.textContent = issues.length ? issues.join('。') + '。' : '配置已就绪。';
  start.disabled = !isDraft || issues.length > 0;
  if (routeChanged) {
    const newRequirements = route.requires.filter((item) => !previousRoute.requires.includes(item));
    playSceneEntry(newRequirements);
  }
}

function progressStep(index) {
  for (let i = 0; i < runSteps.length; i += 1) {
    const row = runSteps[i];
    row.toggleAttribute('data-finished', i < index);
    if (i === index) row.setAttribute('aria-current', 'step');
    else row.removeAttribute('aria-current');
  }
}

function updateRehearsal() {
  const run = state.run;
  const ratio = Math.min(1, (performance.now() - run.started) / rehearsalDuration);
  const percentage = Math.round(ratio * 100);
  progress.value = percentage;
  percent.textContent = percentage + '%';

  if (ratio >= 1) {
    const focusWasInProgress = phaseViews.running.contains(document.activeElement);
    clearInterval(timer);
    state.phase = 'done';
    resultRoute.textContent = run.route.name;
    resultKit.textContent = run.packed.join('、');
    resultLoad.textContent = run.load + ' / ' + maximumLoad + ' 单位';
    render();
    screenReaderStatus.textContent = run.route.name + '派遣演练完成。';
    if (focusWasInProgress) resultTitle.focus();
    return;
  }

  const step = Math.min(Math.floor(ratio * rehearsalSteps.length), rehearsalSteps.length - 1);
  if (run.step !== step) {
    run.step = step;
    progressStep(step);
    screenReaderStatus.textContent = rehearsalSteps[step] + '。';
  }
}

form.addEventListener('change', (event) => {
  if (state.phase !== 'draft') return;
  const input = event.target;
  if (input.name === 'route') state.route = input.value;
  else if (input.name === 'equipment') {
    if (input.checked) state.packed.add(input.value);
    else state.packed.delete(input.value);
  } else return;

  render();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (state.phase !== 'draft') return;

  const { route, load, issues } = configuration();
  if (issues.length) return;
  state.phase = 'running';
  state.run = {
    route,
    load,
    packed: Object.keys(equipment).filter((item) => state.packed.has(item)).map((item) => equipment[item].name),
    started: performance.now(),
    step: -1
  };
  runRoute.textContent = route.name + ' · ' + route.minutes + ' 分航段';
  render();
  updateRehearsal();
  timer = window.setInterval(updateRehearsal, 85);
  cancel.focus();
});

function backToDraft(message) {
  clearInterval(timer);
  state.phase = 'draft';
  state.run = null;
  render();
  screenReaderStatus.textContent = message;
  start.focus();
}

cancel.addEventListener('click', () => {
  if (state.phase === 'running') backToDraft('演练已取消，已保留航线和设备配置。');
});

edit.addEventListener('click', () => {
  if (state.phase === 'done') backToDraft('已返回配置，航线和设备保持当前选择。');
});

reset.addEventListener('click', () => {
  if (state.phase !== 'draft') return;
  state.route = 'atoll';
  state.packed = new Set(['sonar']);
  render();
  screenReaderStatus.textContent = '已恢复默认航线和装配。';
});

render();
