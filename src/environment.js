/** Decorative layers stay independent of the album's state machine. */
export class Environment {
  constructor(root, config, { compact, lowPower }) {
    this.root = root;
    this.config = config;
    this.petalLayer = root.querySelector('#petals');
    this.dustLayer = root.querySelector('#magic-particles');
    const tier = lowPower ? 'lowPower' : compact ? 'mobile' : 'desktop';
    this.createPetals(config.petals[tier]);
    this.createDust(config.dust[tier]);
  }

  createPetals(count) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const petal = document.createElement('span');
      petal.className = 'petal';
      // Stable positions give every visit the same, deliberately sparse composition.
      const x = [6, 91, 19, 80, 36, 96, 3, 70, 25, 84, 14, 63, 47][i];
      const size = [16, 25, 12, 19, 9, 32, 22, 11, 18, 14, 26, 10, 12][i];
      const duration = 19 + (i % 5) * 3;
      petal.style.cssText = `--x:${x}%;--size:${size}px;--blur:${size > 24 ? 2 : .2}px;--duration:${duration}s;--delay:${-i * 4.2 - 3}s;--drift:${(i % 2 ? -1 : 1) * (25 + i * 5)}px;--spin:${i % 2 ? 250 : -190}deg;--opacity:${size > 24 ? .36 : .51};`;
      fragment.append(petal);
    }
    this.petalLayer.append(fragment);
  }

  createDust(count) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('span');
      const angle = i * 2.399;
      particle.className = 'particle';
      particle.style.cssText = `--x:${50 + Math.cos(angle) * (27 + i % 4)}%;--y:${48 + Math.sin(angle) * 36}%;--size:${i % 4 === 0 ? 3 : 2}px;--duration:${6 + i % 5}s;--delay:${-i * 1.3}s;--drift:${i % 2 ? 10 : -12}px;`;
      fragment.append(particle);
    }
    this.dustLayer.append(fragment);
  }

  burst() {
    for (let i = 0; i < this.config.burstCount; i++) {
      const particle = document.createElement('span');
      const angle = (i / this.config.burstCount) * Math.PI * 2;
      particle.className = 'burst-particle';
      particle.style.cssText = `--burst-x:${Math.cos(angle) * (110 + i * 5)}px;--burst-y:${Math.sin(angle) * 160 - 30}px;--delay:${.6 + i * .035}s`;
      particle.addEventListener('animationend', () => particle.remove(), { once: true });
      this.dustLayer.append(particle);
    }
  }

  destroy() {
    this.petalLayer.replaceChildren();
    this.dustLayer.replaceChildren();
  }
}
