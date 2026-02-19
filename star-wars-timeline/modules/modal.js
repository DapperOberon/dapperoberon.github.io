export function createModalController({
  getTimelineData,
  hexToRgb,
  getEntryMetaText,
  getMediaTypeInfo,
  playSound,
  triggerHaptic,
  saveWatchedState,
  updateEntryUI,
  resetAllProgress
}) {
  let savedScrollY = 0;
  let currentModalSection = null;
  let currentModalEntry = null;
  let modalKeydownHandler = null;
  let modalPreviouslyFocusedElement = null;

  function releaseModalKeyboardTrap() {
    if (modalKeydownHandler) {
      document.removeEventListener('keydown', modalKeydownHandler);
      modalKeydownHandler = null;
    }
  }

  function trapModalKeyboard(modal) {
    releaseModalKeyboardTrap();

    modalKeydownHandler = (event) => {
      if (!modal || modal.classList.contains('hidden')) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        playSound('click');
        triggerHaptic('light');
        closeModal();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
      ).filter((el) => !el.hasAttribute('hidden') && el.getAttribute('aria-hidden') !== 'true');

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!modal.contains(active)) {
        event.preventDefault();
        first.focus();
        return;
      }

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', modalKeydownHandler);
  }

  function isShowCompleted(entry) {
    if (!entry || entry.episodes <= 1 || !Array.isArray(entry._watchedArray)) return false;
    return entry._watchedArray.every(Boolean);
  }

  function closeResetDialog() {
    const resetDialog = document.getElementById('reset-dialog');
    if (!resetDialog) return;
    resetDialog.classList.add('hidden');
    resetDialog.setAttribute('aria-hidden', 'true');
  }

  function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.textContent = message;

    toastContainer.appendChild(toast);

    const existingToasts = toastContainer.querySelectorAll('.toast');
    if (existingToasts.length > 4) {
      existingToasts[0].remove();
    }

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 220);
    }, 2600);
  }

  function openResetDialog() {
    const resetDialog = document.getElementById('reset-dialog');
    if (!resetDialog) return;

    resetDialog.innerHTML = `
      <div class="reset-dialog-backdrop"></div>
      <div class="reset-dialog-content" role="dialog" aria-modal="true" aria-labelledby="reset-dialog-title" aria-describedby="reset-dialog-description">
        <h2 id="reset-dialog-title">Reset progress?</h2>
        <p id="reset-dialog-description">This will clear all watched progress across the timeline. This action cannot be undone.</p>
        <div class="reset-dialog-actions">
          <button type="button" class="modal-btn modal-btn--ghost modal-close-btn" id="reset-dialog-cancel">Cancel</button>
          <button type="button" class="modal-btn modal-btn--primary modal-primary-btn" id="reset-dialog-confirm">Reset Progress</button>
        </div>
      </div>
    `;

    resetDialog.classList.remove('hidden');
    resetDialog.setAttribute('aria-hidden', 'false');

    const cancelBtn = resetDialog.querySelector('#reset-dialog-cancel');
    const confirmBtn = resetDialog.querySelector('#reset-dialog-confirm');
    const backdrop = resetDialog.querySelector('.reset-dialog-backdrop');

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        closeResetDialog();
      }
    };

    const handleClose = () => {
      document.removeEventListener('keydown', closeOnEscape);
      closeResetDialog();
    };

    if (cancelBtn) cancelBtn.addEventListener('click', handleClose);
    if (backdrop) backdrop.addEventListener('click', handleClose);
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        playSound('success');
        triggerHaptic('success');
        resetAllProgress();
        handleClose();
        showToast('All Watched Progress Has Been Reset.', 'success');
      });
      confirmBtn.focus();
    }

    document.addEventListener('keydown', closeOnEscape);
  }

  function attachResetButton() {
    const resetBtn = document.getElementById('reset-progress-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        playSound('click');
        triggerHaptic('light');
        openResetDialog();
      });
    }
  }

  function openModal(sectionIdx, entryIdx) {
    currentModalSection = sectionIdx;
    currentModalEntry = entryIdx;

    const timelineData = getTimelineData();
    const entry = timelineData[sectionIdx].entries[entryIdx];
    const section = timelineData[sectionIdx];
    const sectionColor = section.color;
    const sectionColorRgb = hexToRgb(sectionColor);
    const modal = document.getElementById('modal');

    const arr = entry._watchedArray || new Array(entry.episodes).fill(false);
    entry._watchedArray = arr;
    const watchedCount = arr.filter(Boolean).length;

    let episodesHTML = '';
    for (let i = 0; i < entry.episodes; i++) {
      const isChecked = Boolean(arr[i]);
      const checked = isChecked ? 'checked' : '';
      const episodeTitle = (entry.episodeDetails && entry.episodeDetails[i] && entry.episodeDetails[i].title) || '';
      const episodeTime = (entry.episodeDetails && entry.episodeDetails[i] && entry.episodeDetails[i].time) || '';
      const episodeTimeText = String(episodeTime).trim() || '—';
      episodesHTML += `
        <div class="episode-item ${isChecked ? 'is-watched' : ''}" data-episode-item="${i}">
          <label>
            <input type="checkbox" data-ep="${i}" ${checked} />
            <span class="episode-title">${episodeTitle}</span>
            <span class="episode-meta">
              <span class="episode-time">${episodeTimeText}</span>
              <span class="episode-status">${isChecked ? 'Watched' : 'Up Next'}</span>
            </span>
          </label>
        </div>
      `;
    }

    const synopsis = entry.synopsis || '';
    const showEpisodes = entry.episodes > 1;
    const progressPercent = entry.episodes > 0 ? Math.round((watchedCount / entry.episodes) * 100) : 0;
    const episodeCountText = showEpisodes ? `${watchedCount}/${entry.episodes} Watched (${progressPercent}%)` : '';
    const remainingCount = showEpisodes ? Math.max(entry.episodes - watchedCount, 0) : 0;
    const remainingText = remainingCount === 0 ? 'All Caught Up' : `${remainingCount} Left`;
    const entryMetaText = getEntryMetaText(entry);
    const mediaTypeInfo = getMediaTypeInfo(entry.type);

    const modalHTML = `
      <div class="modal-backdrop">
        <div class="modal-backdrop-image" style="background-image: url('${entry.poster}');"></div>
      </div>
      <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title" style="--section-color: ${sectionColor}; --section-color-rgb: ${sectionColorRgb};">
        <button class="modal-close" aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="modal-left"><img src="${entry.poster}" alt="${entry.title}"/></div>
        <div class="modal-right">
          <h2 id="modal-title">${entry.title}</h2>
          <div class="modal-meta">
            <span class="modal-meta-text">${mediaTypeInfo.label} • ${entryMetaText}</span>
            <span class="modal-badge ${entry.canon ? 'canon' : 'legends'}">${entry.canon ? 'CANON' : 'LEGENDS'}</span>
          </div>
          ${synopsis ? `<p class="modal-synopsis">${synopsis}</p>` : ''}
          ${showEpisodes ? `
            <div class="modal-episodes">
              <div class="modal-episodes-header">
                <div class="modal-episodes-heading">
                  <span class="modal-episodes-title">Episodes</span>
                  <span id="modal-episode-remaining" class="modal-episodes-remaining">${remainingText}</span>
                </div>
                <span id="modal-episode-count" class="modal-episodes-count">${episodeCountText}</span>
              </div>
              <div class="modal-episodes-progress" aria-hidden="true">
                <span id="modal-episodes-progress-bar" class="modal-episodes-progress-bar" style="width: ${progressPercent}%;"></span>
              </div>
              <div class="episode-list-wrapper"><div class="episode-list">${episodesHTML}</div></div>
            </div>
          ` : ''}
          <div class="modal-actions">
            ${showEpisodes ? `
              <button class="modal-btn modal-btn--secondary modal-secondary-btn" id="mark-next-episode">Mark Next Episode</button>
              <button class="modal-btn modal-btn--primary modal-primary-btn" id="mark-all-watched">Mark All Watched</button>
            ` : ''}
            <button class="modal-btn modal-btn--ghost modal-close-btn">Close</button>
          </div>
        </div>
      </div>
    `;

    modal.innerHTML = modalHTML;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    modalPreviouslyFocusedElement = document.activeElement;
    trapModalKeyboard(modal);

    const modalImg = modal.querySelector('.modal-left img');
    if (modalImg) {
      if (modalImg.complete && modalImg.naturalWidth > 0) {
        modalImg.classList.add('loaded');
      } else {
        modalImg.addEventListener(
          'load',
          () => {
            modalImg.classList.add('loaded');
          },
          { once: true }
        );
        modalImg.addEventListener(
          'error',
          () => {
            modalImg.classList.add('loaded');
          },
          { once: true }
        );
      }
    }

    savedScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.top = `-${savedScrollY}px`;
    document.body.classList.add('modal-open');

    modal.querySelector('.modal-close').addEventListener('click', () => {
      playSound('click');
      triggerHaptic('light');
      closeModal();
    });
    modal.querySelector('.modal-close-btn').addEventListener('click', () => {
      playSound('click');
      triggerHaptic('light');
      closeModal();
    });
    modal.querySelector('.modal-backdrop').addEventListener('click', () => {
      playSound('click');
      triggerHaptic('light');
      closeModal();
    });

    const closeButton = modal.querySelector('.modal-close');
    if (closeButton) {
      requestAnimationFrame(() => {
        closeButton.focus();
      });
    }

    const updateEpisodeRowState = () => {
      modal.querySelectorAll('[data-episode-item]').forEach((item) => {
        const idx = Number(item.dataset.episodeItem);
        const isWatched = Boolean(entry._watchedArray[idx]);
        item.classList.toggle('is-watched', isWatched);
        const statusEl = item.querySelector('.episode-status');
        if (statusEl) {
          statusEl.textContent = isWatched ? 'Watched' : 'Up Next';
        }
      });
    };

    const updateModalCount = () => {
      const updatedCount = entry._watchedArray.filter(Boolean).length;
      const percent = entry.episodes > 0 ? Math.round((updatedCount / entry.episodes) * 100) : 0;
      const remaining = Math.max(entry.episodes - updatedCount, 0);
      const countEl = modal.querySelector('#modal-episode-count');
      if (countEl) {
        countEl.textContent = `${updatedCount}/${entry.episodes} Watched (${percent}%)`;
      }
      const remainingEl = modal.querySelector('#modal-episode-remaining');
      if (remainingEl) {
        remainingEl.textContent = remaining === 0 ? 'All Caught Up' : `${remaining} Left`;
      }
      const progressBarEl = modal.querySelector('#modal-episodes-progress-bar');
      if (progressBarEl) {
        progressBarEl.style.width = `${percent}%`;
      }

      const markAllBtn = modal.querySelector('#mark-all-watched');
      if (markAllBtn) {
        const allChecked = entry._watchedArray.every(Boolean);
        markAllBtn.textContent = allChecked ? 'Unmark All' : 'Mark All Watched';
      }

      const markNextBtn = modal.querySelector('#mark-next-episode');
      if (markNextBtn) {
        const hasUnwatched = updatedCount < entry.episodes;
        markNextBtn.textContent = hasUnwatched ? 'Mark Next Episode' : 'All Watched';
        markNextBtn.disabled = !hasUnwatched;
      }

      updateEpisodeRowState();
    };

    const markAllBtn = modal.querySelector('#mark-all-watched');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', () => {
        playSound('success');
        triggerHaptic('success');
        const wasCompleted = isShowCompleted(entry);
        const allChecked = entry._watchedArray.every(Boolean);
        const newState = !allChecked;

        entry._watchedArray = new Array(entry.episodes).fill(newState);
        modal.querySelectorAll('.episode-item input[type="checkbox"]').forEach((cb, idx) => {
          cb.checked = newState;
          entry._watchedArray[idx] = newState;
        });
        saveWatchedState(entry);
        updateEntryUI(sectionIdx, entryIdx);
        updateModalCount();
        showToast(`${entry.title}: ${newState ? 'Marked All as Watched' : 'Cleared Watched Status'}`, 'success');
        if (!wasCompleted && isShowCompleted(entry)) {
          showToast(`${entry.title} completed!`, 'success');
        }
      });

      updateModalCount();
    }

    const markNextBtn = modal.querySelector('#mark-next-episode');
    if (markNextBtn) {
      markNextBtn.addEventListener('click', () => {
        const nextIdx = entry._watchedArray.findIndex((isWatched) => !isWatched);
        if (nextIdx === -1) {
          playSound('click');
          triggerHaptic('light');
          showToast(`${entry.title}: All Episodes Are Already Watched`, 'info');
          return;
        }
        const wasCompleted = isShowCompleted(entry);
        playSound('success');
        triggerHaptic('success');
        entry._watchedArray[nextIdx] = true;
        const nextCheckbox = modal.querySelector(`input[data-ep="${nextIdx}"]`);
        if (nextCheckbox) {
          nextCheckbox.checked = true;
        }
        saveWatchedState(entry);
        updateEntryUI(sectionIdx, entryIdx);
        updateModalCount();
        if (!wasCompleted && isShowCompleted(entry)) {
          showToast(`${entry.title} completed!`, 'success');
        }
      });
    }

    const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((cb) => {
      cb.addEventListener('change', () => {
        playSound(cb.checked ? 'success' : 'click');
        triggerHaptic(cb.checked ? 'success' : 'light');
        const wasCompleted = isShowCompleted(entry);
        const idx = Number(cb.dataset.ep);
        entry._watchedArray[idx] = cb.checked;
        saveWatchedState(entry);
        updateEntryUI(sectionIdx, entryIdx);
        updateModalCount();
        if (!wasCompleted && isShowCompleted(entry)) {
          showToast(`${entry.title} completed!`, 'success');
        }
      });
    });
  }

  function closeModal() {
    const modal = document.getElementById('modal');
    if (!modal || modal.classList.contains('hidden')) return;

    const scrollY = savedScrollY || 0;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    releaseModalKeyboardTrap();

    document.body.classList.remove('modal-open');
    document.body.style.top = '';
    window.scrollTo(0, scrollY);
    savedScrollY = 0;

    if (currentModalSection !== null && currentModalEntry !== null) {
      updateEntryUI(currentModalSection, currentModalEntry);
    }

    if (modalPreviouslyFocusedElement && typeof modalPreviouslyFocusedElement.focus === 'function') {
      modalPreviouslyFocusedElement.focus({ preventScroll: true });
    }
    modalPreviouslyFocusedElement = null;
  }

  return {
    attachResetButton,
    openResetDialog,
    closeResetDialog,
    openModal,
    closeModal,
    showToast
  };
}
