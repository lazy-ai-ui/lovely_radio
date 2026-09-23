// Загрузка и проверка channels.json.
// Отбрасываем всё, что не сыграет на iOS: не-https стримы (Safari блокирует
// mixed content), каналы без стримов и пока не реализованные типы.
import { log } from './log.js';

const PLAYABLE_TYPES = ['stream'];

export async function loadConfig(url = 'channels.json') {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  const data = await r.json();
  if (!Array.isArray(data.worlds)) throw new Error(`${url}: нет массива worlds`);

  const worlds = data.worlds.map(w => ({
    id: w.id,
    name: w.name,
    theme: w.theme,
    channels: (w.channels || []).filter(c => isPlayable(c, w.id)),
  }));
  return { version: data.version, worlds };
}

function isPlayable(c, worldId) {
  const where = `${worldId}/${c.id}`;
  if (c.enabled === false) return false;
  if (!PLAYABLE_TYPES.includes(c.type)) { log(`config: ${where} — тип "${c.type}" пока не поддержан`); return false; }
  const bad = (c.streams || []).filter(u => !u.startsWith('https://'));
  if (bad.length) log(`config: ${where} — выкинуты не-https стримы: ${bad.join(', ')}`);
  c.streams = (c.streams || []).filter(u => u.startsWith('https://'));
  if (!c.streams.length) { log(`config: ${where} — нет https-стримов`); return false; }
  return true;
}
