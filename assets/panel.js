/* Add the viewer to the public dashboard without changing its account/API logic. */
const MODELS = [
  { id: 'ae4max2', name: 'AE4 MAX2+', size: '6.2 MB', file: 'ae4-max2plus-display.glb', orbit: '35deg 75deg 100%',
    note: '借用 AE4 MAX2+ 展示，与 AE5i Pro 外形不同', alt: 'AE4 MAX2+ 电动车展示模型，并非 AE5i Pro 原车模型' },
  { id: 'gugugaga', name: '咕咕嘎嘎（企鹅装）', size: '9.7 MB', file: 'gugugaga.glb', orbit: '0deg 80deg 105%',
    note: '第三方趣味角色 · planktonfun / planktonminions · CC BY 4.0', alt: '咕咕嘎嘎企鹅装趣味角色，非车辆模型' },
  { id: 'deepseek-fumo', name: 'DeepSeek 玩偶', size: '1.2 MB', file: 'deepseek-fumo.glb', orbit: '0deg 80deg 105%',
    note: '第三方趣味角色 · xunbile · CC BY 4.0', alt: 'DeepSeek 女仆装玩偶，非车辆模型' },
  { id: 'miko-bust', name: '巫女半身像', size: '36.7 MB', file: 'miko-bust.glb', orbit: '0deg 85deg 105%',
    note: '第三方角色半身像 · 首次约 37 MB，加载时间较长', alt: '巫女角色半身像，非车辆模型' }
];
const PREF_KEY = 'ae5i.panel.preferences.v1';
let preferences = { mode: '3d', rotate: false, model: MODELS[0].id };
try {
  const saved = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
  preferences.mode = saved.mode === '2d' ? '2d' : '3d';
  preferences.rotate = saved.rotate === true && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (MODELS.some(model => model.id === saved.model)) preferences.model = saved.model;
} catch { /* Storage may be unavailable in a private session. */ }
let viewer;
let libraryPromise;
let libraryAttempts = 0;
let loadTimer;
let ready = false;
let failed = false;
let mountedHero;
let queued = false;
let loadSequence = 0;
const selectedModel = () => MODELS.find(model => model.id === preferences.model) || MODELS[0];
const root = document.createElement('div');
root.className = 'ae5i-enhancement';
root.innerHTML = `
  <span class="ae5i-label">3D · AE4 MAX2+</span>
  <div class="ae5i-viewport">
    <div class="ae5i-status" role="status" aria-live="polite" data-state="loading">
      <span class="ae5i-spinner" aria-hidden="true"></span>
      <span class="ae5i-status-text">正在准备 3D 模型…</span>
      <button type="button" class="ae5i-button ae5i-retry" hidden>重新加载</button>
    </div>
  </div>
  <div class="ae5i-actions" aria-label="3D 展示控制">
    <button type="button" class="ae5i-button ae5i-reset" disabled>复位视角</button>
    <button type="button" class="ae5i-button ae5i-rotate" aria-pressed="false" disabled>自动旋转</button>
    <button type="button" class="ae5i-button ae5i-mode">原车图</button>
  </div>`;
const status = root.querySelector('.ae5i-status');
const statusText = root.querySelector('.ae5i-status-text');
const retry = root.querySelector('.ae5i-retry');
const reset = root.querySelector('.ae5i-reset');
const rotate = root.querySelector('.ae5i-rotate');
const mode = root.querySelector('.ae5i-mode');
const label = root.querySelector('.ae5i-label');
const picker = document.createElement('label');
picker.className = 'ae5i-model-picker';
picker.innerHTML = '<span>展示模型</span><select class="ae5i-model-select" aria-label="选择展示模型"></select>';
const select = picker.querySelector('select');
for (const model of MODELS) select.add(new Option(`${model.name} · ${model.size}`, model.id));
const caption = document.createElement('p');
caption.className = 'ae5i-caption';
function updateModelInfo() {
  const model = selectedModel();
  select.value = model.id;
  label.textContent = `3D · ${model.name}`;
  caption.innerHTML = `${model.note}<br>单指旋转 · 双指缩放 · <a href="guide.html#models" target="_blank" rel="noopener">模型来源与说明</a>`;
}
updateModelInfo();

function savePreferences() {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(preferences)); } catch { /* Optional preference. */ }
}
function updateRotation() {
  if (viewer) viewer.autoRotate = ready && preferences.rotate && preferences.mode === '3d' && root.isConnected && !document.hidden;
}
function updateControls() {
  mountedHero?.setAttribute('data-ae5i-mode', preferences.mode);
  mode.textContent = preferences.mode === '3d' ? '原车图' : '显示 3D';
  rotate.setAttribute('aria-pressed', String(preferences.rotate));
  reset.disabled = !ready || preferences.mode !== '3d';
  rotate.disabled = !ready || preferences.mode !== '3d';
  updateRotation();
}
function showFailure() {
  failed = true;
  clearTimeout(loadTimer);
  status.hidden = false;
  status.dataset.state = 'error';
  statusText.textContent = '模型暂时无法显示，可重新加载、选择其他模型或切换原车图。';
  retry.hidden = false;
  ready = false;
  updateControls();
}
async function loadModel(force = false) {
  force ||= failed;
  const model = selectedModel();
  if (ready && viewer?.dataset.modelId === model.id && !force) return;
  const sequence = ++loadSequence;
  ready = false;
  status.hidden = false;
  status.dataset.state = 'loading';
  statusText.textContent = `正在加载 ${model.name}（${model.size}）…`;
  retry.hidden = true;
  failed = false;
  updateControls();
  clearTimeout(loadTimer);
  loadTimer = setTimeout(() => {
    if (!ready && !failed) statusText.textContent = '加载用时较长，可继续等待，或先切换原车图。';
  }, 20000);
  try {
    if (!libraryPromise) {
      const libraryUrl = new URL('../vendor/model-viewer.min.js', import.meta.url);
      if (libraryAttempts++) libraryUrl.searchParams.set('retry', String(libraryAttempts));
      libraryPromise = import(libraryUrl.href);
    }
    await libraryPromise;
    if (sequence !== loadSequence) return;
    if (!viewer) {
      viewer = document.createElement('model-viewer');
      viewer.className = 'ae5i-model';
      const attributes = {
        'camera-controls': '', 'disable-pan': '', 'disable-tap': '',
        'touch-action': 'none', 'camera-orbit': model.orbit,
        'min-camera-orbit': 'auto 25deg 55%', 'max-camera-orbit': 'auto 100deg 180%',
        'field-of-view': '30deg', 'interaction-prompt': 'none',
        'shadow-intensity': '0.65', 'shadow-softness': '0.9', 'exposure': '1.05',
        'loading': 'eager', 'reveal': 'auto', 'rotation-per-second': '16deg',
        'auto-rotate-delay': '1500'
      };
      for (const [name, value] of Object.entries(attributes)) viewer.setAttribute(name, value);
      viewer.addEventListener('load', () => {
        if (!viewer.loaded) return;
        ready = true; failed = false; clearTimeout(loadTimer);
        restoreCamera();
        status.hidden = true;
        updateControls();
      });
      viewer.addEventListener('error', showFailure);
      viewer.addEventListener('progress', event => {
        if (!failed && !ready) {
          const progress = Math.min(99, Math.round((event.detail.totalProgress || 0) * 100));
          statusText.textContent = `正在加载 ${selectedModel().name}… ${progress}%`;
        }
      });
      root.querySelector('.ae5i-viewport').prepend(viewer);
    }
    if (viewer.dataset.modelId !== model.id || force) {
      viewer.dataset.modelId = model.id;
      viewer.alt = model.alt;
      viewer.cameraOrbit = model.orbit;
      const modelUrl = new URL(`../models/${model.file}`, import.meta.url);
      if (force) modelUrl.searchParams.set('retry', String(Date.now()));
      viewer.src = modelUrl.href;
    }
    updateControls();
  } catch {
    if (sequence !== loadSequence) return;
    libraryPromise = undefined;
    showFailure();
  }
}
root.addEventListener('click', event => event.stopPropagation());
picker.addEventListener('click', event => event.stopPropagation());
select.addEventListener('change', () => {
  preferences.model = select.value;
  preferences.mode = '3d';
  savePreferences(); updateModelInfo();
  loadModel();
});
function restoreCamera() {
  viewer.cameraOrbit = selectedModel().orbit;
  viewer.cameraTarget = 'auto auto auto';
  viewer.fieldOfView = '30deg';
  viewer.resetTurntableRotation();
  viewer.jumpCameraToGoal();
}
reset.addEventListener('click', restoreCamera);
rotate.addEventListener('click', () => {
  preferences.rotate = !preferences.rotate;
  savePreferences(); updateControls();
});
mode.addEventListener('click', () => {
  preferences.mode = preferences.mode === '3d' ? '2d' : '3d';
  savePreferences(); updateControls();
  if (preferences.mode === '3d' && !ready) loadModel();
});
retry.addEventListener('click', () => loadModel(true));
document.addEventListener('visibilitychange', updateRotation);
window.addEventListener('pagehide', () => { if (viewer) viewer.autoRotate = false; });
window.addEventListener('pageshow', updateRotation);

function mount() {
  queued = false;
  const hero = document.querySelector('#scroll .hero-card');
  const stage = hero?.querySelector('.hero-stage');
  if (!stage) { updateRotation(); return; }
  if (root.parentElement === stage && picker.parentElement === hero && caption.parentElement === hero) return;
  mountedHero = hero;
  hero.classList.add('ae5i-hero');
  stage.append(root);
  stage.insertAdjacentElement('afterend', picker);
  picker.insertAdjacentElement('afterend', caption);
  updateControls();
  if (preferences.mode === '3d' && !viewer && !libraryPromise) loadModel();
}
const observer = new MutationObserver(() => {
  if (!queued) { queued = true; queueMicrotask(mount); }
});
observer.observe(document.getElementById('scroll') || document.body, { childList: true, subtree: true });
mount();
