// Arcade Portal Interaction Controller

document.addEventListener('DOMContentLoaded', () => {
  const gameFrame = document.getElementById('game-frame');
  const screenLoading = document.getElementById('screen-loading');
  const crtOverlay = document.getElementById('crt-overlay');
  const toggleScanlinesBtn = document.getElementById('toggle-scanlines');
  const scanlinesLabel = document.getElementById('scanlines-label');
  const toggleSizeBtn = document.getElementById('toggle-size');
  const sizeModeLabel = document.getElementById('size-mode-label');
  const screenViewport = document.getElementById('screen-viewport');
  const reloadGameBtn = document.getElementById('reload-game-btn');
  const fullscreenGameBtn = document.getElementById('fullscreen-game-btn');
  const arcadeCabinet = document.getElementById('arcade-cabinet');

  // Hide loading overlay once iframe loads
  gameFrame.addEventListener('load', () => {
    setTimeout(() => {
      if (screenLoading) {
        screenLoading.classList.add('hidden');
      }
      // Give focus to iframe for instant keyboard play
      try {
        gameFrame.focus();
        gameFrame.contentWindow.focus();
      } catch (e) {}
    }, 1200);
  });

  // Toggle Scanlines
  let scanlinesOn = false;
  if (toggleScanlinesBtn) {
    toggleScanlinesBtn.addEventListener('click', () => {
      scanlinesOn = !scanlinesOn;
      if (scanlinesOn) {
        crtOverlay.classList.remove('disabled');
        toggleScanlinesBtn.classList.add('active');
        scanlinesLabel.textContent = 'ON';
      } else {
        crtOverlay.classList.add('disabled');
        toggleScanlinesBtn.classList.remove('active');
        scanlinesLabel.textContent = 'OFF';
      }
    });
  }

  // Toggle Size Mode
  let isMaxMode = false;
  if (toggleSizeBtn) {
    toggleSizeBtn.addEventListener('click', () => {
      isMaxMode = !isMaxMode;
      if (isMaxMode) {
        screenViewport.classList.remove('classic-mode');
        screenViewport.classList.add('max-mode');
        sizeModeLabel.textContent = 'Expanded 16:9';
      } else {
        screenViewport.classList.remove('max-mode');
        screenViewport.classList.add('classic-mode');
        sizeModeLabel.textContent = 'Classic 9:16';
      }
    });
  }

  // Reload Game
  if (reloadGameBtn) {
    reloadGameBtn.addEventListener('click', () => {
      if (screenLoading) {
        screenLoading.classList.remove('hidden');
      }
      gameFrame.src = '/game/index.html?t=' + Date.now();
    });
  }

  // Fullscreen
  if (fullscreenGameBtn) {
    fullscreenGameBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        if (screenViewport.requestFullscreen) {
          screenViewport.requestFullscreen();
        } else if (screenViewport.webkitRequestFullscreen) {
          screenViewport.webkitRequestFullscreen();
        } else if (screenViewport.msRequestFullscreen) {
          screenViewport.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    });
  }

  // Auto-focus game iframe on click
  screenViewport.addEventListener('click', () => {
    try {
      gameFrame.focus();
      gameFrame.contentWindow.focus();
    } catch (e) {}
  });
});
