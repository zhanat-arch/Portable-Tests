// Runs after the upstream localization has mounted sound, home and language.
(() => {
  const copy = {
    ru: ['Игровая панель', 'Поделиться игрой', 'Экранные стрелки', 'Вверх', 'Влево', 'Вниз', 'Вправо', 'Ссылка скопирована', 'Ссылка на игру'],
    kk: ['Ойын тақтасы', 'Ойынды бөлісу', 'Экрандағы жебелер', 'Жоғары', 'Солға', 'Төмен', 'Оңға', 'Сілтеме көшірілді', 'Ойын сілтемесі'],
    en: ['Game toolbar', 'Share game', 'On-screen arrows', 'Up', 'Left', 'Down', 'Right', 'Link copied', 'Game link'],
    fr: ['Commandes du jeu', 'Partager le jeu', 'Flèches à l’écran', 'Haut', 'Gauche', 'Bas', 'Droite', 'Lien copié', 'Lien du jeu']
  };
  const directions = [['Up', '↑'], ['Left', '←'], ['Down', '↓'], ['Right', '→']];
  const preference = 'ph.arcade.arrows';
  const texts = () => copy[WG.current()] || copy.en;
  const label = (element, value) => {
    element.title = value;
    element.setAttribute('aria-label', value);
  };
  function gameUrl() {
    const path = location.pathname.match(/\/games\/arcade\/[a-z0-9-]+\//)?.[0];
    if (!path) return '';
    const link = new URL(path, 'https://porthub.fyi');
    link.searchParams.set('lang', WG.current());
    return link.href;
  }

  async function shareOrCopy(data, clipboardText, copied, fallback) {
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
        await navigator.share(data);
        return;
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(clipboardText);
    } catch {
      fallback();
      return;
    }
    copied();
  }

  window.PHArcadeShare = {
    url: gameUrl,
    score(text, copied, fallback) {
      return shareOrCopy({ title: document.title, text }, text, copied, fallback);
    }
  };

  function mount() {
    const toolbar = document.querySelector('.ph-arcade-toolbar');
    if (!toolbar) return;
    const share = document.createElement('button');
    const feedback = document.createElement('span');
    share.type = 'button';
    share.className = 'ph-arcade-share';
    share.textContent = '↗';
    feedback.className = 'ph-arcade-feedback';
    feedback.setAttribute('role', 'status');
    toolbar.append(share, feedback);
    let feedbackTimer;
    share.addEventListener('click', () => {
      const url = gameUrl();
      if (!url) return;
      shareOrCopy({ title: document.title, url }, url, () => {
        feedback.textContent = texts()[7];
        clearTimeout(feedbackTimer);
        feedbackTimer = setTimeout(() => { feedback.textContent = ''; }, 1800);
      }, () => window.prompt(texts()[8], url));
    });

    const arrowConfig = document.body.dataset.phArrows;
    const controls = arrowConfig ? mountArrows(toolbar, arrowConfig) : null;
    function localize() {
      const words = texts();
      toolbar.setAttribute('aria-label', words[0]);
      label(share, words[1]);
      controls?.localize(words);
    }
    WG.onChange(localize);
    localize();
  }

  function mountArrows(toolbar, config) {
    const pad = config === 'keys' ? document.createElement('div') : document.querySelector(config);
    if (!pad) return null;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'ph-arcade-arrow-toggle';
    toggle.textContent = '✥';
    toolbar.insertBefore(toggle, toolbar.querySelector('.ph-arcade-share'));
    const keys = [];
    if (config === 'keys') {
      pad.className = 'ph-arcade-dpad';
      for (const [direction, symbol] of directions) {
        const key = document.createElement('button');
        key.type = 'button';
        key.textContent = symbol;
        key.addEventListener('click', () => key.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Arrow' + direction, code: 'Arrow' + direction, bubbles: true, cancelable: true
        })));
        keys.push(key);
        pad.append(key);
      }
      const stage = document.querySelector('.snake-stage');
      if (stage) stage.append(pad);
      else document.querySelector('.footer')?.before(pad);
    }
    let enabled = config !== 'keys' || matchMedia('(any-pointer: coarse)').matches;
    try {
      const saved = localStorage.getItem(preference);
      if (saved !== null) enabled = saved === '1';
    } catch {}
    function refresh() {
      pad.hidden = !enabled;
      toggle.setAttribute('aria-pressed', String(enabled));
      document.body.classList.toggle('ph-arcade-arrows-on', enabled);
      // Some games fit their canvas to the available height on resize.
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    }
    toggle.addEventListener('click', () => {
      enabled = !enabled;
      try { localStorage.setItem(preference, enabled ? '1' : '0'); } catch {}
      refresh();
    });
    refresh();
    return { localize(words) {
      label(toggle, words[2]);
      pad.setAttribute('role', 'group');
      pad.setAttribute('aria-label', words[2]);
      keys.forEach((key, index) => label(key, words[index + 3]));
    } };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
