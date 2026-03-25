export function createAudioController({
  triggerHaptic = () => {},
  musicDataPath = './music-data.json',
  mediaBasePath = ''
} = {}) {
  let soundEnabled = false;
  let audioContext = null;
  let musicEnabled = false;
  let backgroundMusicPlayer = null;
  let backgroundMusicIndex = 0;
  let musicInteractionBindingAdded = false;
  let musicInteractionStartHandler = null;
  let musicVisibilityStartHandler = null;
  let musicPillTitleEl = null;
  let musicPillToggleBtn = null;
  let musicVolume = 0.18;
  let backgroundMusicTracks = [];
  const stateListeners = new Set();

  function emitStateChange() {
    const currentTrack = backgroundMusicTracks[backgroundMusicIndex];
    const state = {
      musicEnabled,
      musicVolume,
      currentTrackTitle: musicEnabled && currentTrack ? currentTrack.title : 'Music Off'
    };

    stateListeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        console.warn('Audio state listener failed:', error);
      }
    });
  }

  function resolveMediaSource(src) {
    if (typeof src !== 'string') return '';
    const trimmed = src.trim();
    if (!trimmed) return '';
    if (/^(?:[a-z]+:)?\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
      return trimmed;
    }

    if (!mediaBasePath) {
      return trimmed;
    }

    try {
      return new URL(trimmed, mediaBasePath).href;
    } catch (error) {
      return trimmed;
    }
  }

  function normalizeTrackSource(rawSource) {
    if (typeof rawSource === 'string') {
      const src = resolveMediaSource(rawSource);
      if (!src) return null;
      return { src, type: '' };
    }

    if (!rawSource || typeof rawSource !== 'object') return null;
    const src = resolveMediaSource(typeof rawSource.src === 'string' ? rawSource.src : '');
    if (!src) return null;
    const type = typeof rawSource.type === 'string' ? rawSource.type.trim() : '';
    return { src, type };
  }

  function inferMimeTypeFromSource(src) {
    if (typeof src !== 'string') return '';
    const path = src.split('?')[0].split('#')[0].toLowerCase();
    if (path.endsWith('.mp3')) return 'audio/mpeg';
    if (path.endsWith('.ogg')) return 'audio/ogg';
    if (path.endsWith('.opus')) return 'audio/ogg; codecs=opus';
    if (path.endsWith('.m4a')) return 'audio/mp4';
    if (path.endsWith('.aac')) return 'audio/aac';
    if (path.endsWith('.wav')) return 'audio/wav';
    return '';
  }

  function normalizeMusicTracks(rawTracks) {
    if (!Array.isArray(rawTracks)) return [];

    return rawTracks
      .map((track) => {
        if (!track || typeof track !== 'object') return null;
        const src = typeof track.src === 'string' ? track.src.trim() : '';
        const title = typeof track.title === 'string' ? track.title.trim() : '';
        if (!title) return null;

        const normalizedSources = [];
        const pushSource = (candidate) => {
          const normalized = normalizeTrackSource(candidate);
          if (!normalized) return;
          if (!normalizedSources.some((source) => source.src === normalized.src)) {
            normalizedSources.push(normalized);
          }
        };

        // Backward-compatible: existing schema uses a single `src`.
        if (src) {
          pushSource(src);
        }

        // New optional schemas for format fallback support.
        if (Array.isArray(track.sources)) {
          track.sources.forEach(pushSource);
        }
        pushSource(track.ogg);
        pushSource(track.mp3);
        pushSource(track.srcOgg);
        pushSource(track.srcMp3);

        if (normalizedSources.length === 0) return null;
        return { title, sources: normalizedSources };
      })
      .filter(Boolean);
  }

  async function loadMusicData() {
    try {
      const response = await fetch(musicDataPath);
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
        .catch((error) => {
          console.warn('Sound effect resume failed:', error);
        });
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

    emitStateChange();
  }

  function ensureBackgroundMusicPlayer() {
    if (backgroundMusicPlayer) {
      return backgroundMusicPlayer;
    }

    const player = new Audio();
    player.preload = 'auto';
    player.loop = false;
    player.muted = false;
    player.volume = musicVolume;
    player.addEventListener('error', () => {
      const mediaError = player.error;
      console.error('Background music media error:', {
        code: mediaError?.code ?? null,
        message: mediaError?.message ?? 'unknown',
        src: player.currentSrc || player.src || null
      });
    });
    player.addEventListener('ended', () => {
      if (!musicEnabled) return;
      backgroundMusicIndex = (backgroundMusicIndex + 1) % backgroundMusicTracks.length;
      startBackgroundMusic(true);
    });
    player.addEventListener('playing', () => {
      // Playback finally started; no need to keep activation listeners around.
      unbindMusicStartOnInteraction();
    });

    backgroundMusicPlayer = player;
    return backgroundMusicPlayer;
  }

  function bindMusicStartOnInteraction() {
    if (musicInteractionBindingAdded) return;
    musicInteractionBindingAdded = true;

    musicInteractionStartHandler = () => {
      if (!musicEnabled) return;
      startBackgroundMusic(true);
    };

    musicVisibilityStartHandler = () => {
      if (!musicEnabled) return;
      if (document.visibilityState === 'visible') {
        startBackgroundMusic(true);
      }
    };

    // Keep listeners active until playback succeeds; some browsers need a very
    // specific user-activation event and can reject earlier attempts.
    window.addEventListener('pointerdown', musicInteractionStartHandler, { passive: true });
    window.addEventListener('click', musicInteractionStartHandler, { passive: true });
    window.addEventListener('keydown', musicInteractionStartHandler);
    window.addEventListener('touchstart', musicInteractionStartHandler, { passive: true });
    window.addEventListener('focus', musicInteractionStartHandler);
    document.addEventListener('visibilitychange', musicVisibilityStartHandler);
  }

  function unbindMusicStartOnInteraction() {
    if (!musicInteractionBindingAdded) return;
    if (musicInteractionStartHandler) {
      window.removeEventListener('pointerdown', musicInteractionStartHandler);
      window.removeEventListener('click', musicInteractionStartHandler);
      window.removeEventListener('keydown', musicInteractionStartHandler);
      window.removeEventListener('touchstart', musicInteractionStartHandler);
      window.removeEventListener('focus', musicInteractionStartHandler);
      musicInteractionStartHandler = null;
    }
    if (musicVisibilityStartHandler) {
      document.removeEventListener('visibilitychange', musicVisibilityStartHandler);
      musicVisibilityStartHandler = null;
    }
    musicInteractionBindingAdded = false;
  }

  function startBackgroundMusic(keepCurrentTrack = false) {
    if (!musicEnabled || backgroundMusicTracks.length === 0) return;

    const player = ensureBackgroundMusicPlayer();

    if (!keepCurrentTrack && player.paused) {
      backgroundMusicIndex = Math.floor(Math.random() * backgroundMusicTracks.length);
    }

    const resolvePlayableTrack = (startIndex) => {
      for (let offset = 0; offset < backgroundMusicTracks.length; offset += 1) {
        const index = (startIndex + offset) % backgroundMusicTracks.length;
        const track = backgroundMusicTracks[index];
        const playableSource = track.sources.find((source) => {
          const mimeType = source.type || inferMimeTypeFromSource(source.src);
          if (!mimeType) return true;
          const support = player.canPlayType(mimeType);
          return support === 'probably' || support === 'maybe';
        });

        if (playableSource) {
          return { index, track, source: playableSource };
        }
      }

      return null;
    };

    const resolvedTrack = resolvePlayableTrack(backgroundMusicIndex);
    if (!resolvedTrack) {
      console.error('No playable background music source found for current browser.', {
        tracks: backgroundMusicTracks.map((track) => ({
          title: track.title,
          sources: track.sources
        }))
      });
      return;
    }

    backgroundMusicIndex = resolvedTrack.index;
    const nextSrc = resolvedTrack.source.src;
    const absoluteNextSrc = new URL(nextSrc, window.location.href).href;

    if (player.src !== absoluteNextSrc) {
      player.src = nextSrc;
    }

    player.play()
      .then(() => {
        unbindMusicStartOnInteraction();
      })
      .catch((error) => {
        console.warn('Background music play blocked or failed; waiting for user interaction.', {
          error,
          src: nextSrc,
          track: resolvedTrack.track.title
        });
        bindMusicStartOnInteraction();
      });

    updateMusicPillUI();
  }

  function stopBackgroundMusic() {
    if (!backgroundMusicPlayer) return;
    backgroundMusicPlayer.pause();
    unbindMusicStartOnInteraction();
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
    initMusicPill();

    if (!toggle && !settingsToggle && !musicPillToggleBtn) return;

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

  function getCurrentTrackTitle() {
    const currentTrack = backgroundMusicTracks[backgroundMusicIndex];
    return musicEnabled && currentTrack ? currentTrack.title : 'Music Off';
  }

  function getMusicEnabled() {
    return musicEnabled;
  }

  function getSoundEnabled() {
    return soundEnabled;
  }

  function getMusicVolume() {
    return musicVolume;
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') {
      return () => {};
    }
    stateListeners.add(listener);
    emitStateChange();
    return () => {
      stateListeners.delete(listener);
    };
  }

  function nextTrack({ withFeedback = true } = {}) {
    if (backgroundMusicTracks.length === 0) return;
    if (!musicEnabled) {
      setMusicEnabled(true, { withFeedback: false });
    }
    backgroundMusicIndex = (backgroundMusicIndex + 1) % backgroundMusicTracks.length;
    startBackgroundMusic(true);
    if (withFeedback) {
      playSound('click');
      triggerHaptic('light');
    }
  }

  return {
    loadMusicData,
    initSoundToggle,
    setSoundEnabled,
    initMusicToggle,
    setMusicEnabled,
    setMusicVolume,
    playSound,
    nextTrack,
    getCurrentTrackTitle,
    getMusicEnabled,
    getSoundEnabled,
    getMusicVolume,
    subscribe
  };
}
