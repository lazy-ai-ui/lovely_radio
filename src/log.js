// Отладочный лог. На экране виден только с ?debug в адресе — на iPhone это
// единственный удобный способ увидеть, что происходит с аудио в фоне.
export const debug = new URLSearchParams(location.search).has('debug');

let el = null;

export function mountLog(node) {
  if (!debug) return;
  el = node;
  el.hidden = false;
}

export function log(msg) {
  const t = new Date().toLocaleTimeString();
  console.log(`[radio] ${msg}`);
  if (el) el.textContent = `[${t}] ${msg}\n` + el.textContent;
}
