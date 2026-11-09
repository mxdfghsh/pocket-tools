/* 口袋小站 · 小游戏合集（纯原生实现，无依赖） */
(() => {
  "use strict";

  /* ---------- 基础工具 ---------- */
  const el = (tag, props = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === undefined || v === null) continue;
      if (k === "class") n.className = v;
      else if (k === "style") n.style.cssText = v;
      else if (k === "hidden") n.hidden = !!v;
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2).toLowerCase(), v);
      else n.setAttribute(k, v);
    }
    for (const kid of kids.flat()) {
      if (kid === null || kid === undefined || kid === false) continue;
      n.appendChild(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return n;
  };

  const bestGet = (k) => { try { return Number(localStorage.getItem(k) || 0); } catch (e) { return 0; } };
  const bestSet = (k, v) => { try { localStorage.setItem(k, String(v)); } catch (e) {} };
  const rnd = (n) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };

  function dpad(onDir) {
    const wrap = el("div", { class: "dpad" });
    const mk = (t, d) => {
      const b = el("button", { class: "g-btn", type: "button" }, t);
      b.addEventListener("click", () => onDir(d));
      return b;
    };
    wrap.append(mk("↑", "up"), mk("←", "left"), mk("↓", "down"), mk("→", "right"));
    return wrap;
  }

  function ctrlRow(items) {
    const wrap = el("div", { class: "g-pad" });
    for (const it of items) {
      const b = el("button", { class: "g-btn", type: "button" }, it.t);
      b.addEventListener("click", () => it.fn());
      wrap.appendChild(b);
    }
    return wrap;
  }

  function swipeable(node, cb) {
    let sx = 0, sy = 0, on = false;
    const start = (e) => { const t = (e.touches && e.touches[0]) || e; sx = t.clientX; sy = t.clientY; on = true; };
    const end = (e) => {
      if (!on) return;
      on = false;
      const t = (e.changedTouches && e.changedTouches[0]) || e;
      const dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) < 22 && Math.abs(dy) < 22) return;
      cb(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
    };
    node.addEventListener("touchstart", start, { passive: true });
    node.addEventListener("touchend", end, { passive: true });
  }

  const games = [];
  const add = (g) => games.push(g);

  /* ================= 1. 贪吃蛇 ================= */
  add({
    id: "snake", icon: "🐍", name: "贪吃蛇", desc: "16×16 方格，越吃越长越快",
    init(root) {
      const N = 16, KEY = "pocket-best-snake";
      let snake, dir, nd, food, score, timer, dead, speed;

      const bar = el("div", { class: "g-bar" }, el("span", { class: "g-score" }, "分数 0"), el("span", { class: "g-best" }, ""));
      const board = el("div", { class: "snake-board" });
      const cells = [];
      for (let i = 0; i < N * N; i++) { const c = el("div", { class: "sc" }); cells.push(c); board.appendChild(c); }
      const overlay = el("div", { class: "g-overlay", hidden: true });
      const box = el("div", { class: "board-box" }, board, overlay);
      const wrap = el("div", { class: "g-wrap" }, bar, box, dpad(turn), el("div", { class: "g-hint" }, "方向键 / WASD / 滑动 / 按钮"));
      root.appendChild(wrap);

      const idx = (x, y) => y * N + x;
      const paint = () => {
        for (const c of cells) c.className = "sc";
        for (const s of snake) cells[idx(s.x, s.y)].classList.add("body");
        if (snake[0]) cells[idx(snake[0].x, snake[0].y)].classList.add("head");
        if (food) cells[idx(food.x, food.y)].classList.add("food");
        bar.querySelector(".g-score").textContent = "分数 " + score;
      };
      const placeFood = () => {
        let p;
        do { p = { x: rnd(N), y: rnd(N) }; } while (snake.some((s) => s.x === p.x && s.y === p.y));
        food = p;
      };
      function turn(d) {
        const map = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
        const n = map[d];
        if (!n || dead) return;
        if (n.x === -dir.x && n.y === -dir.y) return;
        nd = n;
      }
      function die() {
        dead = true;
        clearInterval(timer);
        const best = Math.max(score, bestGet(KEY));
        bestSet(KEY, best);
        bar.querySelector(".g-best").textContent = "最高 " + best;
        overlay.hidden = false;
        overlay.innerHTML = "";
        overlay.append(
          el("h4", {}, "游戏结束"),
          el("p", {}, "得分 " + score),
          el("button", { class: "g-btn", type: "button", onclick: reset }, "再来一局")
        );
      }
      function step() {
        if (dead) return;
        dir = nd;
        const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
        if (head.x < 0 || head.y < 0 || head.x >= N || head.y >= N || snake.some((s) => s.x === head.x && s.y === head.y)) return die();
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
          score += 10;
          speed = Math.max(70, speed - 5);
          clearInterval(timer); timer = setInterval(step, speed);
          placeFood(); paint();
        }
        else { snake.pop(); paint(); }
      }
      function reset() {
        snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];
        dir = { x: 1, y: 0 }; nd = dir; score = 0; dead = false;
        overlay.hidden = true;
        placeFood(); paint();
        clearInterval(timer);
        speed = 150;
        timer = setInterval(step, speed);
        bar.querySelector(".g-best").textContent = "最高 " + bestGet(KEY);
      }
      const onKey = (e) => {
        const m = { arrowup: "up", arrowdown: "down", arrowleft: "left", arrowright: "right", w: "up", s: "down", a: "left", d: "right" };
        const k = m[e.key.toLowerCase()];
        if (k) { e.preventDefault(); turn(k); }
      };
      document.addEventListener("keydown", onKey);
      swipeable(board, turn);
      reset();
      return () => { clearInterval(timer); document.removeEventListener("keydown", onKey); };
    },
  });

  /* ================= 2. 俄罗斯方块 ================= */
  add({
    id: "tetris", icon: "🧱", name: "俄罗斯方块", desc: "10×20 经典消除，带落速递进",
    init(root) {
      const COL = 10, ROW = 20, KEY = "pocket-best-tetris";
      const SHAPES = {
        I: [[1, 1, 1, 1]], O: [[1, 1], [1, 1]],
        T: [[0, 1, 0], [1, 1, 1]], S: [[0, 1, 1], [1, 1, 0]],
        Z: [[1, 1, 0], [0, 1, 1]], J: [[1, 0, 0], [1, 1, 1]], L: [[0, 0, 1], [1, 1, 1]],
      };
      const TYPES = Object.keys(SHAPES);
      let grid, cur, score, lines, timer, dead;

      const bar = el("div", { class: "g-bar" },
        el("span", { class: "g-score" }, "分数 0"),
        el("span", { class: "g-best" }, ""));
      const board = el("div", { class: "tetris-board" });
      const cells = [];
      for (let i = 0; i < COL * ROW; i++) { const c = el("div", { class: "tc" }); cells.push(c); board.appendChild(c); }
      const overlay = el("div", { class: "g-overlay", hidden: true });
      const box = el("div", { class: "board-box", style: "max-width:300px;margin:0 auto" }, board, overlay);
      const pad = ctrlRow([
        { t: "←", fn: () => move(-1) }, { t: "↻", fn: () => rotatePiece() },
        { t: "→", fn: () => move(1) }, { t: "↓", fn: () => down() },
        { t: "⤓", fn: hardDrop },
      ]);
      root.appendChild(el("div", { class: "g-wrap" }, bar, box, pad, el("div", { class: "g-hint" }, "← → 移动 · ↑ 旋转 · ↓ 下落 · 空格直接落底")));

      const empty = () => Array.from({ length: ROW }, () => Array(COL).fill(0));
      const rotate = (m) => m[0].map((_, i) => m.map((r) => r[i]).reverse());

      function spawn() {
        const t = TYPES[rnd(TYPES.length)];
        const shape = SHAPES[t].map((r) => r.slice());
        cur = { type: t, shape, x: ((COL - shape[0].length) / 2) | 0, y: 0 };
        if (collide(cur.shape, cur.x, cur.y)) { die(); return false; }
        return true;
      }
      function collide(shape, ox, oy) {
        for (let y = 0; y < shape.length; y++) for (let x = 0; x < shape[y].length; x++) {
          if (!shape[y][x]) continue;
          const nx = ox + x, ny = oy + y;
          if (nx < 0 || nx >= COL || ny >= ROW) return true;
          if (ny >= 0 && grid[ny][nx]) return true;
        }
        return false;
      }
      function lock() {
        for (let y = 0; y < cur.shape.length; y++) for (let x = 0; x < cur.shape[y].length; x++) {
          if (!cur.shape[y][x]) continue;
          if (cur.y + y >= 0) grid[cur.y + y][cur.x + x] = cur.type;
        }
        let cleared = 0;
        for (let y = ROW - 1; y >= 0; y--) {
          if (grid[y].every((v) => v)) { grid.splice(y, 1); grid.unshift(Array(COL).fill(0)); cleared++; y++; }
        }
        if (cleared) {
          lines += cleared;
          score += [0, 100, 300, 500, 800][cleared] * (1 + Math.floor(lines / 10));
          bar.querySelector(".g-score").textContent = "分数 " + score;
        }
        paint();
        spawn();
      }
      function move(dx) {
        if (dead || !cur) return;
        if (!collide(cur.shape, cur.x + dx, cur.y)) { cur.x += dx; paint(); }
      }
      function down() {
        if (dead || !cur) return;
        if (!collide(cur.shape, cur.x, cur.y + 1)) { cur.y++; paint(); }
        else lock();
      }
      function rotatePiece() {
        if (dead || !cur) return;
        const r = rotate(cur.shape);
        for (const dx of [0, -1, 1, -2, 2]) {
          if (!collide(r, cur.x + dx, cur.y)) { cur.shape = r; cur.x += dx; paint(); return; }
        }
      }
      function hardDrop() {
        if (dead || !cur) return;
        while (!collide(cur.shape, cur.x, cur.y + 1)) cur.y++;
        paint(); lock();
      }
      function paint() {
        for (let i = 0; i < cells.length; i++) { cells[i].className = "tc"; cells[i].textContent = ""; }
        for (let y = 0; y < ROW; y++) for (let x = 0; x < COL; x++) {
          const v = grid[y][x];
          if (v) cells[y * COL + x].classList.add("on", "c" + v);
        }
        if (cur) {
          for (let y = 0; y < cur.shape.length; y++) for (let x = 0; x < cur.shape[y].length; x++) {
            if (!cur.shape[y][x]) continue;
            const ny = cur.y + y, nx = cur.x + x;
            if (ny >= 0 && ny < ROW && nx >= 0 && nx < COL) cells[ny * COL + nx].classList.add("on", "c" + cur.type);
          }
        }
      }
      function die() {
        dead = true; clearInterval(timer);
        const best = Math.max(score, bestGet(KEY));
        bestSet(KEY, best);
        bar.querySelector(".g-best").textContent = "最高 " + best;
        overlay.hidden = false;
        overlay.innerHTML = "";
        overlay.append(el("h4", {}, "堆满了"), el("p", {}, "分数 " + score),
          el("button", { class: "g-btn", type: "button", onclick: reset }, "再来一局"));
      }
      function reset() {
        grid = empty(); score = 0; lines = 0; dead = false;
        overlay.hidden = true;
        bar.querySelector(".g-score").textContent = "分数 0";
        bar.querySelector(".g-best").textContent = "最高 " + bestGet(KEY);
        clearInterval(timer);
        spawn(); paint();
        timer = setInterval(() => { if (!dead) down(); }, 620);
      }
      const onKey = (e) => {
        const k = e.key;
        if (k === "ArrowLeft") { e.preventDefault(); move(-1); }
        else if (k === "ArrowRight") { e.preventDefault(); move(1); }
        else if (k === "ArrowDown") { e.preventDefault(); down(); }
        else if (k === "ArrowUp") { e.preventDefault(); rotatePiece(); }
        else if (k === " ") { e.preventDefault(); hardDrop(); }
      };
      document.addEventListener("keydown", onKey);
      let sx = 0;
      board.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
      board.addEventListener("touchend", (e) => {
        const dx = e.changedTouches[0].clientX - sx;
        if (dx > 30) move(1); else if (dx < -30) move(-1);
      }, { passive: true });
      reset();
      return () => { clearInterval(timer); document.removeEventListener("keydown", onKey); };
    },
  });

  /* ================= 3. 2048 ================= */
  add({
    id: "g2048", icon: "🔢", name: "2048", desc: "滑动合并数字，凑到 2048",
    init(root) {
      const KEY = "pocket-best-2048";
      let g, score, dead, won;

      const bar = el("div", { class: "g-bar" }, el("span", { class: "g-score" }, "分数 0"), el("span", { class: "g-best" }, ""));
      const board = el("div", { class: "g2048" });
      const tiles = [];
      for (let i = 0; i < 16; i++) { const c = el("div", { class: "tile" }); tiles.push(c); board.appendChild(c); }
      const overlay = el("div", { class: "g-overlay", hidden: true });
      const box = el("div", { class: "board-box" }, board, overlay);
      root.appendChild(el("div", { class: "g-wrap" }, bar, box,
        el("div", { class: "g-hint" }, "方向键 / WASD / 直接滑动棋盘")));

      const emptyCell = () => { const a = []; for (let i = 0; i < 16; i++) if (!g[i]) a.push(i); return a; };
      function addTile() {
        const e = emptyCell();
        if (!e.length) return;
        g[e[rnd(e.length)]] = rnd(10) === 0 ? 4 : 2;
      }
      function paint() {
        for (let i = 0; i < 16; i++) {
          const v = g[i];
          const t = tiles[i];
          t.textContent = v ? String(v) : "";
          t.dataset.v = String(v || 0);
          t.className = "tile " + (v ? (v <= 2048 ? "t" + v : "tbig") : "");
        }
        bar.querySelector(".g-score").textContent = "分数 " + score;
      }
      function line(arr) {
        const v = arr.filter((x) => x);
        const out = [];
        for (let i = 0; i < v.length; i++) {
          if (v[i] === v[i + 1]) { out.push(v[i] * 2); score += v[i] * 2; i++; }
          else out.push(v[i]);
        }
        while (out.length < 4) out.push(0);
        return out;
      }
      function move(dir) {
        if (dead) return;
        const before = g.join(",");
        const next = Array(16).fill(0);
        for (let i = 0; i < 4; i++) {
          let lineIdx;
          if (dir === "left") lineIdx = [i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 3];
          else if (dir === "right") lineIdx = [i * 4 + 3, i * 4 + 2, i * 4 + 1, i * 4];
          else if (dir === "up") lineIdx = [i, i + 4, i + 8, i + 12];
          else lineIdx = [i + 12, i + 8, i + 4, i];
          const vals = line(lineIdx.map((x) => g[x]));
          lineIdx.forEach((idx, k) => { next[idx] = vals[k]; });
        }
        g = next;
        if (g.join(",") !== before) { addTile(); paint(); check(); }
        bestSet(KEY, Math.max(score, bestGet(KEY)));
      }
      function check() {
        if (g.some((v) => v >= 2048) && !won) { won = true; }
        const full = !g.some((v) => !v);
        let movable = false;
        if (full) {
          for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
            const v = g[y * 4 + x];
            if (x < 3 && g[y * 4 + x + 1] === v) movable = true;
            if (y < 3 && g[(y + 1) * 4 + x] === v) movable = true;
          }
        }
        if (full && !movable) {
          dead = true;
          const best = Math.max(score, bestGet(KEY));
          bestSet(KEY, best);
          bar.querySelector(".g-best").textContent = "最高 " + best;
          overlay.hidden = false; overlay.innerHTML = "";
          overlay.append(el("h4", {}, "没有可走的路了"), el("p", {}, "分数 " + score),
            el("button", { class: "g-btn", type: "button", onclick: reset }, "再来一局"));
        }
      }
      function reset() {
        g = Array(16).fill(0); score = 0; dead = false; won = false;
        overlay.hidden = true;
        addTile(); addTile(); paint();
        bar.querySelector(".g-best").textContent = "最高 " + bestGet(KEY);
      }
      const onKey = (e) => {
        const m = { arrowleft: "left", arrowright: "right", arrowup: "up", arrowdown: "down", a: "left", d: "right", w: "up", s: "down" };
        const k = m[e.key.toLowerCase()];
        if (k) { e.preventDefault(); move(k); }
      };
      document.addEventListener("keydown", onKey);
      swipeable(board, move);
      reset();
      return () => document.removeEventListener("keydown", onKey);
    },
  });

  /* ================= 4. 扫雷 ================= */
  add({
    id: "mine", icon: "💣", name: "扫雷", desc: "9×9、10 颗雷，长按插旗",
    init(root) {
      const N = 9, MINES = 10;
      let cells, opened, flags, over, started, timer, secs;

      const bar = el("div", { class: "mine-bar" },
        el("span", { class: "m-mines" }, "💣 10"),
        el("span", { class: "m-time" }, "⏱ 0"),
        el("span", { class: "m-restart", style: "margin-left:auto;cursor:pointer;color:var(--accent)" }, "重新开始"));
      const grid = el("div", { class: "mine-grid" });
      grid.style.gridTemplateColumns = "repeat(" + N + ", 1fr)";
      const wrap = el("div", { class: "g-wrap" }, bar, grid,
        ctrlRow([{ t: "🚩 标记模式", fn: () => { flagMode = !flagMode; markBtn.textContent = flagMode ? "🚩 标记中" : "🚩 标记模式"; markBtn.style.background = flagMode ? "rgba(255,209,102,.25)" : ""; } }]));
      const markBtn = wrap.querySelector(".g-btn");
      let flagMode = false;
      root.appendChild(wrap);

      const idxs = () => Array.from({ length: N * N }, (_, i) => i);
      const neighbors = (i) => {
        const x = i % N, y = (i / N) | 0, out = [];
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < N && ny >= 0 && ny < N) out.push(ny * N + nx);
        }
        return out;
      };

      cells = idxs().map((i) => ({ mine: false, n: 0, open: false, flag: false }));
      const els = idxs().map((i) => {
        const b = el("button", { class: "mc", type: "button" });
        b.addEventListener("click", () => {
          if (flagMode) toggleFlag(i); else reveal(i);
        });
        let lp;
        b.addEventListener("touchstart", () => { lp = setTimeout(() => toggleFlag(i), 420); }, { passive: true });
        b.addEventListener("touchend", () => clearTimeout(lp), { passive: true });
        b.addEventListener("contextmenu", (e) => { e.preventDefault(); toggleFlag(i); });
        grid.appendChild(b);
        return b;
      });

      function plant(safe) {
        const pool = idxs().filter((i) => i !== safe && !neighbors(safe).includes(i));
        for (let k = 0; k < MINES && pool.length; k++) {
          const j = rnd(pool.length);
          cells[pool[j]].mine = true;
          pool.splice(j, 1);
        }
        idxs().forEach((i) => {
          if (!cells[i].mine) cells[i].n = neighbors(i).filter((j) => cells[j].mine).length;
        });
      }
      function paintCell(i) {
        const c = cells[i], e = els[i];
        e.className = "mc";
        e.textContent = "";
        if (c.open) {
          e.classList.add("open");
          if (c.mine) { e.classList.add("bomb"); e.textContent = "💣"; }
          else if (c.n) { e.classList.add("n" + c.n); e.textContent = String(c.n); }
        } else if (c.flag) {
          e.classList.add("flag"); e.textContent = "🚩";
        }
      }
      function toggleFlag(i) {
        if (over || cells[i].open) return;
        cells[i].flag = !cells[i].flag;
        paintCell(i);
        bar.querySelector(".m-mines").textContent = "💣 " + (MINES - cells.filter((c) => c.flag).length);
      }
      function tickTimer() {
        if (started && !over) { secs++; bar.querySelector(".m-time").textContent = "⏱ " + secs; }
      }
      function reveal(i) {
        if (over || cells[i].open || cells[i].flag) return;
        if (!started) { started = true; plant(i); }
        const stack = [i];
        while (stack.length) {
          const k = stack.pop();
          const c = cells[k];
          if (c.open || c.flag) continue;
          c.open = true;
          paintCell(k);
          if (c.mine) return lose(k);
          if (!c.n) neighbors(k).forEach((j) => { if (!cells[j].open) stack.push(j); });
        }
        const all = cells.every((c) => c.open || c.mine);
        if (all) win();
      }
      function lose(hit) {
        over = true; clearInterval(timer);
        cells.forEach((c, i) => { if (c.mine) { c.open = true; paintCell(i); } });
        els[hit].classList.add("bomb");
        setTimeout(() => alertBox("踩雷了", "用时 " + secs + " 秒"), 60);
      }
      function win() {
        over = true; clearInterval(timer);
        setTimeout(() => alertBox("清完了！", "用时 " + secs + " 秒"), 60);
      }
      function alertBox(title, msg) {
        const ov = el("div", { class: "g-overlay" }, el("h4", {}, title), el("p", {}, msg),
          el("button", { class: "g-btn", type: "button", onclick: reset }, "再来一局"));
        grid.parentElement.style.position = "relative";
        grid.appendChild(ov);
        ov.style.position = "absolute";
      }
      function reset() {
        clearInterval(timer);
        cells = idxs().map(() => ({ mine: false, n: 0, open: false, flag: false }));
        opened = 0; flags = 0; over = false; started = false; secs = 0;
        els.forEach((e, i) => paintCell(i));
        bar.querySelector(".m-mines").textContent = "💣 " + MINES;
        bar.querySelector(".m-time").textContent = "⏱ 0";
        const ov = grid.querySelector(".g-overlay");
        if (ov) ov.remove();
        timer = setInterval(tickTimer, 1000);
      }
      bar.querySelector(".m-restart").addEventListener("click", reset);
      reset();
      return () => clearInterval(timer);
    },
  });

  /* ================= 5. 打砖块 ================= */
  add({
    id: "breakout", icon: "🏓", name: "打砖块", desc: "挡板接球，把砖敲光",
    init(root) {
      const canvas = el("canvas", { class: "breakout-canvas" });
      root.appendChild(el("div", { class: "g-wrap" }, canvas, el("div", { class: "g-hint" }, "左右滑动 / ← → 移动挡板")));
      const ctx = canvas.getContext ? canvas.getContext("2d") : null;
      if (!ctx) { root.appendChild(el("p", { class: "g-hint" }, "当前浏览器不支持 canvas")); return; }

      let W = 360, H = 420, raf = 0, running = true;
      const paddle = { w: 70, h: 10, x: W / 2, y: H - 24 };
      const ball = { x: W / 2, y: H - 60, r: 6, vx: 2.6, vy: -3.4 };
      let bricks = [], score = 0, lives = 3;

      const resize = () => {
        const cssW = canvas.clientWidth || 360;
        const ratio = H / W;
        canvas.width = Math.round(cssW * (window.devicePixelRatio || 1));
        canvas.height = Math.round(cssW * ratio * (window.devicePixelRatio || 1));
        W = canvas.width; H = canvas.height;
        const s = W / 360;
        paddle.w = 70 * s; paddle.h = 10 * s; paddle.y = H - 24 * s;
        ball.r = 6 * s;
      };
      function makeBricks() {
        const cols = 7, rows = 5, pad = 6 * (W / 360), bw = (W - pad * (cols + 1)) / cols, bh = 16 * (W / 360);
        bricks = [];
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          bricks.push({ x: pad + c * (bw + pad), y: 50 * (W / 360) + r * (bh + pad), w: bw, h: bh, alive: true, r });
        }
      }
      const COLORS = ["#6ee7ff", "#a78bfa", "#34d399", "#fbbf24", "#fb7185"];
      function draw() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = "#0c121f"; ctx.fillRect(0, 0, W, H);
        for (const b of bricks) {
          if (!b.alive) continue;
          ctx.fillStyle = COLORS[b.r % COLORS.length];
          roundRect(ctx, b.x, b.y, b.w, b.h, 4);
          ctx.fill();
        }
        ctx.fillStyle = "#e8edf7";
        roundRect(ctx, paddle.x - paddle.w / 2, paddle.y, paddle.w, paddle.h, 5); ctx.fill();
        ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill();
        ctx.fillStyle = "#8a95ab"; ctx.font = (12 * W / 360) + "px monospace";
        ctx.fillText("分数 " + score + "   生命 " + lives, 12 * W / 360, 22 * W / 360);
      }
      function roundRect(c, x, y, w, h, r) {
        c.beginPath(); c.moveTo(x + r, y);
        c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
        c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
      }
      function loop() {
        if (!running) return;
        const s = W / 360;
        ball.x += ball.vx * s; ball.y += ball.vy * s;
        if (ball.x < ball.r || ball.x > W - ball.r) ball.vx *= -1;
        if (ball.y < ball.r) ball.vy *= -1;
        if (ball.y > paddle.y - ball.r && ball.y < paddle.y + paddle.h && Math.abs(ball.x - paddle.x) < paddle.w / 2 + ball.r) {
          ball.vy = -Math.abs(ball.vy);
          ball.vx += (ball.x - paddle.x) / (paddle.w / 2) * 1.2;
        }
        for (const b of bricks) {
          if (b.alive && ball.x > b.x - ball.r && ball.x < b.x + b.w + ball.r && ball.y > b.y - ball.r && ball.y < b.y + b.h + ball.r) {
            b.alive = false; score += 10; ball.vy *= -1; break;
          }
        }
        if (ball.y > H + 20) {
          lives--;
          ball.x = W / 2; ball.y = H - 60 * s; ball.vx = 2.6; ball.vy = -3.4;
          if (lives <= 0) { running = false; overlay("游戏结束", "得分 " + score, () => reset()); }
        }
        if (!bricks.some((b) => b.alive)) { running = false; overlay("全清了！", "得分 " + score, () => reset()); }
        draw();
        raf = requestAnimationFrame(loop);
      }
      function overlay(title, msg, again) {
        const ov = el("div", { class: "g-overlay" }, el("h4", {}, title), el("p", {}, msg),
          el("button", { class: "g-btn", type: "button", onclick: again }, "再来一局"));
        const box = canvas.parentElement;
        box.style.position = "relative";
        canvas.after(ov);
      }
      function reset() {
        const ov = canvas.parentElement.querySelector(".g-overlay");
        if (ov) ov.remove();
        score = 0; lives = 3; running = true;
        resize(); makeBricks();
        ball.x = W / 2; ball.y = H - 90 * (W / 360);
        ball.vx = 2.6; ball.vy = -3.4;
        paddle.x = W / 2;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      }

      const onKey = (e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); paddle.x = Math.max(paddle.w / 2, paddle.x - 26 * (W / 360)); }
        if (e.key === "ArrowRight") { e.preventDefault(); paddle.x = Math.min(W - paddle.w / 2, paddle.x + 26 * (W / 360)); }
      };
      const onMove = (clientX) => {
        const r = canvas.getBoundingClientRect();
        const x = (clientX - r.left) / r.width * W;
        paddle.x = Math.min(W - paddle.w / 2, Math.max(paddle.w / 2, x));
      };
      canvas.addEventListener("pointermove", (e) => onMove(e.clientX));
      canvas.addEventListener("touchmove", (e) => { e.preventDefault(); onMove(e.touches[0].clientX); }, { passive: false });
      document.addEventListener("keydown", onKey);
      window.addEventListener("resize", () => { /* 简化：重开 */ });

      resize(); makeBricks();
      raf = requestAnimationFrame(loop);
      return () => { running = false; cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey); };
    },
  });

  /* ================= 6. 记忆翻牌 ================= */
  add({
    id: "memory", icon: "🃏", name: "记忆翻牌", desc: "4×4 找成对的图案",
    init(root) {
      const EMOJI = ["🍎", "🍌", "🍇", "🍓", "🍑", "🍍", "🥝", "🍒"];
      let cards, first, lock, moves, left, timer, secs;

      const bar = el("div", { class: "g-bar" }, el("span", { class: "g-moves" }, "步数 0"), el("span", { class: "g-best" }, "剩余 8 对"));
      const grid = el("div", { class: "mem-grid" });
      const wrap = el("div", { class: "g-wrap" }, bar, grid, el("div", { class: "g-hint" }, "点开两张，图案一样就留下"));
      root.appendChild(wrap);

      function reset() {
        clearInterval(timer);
        const deck = EMOJI.concat(EMOJI).sort(() => Math.random() - 0.5);
        cards = deck.map((e, i) => ({ e, i, open: false, done: false }));
        first = null; lock = false; moves = 0; left = 8; secs = 0;
        grid.innerHTML = "";
        cards.forEach((c, i) => {
          const btn = el("button", { class: "mcard", type: "button" });
          btn.append(
            el("div", { class: "inner" },
              el("div", { class: "face front" }, "?"),
              el("div", { class: "face back" }, c.e))
          );
          btn.addEventListener("click", () => flip(i));
          c.node = btn;
          grid.appendChild(btn);
        });
        bar.querySelector(".g-moves").textContent = "步数 0";
        bar.querySelector(".g-best").textContent = "剩余 8 对";
        timer = setInterval(() => { secs++; }, 1000);
      }
      function flip(i) {
        const c = cards[i];
        if (lock || c.open || c.done) return;
        c.open = true;
        c.node.classList.add("flip");
        if (!first) { first = i; return; }
        const a = cards[first], b = c;
        moves++;
        bar.querySelector(".g-moves").textContent = "步数 " + moves;
        if (a.e === b.e) {
          a.done = b.done = true;
          a.node.classList.add("done"); b.node.classList.add("done");
          first = null; left--;
          bar.querySelector(".g-best").textContent = "剩余 " + left + " 对";
          if (!left) setTimeout(() => finish(), 350);
        } else {
          lock = true;
          setTimeout(() => {
            a.open = b.open = false;
            a.node.classList.remove("flip"); b.node.classList.remove("flip");
            first = null; lock = false;
          }, 700);
        }
      }
      function finish() {
        clearInterval(timer);
        const ov = el("div", { class: "g-overlay" }, el("h4", {}, "全部找到！"),
          el("p", {}, "用了 " + moves + " 步 · " + secs + " 秒"),
          el("button", { class: "g-btn", type: "button", onclick: () => { reset(); } }, "再来一局"));
        const box = grid.parentElement;
        box.style.position = "relative";
        grid.appendChild(ov);
        ov.style.position = "absolute";
      }
      reset();
      return () => clearInterval(timer);
    },
  });

  /* ================= 7. 井字棋 ================= */
  add({
    id: "ttt", icon: "⭕", name: "井字棋", desc: "和会思考的对手下三连",
    init(root) {
      let b, over, turn;
      const bar = el("div", { class: "g-bar" }, el("span", { class: "g-turn" }, "轮到你（X）"), el("span", { class: "g-best" }, ""));
      const grid = el("div", { class: "ttt-grid" });
      const cells = [];
      for (let i = 0; i < 9; i++) {
        const c = el("button", { class: "tt-cell", type: "button" });
        c.addEventListener("click", () => play(i));
        cells.push(c); grid.appendChild(c);
      }
      root.appendChild(el("div", { class: "g-wrap" }, bar, grid,
        ctrlRow([{ t: "重开", fn: reset }]), el("div", { class: "g-hint" }, "你执 X，先手")));

      const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
      const winner = (st) => {
        for (const [a, b2, c] of LINES) if (st[a] && st[a] === st[b2] && st[a] === st[c]) return { w: st[a], line: [a, b2, c] };
        return st.every((v) => v) ? { w: "draw", line: [] } : null;
      };
      function minimax(st, me) {
        const r = winner(st);
        if (r) return r.w === "O" ? 10 : r.w === "X" ? -10 : 0;
        let best = me ? -Infinity : Infinity;
        for (let i = 0; i < 9; i++) {
          if (st[i]) continue;
          st[i] = me ? "O" : "X";
          const v = minimax(st, !me);
          st[i] = "";
          best = me ? Math.max(best, v) : Math.min(best, v);
        }
        return best;
      }
      function bestMove() {
        let best = -Infinity, mv = -1;
        for (let i = 0; i < 9; i++) {
          if (b[i]) continue;
          b[i] = "O";
          const v = minimax(b, false);
          b[i] = "";
          if (v > best) { best = v; mv = i; }
        }
        return mv;
      }
      function paint() {
        cells.forEach((c, i) => { c.textContent = b[i]; c.className = "tt-cell" + (b[i] === "X" ? " x" : b[i] === "O" ? " o" : ""); });
      }
      function end(r) {
        over = true;
        r.line.forEach((i) => cells[i].classList.add("win"));
        bar.querySelector(".g-turn").textContent = r.w === "draw" ? "平局" : r.w === "X" ? "你赢了 🎉" : "电脑赢了";
      }
      function play(i) {
        if (over || b[i] || turn !== "X") return;
        b[i] = "X"; paint();
        let r = winner(b);
        if (r) return end(r);
        turn = "O";
        bar.querySelector(".g-turn").textContent = "电脑思考中…";
        setTimeout(() => {
          const m = bestMove();
          if (m >= 0) { b[m] = "O"; paint(); }
          r = winner(b);
          if (r) return end(r);
          turn = "X";
          bar.querySelector(".g-turn").textContent = "轮到你（X）";
        }, 260);
      }
      function reset() {
        b = Array(9).fill(""); over = false; turn = "X";
        paint();
        bar.querySelector(".g-turn").textContent = "轮到你（X）";
      }
      reset();
      return () => {};
    },
  });

  /* ================= 卡片与弹窗 ================= */
  const grid = document.getElementById("gameGrid");
  const modal = document.getElementById("gameModal");
  const stage = document.getElementById("gameStage");
  const titleEl = document.getElementById("gameTitle");
  const closeBtn = document.getElementById("gameClose");
  let cleanupFn = null;

  const BEST = { snake: ["pocket-best-snake", "最高 "], tetris: ["pocket-best-tetris", "最高 "], g2048: ["pocket-best-2048", "最高 "] };

  function renderCards() {
    if (!grid) return;
    grid.innerHTML = "";
    for (const g of games) {
      const card = el("button", { class: "game-card", type: "button" },
        el("span", { class: "gc-ico" }, g.icon),
        el("h3", {}, g.name),
        el("p", {}, g.desc)
      );
      const bk = BEST[g.id];
      if (bk) {
        const v = bestGet(bk[0]);
        if (v) card.appendChild(el("span", { class: "gc-best" }, bk[1] + v));
      }
      card.addEventListener("click", () => openGame(g.id));
      grid.appendChild(card);
    }
  }

  function openGame(id) {
    const g = games.find((x) => x.id === id);
    if (!g || !modal) return;
    closeGame();
    titleEl.textContent = g.icon + " " + g.name;
    stage.innerHTML = "";
    modal.hidden = false;
    modal.style.display = "grid";
    document.body.classList.add("modal-open");
    try {
      cleanupFn = g.init(stage) || null;
    } catch (e) {
      stage.innerHTML = "";
      stage.appendChild(el("p", { class: "g-hint" }, "加载失败：" + e.message));
    }
  }
  function closeGame() {
    if (cleanupFn) { try { cleanupFn(); } catch (e) {} cleanupFn = null; }
    if (modal) { modal.hidden = true; modal.style.display = "none"; }
    document.body.classList.remove("modal-open");
    if (stage) stage.innerHTML = "";
    renderCards();
  }

  closeBtn && closeBtn.addEventListener("click", closeGame);
  modal && modal.addEventListener("click", (e) => { if (e.target === modal) closeGame(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeGame(); });

  // 启动兜底：强制隐藏弹窗（内联样式优先级最高，不怕旧 CSS 缓存）
  if (modal) { modal.hidden = true; modal.style.display = "none"; }
  document.body.classList.remove("modal-open");

  renderCards();
  window.PocketGames = { games, openGame, closeGame, add, renderCards, el, nextId: null };
})();
