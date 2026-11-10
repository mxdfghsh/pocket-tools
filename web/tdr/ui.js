const GameUI = (() => {
  const elements = Object.fromEntries(
    Array.from(document.querySelectorAll('[id]')).map(element => [element.id, element])
  );
  const previousValues = new Map();
  let previousScreen = '';
  let previousCards = null;
  let previousModuleCount = -1;
  let nextUpdate = 0;
  let toastTimer = null;
  let returnFocus = null;

  document.querySelectorAll('[data-icon]').forEach(element => {
    element.innerHTML = Art.icon(element.dataset.icon);
  });

  function text(id, value) {
    const normalized = String(value);
    if (previousValues.get(id) === normalized) return;
    elements[id].textContent = normalized;
    previousValues.set(id, normalized);
  }

  function percent(id, value) {
    const normalized = `${Math.max(0, Math.min(100, value)).toFixed(2)}%`;
    if (previousValues.get(id) === normalized) return;
    elements[id].style.width = normalized;
    previousValues.set(id, normalized);
  }

  function show(id, visible) {
    if (elements[id].hidden === !visible) return;
    elements[id].hidden = !visible;
  }

  function formatTime(seconds) {
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  }

  function focusFirst(id) {
    const target = id === 'playing' ? canvas : elements[id].querySelector('button');
    target?.focus({ preventScroll: true });
  }

  function activeDialog() {
    if (game.helpOpen) return elements['help-screen'];
    if (game.state === STATES.CARD_SELECT) return elements['upgrade-screen'];
    if (game.state === STATES.GAME_OVER) return elements['end-screen'];
    if (game.paused) return elements['pause-screen'];
    return null;
  }

  function renderCards(cards) {
    elements['card-grid'].replaceChildren();
    cards.forEach((card, index) => {
      const button = document.createElement('button');
      button.className = 'upgrade-card';
      button.style.setProperty('--rarity', Art.rarity[card.rarity]);
      button.setAttribute('aria-label', `${RARITY_LABELS[card.rarity]}强化：${card.name}，${card.desc}`);
      button.innerHTML = `<span class="card-rarity">${RARITY_LABELS[card.rarity]}<small>${card.id}</small></span><span class="card-illustration">${Art.icon(Art.cardIcons[card.id])}</span><span class="card-name">${card.name}</span><span class="card-description">${card.desc}</span><span class="card-select"><span>装配强化 ↗</span><kbd>${index + 1}</kbd></span>`;
      button.addEventListener('click', () => {
        if (game.state === STATES.CARD_SELECT && !game.helpOpen) {
          game.selectCard(index);
          update(game, true);
        }
      });
      elements['card-grid'].append(button);
    });
  }

  function renderModules(modules) {
    const loadout = elements.loadout;
    loadout.replaceChildren();
    if (!modules.length) {
      loadout.innerHTML = '<span class="empty-loadout">暂无强化模块<br><small>升级后装配第一张卡牌</small></span>';
      return;
    }
    const grouped = new Map();
    for (const card of modules) {
      const entry = grouped.get(card.id) || { card, count: 0 };
      entry.count++;
      grouped.set(card.id, entry);
    }
    for (const { card, count } of grouped.values()) {
      const chip = document.createElement('span');
      chip.className = 'module-chip';
      chip.style.setProperty('--rarity', Art.rarity[card.rarity]);
      chip.title = `${card.name} ×${count}：${card.desc}`;
      chip.setAttribute('aria-label', chip.title);
      chip.innerHTML = `${Art.icon(Art.cardIcons[card.id])}${count > 1 ? `<b>${count}</b>` : ''}`;
      loadout.append(chip);
    }
  }

  function update(gameState, force = false) {
    const now = performance.now();
    const screen = gameState.helpOpen ? 'help-screen'
      : gameState.state === STATES.TITLE ? 'title-screen'
      : gameState.state === STATES.CARD_SELECT ? 'upgrade-screen'
      : gameState.state === STATES.GAME_OVER ? 'end-screen'
      : gameState.paused ? 'pause-screen' : 'playing';
    const changedScreen = screen !== previousScreen;
    if (!force && !changedScreen && now < nextUpdate) return;
    nextUpdate = now + 100;
    const tower = gameState.tower;
    const deployed = gameState.state !== STATES.TITLE;
    show('title-screen', gameState.state === STATES.TITLE);
    show('upgrade-screen', gameState.state === STATES.CARD_SELECT);
    show('end-screen', gameState.state === STATES.GAME_OVER);
    show('pause-screen', gameState.paused && gameState.state === STATES.PLAYING);
    show('help-screen', gameState.helpOpen);
    if (screen !== 'playing') show('reward-toast', false);
    elements['upgrade-screen'].inert = gameState.helpOpen;
    elements['pause-screen'].inert = gameState.helpOpen;
    elements['end-screen'].inert = gameState.helpOpen;
    elements['title-screen'].inert = gameState.helpOpen;
    show('hud', deployed);
    show('combat-dock', deployed);
    elements['pause-button'].disabled = gameState.state !== STATES.PLAYING;
    const paused = gameState.paused || gameState.helpOpen || gameState.state === STATES.CARD_SELECT;
    text('telemetry-status', !deployed ? '等待部署' : gameState.state === STATES.GAME_OVER ? '链路中断' : paused ? '战术暂停' : '哨塔在线 / 自动索敌');
    elements['telemetry-status'].parentElement.classList.toggle('offline', gameState.state === STATES.GAME_OVER);
    text('combat-status', paused ? '战术暂停' : gameState.waveBreak ? '修复装甲' : '自动战斗');
    text('wave-value', String(gameState.wave).padStart(2, '0'));
    text('level-value', `LV. ${String(tower.level).padStart(2, '0')}`);
    text('hp-value', `${Math.ceil(tower.currentHP)} / ${Math.ceil(tower.maxHP)}`);
    percent('hp-fill', tower.currentHP / tower.maxHP * 100);
    elements['hp-fill'].parentElement.classList.toggle('low', tower.currentHP < tower.maxHP * .25);
    percent('xp-fill', tower.xp / tower.xpToNextLevel * 100);
    text('xp-value', `${Math.floor(tower.xp)} / ${tower.xpToNextLevel}`);
    text('kills-value', gameState.kills);
    text('time-value', formatTime(gameState.totalTime));
    text('attack-value', Math.round(tower.attack));
    text('speed-value', tower.attackSpeed.toFixed(2));
    text('crit-value', `${Math.round(tower.critRate * 100)}%`);
    text('range-value', Math.round(tower.attackRange));
    text('battle-attack', `火力 ${Math.round(tower.attack)}${tower.multiShot ? ` ×${tower.multiShot + 1}` : ''}`);
    text('battle-speed', `攻速 ${tower.attackSpeed.toFixed(2)}/s`);
    text('battle-crit', `暴击 ${Math.round(tower.critRate * 100)}%`);
    const elementNames = { fire: '灼烧弹药', ice: '霜冻核心', lightning: '雷电连锁', poison: '剧毒弹药' };
    const elementKey = tower.elementType || 'standard';
    if (previousValues.get('element') !== elementKey) {
      elements['element-badge'].innerHTML = tower.elementType ? `${Art.icon(tower.elementType)} ${elementNames[tower.elementType]}` : '<i></i> 标准弹药';
      elements['element-badge'].style.color = Art.palette[tower.elementType] || '';
      previousValues.set('element', elementKey);
    }
    show('battle-message', gameState.waveBreak && screen === 'playing');
    if (gameState.waveBreak) {
      const remaining = Math.ceil(gameState.waveBreakTimer);
      if (previousValues.get('break') !== `${gameState.wave}:${remaining}`) {
        elements['battle-message'].innerHTML = `第 ${gameState.wave} 波已肃清<small>装甲修复中 · ${remaining}s 后迎战下一波</small>`;
        previousValues.set('break', `${gameState.wave}:${remaining}`);
      }
    }
    if (gameState.state === STATES.CARD_SELECT && previousCards !== gameState.cardCandidates) {
      renderCards(gameState.cardCandidates);
      previousCards = gameState.cardCandidates;
    }
    text('upgrade-level', String(tower.level).padStart(2, '0'));
    if (previousModuleCount !== gameState.modules.length) {
      renderModules(gameState.modules);
      text('module-count', String(gameState.modules.length).padStart(2, '0'));
      previousModuleCount = gameState.modules.length;
    }
    if (gameState.state === STATES.GAME_OVER) {
      text('end-wave', String(gameState.wave).padStart(2, '0'));
      text('end-kills', gameState.kills);
      text('end-time', formatTime(gameState.totalTime));
      text('end-level', `炮塔等级 LV. ${String(tower.level).padStart(2, '0')}`);
    }
    if (changedScreen) {
      previousScreen = screen;
      if (screen !== 'help-screen') focusFirst(screen);
    }
  }

  function start() {
    clearTimeout(toastTimer);
    show('reward-toast', false);
    game.reset();
    update(game, true);
  }

  function togglePause() {
    if (game.state !== STATES.PLAYING || game.helpOpen) return;
    game.paused = !game.paused;
    update(game, true);
  }

  function openHelp() {
    returnFocus = document.activeElement;
    game.helpOpen = true;
    update(game, true);
    focusFirst('help-screen');
  }

  function closeHelp() {
    game.helpOpen = false;
    update(game, true);
    if (returnFocus && !returnFocus.closest('[hidden]')) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  }

  function showReward(card) {
    clearTimeout(toastTimer);
    elements['reward-toast'].innerHTML = `${Art.icon(Art.cardIcons[card.id])}<span>已装配 · ${card.name}</span>`;
    show('reward-toast', true);
    toastTimer = setTimeout(() => show('reward-toast', false), 2200);
  }

  elements['start-button'].addEventListener('click', start);
  elements['restart-button'].addEventListener('click', start);
  elements['pause-button'].addEventListener('click', togglePause);
  elements['resume-button'].addEventListener('click', togglePause);
  elements['help-button'].addEventListener('click', openHelp);
  elements['close-help-button'].addEventListener('click', closeHelp);
  elements['help-done-button'].addEventListener('click', closeHelp);
  canvas.addEventListener('pointerdown', () => canvas.focus({ preventScroll: true }));

  document.addEventListener('keydown', event => {
    const dialog = activeDialog();
    if (event.key === 'Tab' && dialog) {
      const buttons = Array.from(dialog.querySelectorAll('button:not(:disabled)'));
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault(); first?.focus();
      }
      return;
    }
    if (event.key === 'Escape') {
      if (game.helpOpen) closeHelp();
      else if (game.state === STATES.PLAYING) togglePause();
      return;
    }
    if (game.helpOpen) return;
    if (event.key === 'Enter' && (game.state === STATES.TITLE || game.state === STATES.GAME_OVER)) {
      if (event.target.closest('button, a')) return;
      event.preventDefault(); start(); return;
    }
    if (event.code === 'Space' && game.state === STATES.PLAYING) {
      event.preventDefault();
      if (!event.repeat) togglePause();
      return;
    }
    if (game.state === STATES.CARD_SELECT && /^[123]$/.test(event.key)) {
      event.preventDefault();
      if (!event.repeat) {
        game.selectCard(Number(event.key) - 1);
        update(game, true);
      }
      return;
    }
    if (game.state !== STATES.PLAYING || game.paused) return;
    const move = {
      w: [0, -8], W: [0, -8], ArrowUp: [0, -8],
      s: [0, 8], S: [0, 8], ArrowDown: [0, 8],
      a: [-8, 0], A: [-8, 0], ArrowLeft: [-8, 0],
      d: [8, 0], D: [8, 0], ArrowRight: [8, 0]
    }[event.key];
    if (!move) return;
    event.preventDefault();
    game.tower.x = clamp(game.tower.x + move[0], 40, W - 40);
    game.tower.y = clamp(game.tower.y + move[1], TOWER_Y - 80, H - 45);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.state === STATES.PLAYING && !game.paused) {
      game.paused = true;
      update(game, true);
    }
  });

  return { update, showReward };
})();

GameUI.update(game, true);
