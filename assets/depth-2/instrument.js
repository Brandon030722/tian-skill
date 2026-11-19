const bands = {
  coastal: {
    frequency: 28,
    range: 2,
    echoes: [[24, 0.45, 0.33], [62, 0.67, 0.53], [107, 0.74, 0.82], [146, 0.53, 0.44],
      [199, 0.36, 0.61], [255, 0.63, 0.74], [290, 0.81, 0.48], [337, 0.88, 0.37]]
  },
  trench: {
    frequency: 12,
    range: 4,
    echoes: [[17, 0.78, 0.63], [48, 0.88, 0.89], [101, 0.64, 0.52], [157, 0.69, 0.75],
      [208, 0.44, 0.47], [276, 0.80, 0.38], [322, 0.72, 0.67]]
  },
  reef: {
    frequency: 45,
    range: 1,
    echoes: [[37, 0.35, 0.65], [72, 0.29, 0.51], [83, 0.59, 0.77], [126, 0.61, 0.44],
      [170, 0.57, 0.31], [211, 0.43, 0.48], [284, 0.66, 0.62], [303, 0.57, 0.85],
      [316, 0.44, 0.45], [340, 0.74, 0.72]]
  }
};

const bandSelection = document.querySelector('#band-selection');
const sensitivity = document.querySelector('#sensitivity');
const sensitivityValue = document.querySelector('#sensitivity-value');
const start = document.querySelector('[data-scan]');
const stop = document.querySelector('[data-stop]');
const scanLabel = start.querySelector('.scan-label');
const progress = document.querySelector('#scan-progress');
const percent = document.querySelector('#scan-percent');
const status = document.querySelector('#scan-status');
const scopeMode = document.querySelector('#scope-mode');
const frequency = document.querySelector('#frequency');
const scopeRange = document.querySelector('#scope-range');
const count = document.querySelector('#contact-count');
const canvas = document.querySelector('#scope-canvas');
const context = canvas.getContext('2d');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const fullTurn = Math.PI * 2;
const scanDuration = 2200;
let mode = 'preview';
let pendingFrame = 0;
let scanStarted = 0;
let scanRatio = 0;
let band = bands.coastal;
let gain = Number(sensitivity.value);
let viewWidth = 0;
let viewHeight = 0;

function setMode(next, message) {
  mode = next;
  if (status.textContent !== message) status.textContent = message;
  status.dataset.mode = mode;
  scopeMode.dataset.mode = mode;
  scopeMode.textContent = {
    preview: '参数预览',
    running: '正在扫描',
    complete: '扫描结果',
    cancelled: '已取消'
  }[mode];
}

function setProgress(value) {
  if (progress.value === value) return;
  progress.value = value;
  percent.textContent = value + '%';
}

function detectableEchoes() {
  const threshold = 0.9 - gain * 0.008;
  return band.echoes.filter((echo) => echo[2] >= threshold);
}

function drawScope() {
  const echoes = detectableEchoes();
  const displayed = mode === 'running' ? echoes.filter((echo) => echo[0] <= scanRatio * 360) : echoes;
  const nextCount = String(displayed.length).padStart(2, '0');
  if (count.textContent !== nextCount) count.textContent = nextCount;
  if (!context || !viewWidth || !viewHeight) return;

  const width = viewWidth;
  const height = viewHeight;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width * 0.42, height * 0.42);
  context.clearRect(0, 0, width, height);

  context.lineWidth = 1;
  context.strokeStyle = 'rgba(140,189,175,.37)';
  for (let i = 1; i <= 4; i += 1) {
    context.beginPath();
    context.arc(cx, cy, radius * i / 4, 0, fullTurn);
    context.stroke();
  }

  context.strokeStyle = 'rgba(140,189,175,.28)';
  for (let i = 0; i < 8; i += 1) {
    const angle = i * fullTurn / 8;
    context.beginPath();
    context.moveTo(cx, cy);
    context.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    context.stroke();
  }

  if (mode === 'running' && !reducedMotion.matches) {
    const angle = scanRatio * fullTurn - Math.PI / 2;
    context.fillStyle = 'rgba(147,235,175,.15)';
    context.beginPath();
    context.moveTo(cx, cy);
    context.arc(cx, cy, radius, angle - 0.64, angle);
    context.closePath();
    context.fill();
    context.strokeStyle = '#bcecc1';
    context.beginPath();
    context.moveTo(cx, cy);
    context.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    context.stroke();
  }

  context.fillStyle = '#c1d6ce';
  context.font = '600 10px ui-monospace, monospace';
  context.textAlign = 'center';
  context.fillText('000°', cx, cy - radius - 9);
  context.fillText('180°', cx, cy + radius + 17);
  if (width - radius * 2 >= 82) {
    context.fillText('270°', cx - radius - 22, cy + 4);
    context.fillText('090°', cx + radius + 22, cy + 4);
  }
  context.textAlign = 'left';
  context.fillText(String(band.range / 2) + ' km', cx + 6, cy - radius / 2 + 12);
  context.fillText(band.range + ' km', cx + 6, cy - radius + 12);

  for (const [bearing, distance, strength] of displayed) {
    const angle = bearing * Math.PI / 180 - Math.PI / 2;
    const x = cx + distance * radius * Math.cos(angle);
    const y = cy + distance * radius * Math.sin(angle);
    context.fillStyle = 'rgba(177,233,179,.16)';
    context.beginPath();
    context.arc(x, y, 5 + 4 * strength, 0, fullTurn);
    context.fill();
    context.fillStyle = strength > 0.74 ? '#f6d99d' : '#b4e8b1';
    context.beginPath();
    context.arc(x, y, 1.75 + strength * 2.1, 0, fullTurn);
    context.fill();
  }

  context.fillStyle = '#d5eadf';
  context.fillRect(cx - 1.5, cy - 1.5, 3, 3);
}

function resizeScope() {
  const { width, height } = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  viewWidth = width;
  viewHeight = height;
  if (context) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  drawScope();
}

function preview() {
  band = bands[bandSelection.querySelector('input:checked').value];
  gain = Number(sensitivity.value);
  sensitivityValue.textContent = gain + '%';
  sensitivity.setAttribute('aria-valuetext', gain + '%');
  const percentOfTrack = (gain - Number(sensitivity.min)) / (Number(sensitivity.max) - Number(sensitivity.min));
  sensitivity.style.setProperty('--gain', percentOfTrack * 100 + '%');
  frequency.textContent = band.frequency + ' kHz';
  scopeRange.textContent = band.range + ' km';
  setProgress(0);
  setMode('preview', '当前显示参数预览。扫描结束后会报告捕获数量。');
  drawScope();
}

function setRunning(running) {
  if (!running && document.activeElement === stop) start.focus();
  if (running) {
    start.setAttribute('aria-disabled', 'true');
    start.setAttribute('aria-busy', 'true');
  } else {
    start.removeAttribute('aria-disabled');
    start.removeAttribute('aria-busy');
  }
  scanLabel.textContent = running ? '扫描中…' : '开始扫描';
  stop.disabled = !running;
  bandSelection.disabled = running;
  sensitivity.disabled = running;
}

function scanFrame(time) {
  scanRatio = Math.max(0, Math.min((time - scanStarted) / scanDuration, 1));
  setProgress(Math.floor(scanRatio * 100));
  if (scanRatio === 1) {
    pendingFrame = 0;
    setMode('complete', '扫描完成，捕获 ' + detectableEchoes().length + ' 处模拟回波。');
    setRunning(false);
  } else {
    pendingFrame = requestAnimationFrame(scanFrame);
  }
  drawScope();
}

function startScan() {
  if (mode === 'running') return;
  scanRatio = 0;
  setProgress(0);
  setMode('running', '正在扫描。可以取消并继续调整参数。');
  setRunning(true);
  scanStarted = performance.now();
  drawScope();
  pendingFrame = requestAnimationFrame(scanFrame);
}

function cancelScan() {
  if (mode !== 'running') return;
  cancelAnimationFrame(pendingFrame);
  pendingFrame = 0;
  setProgress(0);
  setMode('cancelled', '扫描已取消。已保留当前频段与灵敏度。');
  setRunning(false);
  drawScope();
}

bandSelection.addEventListener('change', preview);
for (const option of bandSelection.querySelectorAll('.band-option')) {
  const value = option.querySelector('input').value;
  option.querySelector('[data-band-range]').textContent = bands[value].range + ' km';
}
sensitivity.addEventListener('input', preview);
start.addEventListener('click', startScan);
stop.addEventListener('click', cancelScan);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') cancelScan();
});
new ResizeObserver(resizeScope).observe(canvas);
preview();
