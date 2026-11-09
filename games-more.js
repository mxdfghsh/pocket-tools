/* 追加游戏：合成大西瓜 */
(() => {
  "use strict";
  const PG = window.PocketGames;
  if (!PG) return;
  const el = PG.el;

  // 简单音效
  let actx = null;
  function sfx(freq, dur, type, vol) {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type || "sine";
      o.frequency.value = freq;
      const t = actx.currentTime;
      g.gain.setValueAtTime(vol || 0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + (dur || 0.12));
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + (dur || 0.12) + 0.02);
    } catch (e) {}
  }

  PG.add({
    id: "merge", icon: "🍉", name: "合成大西瓜",
    desc: "掉落水果，两个相同的碰在一起就变大",
    init(root) {
      const W = 360, H = 520, G = 0.55, KEY = "pocket-best-merge";
      const TIERS = [
        { r: 16, e: "🍒", c: "#fb7185", s: 1 },
        { r: 21, e: "🍓", c: "#f87171", s: 3 },
        { r: 27, e: "🍇", c: "#a78bfa", s: 6 },
        { r: 33, e: "🍊", c: "#fbbf24", s: 10 },
        { r: 40, e: "🍎", c: "#fb923c", s: 15 },
        { r: 48, e: "🍑", c: "#f9a8d4", s: 21 },
        { r: 57, e: "🍍", c: "#fde047", s: 28 },
        { r: 68, e: "🍉", c: "#34d399", s: 36 },
      ];

      const bar = el("div", { class: "g-bar" },
        el("span", { class: "g-score" }, "分数 0"),
        el("span", { class: "g-best" }, ""));
      const canvas = el("canvas", { class: "merge-canvas" });
      const overlay = el("div", { class: "g-overlay", hidden: true });
      const box = el("div", { class: "board-box" }, canvas, overlay);
      root.appendChild(el("div", { class: "g-wrap" }, bar, box,
        el("div", { class: "g-hint" }, "左右移动瞄准，松手掉落 · 相同的两个会合成更大的")));

      const ctx = canvas.getContext ? canvas.getContext("2d") : null;
      if (!ctx) { root.appendChild(el("p", { class: "g-hint" }, "当前浏览器不支持 canvas")); return; }

      let fruits = [], particles = [], score = 0, over = false, raf = 0;
      let aimX = W / 2, nextTier = 0, cool = 0, scale = 1, shake = 0;

      const pick = () => (Math.random() < 0.62 ? 0 : Math.random() < 0.6 ? 1 : 2);

      function resize() {
        const cssW = canvas.clientWidth || 360;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssW * (H / W) * dpr);
        scale = canvas.width / W;
      }

      function reset() {
        fruits = []; particles = []; score = 0; over = false; cool = 0; shake = 0;
        nextTier = pick(); aimX = W / 2;
        overlay.hidden = true;
        bar.querySelector(".g-score").textContent = "分数 0";
        bar.querySelector(".g-best").textContent = "最高 " + Math.max(score, best());
        resize();
      }
      function best() { try { return Number(localStorage.getItem(KEY) || 0); } catch (e) { return 0; } }
      function saveBest() { try { if (score > best()) localStorage.setItem(KEY, String(score)); } catch (e) {} }

      function drop() {
        if (over || cool > 0) return;
        const t = TIERS[nextTier];
        fruits.push({ x: aimX, y: t.r + 6, vx: 0, vy: 0, r: t.r, tier: nextTier, born: performance.now() });
        nextTier = pick();
        cool = 320;
        sfx(220 + Math.random() * 40, 0.06, "sine", 0.06);
      }

      function burst(x, y, color, n) {
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 3;
          particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, life: 1, color });
        }
      }

      function merge(a, b) {
        a.dead = true; b.dead = true;
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const nt = a.tier + 1;
        if (nt < TIERS.length) {
          const t = TIERS[nt];
          fruits.push({ x: mx, y: my, vx: (a.vx + b.vx) / 2, vy: (a.vy + b.vy) / 2 - 0.6, r: t.r, tier: nt, born: performance.now() });
          score += t.s;
          burst(mx, my, t.c, 14);
          sfx(300 + nt * 70, 0.16, "triangle", 0.12);
        } else {
          score += 80;
          burst(mx, my, "#34d399", 30);
          sfx(660, 0.3, "sine", 0.16);
        }
        shake = Math.min(10, shake + 4);
        bar.querySelector(".g-score").textContent = "分数 " + score;
        saveBest();
      }

      function physics() {
        for (const f of fruits) {
          f.vy += G;
          f.x += f.vx; f.y += f.vy;
          f.vx *= 0.992; f.vy *= 0.996;
          if (f.x - f.r < 0) { f.x = f.r; f.vx = Math.abs(f.vx) * 0.5; }
          if (f.x + f.r > W) { f.x = W - f.r; f.vx = -Math.abs(f.vx) * 0.5; }
          if (f.y + f.r > H) { f.y = H - f.r; f.vy = -Math.abs(f.vy) * 0.18; f.vx *= 0.9; }
        }

        for (let i = 0; i < fruits.length; i++) {
          const a = fruits[i];
          if (a.dead) continue;
          for (let j = i + 1; j < fruits.length; j++) {
            const b = fruits[j];
            if (b.dead) continue;
            let dx = b.x - a.x, dy = b.y - a.y;
            let d = Math.hypot(dx, dy) || 0.01;
            const minD = a.r + b.r;
            if (d >= minD) continue;
            if (a.tier === b.tier && a.tier < TIERS.length) { merge(a, b); break; }
            // 分离
            const overlap = (minD - d) / 2;
            const nx = dx / d, ny = dy / d;
            const wa = b.r / (a.r + b.r), wb = a.r / (a.r + b.r);
            a.x -= nx * overlap * wa; a.y -= ny * overlap * wa;
            b.x += nx * overlap * wb; b.y += ny * overlap * wb;
            const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (rel < 0) {
              const imp = -rel * 0.45;
              a.vx -= nx * imp * wa; a.vy -= ny * imp * wa;
              b.vx += nx * imp * wb; b.vy += ny * imp * wb;
            }
          }
        }
        fruits = fruits.filter((f) => !f.dead);
      }

      function drawFruit(f, x, y, r) {
        const t = TIERS[f.tier];
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = t.c;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255,255,255,.55)";
        ctx.stroke();
        ctx.font = (r * 1.15) + "px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(t.e, x, y + r * 0.04);
      }

      function draw() {
        if (scale !== canvas.width / W) resize();
        const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
        shake *= 0.88;
        ctx.setTransform(scale, 0, 0, scale, sx * scale, sy * scale);
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = "#0d1424";
        ctx.fillRect(0, 0, W, H);

        // 危险线
        ctx.strokeStyle = "rgba(251,113,133,.45)";
        ctx.setLineDash([8, 7]);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 72); ctx.lineTo(W, 72); ctx.stroke();
        ctx.setLineDash([]);

        // 瞄准线
        if (!over && cool <= 0) {
          const t = TIERS[nextTier];
          ctx.strokeStyle = "rgba(110,231,255,.35)";
          ctx.beginPath(); ctx.moveTo(aimX, 0); ctx.lineTo(aimX, H); ctx.stroke();
          drawFruit({ tier: nextTier }, aimX, t.r + 6, t.r);
        }

        for (const f of fruits) drawFruit(f, f.x, f.y, f.r);
        for (const p of particles) {
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = p.color; ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      function step() {
        if (over) return;
        if (cool > 0) cool -= 16;
        physics();
        for (const p of particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.life -= 0.03; }
        particles = particles.filter((p) => p.life > 0);
        draw();
        // 判负
        for (const f of fruits) {
          if (f.y - f.r < 60 && performance.now() - f.born > 1800) { return gameOver(); }
        }
        raf = requestAnimationFrame(step);
      }

      function gameOver() {
        over = true;
        cancelAnimationFrame(raf);
        saveBest();
        overlay.hidden = false;
        overlay.innerHTML = "";
        overlay.append(
          el("h4", {}, "装不下啦"),
          el("p", {}, "得分 " + score),
          el("button", { class: "g-btn", type: "button", onclick: reset }, "再来一局")
        );
        bar.querySelector(".g-best").textContent = "最高 " + best();
        sfx(140, 0.4, "sawtooth", 0.1);
      }

      function toLocal(clientX) {
        const r = canvas.getBoundingClientRect();
        const x = (clientX - r.left) / r.width * W;
        return Math.max(20, Math.min(W - 20, x));
      }

      canvas.addEventListener("pointermove", (e) => { if (!over) aimX = toLocal(e.clientX); });
      canvas.addEventListener("pointerdown", (e) => { aimX = toLocal(e.clientX); });
      canvas.addEventListener("pointerup", (e) => { aimX = toLocal(e.clientX); drop(); });
      canvas.addEventListener("touchmove", (e) => { e.preventDefault(); aimX = toLocal(e.touches[0].clientX); }, { passive: false });
      canvas.addEventListener("touchend", (e) => { if (e.changedTouches[0]) aimX = toLocal(e.changedTouches[0].clientX); drop(); }, { passive: true });

      const onKey = (e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); aimX = Math.max(20, aimX - 12); }
        if (e.key === "ArrowRight") { e.preventDefault(); aimX = Math.min(W - 20, aimX + 12); }
        if (e.key === " " || e.key === "ArrowDown") { e.preventDefault(); drop(); }
      };
      document.addEventListener("keydown", onKey);
      window.addEventListener("resize", resize);

      reset();
      raf = requestAnimationFrame(step);

      return () => {
        cancelAnimationFrame(raf);
        document.removeEventListener("keydown", onKey);
        window.removeEventListener("resize", resize);
      };
    },
  });

  PG.renderCards();
})();
