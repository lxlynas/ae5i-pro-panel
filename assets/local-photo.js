/* User-selected images stay in this browser. No network upload or account/VIN access. */
export function createLocalPhotoControls(onChange) {
  const element = document.createElement('div');
  element.className = 'ae5i-photo-controls';
  element.innerHTML = `<div class="ae5i-photo-buttons">
    <button type="button" class="ae5i-button ae5i-photo-pick">从相册选车图</button>
    <button type="button" class="ae5i-button ae5i-photo-clear" disabled>恢复默认车图</button>
    <input class="ae5i-photo-input" type="file" accept="image/*" hidden>
  </div><p class="ae5i-photo-status" role="status" aria-live="polite">图片仅保存在本机浏览器，不上传。</p>`;
  const pick = element.querySelector('.ae5i-photo-pick');
  const clear = element.querySelector('.ae5i-photo-clear');
  const input = element.querySelector('input');
  const status = element.querySelector('.ae5i-photo-status');
  let photoUrl = '';
  let generation = 0;
  let databasePromise;
  function database() {
    if (!databasePromise) databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('ae5i-panel-local-media', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('photos');
      request.onsuccess = () => {
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Local image storage is blocked'));
    });
    return databasePromise;
  }
  async function storedPhoto(operation, blob) {
    const db = await database();
    // ArrayBuffer storage also works in WebKit implementations that cannot persist Blob objects.
    const value = operation === 'put' ? {bytes: await blob.arrayBuffer(), type: blob.type} : null;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('photos', operation === 'get' ? 'readonly' : 'readwrite');
      const store = transaction.objectStore('photos');
      const request = operation === 'get' ? store.get('vehicle') : operation === 'put' ? store.put(value, 'vehicle') : store.delete('vehicle');
      let result;
      request.onsuccess = () => { result = request.result; };
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('Local image storage was interrupted'));
    });
  }
  function display(blob, reason) {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = blob ? URL.createObjectURL(blob) : '';
    clear.disabled = !photoUrl;
    onChange(photoUrl, reason);
  }
  async function normalizeImage(file) {
    if ((!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name)) || /svg/i.test(file.type)) {
      throw new Error('请选择照片文件，例如 JPEG、PNG 或 WebP。');
    }
    if (file.size > 20 * 1024 * 1024) throw new Error('照片超过 20 MB，请先选择较小的照片。');
    const sourceUrl = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = sourceUrl;
      try { await image.decode(); } catch { throw new Error('这张照片暂时无法读取，请换用 JPEG、PNG 或 WebP。'); }
      if (!image.naturalWidth || !image.naturalHeight) throw new Error('照片尺寸无效，请换一张。');
      const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('本机暂时无法处理照片，请稍后重试。');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return await new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('照片处理失败，请换一张。')), 'image/webp', .9));
    } finally { URL.revokeObjectURL(sourceUrl); }
  }
  element.addEventListener('click', event => event.stopPropagation());
  pick.addEventListener('click', () => { input.value = ''; input.click(); });
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    ++generation;
    pick.disabled = clear.disabled = true;
    status.textContent = '正在本机处理照片…';
    try {
      const blob = await normalizeImage(file);
      let saved = true;
      try { await storedPhoto('put', blob); } catch { saved = false; }
      display(blob, 'selected');
      status.textContent = saved ? '车图已保存在本机；刷新后仍可显示，不上传。' : '本浏览器无法保存，照片仅本次显示；没有上传。';
    } catch (error) {
      status.textContent = error.message || '无法读取照片，请换一张。';
    } finally {
      pick.disabled = false;
      clear.disabled = !photoUrl;
      input.value = '';
    }
  });
  clear.addEventListener('click', async () => {
    ++generation;
    pick.disabled = clear.disabled = true;
    try {
      await storedPhoto('delete');
      display(null, 'cleared');
      status.textContent = '已恢复默认车图；登录信息保留。';
    } catch {
      display(null, 'cleared');
      status.textContent = '已恢复本次默认图；本机存储暂不可用，旧车图未能清除。';
    } finally {
      pick.disabled = false;
      clear.disabled = !photoUrl;
    }
  });
  const initialGeneration = generation;
  storedPhoto('get').then(value => {
    const blob = value instanceof Blob ? value : value?.bytes instanceof ArrayBuffer ? new Blob([value.bytes], {type: value.type || 'image/png'}) : null;
    if (generation === initialGeneration && blob) display(blob, 'restored');
  }).catch(() => { /* Selection can still be displayed for the current session. */ });
  return element;
}
