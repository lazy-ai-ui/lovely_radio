import { log, mountLog } from './log.js';
import { loadConfig } from './config.js';
import { createPlayer } from './player.js';
import { bindMediaSession } from './media-session.js';
import { bindUI } from './ui.js';

mountLog(document.getElementById('log'));
log(navigator.userAgent);
document.addEventListener('visibilitychange', () => log('visibility: ' + document.visibilityState));

const player = createPlayer(document.getElementById('audio'));
const ui = bindUI(player);
bindMediaSession(player);

// Конфиг грузим сразу при старте, а не по тапу: иначе между тапом и play()
// окажется await, и iOS откажется запускать звук.
try {
  const config = await loadConfig();
  const world = config.worlds[0]; // выбор мира появится позже
  ui.setWorld(world);
  player.setChannels(world.channels);
  log(`config: мир "${world.id}", каналов ${world.channels.length}`);
} catch (e) {
  log('config error: ' + e.message);
  ui.showError('Не удалось загрузить список станций');
}
