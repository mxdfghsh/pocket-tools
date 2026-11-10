/**
 * 游戏核心逻辑
 * 消消乐 (Match-3) 游戏引擎
 */

const Game = (() => {
  // ====== 常量 ======
  const BOARD_SIZE = 8;
  const GEM_TYPES = 7; // 宝石种类数
  const GEM_EMOJIS = ['🔴', '🟣', '🟢', '🟡', '🔵', '🟠', '💜'];
  const GEM_COLORS = [
    '#ff6b6b', '#764ba2', '#43e97b', '#ffd200',
    '#4facfe', '#f7971e', '#c471ed'
  ];

  // 关卡配置
  const LEVELS = [
    { target: 1000,  moves: 30, gemTypes: 5 },
    { target: 2000,  moves: 28, gemTypes: 5 },
    { target: 3500,  moves: 26, gemTypes: 6 },
    { target: 5000,  moves: 25, gemTypes: 6 },
    { target: 7500,  moves: 24, gemTypes: 6 },
    { target: 10000, moves: 22, gemTypes: 7 },
    { target: 13000, moves: 22, gemTypes: 7 },
    { target: 17000, moves: 20, gemTypes: 7 },
    { target: 22000, moves: 20, gemTypes: 7 },
    { target: 28000, moves: 18, gemTypes: 7 },
  ];

  // ====== 状态 ======
  let board = [];        // 棋盘数据 [row][col] = {type, special}
  let selected = null;   // 已选择的格子 {row, col}
  let score = 0;
  let moves = 0;
  let level = 1;
  let combo = 0;
  let maxCombo = 0;
  let isAnimating = false;
  let isPaused = false;
  let hintTimer = null;
  let bestScore = 0;

  // 特殊宝石类型
  const SPECIAL = {
    NONE: 0,
    BOMB: 1,    // 5个匹配 - 爆炸消除3x3
    ROW: 2,     // 4个水平匹配 - 清除整行
    COL: 3,     // 4个垂直匹配 - 清除整列
    RAINBOW: 4  // T或L型匹配 - 消除同色
  };

  // ====== 初始化 ======
  function init(lvl = 1) {
    level = Math.min(lvl, LEVELS.length);
    const cfg = getLevelConfig();
    score = 0;
    moves = cfg.moves;
    combo = 0;
    maxCombo = 0;
    isAnimating = false;
    isPaused = false;
    selected = null;
    bestScore = parseInt(localStorage.getItem('bestScore') || '0');

    clearHintTimer();
    generateBoard();
    UI.updateAll();
    UI.renderBoard();
  }

  function getLevelConfig() {
    return LEVELS[Math.min(level - 1, LEVELS.length - 1)];
  }

  // ====== 棋盘生成 ======
  function generateBoard() {
    const gemTypes = getLevelConfig().gemTypes;
    let attempts = 0;

    do {
      board = [];
      for (let r = 0; r < BOARD_SIZE; r++) {
        board[r] = [];
        for (let c = 0; c < BOARD_SIZE; c++) {
          board[r][c] = {
            type: Math.floor(Math.random() * gemTypes),
            special: SPECIAL.NONE
          };
        }
      }
      // 消除初始匹配
      resolveInitialMatches();
      attempts++;
    } while (!hasValidMoves() && attempts < 10);
  }

  function resolveInitialMatches() {
    let changed = true;
    while (changed) {
      changed = false;
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const type = board[r][c].type;
          const gemTypes = getLevelConfig().gemTypes;

          // 检查水平
          if (c >= 2 && board[r][c-1].type === type && board[r][c-2].type === type) {
            board[r][c].type = getRandomOther(type, gemTypes);
            changed = true;
          }
          // 检查垂直
          if (r >= 2 && board[r-1][c].type === type && board[r-2][c].type === type) {
            board[r][c].type = getRandomOther(type, gemTypes);
            changed = true;
          }
        }
      }
    }
  }

  function getRandomOther(exclude, max) {
    let t;
    do { t = Math.floor(Math.random() * max); } while (t === exclude);
    return t;
  }

  // ====== 点击/交换逻辑 ======
  function onCellClick(row, col) {
    if (isAnimating || isPaused) return;

    AudioEngine.playSelect();
    clearHintTimer();

    if (selected === null) {
      // 选择第一个
      selected = { row, col };
      UI.setSelected(row, col, true);
    } else {
      const sr = selected.row;
      const sc = selected.col;

      if (sr === row && sc === col) {
        // 取消选择
        UI.setSelected(sr, sc, false);
        selected = null;
        return;
      }

      // 检查是否相邻
      const dr = Math.abs(row - sr);
      const dc = Math.abs(col - sc);

      if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        // 尝试交换
        UI.setSelected(sr, sc, false);
        selected = null;
        attemptSwap(sr, sc, row, col);
      } else {
        // 选择新格子
        UI.setSelected(sr, sc, false);
        selected = { row, col };
        UI.setSelected(row, col, true);
      }
    }
  }

  function attemptSwap(r1, c1, r2, c2) {
    isAnimating = true;
    AudioEngine.playSwap();

    // 执行交换
    swap(r1, c1, r2, c2);

    // 动画
    UI.animateSwap(r1, c1, r2, c2, () => {
      const matches = findAllMatches();

      if (matches.length === 0) {
        // 无匹配，交换回去
        swap(r1, c1, r2, c2);
        UI.animateSwap(r1, c1, r2, c2, () => {
          UI.animateInvalid(r1, c1);
          UI.animateInvalid(r2, c2);
          AudioEngine.playInvalid();
          isAnimating = false;
          scheduleHint();
        });
      } else {
        // 有匹配，消耗步数
        moves--;
        combo = 0;
        UI.updateMoves();
        processMatches(matches, () => {
          checkGameState();
          isAnimating = false;
          scheduleHint();
        });
      }
    });
  }

  function swap(r1, c1, r2, c2) {
    const temp = board[r1][c1];
    board[r1][c1] = board[r2][c2];
    board[r2][c2] = temp;
  }

  // ====== 匹配检测 ======
  function findAllMatches() {
    const matched = new Set();

    // 水平匹配
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c <= BOARD_SIZE - 3; c++) {
        const type = board[r][c].type;
        let len = 1;
        while (c + len < BOARD_SIZE && board[r][c + len].type === type) len++;

        if (len >= 3) {
          for (let i = 0; i < len; i++) matched.add(`${r},${c+i}`);
          c += len - 1;
        }
      }
    }

    // 垂直匹配
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (let r = 0; r <= BOARD_SIZE - 3; r++) {
        const type = board[r][c].type;
        let len = 1;
        while (r + len < BOARD_SIZE && board[r + len][c].type === type) len++;

        if (len >= 3) {
          for (let i = 0; i < len; i++) matched.add(`${r+i},${c}`);
          r += len - 1;
        }
      }
    }

    return Array.from(matched).map(k => {
      const [r, c] = k.split(',').map(Number);
      return { row: r, col: c };
    });
  }

  // 检测匹配形状以确定特殊宝石
  function getMatchInfo(r1, c1, r2, c2) {
    // 临时交换后检测
    const infos = [];

    // 水平匹配
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c <= BOARD_SIZE - 3; c++) {
        const type = board[r][c].type;
        let len = 1;
        while (c + len < BOARD_SIZE && board[r][c + len].type === type) len++;

        if (len >= 3) {
          infos.push({ cells: Array.from({length: len}, (_, i) => ({row: r, col: c+i})), dir: 'h', len });
          c += len - 1;
        }
      }
    }

    // 垂直匹配
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (let r = 0; r <= BOARD_SIZE - 3; r++) {
        const type = board[r][c].type;
        let len = 1;
        while (r + len < BOARD_SIZE && board[r + len][c].type === type) len++;

        if (len >= 3) {
          infos.push({ cells: Array.from({length: len}, (_, i) => ({row: r+i, col: c})), dir: 'v', len });
          r += len - 1;
        }
      }
    }

    return infos;
  }

  // ====== 消除处理 ======
  function processMatches(matches, callback) {
    if (matches.length === 0) {
      callback();
      return;
    }

    combo++;
    if (combo > maxCombo) maxCombo = combo;

    // 计算分数
    const baseScore = matches.length * 50;
    const comboBonus = combo > 1 ? Math.pow(combo, 1.5) : 1;
    const earned = Math.round(baseScore * comboBonus);
    score += earned;
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('bestScore', bestScore);
    }

    // 播放音效
    if (combo > 1) {
      AudioEngine.playCombo(combo);
      UI.showCombo(combo);
    } else {
      AudioEngine.playMatch(matches.length, 1);
    }

    // 检测特殊宝石并激活
    const specialCells = [];
    matches.forEach(({ row, col }) => {
      if (board[row][col].special !== SPECIAL.NONE) {
        specialCells.push({ row, col, special: board[row][col].special });
      }
    });

    // 显示分数弹出
    if (matches.length > 0) {
      const centerMatch = matches[Math.floor(matches.length / 2)];
      const cellEl = UI.getCellElement(centerMatch.row, centerMatch.col);
      if (cellEl) {
        const rect = cellEl.getBoundingClientRect();
        UI.showScorePopup(earned, rect.left + rect.width / 2, rect.top, combo);
      }
    }

    // 爆炸特效
    const matchInfos = getMatchInfo();
    matches.forEach(({ row, col }) => {
      const cellEl = UI.getCellElement(row, col);
      if (cellEl) {
        const rect = cellEl.getBoundingClientRect();
        ParticleSystem.burst(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          GEM_COLORS[board[row][col].type] || '#fff',
          8
        );
        ParticleSystem.stars(rect.left + rect.width / 2, rect.top + rect.height / 2, 3);
      }
    });

    // 处理特殊宝石效果
    let extraMatches = new Set(matches.map(m => `${m.row},${m.col}`));

    specialCells.forEach(({ row, col, special }) => {
      if (special === SPECIAL.ROW) {
        AudioEngine.playLineClear();
        const cellEl = UI.getCellElement(row, col);
        if (cellEl) {
          const effectsLayer = document.getElementById('effects-layer');
          ParticleSystem.rowClear(cellEl.getBoundingClientRect(), effectsLayer);
        }
        for (let c = 0; c < BOARD_SIZE; c++) extraMatches.add(`${row},${c}`);
      } else if (special === SPECIAL.COL) {
        AudioEngine.playLineClear();
        const cellEl = UI.getCellElement(row, col);
        if (cellEl) {
          const effectsLayer = document.getElementById('effects-layer');
          ParticleSystem.colClear(cellEl.getBoundingClientRect(), effectsLayer);
        }
        for (let r = 0; r < BOARD_SIZE; r++) extraMatches.add(`${r},${col}`);
      } else if (special === SPECIAL.BOMB) {
        AudioEngine.playExplosion();
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = row + dr, nc = col + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
              extraMatches.add(`${nr},${nc}`);
            }
          }
        }
      }
    });

    const allMatches = Array.from(extraMatches).map(k => {
      const [r, c] = k.split(',').map(Number);
      return { row: r, col: c };
    });

    // 确定特殊宝石生成（在消除之前记录生成位置和类型）
    let newSpecialGem = null;
    matchInfos.forEach(info => {
      if (info.len >= 5) {
        const center = info.cells[Math.floor(info.len / 2)];
        newSpecialGem = {
          row: center.row,
          col: center.col,
          type: board[center.row][center.col].type,
          special: SPECIAL.BOMB
        };
      } else if (info.len === 4 && !newSpecialGem) {
        const center = info.cells[Math.floor(info.len / 2)];
        newSpecialGem = {
          row: center.row,
          col: center.col,
          type: board[center.row][center.col].type,
          special: info.dir === 'h' ? SPECIAL.ROW : SPECIAL.COL
        };
      }
    });

    // 动画消除
    UI.animateMatch(allMatches, () => {
      // 从棋盘中移除匹配格子
      allMatches.forEach(({ row, col }) => {
        board[row][col] = null;
      });

      // 生成特殊宝石（在下落之前）
      if (newSpecialGem) {
        board[newSpecialGem.row][newSpecialGem.col] = {
          type: newSpecialGem.type,
          special: newSpecialGem.special
        };
      }

      // 下落（dropGems内部已包含新宝石填充）
      dropGems(() => {
        UI.renderBoard();

        // 检测连锁
        setTimeout(() => {
          const newMatches = findAllMatches();
          if (newMatches.length > 0) {
            processMatches(newMatches, callback);
          } else {
            combo = 0;
            UI.updateScore();
            callback();
          }
        }, 300);
      });
    });
  }

  // ====== 宝石下落 ======
  function dropGems(callback) {
    // 记录每个格子最终位置的下落距离（行数）
    const dropDist = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      dropDist[r] = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        dropDist[r][c] = 0;
      }
    }

    let dropped = false;

    for (let c = 0; c < BOARD_SIZE; c++) {
      // 统计该列空格数量
      let emptyCount = 0;
      for (let r = 0; r < BOARD_SIZE; r++) {
        if (board[r][c] === null) emptyCount++;
      }

      if (emptyCount === 0) continue;

      // 下落：将非空格子压到底部
      let writeRow = BOARD_SIZE - 1;
      for (let r = BOARD_SIZE - 1; r >= 0; r--) {
        if (board[r][c] !== null) {
          if (r !== writeRow) {
            board[writeRow][c] = board[r][c];
            board[r][c] = null;
            dropDist[writeRow][c] = writeRow - r;
            dropped = true;
          }
          writeRow--;
        }
      }

      // 填充顶部空格（新宝石从上方落入）
      const gemTypes = getLevelConfig().gemTypes;
      let newFromAbove = emptyCount; // 新宝石从第-emptyCount行开始
      for (let r = writeRow; r >= 0; r--) {
        board[r][c] = {
          type: Math.floor(Math.random() * gemTypes),
          special: SPECIAL.NONE
        };
        // 新宝石从棋盘上方落入，下落距离 = emptyCount（从上面落入的距离）
        dropDist[r][c] = emptyCount;
        dropped = true;
      }
    }

    if (dropped) {
      UI.animateDrop(board, dropDist, callback);
    } else {
      callback();
    }
  }

  // ====== 填充空格 ======
  function fillBoard() {
    const gemTypes = getLevelConfig().gemTypes;
    // 先记录每列空格数，用于计算新宝石的"下落距离"
    for (let c = 0; c < BOARD_SIZE; c++) {
      let emptyCount = 0;
      for (let r = 0; r < BOARD_SIZE; r++) {
        if (board[r][c] === null) emptyCount++;
      }
      // 从顶部填充空格
      let newIdx = 0;
      for (let r = 0; r < BOARD_SIZE; r++) {
        if (board[r][c] === null) {
          board[r][c] = {
            type: Math.floor(Math.random() * gemTypes),
            special: SPECIAL.NONE
          };
          // 标记新宝石的下落距离（从棋盘外落入）
          newIdx++;
        }
      }
    }
  }

  // ====== 检查有效步骤 ======
  function hasValidMoves() {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        // 检查向右交换
        if (c + 1 < BOARD_SIZE) {
          swap(r, c, r, c + 1);
          const m = findAllMatches().length > 0;
          swap(r, c, r, c + 1);
          if (m) return true;
        }
        // 检查向下交换
        if (r + 1 < BOARD_SIZE) {
          swap(r, c, r + 1, c);
          const m = findAllMatches().length > 0;
          swap(r, c, r + 1, c);
          if (m) return true;
        }
      }
    }
    return false;
  }

  // 寻找一个提示
  function findHint() {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (c + 1 < BOARD_SIZE) {
          swap(r, c, r, c + 1);
          const hasMatch = findAllMatches().length > 0;
          swap(r, c, r, c + 1);
          if (hasMatch) return [{ row: r, col: c }, { row: r, col: c + 1 }];
        }
        if (r + 1 < BOARD_SIZE) {
          swap(r, c, r + 1, c);
          const hasMatch = findAllMatches().length > 0;
          swap(r, c, r + 1, c);
          if (hasMatch) return [{ row: r, col: c }, { row: r + 1, col: c }];
        }
      }
    }
    return null;
  }

  // ====== 洗牌 ======
  function shuffle() {
    if (isAnimating) return;
    AudioEngine.playClick();

    // Fisher-Yates 洗牌
    const cells = [];
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++)
        cells.push(board[r][c]);

    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    let idx = 0;
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++)
        board[r][c] = cells[idx++];

    resolveInitialMatches();
    if (!hasValidMoves()) shuffle();

    UI.renderBoard();
  }

  // ====== 游戏状态检查 ======
  function checkGameState() {
    const cfg = getLevelConfig();

    if (score >= cfg.target) {
      // 关卡完成
      setTimeout(() => {
        AudioEngine.playLevelComplete();
        UI.showLevelComplete(level, score, moves, maxCombo);
      }, 500);
      return;
    }

    if (moves <= 0) {
      // 游戏失败
      setTimeout(() => {
        AudioEngine.playGameOver();
        UI.showGameOver(score, bestScore);
      }, 500);
      return;
    }

    if (!hasValidMoves()) {
      // 无有效步骤，自动洗牌
      setTimeout(() => shuffle(), 300);
    }
  }

  // ====== 提示系统 ======
  function scheduleHint() {
    clearHintTimer();
    hintTimer = setTimeout(() => {
      if (isAnimating || isPaused) return;
      const hint = findHint();
      if (hint) {
        AudioEngine.playHint();
        UI.showHint(hint);
      }
    }, 5000);
  }

  function clearHintTimer() {
    if (hintTimer) {
      clearTimeout(hintTimer);
      hintTimer = null;
    }
    UI.clearHint();
  }

  // ====== 公共接口 ======
  return {
    init,
    onCellClick,
    shuffle,
    getBoard: () => board,
    getScore: () => score,
    getMoves: () => moves,
    getLevel: () => level,
    getBestScore: () => bestScore,
    getLevelConfig,
    BOARD_SIZE,
    GEM_EMOJIS,
    GEM_COLORS,
    SPECIAL,
    pause() { isPaused = true; },
    resume() { isPaused = false; scheduleHint(); },
    nextLevel() { init(level + 1); AudioEngine.playNewLevel(); },
    restart() { init(level); },
    isAnimating: () => isAnimating
  };
})();
