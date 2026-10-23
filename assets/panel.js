/* Add the viewer to the public dashboard without changing its account/API logic. */
const MODEL_URL = new URL('../models/ae4-max2plus-display.glb', import.meta.url).href;
const DEFAULT_ORBIT = '35deg 75deg 100%';
const PREF_KEY = 'ae5i.panel.preferences.v1';
let preferences = { mode: '3d', rotate: false };
try {
  const saved = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
  preferences.mode = saved.mode === '2d' ? '2d' : '3d';
  preferences.rotate = saved.rotate === true && !matchMedia('(prefers-reduced-motion: reduce)').matches;
} catch { /* Storage may be unavailable in a private session. */ }
let viewer;
let libraryPromise;
let libraryAttempts = 0;
let loadTimer;
let ready = false;
let failed = false;
let mountedHero;
let queued = false;
const root = document.createElement('div');
root.className = 'ae5i-enhancement';
root.innerHTML = `
  <span class="ae5i-label">3D · AE4 MAX2+</span>
  <div class="ae5i-viewport">
    <div class="ae5i-status" role="status" aria-live="polite" data-state="loading">
      <span class="ae5i-spinner" aria-hidden="true"></span>
      <span class="ae5i-status-text">正在准备 3D 车模…</span>
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
const caption = document.createElement('p');
caption.className = 'ae5i-caption';
caption.innerHTML = '单指旋转 · 双指缩放<br>借用 AE4 MAX2+ 展示，与 AE5i Pro 外形不同 · <a href="guide.html" target="_blank" rel="noopener">使用说明</a>';

function savePreferences() {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(preferences)); } catch { /* Optional preference. */ }
}
function updateRotation() {
  if (viewer) viewer.autoRotate = preferences.rotate && preferences.mode === '3d' && root.isConnected && !document.hidden;
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
  statusText.textContent = '3D 暂时无法显示，可重新加载或切换原车图。';
  retry.hidden = false;
  ready = false;
  updateControls();
}
async function loadModel(force = false) {
  force ||= failed;
  if (ready && !force) return;
  status.hidden = false;
  status.dataset.state = 'loading';
  statusText.textContent = '正在加载 3D 车模…';
  retry.hidden = true;
  failed = false;
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
    if (!viewer) {
      viewer = document.createElement('model-viewer');
      viewer.className = 'ae5i-model';
      viewer.alt = '可旋转和缩放的 AE4 MAX2+ 电动车展示模型，并非 AE5i Pro 原车模型';
      const attributes = {
        'camera-controls': '', 'disable-pan': '', 'disable-tap': '',
        'touch-action': 'none', 'camera-orbit': DEFAULT_ORBIT,
        'min-camera-orbit': 'auto 25deg 55%', 'max-camera-orbit': 'auto 100deg 180%',
        'field-of-view': '30deg', 'interaction-prompt': 'none',
        'shadow-intensity': '0.65', 'shadow-softness': '0.9', 'exposure': '1.05',
        'loading': 'eager', 'reveal': 'auto', 'rotation-per-second': '16deg',
        'auto-rotate-delay': '1500'
      };
      for (const [name, value] of Object.entries(attributes)) viewer.setAttribute(name, value);
      viewer.addEventListener('load', () => {
        ready = true; failed = false; clearTimeout(loadTimer);
        status.hidden = true;
        updateControls();
      });
      viewer.addEventListener('error', showFailure);
      viewer.addEventListener('progress', event => {
        if (!failed && !ready) {
          const progress = Math.min(99, Math.round((event.detail.totalProgress || 0) * 100));
          statusText.textContent = `正在加载 3D 车模… ${progress}%`;
        }
      });
      root.querySelector('.ae5i-viewport').prepend(viewer);
    }
    if (!viewer.src || force) {
      ready = false;
      viewer.src = force ? `${MODEL_URL}?retry=${Date.now()}` : MODEL_URL;
    }
    updateControls();
  } catch {
    libraryPromise = undefined;
    showFailure();
  }
}
root.addEventListener('click', event => event.stopPropagation());
reset.addEventListener('click', () => {
  viewer.cameraOrbit = DEFAULT_ORBIT;
  viewer.cameraTarget = 'auto auto auto';
  viewer.fieldOfView = '30deg';
  viewer.resetTurntableRotation();
  viewer.jumpCameraToGoal();
});
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
  if (root.parentElement === stage && caption.parentElement === hero) return;
  mountedHero = hero;
  hero.classList.add('ae5i-hero');
  stage.append(root);
  stage.insertAdjacentElement('afterend', caption);
  updateControls();
  if (preferences.mode === '3d' && !viewer && !libraryPromise) loadModel();
}
const observer = new MutationObserver(() => {
  if (!queued) { queued = true; queueMicrotask(mount); }
});
observer.observe(document.getElementById('scroll') || document.body, { childList: true, subtree: true });
mount();
