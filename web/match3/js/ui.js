/**
 * UI 管理器
 * 处理所有界面渲染和动画
 */

const UI = (() => {
  let boardEl = null;
  let hintCells = [];
  let swipeStart = null;

  function init() {
    boardEl = document.getElementById('game-board');
    AudioEngine.init();
    ParticleSystem.init();
    loadBestScore();
    setupTouchEvents();
  }

  function loadBestScore() {
    const best = localStorage.getItem('bestScore') || '0';
    const els = document.querySelectorAll('#best-score-start, #best-score-game');
    els.forEach(el => { if (el) el.textContent = best; });
  }

  // ====== 棋盘渲染 ======
  function renderBoard() {
    if (!boardEl) return;
    boardEl.innerHTML = '';

    const board = Game.getBoard();
    for (let r = 0; r < Game.BOARD_SIZE; r++) {
      for (let c = 0; c < Game.BOARD_SIZE; c++) {
        boardEl.appendChild(createCellElement(r, c, board[r][c]));
      }
    }
  }

  function createCellElement(r, c, gem) {
    const cell = document.createElement('div');
    cell.className = `gem-cell gem-${gem.type}`;
    cell.dataset.row = r;
    cell.dataset.col = c;

    // 添加特殊宝石标记
    if (gem.special === Game.SPECIAL.BOMB) cell.classList.add('gem-special-bomb');
    else if (gem.special === Game.SPECIAL.ROW) cell.classList.add('gem-special-row');
    else if (gem.special === Game.SPECIAL.COL) cell.classList.add('gem-special-col');

    // 宝石图标
    const icon = document.createElement('span');
    icon.className = 'gem-icon';
    icon.textContent = getGemEmoji(gem.type, gem.special);
    cell.appendChild(icon);

    // 事件绑定
    cell.addEventListener('click', () => {
      AudioEngine.init(); // 确保音频初始化（需要用户交互）
      Game.onCellClick(r, c);
    });

    return cell;
  }

  function getGemEmoji(type, special) {
    const baseEmojis = ['💎', '🔮', '🌟', '🏆', '🌊', '🌸', '🌈'];
    const specialEmojis = {
      [Game.SPECIAL.BOMB]: ['💥', '🌋', '💣', '🔥', '⚡', '🌪', '☄️'],
      [Game.SPECIAL.ROW]:  ['↔', '↔', '↔', '↔', '↔', '↔', '↔'],
      [Game.SPECIAL.COL]:  ['↕', '↕', '↕', '↕', '↕', '↕', '↕'],
    };

    if (special && special !== Game.SPECIAL.NONE) {
      return specialEmojis[special]?.[type] || baseEmojis[type];
    }
    return baseEmojis[type];
  }

  function getCellElement(row, col) {
    if (!boardEl) return null;
    return boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  }

  // ====== 选择状态 ======
  function setSelected(row, col, selected) {
    const cell = getCellElement(row, col);
    if (!cell) return;
    cell.classList.toggle('selected', selected);
  }

  // ====== 动画 ======
  function animateSwap(r1, c1, r2, c2, callback) {
    const cell1 = getCellElement(r1, c1);
    const cell2 = getCellElement(r2, c2);
    if (!cell1 || !cell2) { callback(); return; }

    const rect1 = cell1.getBoundingClientRect();
    const rect2 = cell2.getBoundingClientRect();

    const dx = rect2.left - rect1.left;
    const dy = rect2.top - rect1.top;

    cell1.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
    cell2.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
    cell1.style.transform = `translate(${dx}px, ${dy}px)`;
    cell2.style.transform = `translate(${-dx}px, ${-dy}px)`;
    cell1.classList.add('animating-swap');
    cell2.classList.add('animating-swap');

    setTimeout(() => {
      cell1.style.transition = '';
      cell1.style.transform = '';
      cell2.style.transition = '';
      cell2.style.transform = '';
      cell1.classList.remove('animating-swap');
      cell2.classList.remove('animating-swap');
      // 重新渲染
      renderBoard();
      callback();
    }, 220);
  }

  function animateMatch(matches, callback) {
    if (!boardEl) { callback(); return; }

    let pending = matches.length;
    let called = false;
    if (pending === 0) { callback(); return; }

    const done = () => {
      if (called) return;
      called = true;
      callback();
    };

    matches.forEach(({ row, col }) => {
      const cell = getCellElement(row, col);
      if (cell) {
        cell.classList.add('animating-match');
        cell.addEventListener('animationend', () => {
          pending--;
          if (pending <= 0) done();
        }, { once: true });
      } else {
        pending--;
        if (pending <= 0) done();
      }
    });

    // 安全回调
    setTimeout(() => {
      if (pending > 0) done();
    }, 500);
  }

  function animateDrop(boardData, dropDist, callback) {
    renderBoard();

    // 根据下落距离计算动画
    let maxDelay = 0;
    const cellSize = boardEl.querySelector('.gem-cell')?.offsetHeight || 50;

    for (let r = 0; r < Game.BOARD_SIZE; r++) {
      for (let c = 0; c < Game.BOARD_SIZE; c++) {
        const cell = getCellElement(r, c);
        if (!cell) continue;

        const dist = dropDist[r][c];
        if (dist > 0) {
          // 这个格子从上方落下来了
          const offsetY = -dist * cellSize;
          cell.style.transform = `translateY(${offsetY}px)`;
          cell.style.transition = 'none';
        }
      }
    }

    // 强制重排后启动动画
    void boardEl.offsetHeight;

    for (let r = 0; r < Game.BOARD_SIZE; r++) {
      for (let c = 0; c < Game.BOARD_SIZE; c++) {
        const cell = getCellElement(r, c);
        if (!cell) continue;

        const dist = dropDist[r][c];
        if (dist > 0) {
          const duration = Math.min(0.1 + dist * 0.06, 0.5);
          const delay = c * 0.02;
          maxDelay = Math.max(maxDelay, (delay + duration) * 1000);

          cell.style.transition = `transform ${duration}s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s`;
          cell.style.transform = 'translateY(0)';

          cell.addEventListener('transitionend', function handler() {
            cell.style.transition = '';
            cell.style.transform = '';
            cell.removeEventListener('transitionend', handler);
          });

          AudioEngine.playDrop(r);
        }
      }
    }

    setTimeout(callback, maxDelay + 100);
  }

  function animateInvalid(row, col) {
    const cell = getCellElement(row, col);
    if (!cell) return;
    cell.classList.add('animating-invalid');
    cell.addEventListener('animationend', () => {
      cell.classList.remove('animating-invalid');
    }, { once: true });
  }

  // ====== 提示 ======
  function showHint(cells) {
    clearHint();
    hintCells = cells;
    cells.forEach(({ row, col }) => {
      const cell = getCellElement(row, col);
      if (cell) cell.classList.add('hint-glow');
    });
  }

  function clearHint() {
    hintCells.forEach(({ row, col }) => {
      const cell = getCellElement(row, col);
      if (cell) cell.classList.remove('hint-glow');
    });
    hintCells = [];
  }

  // ====== 连击显示 ======
  function showCombo(count) {
    const el = document.getElementById('combo-display');
    const countEl = document.getElementById('combo-count');
    if (!el || !countEl) return;

    countEl.textContent = `x${count}`;
    el.classList.remove('hidden');
    el.style.animation = 'none';
    void el.offsetWidth; // 触发重排
    el.style.animation = 'combo-appear 1.2s ease forwards';

    setTimeout(() => {
      el.classList.add('hidden');
    }, 1200);
  }

  // ====== 分数弹出 ======
  function showScorePopup(points, x, y, combo) {
    const container = document.getElementById('score-popup-container');
    if (!container) return;

    const popup = document.createElement('div');
    popup.className = 'score-popup';

    let text = `+${points}`;
    if (combo > 1) text += ` x${combo}`;

    popup.textContent = text;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    popup.style.transform = 'translateX(-50%)';

    container.appendChild(popup);
    popup.addEventListener('animationend', () => popup.remove());
  }

  // ====== UI 更新 ======
  function updateAll() {
    updateScore();
    updateMoves();
    updateLevel();
    updateProgress();
    loadBestScore();
  }

  function updateScore() {
    const el = document.getElementById('score-display');
    if (el) {
      const old = parseInt(el.textContent) || 0;
      const newScore = Game.getScore();
      el.textContent = newScore;

      if (newScore > old) {
        el.classList.add('score-up');
        el.addEventListener('animationend', () => el.classList.remove('score-up'), { once: true });
      }
    }

    // 更新最高分
    const bestEl = document.getElementById('best-score-game');
    if (bestEl) bestEl.textContent = Game.getBestScore();
    const bestStartEl = document.getElementById('best-score-start');
    if (bestStartEl) bestStartEl.textContent = Game.getBestScore();

    updateProgress();
  }

  function updateMoves() {
    const el = document.getElementById('moves-display');
    if (el) {
      el.textContent = Game.getMoves();
      // 少步数警告
      if (Game.getMoves() <= 5) {
        el.style.color = '#ff4757';
        el.style.animation = 'score-pop 0.5s ease';
        el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
      } else {
        el.style.color = '';
      }
    }
  }

  function updateLevel() {
    const el = document.getElementById('level-display');
    if (el) el.textContent = Game.getLevel();
  }

  function updateProgress() {
    const score = Game.getScore();
    const target = Game.getLevelConfig().target;
    const pct = Math.min((score / target) * 100, 100);

    const fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = `${pct}%`;

    const targetEl = document.getElementById('target-score');
    if (targetEl) targetEl.textContent = target;
  }

  // ====== 屏幕切换 ======
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) {
      target.classList.add('active');
    }
  }

  // ====== 关卡完成界面 ======
  function showLevelComplete(level, score, movesLeft, bestCombo) {
    document.getElementById('complete-level').textContent = level;
    document.getElementById('final-score').textContent = score;
    document.getElementById('remaining-moves').textContent = movesLeft;
    document.getElementById('best-combo').textContent = bestCombo;

    // 星星评分
    const target = Game.getLevelConfig().target;
    let stars = 1;
    if (score >= target * 1.5) stars = 3;
    else if (score >= target * 1.2) stars = 2;

    const starsEl = document.getElementById('stars-display');
    if (starsEl) {
      starsEl.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        star.textContent = i < stars ? '⭐' : '☆';
        starsEl.appendChild(star);
      }
    }

    showScreen('level-complete-screen');

    // 撒花特效
    setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const x = window.innerWidth * Math.random();
          const y = window.innerHeight * 0.3 + Math.random() * 200;
          ParticleSystem.burst(x, y, '#ffd700', 20);
          ParticleSystem.stars(x, y, 8);
        }, i * 150);
      }
    }, 300);
  }

  // ====== 游戏结束界面 ======
  function showGameOver(score, bestScore) {
    document.getElementById('over-score').textContent = score;
    document.getElementById('over-best').textContent = bestScore;
    showScreen('game-over-screen');
  }

  // ====== 触摸/滑动支持 ======
  function setupTouchEvents() {
    document.addEventListener('touchstart', e => {
      const cell = e.target.closest('.gem-cell');
      if (!cell) return;
      swipeStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        row: parseInt(cell.dataset.row),
        col: parseInt(cell.dataset.col)
      };
    }, { passive: true });

    document.addEventListener('touchend', e => {
      if (!swipeStart) return;

      const dx = e.changedTouches[0].clientX - swipeStart.x;
      const dy = e.changedTouches[0].clientY - swipeStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 15) {
        // 视为点击
        swipeStart = null;
        return;
      }

      // 确定滑动方向
      let targetRow = swipeStart.row;
      let targetCol = swipeStart.col;

      if (Math.abs(dx) > Math.abs(dy)) {
        targetCol += dx > 0 ? 1 : -1;
      } else {
        targetRow += dy > 0 ? 1 : -1;
      }

      // 边界检查
      if (targetRow >= 0 && targetRow < Game.BOARD_SIZE &&
          targetCol >= 0 && targetCol < Game.BOARD_SIZE) {
        AudioEngine.init();
        // 直接触发交换逻辑
        const { row, col } = swipeStart;
        if (!Game.isAnimating()) {
          // 通过模拟两次点击实现滑动交换
          Game.onCellClick(row, col);
          setTimeout(() => Game.onCellClick(targetRow, targetCol), 50);
        }
      }

      swipeStart = null;
    }, { passive: true });
  }

  return {
    init,
    renderBoard,
    getCellElement,
    setSelected,
    animateSwap,
    animateMatch,
    animateDrop,
    animateInvalid,
    showHint,
    clearHint,
    showCombo,
    showScorePopup,
    updateAll,
    updateScore,
    updateMoves,
    updateLevel,
    updateProgress,
    showScreen,
    showLevelComplete,
    showGameOver
  };
})();

// ====== 全局游戏控制函数 (HTML onclick 使用) ======
function startGame() {
  AudioEngine.init();
  AudioEngine.playClick();
  UI.showScreen('game-screen');
  Game.init(1);
}

function showHowToPlay() {
  AudioEngine.init();
  AudioEngine.playClick();
  UI.showScreen('howto-screen');
}

function hideHowToPlay() {
  AudioEngine.playClick();
  UI.showScreen('start-screen');
}

function showStartScreen() {
  AudioEngine.playClick();
  UI.showScreen('start-screen');
}

function pauseGame() {
  if (Game.isAnimating()) return;
  AudioEngine.playClick();
  Game.pause();
  UI.showScreen('pause-screen');
}

function resumeGame() {
  AudioEngine.playClick();
  Game.resume();
  UI.showScreen('game-screen');
}

function restartGame() {
  AudioEngine.playClick();
  UI.showScreen('game-screen');
  Game.restart();
}

function nextLevel() {
  AudioEngine.playClick();
  UI.showScreen('game-screen');
  Game.nextLevel();
}

function shuffleBoard() {
  if (Game.isAnimating()) return;
  Game.shuffle();
}

function toggleSound() {
  AudioEngine.init();
  const newState = !AudioEngine.isEnabled();
  AudioEngine.setEnabled(newState);
  document.getElementById('sound-icon').textContent = newState ? '🔊' : '🔇';
  if (newState) AudioEngine.playClick();
}

// ====== 初始化 ======
document.addEventListener('DOMContentLoaded', () => {
  UI.init();
  UI.showScreen('start-screen');

  // 键盘支持
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const gameActive = document.getElementById('game-screen').classList.contains('active');
      const pauseActive = document.getElementById('pause-screen').classList.contains('active');
      if (gameActive && !pauseActive) pauseGame();
      else if (pauseActive) resumeGame();
    }
  });
});
