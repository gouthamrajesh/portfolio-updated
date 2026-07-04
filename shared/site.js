/* Shared across all view-mode pages: view-mode switcher + background music (local audio file). */
(function (global) {
  function siteBase() {
    var p = location.pathname.replace(/\\/g, '/');
    var subs = ['newspaper', 'terminal', 'flipkart'];
    for (var i = 0; i < subs.length; i++) {
      var s = subs[i];
      if (p.indexOf('/' + s + '/') !== -1 || p.slice(-(s.length + 1)) === '/' + s) return '../';
    }
    return './';
  }

  function injectStyles() {
    if (document.getElementById('sharedSiteStyles')) return;
    var style = document.createElement('style');
    style.id = 'sharedSiteStyles';
    style.textContent =
      '.egypt-music-btn{position:fixed;bottom:20px;left:20px;z-index:5000;background:#1a1a1a;color:#fff;border:1px solid #444;padding:10px 16px;border-radius:100px;font-family:"Courier New",monospace;font-size:12px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.4);transition:background .2s ease,border-color .2s ease,color .2s ease;}' +
      '.egypt-music-btn:hover{border-color:#FFC24B;}' +
      '.egypt-music-btn.playing{background:#3a2f0a;border-color:#FFC24B;color:#FFC24B;}' +
      '.view-mode-widget{position:fixed;bottom:20px;right:20px;z-index:5000;font-family:"Courier New",monospace;font-size:12px;text-align:right;}' +
      '.view-mode-widget .vm-btn{background:#1a1a1a;color:#fff;border:1px solid #444;padding:10px 16px;border-radius:100px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.4);}' +
      '.view-mode-widget .vm-btn:hover{border-color:#4D9FFF;}' +
      '.view-mode-widget .vm-menu{display:none;position:absolute;bottom:46px;right:0;background:#151515;border:1px solid #444;border-radius:10px;padding:8px;min-width:200px;box-shadow:0 8px 24px rgba(0,0,0,0.5);}' +
      '.view-mode-widget.open .vm-menu{display:block;}' +
      '.view-mode-widget .vm-item{display:block;padding:9px 10px;color:#ddd;text-decoration:none;border-radius:6px;font-size:12px;white-space:nowrap;}' +
      '.view-mode-widget .vm-item:hover{background:#272727;}' +
      '.view-mode-widget .vm-item.active{color:#39FF88;}' +
      '@media (max-width:560px){.egypt-music-btn{left:12px;bottom:12px;padding:8px 12px;font-size:11px;}.view-mode-widget{right:12px;bottom:12px;}}';
    document.head.appendChild(style);
  }

  /* ── View Mode switcher ── */
  function injectViewModeSwitcher(current) {
    injectStyles();
    var base = siteBase();
    var modes = [
      { key: 'default', label: 'Default', href: base },
      { key: 'newspaper', label: '1800s Newspaper', href: base + 'newspaper/' },
      { key: 'terminal', label: 'Terminal', href: base + 'terminal/' },
      { key: 'flipkart', label: 'Flipkart Product Page', href: base + 'flipkart/' }
    ];
    var wrap = document.createElement('div');
    wrap.className = 'view-mode-widget';
    var menu = document.createElement('div');
    menu.className = 'vm-menu';
    modes.forEach(function (m) {
      var a = document.createElement('a');
      a.href = m.href;
      a.textContent = (m.key === current ? '● ' : '') + m.label;
      a.className = 'vm-item' + (m.key === current ? ' active' : '');
      menu.appendChild(a);
    });
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'vm-btn';
    btn.textContent = '🎛 View Mode';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      wrap.classList.toggle('open');
    });
    document.addEventListener('click', function () { wrap.classList.remove('open'); });
    wrap.appendChild(menu);
    wrap.appendChild(btn);
    document.body.appendChild(wrap);
  }

  /* ── Background music: single local audio file, shared across every page ── */
  function createFileMusic(src) {
    var audio = null, playing = false, muted = true;

    function ensureAudio() {
      if (audio) return audio;
      audio = new Audio(src);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0.6;
      audio.muted = true; // starts muted so the browser allows autoplay
      return audio;
    }

    function play() {
      if (playing) return;
      playing = true;
      ensureAudio();
      audio.play().catch(function () {});
    }
    function pause() {
      if (!playing) return;
      playing = false;
      if (audio) audio.pause();
    }
    function wake() {
      if (!playing || !muted) return;
      muted = false;
      ensureAudio();
      audio.muted = false;
      audio.play().catch(function () {});
    }
    function toggle() {
      if (playing) pause(); else play();
      return playing;
    }

    return { play: play, pause: pause, wake: wake, toggle: toggle, isPlaying: function () { return playing; } };
  }

  function initMusic(opts) {
    opts = opts || {};
    var label = opts.label || 'Vice City Vibes';
    var icon = opts.icon || '🌆';
    var src = opts.src || (siteBase() + 'shared/audio.mp3');
    var storageKey = 'siteMusicPref:audio';
    injectStyles();
    var music = createFileMusic(src);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'egyptMusicToggle';
    btn.className = 'egypt-music-btn';

    function render() {
      var isPlaying = music.isPlaying();
      btn.textContent = icon + ' ' + (isPlaying ? 'Pause ' : 'Play ') + label;
      btn.classList.toggle('playing', isPlaying);
    }

    btn.addEventListener('click', function () {
      music.toggle();
      try { localStorage.setItem(storageKey, music.isPlaying() ? 'playing' : 'paused'); } catch (e) {}
      render();
    });
    document.body.appendChild(btn);

    var explicitlyPaused = false;
    try { explicitlyPaused = localStorage.getItem(storageKey) === 'paused'; } catch (e) {}

    if (!explicitlyPaused) {
      music.play();
      render();
      // Browsers block audible autoplay until the visitor interacts with the page.
      // Music is already "on" by intent; this just lets the sound through on the first interaction.
      var wakeEvents = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
      function onFirstInteraction() {
        wakeEvents.forEach(function (ev) { document.removeEventListener(ev, onFirstInteraction); });
        music.wake();
      }
      wakeEvents.forEach(function (ev) { document.addEventListener(ev, onFirstInteraction, { passive: true }); });
    } else {
      render();
    }

    return music;
  }

  global.SiteShared = {
    siteBase: siteBase,
    injectViewModeSwitcher: injectViewModeSwitcher,
    initMusic: initMusic
  };
})(window);
