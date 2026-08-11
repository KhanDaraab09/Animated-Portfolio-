/**
 * Daraab Khan Portfolio - Smooth Canvas Scroll Engine & Nav Sync
 */

(function () {
  'use strict';

  // Constants
  const TOTAL_FRAMES = 210;
  const FRAME_PATH_PREFIX = 'frames/frame';
  const FRAME_EXTENSION = '.png';
  const FRAME_PADDING = 6;
  const LERP_FACTOR = 0.08;

  // DOM Elements
  const canvas = document.getElementById('frame-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const loaderOverlay = document.getElementById('loader');
  const loaderPercent = document.getElementById('loader-percent');
  const loaderFill = document.getElementById('loader-fill');
  const currentFrameText = document.getElementById('current-frame-text');
  const scrollPercentText = document.getElementById('scroll-percent-text');
  const scrollProgressBar = document.getElementById('scroll-progress-bar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id], footer[id]');

  // State
  const images = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  let targetFrameIndex = 0;
  let currentFrameIndex = 0;
  let renderedFrameIndex = -1;
  let isLoaded = false;

  function getFramePath(index) {
    const padded = String(index).padStart(FRAME_PADDING, '0');
    return `${FRAME_PATH_PREFIX}${padded}${FRAME_EXTENSION}`;
  }

  function preloadFrames() {
    return new Promise((resolve) => {
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        const img = new Image();
        const src = getFramePath(i);

        img.onload = () => {
          images[i] = img;
          loadedCount++;
          updateLoaderProgress(loadedCount);
          if (loadedCount === TOTAL_FRAMES) resolve();
        };

        img.onerror = () => {
          console.warn(`Failed to load frame: ${src}`);
          loadedCount++;
          updateLoaderProgress(loadedCount);
          if (loadedCount === TOTAL_FRAMES) resolve();
        };

        img.src = src;
      }
    });
  }

  function updateLoaderProgress(count) {
    const progress = Math.min(Math.floor((count / TOTAL_FRAMES) * 100), 100);
    loaderPercent.textContent = `${progress}%`;
    loaderFill.style.width = `${progress}%`;
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (renderedFrameIndex >= 0 && images[renderedFrameIndex]) {
      renderFrame(renderedFrameIndex);
    }
  }

  function renderFrame(index) {
    const img = images[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const canvasAspect = cw / ch;
    const imgAspect = iw / ih;

    let dw, dh, dx, dy;

    if (canvasAspect > imgAspect) {
      dw = cw;
      dh = cw / imgAspect;
      dx = 0;
      dy = (ch - dh) / 2;
    } else {
      dh = ch;
      dw = ch * imgAspect;
      dx = (cw - dw) / 2;
      dy = 0;
    }

    ctx.fillStyle = '#08080a';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function onScroll() {
    const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    const maxScroll = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      1
    );
    const progress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);

    targetFrameIndex = progress * (TOTAL_FRAMES - 1);

    // Update HUD metrics
    const percentInt = Math.round(progress * 100);
    scrollPercentText.textContent = `${percentInt}%`;
    scrollProgressBar.style.width = `${progress * 100}%`;

    // Active Section Tracking
    let currentSectionId = '';
    sections.forEach((sec) => {
      const secTop = sec.offsetTop - 200;
      const secHeight = sec.offsetHeight;
      if (scrollTop >= secTop && scrollTop < secTop + secHeight) {
        currentSectionId = sec.getAttribute('id');
      }
    });

    if (currentSectionId) {
      navLinks.forEach((link) => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSectionId}`) {
          link.classList.add('active');
        }
      });
    }
  }

  function animationLoop() {
    if (isLoaded) {
      const delta = targetFrameIndex - currentFrameIndex;

      if (Math.abs(delta) > 0.001) {
        currentFrameIndex += delta * LERP_FACTOR;
      } else {
        currentFrameIndex = targetFrameIndex;
      }

      const activeFrameInt = Math.min(
        Math.max(Math.round(currentFrameIndex), 0),
        TOTAL_FRAMES - 1
      );

      if (activeFrameInt !== renderedFrameIndex) {
        renderedFrameIndex = activeFrameInt;
        renderFrame(activeFrameInt);

        if (currentFrameText) {
          const paddedNum = String(activeFrameInt + 1).padStart(3, '0');
          currentFrameText.textContent = `FRAME ${paddedNum}`;
        }
      }
    }

    requestAnimationFrame(animationLoop);
  }

  async function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', onScroll, { passive: true });

    onScroll();
    requestAnimationFrame(animationLoop);

    await preloadFrames();

    setTimeout(() => {
      isLoaded = true;
      loaderOverlay.classList.add('hidden');
      renderFrame(0);
      onScroll();
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
