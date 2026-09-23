// Media Session: экран блокировки, пункт управления, наушники.
import { log } from './log.js';

const APP_NAME = 'Lovely Radio';
// Обложка обязательно с нашего домена: чужие картинки iOS часто не показывает.
const ARTWORK = [{ src: new URL('cover.png', location.href).href, sizes: '512x512', type: 'image/png' }];

export function bindMediaSession(player) {
  if (!('mediaSession' in navigator)) { log('Media Session: нет'); return; }
  const ms = navigator.mediaSession;

  ms.setActionHandler('play',  () => player.play());
  ms.setActionHandler('pause', () => player.pause());
  ms.setActionHandler('nexttrack',     () => player.next());
  ms.setActionHandler('previoustrack', () => player.prev());
  // Без этого iOS рисует перемотку ±10 сек вместо ⏮ ⏭ — для живого радио она не нужна.
  try { ms.setActionHandler('seekbackward', null); } catch (e) {}
  try { ms.setActionHandler('seekforward', null); } catch (e) {}
  try { ms.setActionHandler('seekto', null); } catch (e) {}

  player.onChange(e => {
    if (e.type === 'channel' && e.channel) {
      ms.metadata = new MediaMetadata({
        title: e.channel.name,
        artist: APP_NAME,
        album: e.channel.source || '',
        artwork: ARTWORK,
      });
    }
    if (e.type === 'status') {
      if (e.status === 'playing') ms.playbackState = 'playing';
      if (e.status === 'paused')  ms.playbackState = 'paused';
    }
  });
  log('Media Session: есть');
}
