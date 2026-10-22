import { SCENE_CONFIG } from './config.js';
import { Environment } from './environment.js';

/**
 * One-way opening scene. onOpenComplete runs exactly once, after the hinge settles.
 * A bubbling `album:opened` CustomEvent offers a framework-independent handoff.
 */
export class OpeningScene {
  constructor(root, { onOpenComplete = () => {}, config = SCENE_CONFIG } = {}) {
    if (!root) throw new Error('OpeningScene needs a root element.');
    this.root = root;
    this.config = config;
    this.onOpenComplete = onOpenComplete;
    this.state = 'idle';
    this.disposed = false;
    this.controller = new AbortController();
    this.signal = this.controller.signal;
    this.album = root.querySelector('#album');
    this.cta = root.querySelector('#open-button');
    this.label = root.querySelector('#button-label');
    this.hint = root.querySelector('#interaction-hint');
    this.status = root.querySelector('#scene-status');
    this.motionButton = root.querySelector('#motion-toggle');
    this.motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    this.pointerQuery = matchMedia('(hover: hover) and (pointer: fine)');
    this.userPaused = false;
    this.autoPaused = false;
    this.lowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4) || navigator.connection?.saveData;
    root.classList.toggle('is-low-power', !!this.lowPower);
    root.style.setProperty('--opening-duration', `${config.openingMs}ms`);
    this.environment = new Environment(root, config, { compact: matchMedia('(max-width: 767px)').matches, lowPower: this.lowPower });
    this.bindEvents();
    this.updateMotion();
    this.syncVisibility();
  }

  bindEvents() {
    const options = { signal: this.signal };
    this.album.addEventListener('click', () => this.open(), options);
    this.cta.addEventListener('click', () => this.open(), options);
    this.album.addEventListener('pointermove', event => this.tilt(event), options);
    this.album.addEventListener('pointerleave', () => this.resetTilt(), options);
    this.album.addEventListener('blur', () => this.resetTilt(), options);
    this.motionButton.addEventListener('click', () => {
      this.userPaused = !this.userPaused;
      this.updateMotion();
    }, options);
    this.root.addEventListener('focusin', event => {
      if (event.target === this.album || event.target === this.cta) {
        this.autoPaused = true;
        this.updateMotion();
      }
    }, options);
    this.root.addEventListener('focusout', event => {
      if (event.relatedTarget !== this.album && event.relatedTarget !== this.cta) {
        this.autoPaused = false;
        this.updateMotion();
      }
    }, options);
    this.motionQuery.addEventListener('change', () => {
      this.updateMotion();
      if (this.motionQuery.matches && this.state === 'opening') this.finishOpening();
    }, options);
    document.addEventListener('visibilitychange', () => this.syncVisibility(), options);
    // transitionend is the primary completion signal, with a visible-time fallback.
    this.root.querySelector('#front-cover').addEventListener('transitionend', event => {
      if (event.propertyName === 'transform' && this.state === 'opening' && !document.hidden) this.finishOpening();
    }, options);
  }

  get motionPaused() { return this.userPaused || this.motionQuery.matches; }

  updateMotion() {
    this.root.classList.toggle('is-paused', this.motionPaused || this.autoPaused);
    this.motionButton.setAttribute('aria-pressed', String(this.motionPaused));
    this.motionButton.setAttribute('aria-label', this.motionQuery.matches ? 'Hệ thống đang bật chế độ giảm chuyển động' : this.motionPaused ? 'Tiếp tục chuyển động' : 'Tạm dừng chuyển động');
    this.motionButton.querySelector('span').textContent = this.motionQuery.matches ? 'Giảm chuyển động' : this.motionPaused ? 'Tiếp tục' : 'Tạm dừng';
    this.motionButton.disabled = this.motionQuery.matches;
    if (this.motionPaused || this.autoPaused) this.resetTilt();
  }

  syncVisibility() {
    this.root.classList.toggle('is-hidden', document.hidden);
    // Freeze CSS transitions too; opening cannot complete behind a hidden tab.
    for (const animation of this.root.getAnimations({ subtree: true })) {
      if (animation.constructor.name !== 'CSSTransition') continue;
      if (document.hidden) animation.pause();
      else if (animation.playState === 'paused') animation.play();
    }
    if (this.state === 'opening') {
      if (document.hidden) {
        clearTimeout(this.completionTimer);
        this.remainingMs = Math.max(0, this.remainingMs - (performance.now() - this.visibleSince));
      } else {
        this.visibleSince = performance.now();
        this.completionTimer = setTimeout(() => this.finishOpening(), this.remainingMs);
      }
    }
  }

  tilt(event) {
    if (this.state !== 'idle' || this.motionPaused || this.autoPaused || !this.pointerQuery.matches || event.pointerType === 'touch') return;
    const bounds = this.root.querySelector('#album-stage').getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - bounds.left - bounds.width / 2) / (bounds.width / 2)));
    const y = Math.max(-1, Math.min(1, (event.clientY - bounds.top - bounds.height / 2) / (bounds.height / 2)));
    this.album.style.setProperty('--pointer-x', `${-y * this.config.pointerTiltX}deg`);
    this.album.style.setProperty('--pointer-y', `${x * this.config.pointerTiltY}deg`);
  }

  resetTilt() {
    this.album.style.setProperty('--pointer-x', '0deg');
    this.album.style.setProperty('--pointer-y', '0deg');
  }

  open() {
    if (this.state !== 'idle' || this.disposed) return false;
    this.state = 'opening';
    this.resetTilt();
    // A manual pause also chooses the simplified opening; ambient pause stays intact.
    const simplified = this.motionPaused;
    if (simplified) this.root.classList.add('is-simplified');
    this.root.dataset.state = 'opening';
    this.album.disabled = true;
    this.cta.disabled = true;
    this.album.setAttribute('aria-expanded', 'true');
    this.root.setAttribute('aria-busy', 'true');
    this.label.textContent = 'Câu chuyện đang khẽ mở…';
    this.hint.textContent = 'Một chút phép màu, dành riêng cho chúng ta';
    this.status.textContent = 'Đang mở cuốn album.';
    if (!simplified) this.environment.burst();
    this.remainingMs = simplified ? this.config.reducedOpeningMs : this.config.openingMs;
    this.visibleSince = performance.now();
    if (!document.hidden) this.completionTimer = setTimeout(() => this.finishOpening(), this.remainingMs);
    return true;
  }

  finishOpening() {
    if (this.state !== 'opening' || this.disposed || document.hidden) return;
    clearTimeout(this.completionTimer);
    this.state = 'opened';
    this.root.dataset.state = 'opened';
    this.root.setAttribute('aria-busy', 'false');
    this.label.textContent = 'Và câu chuyện bắt đầu';
    this.hint.textContent = 'Trang đầu tiên, dành riêng cho chúng ta';
    this.status.textContent = 'Album đã mở. Câu chuyện của chúng mình đã sẵn sàng.';
    // Keep focus on a meaningful, stable landmark after disabling the trigger.
    this.status.tabIndex = -1;
    this.status.focus({ preventScroll: true });
    const detail = Object.freeze({ scene: this, album: this.album });
    this.root.dispatchEvent(new CustomEvent('album:opened', { bubbles: true, detail }));
    this.onOpenComplete(detail);
  }

  destroy() {
    this.disposed = true;
    this.controller.abort();
    clearTimeout(this.completionTimer);
    this.environment.destroy();
  }
}
