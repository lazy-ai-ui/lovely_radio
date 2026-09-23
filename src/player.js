// Плеер: один <audio>, список каналов, перебор зеркал при ошибке.
// Про DOM интерфейса ничего не знает — наружу отдаёт события через onChange.
//
// iOS: play() должен вызываться синхронно из обработчика тапа (или Media
// Session), до любого await. Поэтому tune()/resume() не ждут ничего перед
// audio.play(), а конфиг грузится заранее, при старте страницы.
import { log } from './log.js';

export function createPlayer(audio) {
  let channels = [];
  let current = -1;
  let mirrorIdx = 0;
  const listeners = new Set();

  const state = () => ({
    channels,
    current,
    channel: channels[current] || null,
    paused: audio.paused,
  });
  const emit = (type, extra = {}) => listeners.forEach(fn => fn({ type, ...state(), ...extra }));

  async function start() {
    const c = channels[current];
    const url = c.streams[mirrorIdx];
    audio.src = url;
    emit('status', { status: 'connecting' });
    log(`play ${c.name} → ${url}`);
    try { await audio.play(); }
    catch (e) {
      log(`play() rejected: ${e.name} — ${e.message}`);
      emit('status', { status: 'rejected', error: e.name });
    }
  }

  function tune(i) {
    if (!channels.length) return;
    current = (i + channels.length) % channels.length;
    mirrorIdx = 0;
    emit('channel');
    return start();
  }

  audio.addEventListener('playing', () => emit('status', { status: 'playing' }));
  audio.addEventListener('pause',   () => emit('status', { status: 'paused' }));
  audio.addEventListener('waiting', () => emit('status', { status: 'buffering' }));
  audio.addEventListener('stalled', () => log('stalled'));
  audio.addEventListener('error', () => {
    const c = channels[current];
    log(`audio error code=${audio.error?.code} на ${c?.streams[mirrorIdx]}`);
    if (c && mirrorIdx < c.streams.length - 1) {
      mirrorIdx++;
      log('пробую зеркало ' + mirrorIdx);
      start();
    } else emit('status', { status: 'unavailable' });
  });

  return {
    setChannels(list) { channels = list; current = -1; emit('channel'); },
    tune,
    next: () => tune(current + 1),
    prev: () => tune(current - 1),
    // После паузы переподключаемся заново, а не доигрываем старый буфер.
    play: () => (current < 0 ? tune(0) : start()),
    pause: () => audio.pause(),
    toggle() {
      if (current < 0) return tune(0);
      return audio.paused ? start() : audio.pause();
    },
    get state() { return state(); },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}
