const Art = (() => {
  const palette = {
    amber: '#e5b777', mint: '#a0d9b8', ink: '#e7eee5',
    fire: '#ed9366', ice: '#9edbd8', lightning: '#efcf7b', poison: '#b0c78c'
  };
  const rarity = { common: '#a5b4a1', rare: '#8fc7c7', epic: '#c7a7d8', legendary: '#e5b777' };
  const iconPaths = {
    outpost: '<path d="m12 2 9 5v10l-9 5-9-5V7Z"/><path d="M8 16V9l4-3 4 3v7M6 17h12M12 6V2M10 12h4M12 10v5"/>',
    play: '<path d="m8 5 11 7-11 7Z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5M12 17h.01"/>',
    restart: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
    shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="M12 7v10M8 12h8"/>',
    bullet: '<path d="M9 19V8l3-5 3 5v11ZM8 19h8M9 10h6M9 16h6"/>',
    speed: '<path d="M4 17a9 9 0 1 1 16 0M12 12l5-5M6 17h12M12 3v2M4 9l2 1M20 9l-2 1"/><circle cx="12" cy="12" r="1.5"/>',
    crosshair: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v5M12 18v5M1 12h5M18 12h5"/>',
    range: '<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5M7 7l10 10M7 7v4M7 7h4M17 17h-4M17 17v-4"/>',
    heal: '<path d="m12 3 7 4v10l-7 4-7-4V7Z"/><path d="M12 8v8M8 12h8"/>',
    heart: '<path d="M12 20 4 12C-1 5 8 0 12 7c4-7 13-2 8 5Z"/><path d="M5 11h4l2-3 3 7 2-4h4"/>',
    skull: '<path d="M6 15a8 8 0 1 1 12 0v5H6ZM9 20v-3M15 20v-3"/><circle cx="8.5" cy="10" r="1.5"/><circle cx="15.5" cy="10" r="1.5"/><path d="m11 14 1-2 1 2"/>',
    lightning: '<path d="m13 2-9 12h7l-1 8 10-13h-7Z"/>',
    fire: '<path d="M12 2c2 5 7 7 7 12a7 7 0 0 1-14 0c0-3 2-5 4-7l1 4c2-3 2-6 2-9Z"/><path d="M12 12c-4 4-3 8 0 8s4-4 0-8Z"/>',
    ice: '<path d="M12 2v20M3.34 7l17.32 10M3.34 17 20.66 7M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-1-1-4M17 19l-1-4 4-1M4 14l4 1-1 4M17 5l-1 4 4 1"/>',
    poison: '<path d="M12 2C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-13Z"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/><path d="m10 18 2-1 2 1"/>',
    split: '<path d="M12 21V12M12 12 4 4M12 12l8-8M4 4v5M4 4h5M20 4h-5M20 4v5"/><circle cx="12" cy="12" r="2"/>',
    multi: '<path d="M6 19V9l2-3 2 3v10M14 19V9l2-3 2 3v10M4 19h16M6 12h4M14 12h4M12 2v3"/>',
    scatter: '<path d="M12 21 3 4M12 21V3M12 21 21 4M2 8l1-4 4 1M9 6l3-3 3 3M17 5l4-1 1 4"/>',
    vortex: '<path d="M12 3a9 9 0 1 1-9 9 6 6 0 1 0 6-6 3 3 0 1 0 3 3"/>',
    atom: '<ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/><circle cx="12" cy="12" r="1"/>',
    fortress: '<path d="M4 21V5h4v4h3V5h2v4h3V5h4v16ZM10 21v-6h4v6M4 12h16"/>',
    chaos: '<path d="m12 2 10 6v8l-10 6-10-6V8ZM12 2v20M2 8l10 6 10-6M2 16l10-6 10 6"/>',
    infinity: '<path d="M12 12c-3-7-10-6-10 0s7 7 10 0 10-6 10 0-7 7-10 0Z"/>',
    bounce: '<path d="m3 19 6-8 5 4 7-11M16 4h5v5"/><circle cx="9" cy="11" r="2"/>'
  };
  const cardIcons = {
    C01: 'bullet', C02: 'shield', C03: 'speed', C04: 'range', C05: 'heal',
    C06: 'bullet', C07: 'vortex', C08: 'crosshair', C09: 'skull', C10: 'heart',
    C11: 'lightning', C12: 'heart', C13: 'fire', C14: 'fortress', C15: 'skull',
    C16: 'heal', C17: 'multi', C18: 'scatter', C19: 'vortex', C20: 'split',
    C21: 'bounce', C22: 'atom', C23: 'fire', C24: 'ice', C25: 'lightning',
    C26: 'poison', C27: 'chaos', C28: 'infinity'
  };
  let terrain = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function icon(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.outpost}</svg>`;
  }

  function seededRandom(seed) {
    let value = seed;
    return () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function polygon(context, points, fill, stroke, width = 1) {
    context.beginPath();
    context.moveTo(points[0][0], points[0][1]);
    for (const point of points.slice(1)) context.lineTo(point[0], point[1]);
    context.closePath();
    if (fill) { context.fillStyle = fill; context.fill(); }
    if (stroke) { context.strokeStyle = stroke; context.lineWidth = width; context.stroke(); }
  }

  function line(context, points, color, width = 1) {
    context.strokeStyle = color;
    context.lineWidth = width;
    context.beginPath();
    context.moveTo(points[0][0], points[0][1]);
    for (const point of points.slice(1)) context.lineTo(point[0], point[1]);
    context.stroke();
  }

  function circle(context, x, y, radius, fill, stroke, width = 1) {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    if (fill) { context.fillStyle = fill; context.fill(); }
    if (stroke) { context.strokeStyle = stroke; context.lineWidth = width; context.stroke(); }
  }

  function ellipse(context, x, y, radiusX, radiusY, fill) {
    context.fillStyle = fill;
    context.beginPath();
    context.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
    context.fill();
  }

  function hex(context, x, y, radius, fill, stroke, angle = Math.PI / 6) {
    const points = Array.from({ length: 6 }, (_, index) => {
      const direction = angle + index * Math.PI / 3;
      return [x + Math.cos(direction) * radius, y + Math.sin(direction) * radius];
    });
    polygon(context, points, fill, stroke);
  }

  function box(context, x, y, width, height, radius, fill, stroke) {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    if (fill) { context.fillStyle = fill; context.fill(); }
    if (stroke) { context.strokeStyle = stroke; context.lineWidth = 1; context.stroke(); }
  }

  function rock(context, x, y, size, rotation, shade) {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    ellipse(context, 3, 7, size * 1.1, size * .66, '#15251d55');
    polygon(context, [[-size, 0], [-size * .6, -size * .5], [size * .32, -size * .7], [size, -.1 * size], [.8 * size, .5 * size], [-.2 * size, .7 * size]], shade, '#1d302555');
    polygon(context, [[-size, 0], [-size * .6, -size * .5], [size * .32, -size * .7], [-.15 * size, -.05 * size]], '#bdc19a11');
    line(context, [[-size * .3, size * .3], [0, 0], [size * .5, -size * .2]], '#182c2333');
    context.restore();
  }

  function crate(context, x, y, width, height, rotation) {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    box(context, 2, 5, width, height, 2, '#0d1f1c66');
    box(context, 0, 0, width, height, 2, '#465347', '#7d866655');
    box(context, 3, 3, width - 6, height - 6, 1, '#354738', '#1a3029');
    for (let offset = 8; offset < width - 4; offset += 8) {
      line(context, [[offset, 5], [offset, height - 5]], '#7c866444', 2);
    }
    context.fillStyle = '#baaf7866';
    context.fillRect(4, 5, 3, height - 10);
    context.fillRect(width - 7, 5, 3, height - 10);
    line(context, [[0, 0], [width, 0]], '#a8ae8555');
    context.restore();
  }

  function barrier(context, x, y, count) {
    for (let index = 0; index < count; index++) {
      const offset = x + index * 23;
      box(context, offset + 3, y + 6, 21, 12, 2, '#13282166');
      polygon(context, [[offset, y], [offset + 20, y], [offset + 22, y + 7], [offset + 19, y + 14], [offset - 2, y + 14]], '#66705a', '#2b4134');
      line(context, [[offset + 2, y + 2], [offset + 17, y + 2]], '#a6ad8277');
      line(context, [[offset + 5, y + 4], [offset + 8, y + 10]], '#c0ab7066', 2);
      line(context, [[offset + 12, y + 4], [offset + 15, y + 10]], '#c0ab7066', 2);
    }
  }

  function createTerrain() {
    const buffer = document.createElement('canvas');
    buffer.width = 960; buffer.height = 1440;
    const context = buffer.getContext('2d');
    context.scale(2, 2);
    const random = seededRandom(208607);
    const ground = context.createLinearGradient(0, 0, 0, 720);
    ground.addColorStop(0, '#34463a');
    ground.addColorStop(.45, '#485744');
    ground.addColorStop(1, '#283f35');
    context.fillStyle = ground; context.fillRect(0, 0, 480, 720);
    for (let index = 0; index < 22; index++) {
      const positionX = random() * 480, positionY = random() * 720;
      const stain = context.createRadialGradient(positionX, positionY, 0, positionX, positionY, 40 + random() * 75);
      stain.addColorStop(0, index % 2 ? '#b2aa7620' : '#0c252a36');
      stain.addColorStop(1, '#00000000');
      context.fillStyle = stain; context.fillRect(0, 0, 480, 720);
    }
    for (let row = 0; row < 29; row++) {
      for (let column = 0; column < 12; column++) {
        const positionX = column * 42 + (row % 2 ? 21 : 0);
        const positionY = row * 24 + 12;
        const roadWidth = 82 + positionY * .14;
        if (Math.abs(positionX - 240) < roadWidth && random() > .18) {
          hex(context, positionX, positionY, 23, random() > .5 ? '#b8b48807' : '#152c230a', '#b8bc9414');
        }
      }
    }
    for (let index = 0; index < 2900; index++) {
      context.fillStyle = random() > .5 ? '#bdc39d12' : '#0a25191a';
      const size = random() * 1.4 + .3;
      context.fillRect(random() * 480, random() * 720, size * 2, size);
    }
    for (let side = 0; side < 2; side++) {
      context.save();
      if (side) { context.translate(480, 0); context.scale(-1, 1); }
      polygon(context, [[0, 0], [42, 0], [61, 83], [35, 135], [55, 207], [40, 264], [62, 332], [35, 414], [55, 494], [32, 578], [61, 660], [39, 720], [0, 720]], '#1f362d66');
      for (let index = 0; index < 32; index++) {
        rock(context, random() * 47, index * 24 + random() * 16, 9 + random() * 20, random() * 6, index % 2 ? '#384b39' : '#46513c');
      }
      for (let index = 0; index < 75; index++) {
        const positionX = 10 + random() * 55, positionY = random() * 720;
        const length = random() * 9 + 3;
        line(context, [[positionX - 3, positionY + 2], [positionX, positionY - length], [positionX + 2, positionY + 1]], '#9da27535', .8);
      }
      context.restore();
    }
    for (let index = 0; index < 36; index++) {
      const positionX = random() < .5 ? 55 + random() * 64 : 367 + random() * 66;
      rock(context, positionX, random() * 560 + 130, 2 + random() * 6, random() * 6, '#566047');
    }
    line(context, [[50, 612], [68, 612], [68, 651], [136, 651], [136, 665], [214, 665]], '#0c271e99', 5);
    line(context, [[50, 610], [70, 610], [70, 649], [138, 649], [138, 663], [214, 663]], '#84947577', 2);
    line(context, [[266, 665], [326, 665], [340, 676], [405, 676], [418, 657], [480, 657]], '#93a17c66', 2);
    crate(context, 45, 145, 32, 48, -.12);
    crate(context, 402, 310, 35, 53, .15);
    crate(context, 28, 644, 32, 37, -.12);
    crate(context, 431, 570, 26, 44, .13);
    barrier(context, 74, 602, 5);
    barrier(context, 294, 602, 5);
    context.save();
    context.translate(240, 649);
    hex(context, 0, 4, 53, '#122d2244', '#8ca27944');
    hex(context, 0, 4, 47, '#80917311', '#80977355');
    for (let index = 0; index < 8; index++) {
      context.save(); context.rotate(index * Math.PI / 4);
      context.fillStyle = '#c9bd8466'; context.fillRect(-1, -58, 2, 9);
      context.restore();
    }
    context.restore();
    context.font = 'bold 27px "Consolas", monospace';
    context.textAlign = 'center'; context.fillStyle = '#bcc49722';
    context.fillText('07', 240, 581);
    context.font = '8px "Consolas", monospace'; context.fillStyle = '#c6c69944';
    context.fillText('KEEP CLEAR', 240, 598);
    line(context, [[113, 512], [113, 532], [130, 532]], '#c6c69933', 2);
    line(context, [[367, 512], [367, 532], [350, 532]], '#c6c69933', 2);
    const vignette = context.createRadialGradient(240, 380, 100, 240, 380, 450);
    vignette.addColorStop(0, '#071d1700'); vignette.addColorStop(1, '#071d1780');
    context.fillStyle = vignette; context.fillRect(0, 0, 480, 720);
    return buffer;
  }

  function drawEnvironment(context, time, title) {
    if (!terrain) terrain = createTerrain();
    context.drawImage(terrain, 0, 0, 480, 720);
    const motionTime = reducedMotion.matches ? 0 : time;
    context.save();
    context.globalCompositeOperation = 'screen';
    for (let index = 0; index < 24; index++) {
      const positionX = (index * 73.7 + Math.sin(index * 2.3 + motionTime * .13) * 23 + 480) % 480;
      const positionY = (index * 137 + motionTime * (1.2 + index % 3) + 30) % 720;
      const alpha = .1 + (Math.sin(motionTime * .5 + index) + 1) * .14;
      circle(context, positionX, positionY, index % 4 === 0 ? 1.3 : .65, `rgba(220,213,153,${alpha})`);
    }
    if (!title) {
      const defenseGlow = context.createRadialGradient(240, 650, 12, 240, 650, 100);
      defenseGlow.addColorStop(0, '#91b98718'); defenseGlow.addColorStop(1, '#91b98700');
      context.fillStyle = defenseGlow; context.fillRect(130, 540, 220, 180);
    }
    context.restore();
  }

  function drawTower(context, tower, time, hero = false) {
    const element = tower.elementType;
    const accent = tower.hurtFlash > 0 ? '#f19b83' : palette[element] || palette.amber;
    context.save();
    context.translate(tower.x, tower.y);
    if (!hero) {
      context.save();
      circle(context, 0, 0, tower.attackRange, '#c4d1a103');
      context.setLineDash([4, 9]);
      circle(context, 0, 0, tower.attackRange, null, '#b9caa53b');
      context.setLineDash([]);
      context.strokeStyle = '#bbd5ac55'; context.lineWidth = 1.5;
      const scan = reducedMotion.matches ? -Math.PI / 2 : time * .2;
      context.beginPath(); context.arc(0, 0, tower.attackRange, scan, scan + .14); context.stroke();
      context.restore();
    } else {
      context.scale(2.05, 2.05);
      context.save();
      context.rotate(-Math.PI / 6);
      hex(context, 0, 7, 56, '#9ea88a13', '#bac09a55');
      hex(context, 0, 7, 50, '#112c2555', '#81977266');
      context.restore();
    }
    ellipse(context, 4, 18, 38, 23, '#081b1699');
    hex(context, 0, 7, 34, '#273d35', '#738573');
    hex(context, 0, 4, 30, '#526456', '#9aad91');
    circle(context, 0, 3, 23, '#283f36', '#7b8f75', 1.3);
    circle(context, 0, 3, 19, '#102c25', '#9bab7b66');
    for (let index = 0; index < 4; index++) {
      context.save(); context.rotate(Math.PI / 4 + index * Math.PI / 2);
      box(context, -6, -34, 12, 20, 2, '#233c32', '#7f9276');
      box(context, -4, -32, 8, 7, 1, '#9aa589');
      line(context, [[-3, -22], [3, -22]], accent, 2);
      circle(context, 0, -28, 1, '#31483b');
      context.restore();
    }
    context.save();
    context.rotate(tower.currentAngle);
    const recoil = tower.muzzleFlash * 2.5;
    context.translate(-recoil, 0);
    box(context, 4, -5, 30, 13, 2, '#112b22');
    box(context, 3, -7, 30, 12, 2, '#758c78', '#b9c6a6');
    box(context, 13, -6, 19, 9, 1, '#354f42');
    line(context, [[16, -4], [29, -4]], '#a1b697', 1.5);
    box(context, 28, -9, 10, 16, 2, '#344f40', '#9cae8d');
    box(context, 31, -7, 5, 12, 1, accent);
    line(context, [[36, -4], [36, 2]], '#233f31', 2);
    polygon(context, [[-18, -12], [-8, -19], [9, -16], [16, -7], [16, 7], [4, 16], [-13, 13], [-20, 3]], '#19382c', '#b1bda0');
    polygon(context, [[-18, -12], [-8, -19], [9, -16], [13, -10], [-8, -8], [-17, 0]], '#a4b19a');
    polygon(context, [[-17, 0], [-8, -8], [13, -10], [16, -7], [16, 7], [4, 16], [-13, 13]], '#5d7d62');
    polygon(context, [[-13, 1], [-5, -5], [8, -6], [11, -1], [8, 8], [-7, 9]], '#345641', '#8ca68b');
    box(context, -8, -4, 12, 9, 2, '#1d3b2b', '#859e77');
    line(context, [[-5, -1], [1, -1]], accent, 2);
    line(context, [[-5, 3], [1, 3]], accent, 1);
    for (let offset = -9; offset <= 5; offset += 4) line(context, [[offset, 11], [offset + 1, 14]], '#172f24', 1.5);
    circle(context, -12, -6, 1.6, '#d4d5b3');
    circle(context, 9, 5, 1.5, '#d4d5b3');
    if (tower.multiShot > 0) {
      box(context, 7, 9, 24, 5, 1, '#758c78', '#b9c6a6');
      box(context, 25, 8, 8, 7, 1, accent);
    }
    if (tower.muzzleFlash > 0) {
      context.save(); context.globalAlpha = tower.muzzleFlash;
      context.globalCompositeOperation = 'screen';
      const muzzleGlow = context.createRadialGradient(42, -1, 1, 42, -1, 17);
      muzzleGlow.addColorStop(0, '#fff7d6'); muzzleGlow.addColorStop(.3, accent); muzzleGlow.addColorStop(1, '#e5b77700');
      circle(context, 42, -1, 17, muzzleGlow);
      polygon(context, [[36, -1], [43, -5], [40, -10], [47, -5], [55, -1], [47, 2], [43, 9], [42, 3]], '#fff2c8');
      context.restore();
    }
    context.restore();
    if (element) {
      context.save(); context.globalCompositeOperation = 'screen';
      circle(context, 0, 3, 33, null, accent, .8);
      context.restore();
    }
    context.restore();
  }

  function drawEnemy(context, enemy, target = { x: 240, y: 650 }) {
    const size = enemy.size;
    const boss = enemy.type === 'BOSS';
    const fast = enemy.type === 'FAST';
    const tank = enemy.type === 'TANK';
    const shell = enemy.hitFlash > .2 ? '#eee6cf' : tank ? '#89917b' : boss ? '#a75e52' : fast ? '#c6a363' : '#b77964';
    const highlight = tank ? '#c1c4a0' : fast ? '#e5c883' : boss ? '#e29474' : '#dbaa87';
    const angle = Math.atan2(target.x - enemy.x, target.y - enemy.y);
    const stride = reducedMotion.matches ? 0 : Math.sin(enemy.wobble * (fast ? 2.6 : 1.5));
    context.save();
    context.translate(enemy.x, enemy.y);
    ellipse(context, 2, size * .5, size * 1.3, size * .75, '#132b1f77');
    context.save(); context.rotate(-angle);
    context.lineCap = 'round'; context.lineJoin = 'round';
    for (let side = -1; side <= 1; side += 2) {
      for (let index = 0; index < 3; index++) {
        const offset = (index - 1) * size * .65;
        const swing = stride * (index % 2 ? -1 : 1) * size * .25;
        const points = [[side * size * .55, offset], [side * size * 1.15, offset + swing], [side * size * 1.4, offset + size * .4 + swing]];
        line(context, points, '#25372a', tank ? 4 : boss ? 4.5 : 2.8);
        line(context, points, tank ? '#a0a487' : '#8a6b53', tank ? 1.5 : 1);
      }
    }
    if (tank) {
      polygon(context, [[0, -size], [size * .83, -size * .45], [size, size * .4], [size * .5, size * .9], [-size * .5, size * .9], [-size, size * .4], [-size * .83, -size * .45]], '#394a36', '#bdbe9b');
      polygon(context, [[0, -size * .92], [size * .65, -size * .45], [size * .8, size * .35], [0, size * .8], [-size * .8, size * .35], [-size * .65, -size * .45]], shell);
      line(context, [[0, -size * .9], [0, size * .6]], '#4b5c3f', 2);
      line(context, [[-size * .65, -size * .2], [0, size * .05], [size * .65, -size * .2]], highlight, 2);
      line(context, [[-size * .7, size * .23], [0, size * .45], [size * .7, size * .23]], '#aeb395', 2);
    } else if (fast) {
      polygon(context, [[0, -size * 1.35], [size * .65, -size * .2], [size * .9, size * .6], [0, size], [-size * .9, size * .6], [-size * .65, -size * .2]], '#5c5736', '#c6b476');
      polygon(context, [[0, -size * 1.2], [size * .48, -.1 * size], [0, size * .7], [-size * .48, -.1 * size]], shell);
      line(context, [[0, -size * .8], [0, size * .4]], highlight, 1.5);
    } else {
      ellipse(context, 0, -size * .15, size * .8, size, '#4c4231');
      ellipse(context, 0, -size * .22, size * .7, size * .83, shell);
      ellipse(context, -size * .2, -size * .37, size * .4, size * .57, highlight);
      line(context, [[0, -size * .9], [0, size * .35]], '#744f3d', 1);
      if (boss) {
        for (let side = -1; side <= 1; side += 2) {
          polygon(context, [[side * size * .45, -size * .6], [side * size * 1.1, -size * 1.2], [side * size * .9, size * .2], [side * size * .35, size * .5]], shell, highlight);
        }
        polygon(context, [[0, -size * 1.2], [size * .23, -size * .7], [0, -.2 * size], [-size * .23, -size * .7]], '#e1b685', '#523b2d');
      }
    }
    ellipse(context, 0, size * .65, size * .55, size * .35, '#323c2b');
    for (let side = -1; side <= 1; side += 2) {
      line(context, [[side * size * .4, size * .65], [side * size * .6, size * 1.05], [side * size * .15, size * 1.15]], '#cdc4a2', boss ? 2.6 : 1.3);
      circle(context, side * size * .28, size * .58, boss ? 2.2 : 1.2, boss ? '#ffca88' : '#e7d69c');
    }
    context.restore();
    const statuses = [
      ['burn', palette.fire], ['slow', palette.ice], ['poison', palette.poison], ['stun', palette.lightning]
    ].filter(([name]) => enemy.debuffs.some(debuff => debuff.type === name));
    if (statuses.length) {
      const statusColor = statuses[0][1];
      context.save(); context.globalAlpha = .6;
      circle(context, 0, 0, size * 1.5, null, statusColor, 1);
      context.restore();
      statuses.forEach(([, color], index) => hex(context, -size + index * 7, -size - 13, 2.5, color));
    }
    if (enemy.hp < enemy.maxHP || boss) {
      const width = size * 2.7;
      box(context, -width / 2 - 1, -size - 8, width + 2, 5, 1, '#11251e');
      context.fillStyle = boss ? '#ea9b7b' : '#ced19e';
      context.fillRect(-width / 2, -size - 7, width * Math.max(0, enemy.hp / enemy.maxHP), 3);
    }
    if (boss) {
      context.font = '7px "Consolas", monospace'; context.textAlign = 'center'; context.fillStyle = '#f4c79b';
      context.fillText('OVERLORD', 0, -size - 13);
    }
    context.restore();
  }

  function drawProjectile(context, projectile) {
    const color = projectile.color;
    const trail = projectile.trail;
    context.save();
    context.lineCap = 'round';
    for (let index = 1; index < trail.length; index++) {
      context.globalAlpha = index / trail.length * .65;
      line(context, [[trail[index - 1].x, trail[index - 1].y], [trail[index].x, trail[index].y]], color, projectile.size * (index / trail.length) * .85);
    }
    context.globalAlpha = 1;
    context.translate(projectile.x, projectile.y);
    context.rotate(Math.atan2(projectile.vy, projectile.vx));
    context.shadowColor = color; context.shadowBlur = projectile.isCrit ? 10 : 4;
    if (projectile.element === 'ice') {
      polygon(context, [[-projectile.size, 0], [0, -projectile.size * .65], [projectile.size * 1.5, 0], [0, projectile.size * .65]], color);
    } else {
      box(context, -projectile.size, -projectile.size * .36, projectile.size * 2.2, projectile.size * .72, 1, color);
    }
    context.shadowBlur = 0;
    circle(context, projectile.size * .4, 0, projectile.size * .35, '#fff3d4');
    context.restore();
  }

  function drawParticle(context, particle) {
    const alpha = Math.max(0, particle.life / particle.maxLife);
    const size = particle.size * (.35 + .65 * alpha);
    context.save(); context.globalAlpha = alpha;
    if (particle.type === 'ring') {
      circle(context, particle.x, particle.y, particle.size * (1.5 - alpha), null, particle.color, Math.max(.5, alpha * 2));
    } else if (particle.type === 'rect') {
      context.translate(particle.x, particle.y); context.rotate(alpha * 3);
      context.fillStyle = particle.color; context.fillRect(-size / 2, -size / 2, size, size * .6);
    } else {
      line(context, [[particle.x, particle.y], [particle.x - particle.vx * .016, particle.y - particle.vy * .016]], particle.color, Math.max(1, size * .5));
      circle(context, particle.x, particle.y, size * .35, particle.color);
    }
    context.restore();
  }

  function render(gameState, context) {
    const time = reducedMotion.matches ? 0 : performance.now() / 1000;
    const title = gameState.state === 0;
    const shake = reducedMotion.matches ? 0 : Math.min(3, gameState.screenShake);
    context.save();
    context.fillStyle = '#263d31'; context.fillRect(0, 0, 480, 720);
    if (shake > 0 && gameState.state === 1 && !gameState.paused && !gameState.helpOpen) {
      context.translate(Math.sin(time * 111) * shake, Math.cos(time * 97) * shake);
    }
    drawEnvironment(context, time, title);
    if (title) {
      context.save();
      const spotlight = context.createRadialGradient(240, 431, 15, 240, 431, 175);
      spotlight.addColorStop(0, '#a5bf8b22'); spotlight.addColorStop(1, '#a5bf8b00');
      context.fillStyle = spotlight; context.fillRect(0, 200, 480, 380);
      const preview = { ...gameState.tower, x: 240, y: 432, currentAngle: -1.35 + Math.sin(time * .25) * .1 };
      drawTower(context, preview, time, true);
      drawEnemy(context, { type: 'NORMAL', x: 98, y: 395, size: 12, hp: 20, maxHP: 20, hitFlash: 0, wobble: time, debuffs: [] });
      drawEnemy(context, { type: 'FAST', x: 373, y: 467, size: 11, hp: 12, maxHP: 12, hitFlash: 0, wobble: time + 3, debuffs: [] });
      context.restore();
    } else {
      for (const lightning of gameState.lightningEffects) lightning.render(context);
      for (const enemy of gameState.enemies) if (enemy.active) enemy.render(context);
      gameState.tower.render(context);
      for (const projectile of gameState.projectiles) projectile.render(context);
      for (const particle of gameState.particles) particle.render(context);
      for (const text of gameState.dmgTexts) text.render(context);
      if (gameState.tower.currentHP < gameState.tower.maxHP * .25) {
        const danger = context.createRadialGradient(240, 400, 180, 240, 400, 410);
        danger.addColorStop(0, '#b15a4200');
        danger.addColorStop(1, `rgba(153,61,40,${.18 + Math.sin(time * 2) * .05})`);
        context.fillStyle = danger; context.fillRect(0, 0, 480, 720);
      }
    }
    context.restore();
    if (typeof GameUI !== 'undefined') GameUI.update(gameState);
  }

  return { render, icon, cardIcons, rarity, palette, reducedMotion, drawTower, drawEnemy, drawProjectile, drawParticle };
})();
