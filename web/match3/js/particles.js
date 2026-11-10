/**
 * 粒子背景系统
 */

const ParticleSystem = (() => {
  const GEM_COLORS = [
    '#ff6b6b', '#667eea', '#43e97b', '#f7971e',
    '#4facfe', '#f093fb', '#c471ed'
  ];

  function init() {
    const container = document.getElementById('particles-bg');
    if (!container) return;

    // 创建背景粒子
    for (let i = 0; i < 25; i++) {
      createParticle(container);
    }
  }

  function createParticle(container) {
    const p = document.createElement('div');
    p.className = 'particle';

    const size = 4 + Math.random() * 8;
    const color = GEM_COLORS[Math.floor(Math.random() * GEM_COLORS.length)];
    const left = Math.random() * 100;
    const duration = 8 + Math.random() * 15;
    const delay = -Math.random() * duration;

    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      left: ${left}%;
      bottom: -10px;
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
      opacity: 0;
      box-shadow: 0 0 ${size}px ${color};
    `;

    container.appendChild(p);
  }

  // 爆炸粒子特效
  function burst(x, y, color, count = 12) {
    const container = document.getElementById('effects-layer') || document.body;
    const boardContainer = document.querySelector('.board-container');
    const rect = boardContainer ? boardContainer.getBoundingClientRect() : { left: 0, top: 0 };

    const localX = x - rect.left;
    const localY = y - rect.top;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      const angle = (i / count) * 360;
      const speed = 40 + Math.random() * 60;
      const size = 4 + Math.random() * 6;

      p.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        left: ${localX}px;
        top: ${localY}px;
        pointer-events: none;
        z-index: 100;
        box-shadow: 0 0 6px ${color};
      `;

      container.appendChild(p);

      const radians = (angle * Math.PI) / 180;
      const vx = Math.cos(radians) * speed;
      const vy = Math.sin(radians) * speed;

      let startTime = null;
      const duration = 600 + Math.random() * 400;

      function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = elapsed / duration;

        if (progress >= 1) {
          p.remove();
          return;
        }

        const eased = 1 - Math.pow(1 - progress, 2);
        const gravity = 100 * progress * progress;

        p.style.transform = `translate(${vx * eased}px, ${vy * eased + gravity}px)`;
        p.style.opacity = 1 - progress;

        requestAnimationFrame(animate);
      }

      requestAnimationFrame(animate);
    }
  }

  // 星星特效
  function stars(x, y, count = 6) {
    const colors = ['#ffd700', '#fff', '#f093fb', '#43e97b'];
    const effectsLayer = document.getElementById('effects-layer');
    if (!effectsLayer) return;

    const boardContainer = document.querySelector('.board-container');
    const rect = boardContainer ? boardContainer.getBoundingClientRect() : { left: 0, top: 0 };
    const localX = x - rect.left;
    const localY = y - rect.top;

    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 6 + Math.random() * 8;

      star.innerHTML = '★';
      star.style.cssText = `
        position: absolute;
        font-size: ${size}px;
        color: ${color};
        left: ${localX}px;
        top: ${localY}px;
        pointer-events: none;
        z-index: 100;
        text-shadow: 0 0 6px ${color};
      `;

      effectsLayer.appendChild(star);

      const angle = (i / count) * 360 + Math.random() * 30;
      const speed = 30 + Math.random() * 50;
      const radians = (angle * Math.PI) / 180;
      const vx = Math.cos(radians) * speed;
      const vy = Math.sin(radians) * speed;

      let startTime = null;
      const duration = 700 + Math.random() * 500;

      function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = elapsed / duration;

        if (progress >= 1) {
          star.remove();
          return;
        }

        const eased = 1 - Math.pow(1 - progress, 3);
        const gravity = 80 * progress * progress;
        const rotation = progress * 360;

        star.style.transform = `translate(${vx * eased}px, ${vy * eased + gravity}px) rotate(${rotation}deg)`;
        star.style.opacity = 1 - progress;

        requestAnimationFrame(animate);
      }

      requestAnimationFrame(animate);
    }
  }

  // 行清除特效
  function rowClear(cellRect, effectsLayer) {
    if (!effectsLayer) return;
    const boardContainer = document.querySelector('.board-container');
    const boardRect = boardContainer.getBoundingClientRect();

    const beam = document.createElement('div');
    const relY = cellRect.top - boardRect.top + cellRect.height / 2;

    beam.style.cssText = `
      position: absolute;
      left: 0;
      top: ${relY - 4}px;
      width: 100%;
      height: 8px;
      background: linear-gradient(90deg, transparent, #ffd700, #fff, #ffd700, transparent);
      pointer-events: none;
      z-index: 50;
      border-radius: 4px;
      box-shadow: 0 0 12px #ffd700;
    `;

    effectsLayer.appendChild(beam);

    beam.animate([
      { opacity: 0, transform: 'scaleX(0)' },
      { opacity: 1, transform: 'scaleX(1.05)' },
      { opacity: 0, transform: 'scaleX(1)' }
    ], { duration: 400, easing: 'ease-out' }).onfinish = () => beam.remove();
  }

  // 列清除特效
  function colClear(cellRect, effectsLayer) {
    if (!effectsLayer) return;
    const boardContainer = document.querySelector('.board-container');
    const boardRect = boardContainer.getBoundingClientRect();

    const beam = document.createElement('div');
    const relX = cellRect.left - boardRect.left + cellRect.width / 2;

    beam.style.cssText = `
      position: absolute;
      left: ${relX - 4}px;
      top: 0;
      width: 8px;
      height: 100%;
      background: linear-gradient(180deg, transparent, #00d2ff, #fff, #00d2ff, transparent);
      pointer-events: none;
      z-index: 50;
      border-radius: 4px;
      box-shadow: 0 0 12px #00d2ff;
    `;

    effectsLayer.appendChild(beam);

    beam.animate([
      { opacity: 0, transform: 'scaleY(0)' },
      { opacity: 1, transform: 'scaleY(1.05)' },
      { opacity: 0, transform: 'scaleY(1)' }
    ], { duration: 400, easing: 'ease-out' }).onfinish = () => beam.remove();
  }

  return { init, burst, stars, rowClear, colClear };
})();
