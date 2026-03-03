export function createAudioController({ triggerHaptic = () => {} } = {}) {
  let soundEnabled = false;
  let audioContext = null;
  let musicEnabled = false;
  let backgroundMusicPlayer = null;
  let backgroundMusicIndex = 0;
  let musicInteractionBindingAdded = false;
  let musicPillTitleEl = null;
  let musicPillToggleBtn = null;
  let musicVolume = 0.18;
  let backgroundMusicTracks = [];

  function normalizeMusicTracks(rawTracks) {
    if (!Array.isArray(rawTracks)) return [];

    return rawTracks
      .map((track) => {
        if (!track || typeof track !== 'object') return null;
        const src = typeof track.src === 'string' ? track.src.trim() : '';
        const title = typeof track.title === 'string' ? track.title.trim() : '';
        if (!src || !title) return null;
        return { src, title };
      })
      .filter(Boolean);
  }

  async function loadMusicData() {
    try {
      const response = await fetch('./music-data.json');
      if (!response.ok) {
        throw new Error(`Failed to load music data: ${response.status}`);
      }

      const rawData = await response.json();
      const trackData = Array.isArray(rawData) ? rawData : rawData?.tracks;
      const normalized = normalizeMusicTracks(trackData);
      backgroundMusicTracks = normalized;
    } catch (error) {
      console.error('Failed to load music-data.json:', error);
      backgroundMusicTracks = [];
    }
  }

  function clampMusicVolume(value) {
    if (!Number.isFinite(value)) return 0.18;
    return Math.min(1, Math.max(0, value));
  }

  function playSound(type) {
    if (!soundEnabled) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioContext) {
      audioContext = new AudioCtx();
    }

    const schedulePlayback = () => {
      if (!audioContext || audioContext.state !== 'running') return;

      const now = audioContext.currentTime;
      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      gain.connect(audioContext.destination);

      const playTone = (frequency, start, duration) => {
        const osc = audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, start);
        osc.connect(gain);
        osc.start(start);
        osc.stop(start + duration);
      };

      if (type === 'success') {
        playTone(640, now, 0.12);
        playTone(880, now + 0.12, 0.12);
      } else if (type === 'toggle') {
        playTone(520, now, 0.12);
      } else {
        playTone(420, now, 0.1);
      }
    };

    if (audioContext.state !== 'running') {
      audioContext
        .resume()
        .then(schedulePlayback)
        .catch(() => {});
      return;
    }

    schedulePlayback();
  }

  function updateMusicPillUI() {
    if (musicPillTitleEl) {
      const currentTrack = backgroundMusicTracks[backgroundMusicIndex];
      musicPillTitleEl.textContent = musicEnabled && currentTrack ? currentTrack.title : 'Music Off';
    }

    if (musicPillToggleBtn) {
      musicPillToggleBtn.textContent = musicEnabled ? '⏸' : '▶';
      musicPillToggleBtn.setAttribute('aria-pressed', String(musicEnabled));
    }

    const settingsVolumeIcon = document.getElementById('settings-volume-icon');
    if (settingsVolumeIcon) {
      if (musicVolume <= 0.001) {
        settingsVolumeIcon.textContent = '🔇';
      } else if (musicVolume < 0.5) {
        settingsVolumeIcon.textContent = '🔉';
      } else {
        settingsVolumeIcon.textContent = '🔊';
      }
    }
  }

  function ensureBackgroundMusicPlayer() {
    if (backgroundMusicPlayer) {
      return backgroundMusicPlayer;
    }

    const player = new Audio();
    player.preload = 'auto';
    player.loop = false;
    player.volume = musicVolume;
    player.addEventListener('ended', () => {
      if (!musicEnabled) return;
      backgroundMusicIndex = (backgroundMusicIndex + 1) % backgroundMusicTracks.length;
      startBackgroundMusic(true);
    });

    backgroundMusicPlayer = player;
    return backgroundMusicPlayer;
  }

  function bindMusicStartOnInteraction() {
    if (musicInteractionBindingAdded) return;
    musicInteractionBindingAdded = true;

    const startOnInteraction = () => {
      if (!musicEnabled) return;
      startBackgroundMusic(true);
      window.removeEventListener('pointerdown', startOnInteraction);
      window.removeEventListener('keydown', startOnInteraction);
      window.removeEventListener('touchstart', startOnInteraction);
      musicInteractionBindingAdded = false;
    };

    window.addEventListener('pointerdown', startOnInteraction, { once: true });
    window.addEventListener('keydown', startOnInteraction, { once: true });
    window.addEventListener('touchstart', startOnInteraction, { once: true, passive: true });
  }

  function startBackgroundMusic(keepCurrentTrack = false) {
    if (!musicEnabled || backgroundMusicTracks.length === 0) return;

    const player = ensureBackgroundMusicPlayer();

    if (!keepCurrentTrack && player.paused) {
      backgroundMusicIndex = Math.floor(Math.random() * backgroundMusicTracks.length);
    }

    const nextTrack = backgroundMusicTracks[backgroundMusicIndex];
    const nextSrc = nextTrack.src;
    const absoluteNextSrc = new URL(nextSrc, window.location.href).href;

    if (player.src !== absoluteNextSrc) {
      player.src = nextSrc;
    }

    player.play().catch(() => {
      bindMusicStartOnInteraction();
    });

    updateMusicPillUI();
  }

  function stopBackgroundMusic() {
    if (!backgroundMusicPlayer) return;
    backgroundMusicPlayer.pause();
    updateMusicPillUI();
  }

  function setMusicVolume(nextVolume, { persist = true } = {}) {
    musicVolume = clampMusicVolume(nextVolume);

    if (persist) {
      localStorage.setItem('sw_music_volume', String(musicVolume));
    }

    if (backgroundMusicPlayer) {
      backgroundMusicPlayer.volume = musicVolume;
    }

    const settingsSlider = document.getElementById('settings-music-volume');
    if (settingsSlider) {
      settingsSlider.value = String(Math.round(musicVolume * 100));
    }

    updateMusicPillUI();
  }

  function setMusicEnabled(enabled, { withFeedback = false, persist = true } = {}) {
    musicEnabled = enabled;
    if (persist) {
      localStorage.setItem('sw_music_enabled', String(musicEnabled));
    }

    const toggle = document.getElementById('music-toggle');
    if (toggle) {
      toggle.checked = musicEnabled;
    }

    const settingsToggle = document.getElementById('settings-music-toggle');
    if (settingsToggle) {
      settingsToggle.checked = musicEnabled;
    }

    if (musicEnabled) {
      startBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }

    updateMusicPillUI();

    if (withFeedback) {
      playSound('toggle');
      triggerHaptic('light');
    }
  }

  function initMusicPill() {
    musicPillTitleEl = document.getElementById('music-pill-title');
    musicPillToggleBtn = document.getElementById('music-pill-toggle');
    const nextButton = document.getElementById('music-pill-next');

    if (musicPillToggleBtn) {
      musicPillToggleBtn.addEventListener('click', () => {
        setMusicEnabled(!musicEnabled, { withFeedback: true });
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => {
        if (backgroundMusicTracks.length === 0) return;
        if (!musicEnabled) {
          setMusicEnabled(true, { withFeedback: false });
        }
        backgroundMusicIndex = (backgroundMusicIndex + 1) % backgroundMusicTracks.length;
        startBackgroundMusic(true);
        playSound('click');
        triggerHaptic('light');
      });
    }

    updateMusicPillUI();
  }

  function initSoundToggle() {
    const mainToggle = document.getElementById('sound-toggle');
    const settingsToggle = document.getElementById('settings-sound-toggle');
    if (!mainToggle && !settingsToggle) return;
    const stored = localStorage.getItem('sw_sound_enabled');
    soundEnabled = stored === 'true';
    setSoundEnabled(soundEnabled, { withFeedback: false, persist: false });

    if (mainToggle) {
      mainToggle.addEventListener('change', () => {
        setSoundEnabled(mainToggle.checked, { withFeedback: true });
      });
    }

    if (settingsToggle) {
      settingsToggle.addEventListener('change', () => {
        setSoundEnabled(settingsToggle.checked, { withFeedback: true });
      });
    }
  }

  function setSoundEnabled(enabled, { withFeedback = false, persist = true } = {}) {
    soundEnabled = enabled;

    if (persist) {
      localStorage.setItem('sw_sound_enabled', String(soundEnabled));
    }

    const mainToggle = document.getElementById('sound-toggle');
    if (mainToggle) {
      mainToggle.checked = soundEnabled;
    }

    const settingsToggle = document.getElementById('settings-sound-toggle');
    if (settingsToggle) {
      settingsToggle.checked = soundEnabled;
    }

    if (withFeedback) {
      playSound('toggle');
      triggerHaptic('light');
    }
  }

  function initMusicToggle() {
    const toggle = document.getElementById('music-toggle');
    const settingsToggle = document.getElementById('settings-music-toggle');
    const settingsMusicVolume = document.getElementById('settings-music-volume');
    if (!toggle && !settingsToggle) return;

    initMusicPill();

    const stored = localStorage.getItem('sw_music_enabled');
    musicEnabled = stored === null ? true : stored === 'true';
    const storedVolume = Number(localStorage.getItem('sw_music_volume'));
    musicVolume = clampMusicVolume(storedVolume);
    setMusicVolume(musicVolume, { persist: false });
    setMusicEnabled(musicEnabled, { withFeedback: false, persist: false });

    if (toggle) {
      toggle.addEventListener('change', () => {
        setMusicEnabled(toggle.checked, { withFeedback: true });
      });
    }

    if (settingsToggle) {
      settingsToggle.addEventListener('change', () => {
        setMusicEnabled(settingsToggle.checked, { withFeedback: true });
      });
    }

    if (settingsMusicVolume) {
      settingsMusicVolume.addEventListener('input', () => {
        setMusicVolume(Number(settingsMusicVolume.value) / 100);
      });
    }
  }

  return {
    loadMusicData,
    initSoundToggle,
    setSoundEnabled,
    initMusicToggle,
    setMusicEnabled,
    setMusicVolume,
    playSound
  };
}
