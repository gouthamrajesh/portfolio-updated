/* Shared across all view-mode pages: view-mode switcher + synthesized background music tracks. */
(function (global) {
  function siteBase() {
    var p = location.pathname.replace(/\\/g, '/');
    var subs = ['newspaper', 'terminal', 'flipkart', 'egyptian'];
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
      { key: 'flipkart', label: 'Flipkart Product Page', href: base + 'flipkart/' },
      { key: 'egyptian', label: 'Egyptian', href: base + 'egyptian/' }
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

  /* ── Synthesized music engine (no external audio files) ── */
  function noiseBuffer(ctx, seconds, shape) {
    var size = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    var buf = ctx.createBuffer(1, size, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < size; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / size, shape || 2);
    }
    return buf;
  }

  function createMusicEngine(kind) {
    var ctx = null, master = null, timers = [], liveNodes = [], playing = false, tickerStarted = false;

    function ensureCtx() {
      if (!ctx) {
        var AC = global.AudioContext || global.webkitAudioContext;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.22;
        master.connect(ctx.destination);
      }
    }

    function stopAll() {
      timers.forEach(function (id) { clearInterval(id); clearTimeout(id); });
      timers = [];
      liveNodes.forEach(function (n) { try { n.stop(); } catch (e) {} });
      liveNodes = [];
      tickerStarted = false;
    }

    /* ---- Track: 'egyptian' — upbeat Hijaz-scale plucked loop with hand-drum ---- */
    function startEgyptian() {
      var ROOT = 146.83; // D3
      var SCALE = [0, 1, 4, 5, 7, 8, 11, 12];
      var PATTERN = [0, 2, 4, 2, 5, 4, 2, 1, 0, 7, 5, 4, 2, 1, 0, -1];
      var STEP_SECONDS = 60 / 128 / 2;
      var step = 0;

      function freqFor(idx) {
        if (idx < 0) return null;
        var octave = Math.floor(idx / SCALE.length);
        var semis = SCALE[((idx % SCALE.length) + SCALE.length) % SCALE.length] + 12 * octave;
        return ROOT * Math.pow(2, semis / 12);
      }
      function pluck(freq, time) {
        var osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        var filt = ctx.createBiquadFilter();
        filt.type = 'lowpass';
        filt.frequency.value = 1400;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(0.14, time + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, time + 0.32);
        osc.connect(filt); filt.connect(g); g.connect(master);
        osc.start(time); osc.stop(time + 0.36);
      }
      function drum(time, low) {
        var src = ctx.createBufferSource();
        src.buffer = noiseBuffer(ctx, 0.15, 2);
        var filt = ctx.createBiquadFilter();
        filt.type = 'bandpass';
        filt.frequency.value = low ? 170 : 1500;
        filt.Q.value = 1.1;
        var g = ctx.createGain();
        g.gain.value = low ? 0.32 : 0.12;
        src.connect(filt); filt.connect(g); g.connect(master);
        src.start(time);
      }
      var drone = ctx.createOscillator();
      drone.type = 'sawtooth';
      drone.frequency.value = ROOT / 2;
      var droneFilt = ctx.createBiquadFilter();
      droneFilt.type = 'lowpass';
      droneFilt.frequency.value = 260;
      var droneGain = ctx.createGain();
      droneGain.gain.value = 0.045;
      drone.connect(droneFilt); droneFilt.connect(droneGain); droneGain.connect(master);
      drone.start();
      liveNodes.push(drone);

      function tick() {
        var t = ctx.currentTime + 0.02;
        var freq = freqFor(PATTERN[step % PATTERN.length]);
        if (freq) pluck(freq, t);
        if (step % 4 === 0) drum(t, true);
        else if (step % 4 === 2) drum(t, false);
        step++;
      }
      tick();
      timers.push(setInterval(tick, STEP_SECONDS * 1000));
    }

    /* ---- Track: 'egyptian-ambient' — dark mystical desert drone + nay-flute phrases ---- */
    function startEgyptianAmbient() {
      var padFreqs = [73.42, 73.62, 110.0]; // D2, detuned D2, A2 (fifth)
      padFreqs.forEach(function (f) {
        var osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f;
        var filt = ctx.createBiquadFilter();
        filt.type = 'lowpass';
        filt.frequency.value = 500;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 3);
        osc.connect(filt); filt.connect(g); g.connect(master);
        osc.start();
        liveNodes.push(osc);

        var lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.05 + Math.random() * 0.05;
        var lfoGain = ctx.createGain();
        lfoGain.gain.value = 90;
        lfo.connect(lfoGain); lfoGain.connect(filt.frequency);
        lfo.start();
        liveNodes.push(lfo);
      });

      var wind = ctx.createBufferSource();
      var windBuf = noiseBuffer(ctx, 4, 0.02);
      wind.buffer = windBuf;
      wind.loop = true;
      var windFilt = ctx.createBiquadFilter();
      windFilt.type = 'lowpass';
      windFilt.frequency.value = 350;
      var windGain = ctx.createGain();
      windGain.gain.value = 0.03;
      wind.connect(windFilt); windFilt.connect(windGain); windGain.connect(master);
      wind.start();
      liveNodes.push(wind);

      var FLUTE_SCALE = [0, 1, 4, 5, 7, 8, 11, 12];
      var FLUTE_ROOT = 293.66; // D4
      function playFlute(freq, time) {
        var osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        var vibrato = ctx.createOscillator();
        vibrato.type = 'sine';
        vibrato.frequency.value = 4.5;
        var vibGain = ctx.createGain();
        vibGain.gain.value = 4;
        vibrato.connect(vibGain); vibGain.connect(osc.frequency);
        var filt = ctx.createBiquadFilter();
        filt.type = 'lowpass';
        filt.frequency.value = 1600;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(0.09, time + 0.18);
        g.gain.linearRampToValueAtTime(0.07, time + 0.5);
        g.gain.exponentialRampToValueAtTime(0.0001, time + 0.95);
        osc.connect(filt); filt.connect(g); g.connect(master);
        vibrato.start(time); vibrato.stop(time + 1);
        osc.start(time); osc.stop(time + 1);
      }
      function scheduleFlutePhrase() {
        var t0 = ctx.currentTime + 0.1;
        var notes = 3 + Math.floor(Math.random() * 4);
        for (var i = 0; i < notes; i++) {
          var semis = FLUTE_SCALE[Math.floor(Math.random() * FLUTE_SCALE.length)];
          var freq = FLUTE_ROOT * Math.pow(2, semis / 12);
          playFlute(freq, t0);
          t0 += 0.6 + Math.random() * 0.5;
        }
        var nextDelay = (6000 + Math.random() * 6000);
        timers.push(setTimeout(scheduleFlutePhrase, nextDelay));
      }
      timers.push(setTimeout(scheduleFlutePhrase, 1500));
    }

    /* ---- Track: 'vicecity' — 80s Miami synthwave (original composition, not the actual game theme) ---- */
    function startViceCity() {
      var BPM = 112;
      var stepDur = 60 / BPM / 4;
      var rootsHz = [110.0, 87.31, 130.81, 98.0]; // A2 - F2 - C3 - G2
      var barLen = 16;
      var arpPattern = [0, 7, 12, 7, 3, 7, 12, 7];
      var step = 0;

      function kick(t) {
        var osc = ctx.createOscillator();
        osc.type = 'sine';
        var g = ctx.createGain();
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        g.gain.setValueAtTime(0.5, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(g); g.connect(master);
        osc.start(t); osc.stop(t + 0.3);
      }
      function clap(t) {
        var src = ctx.createBufferSource();
        src.buffer = noiseBuffer(ctx, 0.2, 3);
        var filt = ctx.createBiquadFilter();
        filt.type = 'bandpass';
        filt.frequency.value = 1500;
        filt.Q.value = 0.8;
        var g = ctx.createGain();
        g.gain.value = 0.2;
        src.connect(filt); filt.connect(g); g.connect(master);
        src.start(t);
      }
      function hat(t, accent) {
        var src = ctx.createBufferSource();
        src.buffer = noiseBuffer(ctx, 0.05, 2);
        var filt = ctx.createBiquadFilter();
        filt.type = 'highpass';
        filt.frequency.value = 7000;
        var g = ctx.createGain();
        g.gain.value = accent ? 0.1 : 0.05;
        src.connect(filt); filt.connect(g); g.connect(master);
        src.start(t);
      }
      function bassNote(freq, t, dur) {
        var osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        var filt = ctx.createBiquadFilter();
        filt.type = 'lowpass';
        filt.frequency.value = 400;
        filt.Q.value = 2;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.18, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(filt); filt.connect(g); g.connect(master);
        osc.start(t); osc.stop(t + dur + 0.05);
      }
      function leadNote(freq, t, dur) {
        var osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = freq;
        var osc2 = ctx.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.value = freq * 1.003;
        var filt = ctx.createBiquadFilter();
        filt.type = 'lowpass';
        filt.frequency.value = 2200;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.1, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(filt); osc2.connect(filt); filt.connect(g); g.connect(master);
        osc.start(t); osc.stop(t + dur + 0.05);
        osc2.start(t); osc2.stop(t + dur + 0.05);
      }

      function tick() {
        var t = ctx.currentTime + 0.03;
        var bar = Math.floor(step / barLen) % rootsHz.length;
        var posInBar = step % barLen;
        var root = rootsHz[bar];

        if (posInBar === 0 || posInBar === 8) kick(t);
        if (posInBar === 4 || posInBar === 12) clap(t);
        if (posInBar % 2 === 0) hat(t, posInBar % 4 === 0);
        if (posInBar % 4 === 0) bassNote(root / 2, t, stepDur * 4 * 0.9);
        if (posInBar % 2 === 0) {
          var idx = (posInBar / 2) % arpPattern.length;
          var freq = root * 2 * Math.pow(2, arpPattern[idx] / 12);
          leadNote(freq, t, stepDur * 2 * 0.85);
        }
        step++;
      }
      timers.push(setInterval(tick, stepDur * 1000));
    }

    var STARTERS = {
      egyptian: startEgyptian,
      'egyptian-ambient': startEgyptianAmbient,
      vicecity: startViceCity
    };

    function startTickerWhenRunning() {
      if (tickerStarted) return;
      ensureCtx();
      ctx.resume().then(function () {
        if (tickerStarted || !playing || ctx.state !== 'running') return;
        tickerStarted = true;
        (STARTERS[kind] || startEgyptian)();
      }).catch(function () {});
    }

    function play() {
      if (playing) return;
      playing = true;
      startTickerWhenRunning();
    }
    function pause() {
      if (!playing) return;
      playing = false;
      stopAll();
    }
    function wake() {
      if (playing) startTickerWhenRunning();
    }
    function toggle() {
      if (playing) pause(); else play();
      return playing;
    }

    return { play: play, pause: pause, wake: wake, toggle: toggle, isPlaying: function () { return playing; } };
  }

  /* ---- YouTube-embedded track (official iframe player, looped) ---- */
  function loadYouTubeAPI() {
    if (global.__ytApiPromise) return global.__ytApiPromise;
    global.__ytApiPromise = new Promise(function (resolve) {
      if (global.YT && global.YT.Player) { resolve(global.YT); return; }
      var prevCallback = global.onYouTubeIframeAPIReady;
      global.onYouTubeIframeAPIReady = function () {
        if (typeof prevCallback === 'function') prevCallback();
        resolve(global.YT);
      };
      var tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    });
    return global.__ytApiPromise;
  }

  function createYouTubeMusic(videoId) {
    var player = null, playerPromise = null, playing = false, muted = true;
    var containerId = 'ytMusic_' + videoId;

    function ensurePlayer() {
      if (playerPromise) return playerPromise;
      playerPromise = loadYouTubeAPI().then(function (YT) {
        return new Promise(function (resolve) {
          var container = document.createElement('div');
          container.id = containerId;
          container.style.cssText = 'position:fixed;bottom:0;left:0;width:2px;height:2px;opacity:0;pointer-events:none;overflow:hidden;';
          document.body.appendChild(container);
          player = new YT.Player(containerId, {
            // Starts muted so the browser allows autoplay; wake() unmutes on the visitor's first interaction.
            videoId: videoId,
            playerVars: { autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0, loop: 1, playlist: videoId, playsinline: 1 },
            events: {
              onReady: function (e) { e.target.setVolume(60); resolve(e.target); }
            }
          });
        });
      });
      return playerPromise;
    }

    function play() {
      if (playing) return;
      playing = true;
      ensurePlayer().then(function (p) { p.playVideo(); });
    }
    function pause() {
      if (!playing) return;
      playing = false;
      if (player) player.pauseVideo();
    }
    function wake() {
      if (!playing || !muted) return;
      muted = false;
      ensurePlayer().then(function (p) { p.unMute(); p.setVolume(60); });
    }
    function toggle() {
      if (playing) pause(); else play();
      return playing;
    }

    return { play: play, pause: pause, wake: wake, toggle: toggle, isPlaying: function () { return playing; } };
  }

  function initMusic(opts) {
    opts = opts || {};
    var kind = opts.kind || 'egyptian';
    var label = opts.label || 'Egyptian Vibes';
    var icon = opts.icon || '🎵';
    var storageKey = 'siteMusicPref:' + (opts.youtubeId || kind);
    injectStyles();
    var music = opts.youtubeId ? createYouTubeMusic(opts.youtubeId) : createMusicEngine(kind);

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

  /* Back-compat: pages from the previous version call initEgyptianMusic() directly. */
  function initEgyptianMusic() {
    return initMusic({ kind: 'egyptian', label: 'Egyptian Vibes', icon: '🏺' });
  }

  global.SiteShared = {
    siteBase: siteBase,
    injectViewModeSwitcher: injectViewModeSwitcher,
    initMusic: initMusic,
    initEgyptianMusic: initEgyptianMusic
  };
})(window);
