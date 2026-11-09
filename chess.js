/* 中国象棋：规则完整 + 带 AI */
(() => {
  "use strict";

  // 棋盘 9 列 x 10 行，row 0 在上（黑方），row 9 在下（红方）
  // 棋子: K 帅/将, A 仕/士, B 相/象, N 马, R 车, C 炮, P 兵/卒
  const RED = "red", BLACK = "black";
  const NAMES = {
    red: { K: "帥", A: "仕", B: "相", N: "馬", R: "車", C: "炮", P: "兵" },
    black: { K: "將", A: "士", B: "象", N: "馬", R: "車", C: "砲", P: "卒" },
  };
  const VALUE = { K: 10000, R: 900, C: 450, N: 400, B: 200, A: 200, P: 100 };

  const INIT = [
    "rnbakabnr",
    "         ",
    " c     c ",
    "p p p p p",
    "         ",
    "         ",
    "P P P P P",
    " C     C ",
    "         ",
    "RNBAKABNR",
  ];

  function initialBoard() {
    const b = [];
    for (let y = 0; y < 10; y++) {
      const row = [];
      for (let x = 0; x < 9; x++) {
        const ch = INIT[y][x];
        if (ch === " ") row.push(null);
        else {
          const color = y <= 4 ? BLACK : RED;
          row.push({ t: ch.toUpperCase(), c: color });
        }
      }
      b.push(row);
    }
    return b;
  }

  const inBoard = (x, y) => x >= 0 && x < 9 && y >= 0 && y < 10;
  const inPalace = (x, y, c) => (x >= 3 && x <= 5) && (c === RED ? y >= 7 && y <= 9 : y >= 0 && y <= 2);
  const crossedRiver = (y, c) => (c === RED ? y <= 4 : y >= 5);

  function genMoves(b, x, y) {
    const p = b[y][x];
    if (!p) return [];
    const out = [];
    const add = (nx, ny) => {
      if (!inBoard(nx, ny)) return false;
      const q = b[ny][nx];
      if (q && q.c === p.c) return false;
      out.push([nx, ny]);
      return !q;
    };
    switch (p.t) {
      case "K": {
        [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => {
          const nx = x + dx, ny = y + dy;
          if (inPalace(nx, ny, p.c)) add(nx, ny);
        });
        break;
      }
      case "A": {
        [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dx, dy]) => {
          const nx = x + dx, ny = y + dy;
          if (inPalace(nx, ny, p.c)) add(nx, ny);
        });
        break;
      }
      case "B": {
        [[2,2],[2,-2],[-2,2],[-2,-2]].forEach(([dx, dy]) => {
          const nx = x + dx, ny = y + dy;
          if (!inBoard(nx, ny)) return;
          if (dx > 0 && (p.c === RED ? ny < 5 : ny > 4)) return;
          if (b[y + dy / 2][x + dx / 2]) return; // 塞象眼
          add(nx, ny);
        });
        break;
      }
      case "N": {
        [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].forEach(([dx, dy]) => {
          const lx = x + (Math.abs(dx) === 2 ? Math.sign(dx) : 0);
          const ly = y + (Math.abs(dy) === 2 ? Math.sign(dy) : 0);
          if (!inBoard(lx, ly) || b[ly][lx]) return; // 蹩马腿
          add(x + dx, y + dy);
        });
        break;
      }
      case "R": {
        [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => {
          let nx = x + dx, ny = y + dy;
          while (inBoard(nx, ny)) {
            const q = b[ny][nx];
            if (!q) out.push([nx, ny]);
            else { if (q.c !== p.c) out.push([nx, ny]); break; }
            nx += dx; ny += dy;
          }
        });
        break;
      }
      case "C": {
        [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => {
          let nx = x + dx, ny = y + dy, jumped = false;
          while (inBoard(nx, ny)) {
            const q = b[ny][nx];
            if (!jumped) {
              if (!q) out.push([nx, ny]);
              else jumped = true;
            } else if (q) {
              if (q.c !== p.c) out.push([nx, ny]);
              break;
            }
            nx += dx; ny += dy;
          }
        });
        break;
      }
      case "P": {
        const fwd = p.c === RED ? -1 : 1;
        add(x, y + fwd);
        if (crossedRiver(y, p.c)) { add(x - 1, y); add(x + 1, y); }
        break;
      }
    }
    return out;
  }

  function findKing(b, color) {
    for (let y = 0; y < 10; y++) for (let x = 0; x < 9; x++) {
      const p = b[y][x];
      if (p && p.t === "K" && p.c === color) return [x, y];
    }
    return null;
  }

  function isAttacked(b, x, y, byColor) {
    for (let yy = 0; yy < 10; yy++) for (let xx = 0; xx < 9; xx++) {
      const p = b[yy][xx];
      if (!p || p.c !== byColor) continue;
      const ms = genMoves(b, xx, yy);
      for (const [mx, my] of ms) if (mx === x && my === y) return true;
      // 飞将
      if (p.t === "K" && xx === x) {
        let blocked = false;
        const step = yy < y ? 1 : -1;
        for (let t = yy + step; t !== y; t += step) if (b[t][xx]) { blocked = true; break; }
        if (!blocked) return true;
      }
    }
    return false;
  }

  function inCheck(b, color) {
    const k = findKing(b, color);
    if (!k) return true;
    return isAttacked(b, k[0], k[1], color === RED ? BLACK : RED);
  }

  function cloneBoard(b) { return b.map((r) => r.map((p) => (p ? { t: p.t, c: p.c } : null))); }

  function applyMove(b, from, to) {
    const nb = cloneBoard(b);
    nb[to[1]][to[0]] = nb[from[1]][from[0]];
    nb[from[1]][from[0]] = null;
    return nb;
  }

  function legalMoves(b, color) {
    const out = [];
    for (let y = 0; y < 10; y++) for (let x = 0; x < 9; x++) {
      const p = b[y][x];
      if (!p || p.c !== color) continue;
      for (const [nx, ny] of genMoves(b, x, y)) {
        const nb = applyMove(b, [x, y], [nx, ny]);
        if (!inCheck(nb, color)) out.push({ from: [x, y], to: [nx, ny] });
      }
    }
    return out;
  }

  function evaluate(b, color) {
    let s = 0;
    for (let y = 0; y < 10; y++) for (let x = 0; x < 9; x++) {
      const p = b[y][x];
      if (!p) continue;
      let v = VALUE[p.t];
      // 兵过河加分
      if (p.t === "P" && crossedRiver(y, p.c)) v += 60;
      s += p.c === color ? v : -v;
    }
    return s;
  }

  function search(b, color, depth, alpha, beta, rootColor, deadline) {
    if (Date.now() > deadline) return { v: evaluate(b, rootColor) };
    const moves = legalMoves(b, color);
    if (!moves.length) return { v: color === rootColor ? -99999 : 99999, move: null };
    let best = null;
    for (const m of moves) {
      const nb = applyMove(b, m.from, m.to);
      const r = depth <= 1 ? { v: evaluate(nb, rootColor) } : search(nb, color === RED ? BLACK : RED, depth - 1, alpha, beta, rootColor, deadline);
      const v = r.v;
      if (color === rootColor) {
        if (v > alpha) { alpha = v; best = m; }
      } else {
        if (v < beta) { beta = v; best = m; }
      }
      if (alpha >= beta) break;
    }
    return { v: color === rootColor ? alpha : beta, move: best };
  }

  function aiMove(b, color, depth) {
    const deadline = Date.now() + 1200;
    const r = search(b, color, depth, -Infinity, Infinity, color, deadline);
    return r.move;
  }

  // ---------- 界面 ----------
  const el = (tag, props = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "class") n.className = v;
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2).toLowerCase(), v);
      else n.setAttribute(k, v);
    }
    kids.flat().forEach((k) => k && n.appendChild(k instanceof Node ? k : document.createTextNode(String(k))));
    return n;
  };

  const canvas = document.getElementById("chess");
  if (!canvas) return;
  const ctx = canvas.getContext ? canvas.getContext("2d") : null;
  if (!ctx) { document.body.insertAdjacentHTML("beforeend", "<p>浏览器不支持 canvas</p>"); return; }

  let board = initialBoard(), turn = RED, selected = null, hint = [], over = false, thinking = false;
  let animating = false, lastMove = null, history = [];

  const CELL = 56, PAD = 28;
  const W = PAD * 2 + CELL * 8, H = PAD * 2 + CELL * 9;
  const status = document.getElementById("status");
  const undoBtn = document.getElementById("undo");

  function resize() {
    const cssW = canvas.clientWidth || 360;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssW * (H / W) * dpr);
  }

  function px(x) { return PAD + x * CELL; }
  function py(y) { return PAD + y * CELL; }

  function draw() {
    const scale = canvas.width / W;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // 底色
    ctx.fillStyle = "#f2dfb8";
    ctx.fillRect(0, 0, W, H);
    // 棋盘线
    ctx.strokeStyle = "#6b4f27";
    ctx.lineWidth = 1.5;
    for (let y = 0; y < 10; y++) {
      ctx.beginPath(); ctx.moveTo(px(0), py(y)); ctx.lineTo(px(8), py(y)); ctx.stroke();
    }
    for (let x = 0; x < 9; x++) {
      ctx.beginPath(); ctx.moveTo(px(x), py(0)); ctx.lineTo(px(x), py(9)); ctx.stroke();
    }
    // 楚河汉界
    ctx.fillStyle = "#8a6a3b";
    ctx.font = "bold 24px serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("楚 河", px(2), py(4.5));
    ctx.fillText("漢 界", px(6), py(4.5));

    // 选中高亮
    if (selected) {
      ctx.fillStyle = "rgba(52,211,153,.35)";
      ctx.fillRect(px(selected[0]) - CELL / 2, py(selected[1]) - CELL / 2, CELL, CELL);
    }
    for (const [x, y] of hint) {
      ctx.beginPath();
      ctx.arc(px(x), py(y), 9, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(52,211,153,.75)";
      ctx.fill();
    }
    if (lastMove) {
      [lastMove.from, lastMove.to].forEach(([x, y]) => {
        ctx.strokeStyle = "rgba(251,191,36,.9)";
        ctx.lineWidth = 3;
        ctx.strokeRect(px(x) - CELL / 2 + 3, py(y) - CELL / 2 + 3, CELL - 6, CELL - 6);
      });
    }

    // 棋子
    for (let y = 0; y < 10; y++) for (let x = 0; x < 9; x++) {
      const p = board[y][x];
      if (!p) continue;
      const cx = px(x), cy = py(y), r = CELL * 0.42;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = p.c === RED ? "#fdf3e0" : "#f6ecd8";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = p.c === RED ? "#c0392b" : "#2c2c2c";
      ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
      ctx.strokeStyle = p.c === RED ? "rgba(192,57,43,.45)" : "rgba(44,44,44,.45)";
      ctx.stroke();
      ctx.fillStyle = p.c === RED ? "#c0392b" : "#1f1f1f";
      ctx.font = "bold " + (CELL * 0.46) + "px 'PingFang SC','Microsoft YaHei',serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(NAMES[p.c][p.t], cx, cy + 1);
    }
  }

  function coord(evt) {
    const r = canvas.getBoundingClientRect();
    const cx = (evt.clientX - r.left) / r.width * W;
    const cy = (evt.clientY - r.top) / r.height * H;
    const x = Math.round((cx - PAD) / CELL);
    const y = Math.round((cy - PAD) / CELL);
    if (!inBoard(x, y)) return null;
    return [x, y];
  }

  function say(t) { if (status) status.textContent = t; }

  function gameOver(winner) {
    over = true;
    say(winner === RED ? "红方胜！" : "黑方胜！");
  }

  function checkEnd(b, color) {
    const ms = legalMoves(b, color);
    if (!ms.length) {
      gameOver(color === RED ? BLACK : RED);
      return true;
    }
    if (inCheck(b, color)) say((color === RED ? "红方" : "黑方") + "被将军！");
    return false;
  }

  function onClick(evt) {
    if (over || thinking) return;
    const c = coord(evt);
    if (!c) return;
    const [x, y] = c;
    const p = board[y][x];

    if (selected) {
      const ok = hint.some(([hx, hy]) => hx === x && hy === y);
      if (ok) {
        history.push({ board: cloneBoard(board), turn });
        board = applyMove(board, selected, [x, y]);
        lastMove = { from: selected, to: [x, y] };
        selected = null; hint = [];
        turn = BLACK;
        draw();
        if (checkEnd(board, turn)) return;
        aiTurn();
        return;
      }
    }
    if (p && p.c === turn) {
      selected = [x, y];
      hint = genMoves(board, x, y).filter(([mx, my]) => !inCheck(applyMove(board, [x, y], [mx, my]), turn));
      draw();
    } else {
      selected = null; hint = []; draw();
    }
  }

  function aiTurn() {
    thinking = true;
    say("电脑思考中…");
    setTimeout(() => {
      const m = aiMove(board, BLACK, 3);
      if (!m) { thinking = false; gameOver(RED); return; }
      board = applyMove(board, m.from, m.to);
      lastMove = m;
      turn = RED;
      thinking = false;
      draw();
      if (!checkEnd(board, turn)) say("轮到红方（你）");
    }, 30);
  }

  function reset() {
    board = initialBoard(); turn = RED; selected = null; hint = []; over = false; thinking = false; lastMove = null; history = [];
    draw(); say("轮到红方（你）");
  }

  canvas.addEventListener("click", onClick);
  undoBtn && undoBtn.addEventListener("click", () => {
    if (thinking) return;
    // 回退两步（玩家 + 电脑）
    for (let i = 0; i < 2 && history.length; i++) {
      const h = history.pop();
      board = h.board; turn = h.turn;
    }
    selected = null; hint = []; over = false; lastMove = null;
    draw(); say("已悔棋");
  });
  document.getElementById("restart") && document.getElementById("restart").addEventListener("click", reset);
  window.addEventListener("resize", () => { resize(); draw(); });

  resize();
  reset();
})();
