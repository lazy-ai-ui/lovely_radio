// Временный функциональный интерфейс: без дизайна, только чтобы плеер
// можно было потрогать. Разметка — в index.html, стили — в styles/app.css.

const STATUS_TEXT = {
  connecting:  'Подключаюсь…',
  playing:     'Играет',
  paused:      'Пауза',
  buffering:   'Буферизация…',
  unavailable: 'Стрим недоступен — переключи станцию',
};

export function bindUI(player, root = document) {
  const $ = id => root.getElementById(id);
  const list = $('channels');
  const playBtn = $('play');

  // Обработчики синхронные: play() должен стартовать прямо из тапа.
  playBtn.onclick = () => player.toggle();
  $('next').onclick = () => player.next();
  $('prev').onclick = () => player.prev();

  function renderList({ channels, current }) {
    list.replaceChildren(...channels.map((c, i) => {
      const li = document.createElement('li');
      li.className = 'channel' + (i === current ? ' is-active' : '');
      li.innerHTML = '<span class="channel__name"></span><span class="channel__meta"></span>';
      li.querySelector('.channel__name').textContent = c.name;
      li.querySelector('.channel__meta').textContent = c.description || '';
      li.onclick = () => player.tune(i);
      return li;
    }));
  }

  player.onChange(e => {
    if (e.type === 'channel') {
      $('nowName').textContent = e.channel ? e.channel.name : 'Станция не выбрана';
      $('nowMeta').textContent = e.channel ? [e.channel.source, e.channel.description].filter(Boolean).join(' · ') : 'Нажми «Играть»';
      renderList(e);
    }
    if (e.type === 'status') {
      $('status').textContent = e.status === 'rejected'
        ? 'Не удалось запустить: ' + e.error
        : STATUS_TEXT[e.status];
      if (e.status === 'playing') playBtn.textContent = '⏸ Пауза';
      if (e.status === 'paused')  playBtn.textContent = '▶ Играть';
    }
  });

  return {
    setWorld(world) {
      document.documentElement.dataset.theme = world.theme;
      $('worldName').textContent = world.name;
    },
    showError(msg) { $('status').textContent = msg; },
  };
}
