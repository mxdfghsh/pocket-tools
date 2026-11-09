/* FC(NES) 模拟器封装 */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const canvas = $("screen");
  const ctx = canvas.getContext("2d", { alpha: false });
  const W = 256, H = 240;
  canvas.width = W; canvas.height = H;
  const imgData = ctx.createImageData(W, H);
  const buf32 = new Uint32Array(imgData.data.buffer);

  let nes = null, romData = null, running = false, rafId = 0, lastT = 0, acc = 0;
  let muted = false;

  // ---- 音频环形缓冲 ----
  const RING = 8192;
  const ringL = new Float32Array(RING), ringR = new Float32Array(RING);
  let wr = 0, rd = 0, count = 0;
  let audioCtx = null, scriptNode = null, gain = null;

  function pushSample(l, r) {
    ringL[wr] = l; ringR[wr] = r;
    wr = (wr + 1) % RING;
    if (count < RING) count++; else rd = (rd + 1) % RING;
  }
  function ensureAudio() {
    if (audioCtx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      audioCtx = new AC();
      scriptNode = audioCtx.createScriptProcessor(2048, 0, 2);
      gain = audioCtx.createGain();
      gain.gain.value = 0.3;
      scriptNode.onaudioprocess = (e) => {
        const l = e.outputBuffer.getChannelData(0), r = e.outputBuffer.getChannelData(1);
        for (let i = 0; i < l.length; i++) {
          if (count > 0) { l[i] = ringL[rd]; r[i] = ringR[rd]; rd = (rd + 1) % RING; count--; }
          else { l[i] = 0; r[i] = 0; }
        }
      };
      scriptNode.connect(gain); gain.connect(audioCtx.destination);
    } catch (e) { audioCtx = null; }
  }

  function status(msg) { const s = $("status"); if (s) s.textContent = msg; }

  function makeNES(bin) {
    nes = new window.jsnes.NES({
      onFrame: (fb) => { buf32.set(fb); ctx.putImageData(imgData, 0, 0); },
      onAudioSample: (l, r) => { if (!muted) pushSample(l, r); },
      sampleRate: 44100,
    });
    nes.loadROM(bin);
  }

  function loop(t) {
    if (!running) return;
    if (!lastT) lastT = t;
    acc += t - lastT; lastT = t;
    const step = 1000 / 60;
    let n = 0;
    while (acc >= step && n < 4) { try { nes.frame(); } catch (e) { console.error(e); running = false; status("游戏卡住了：" + e.message); return; } acc -= step; n++; }
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (!nes || running) return;
    ensureAudio();
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    running = true; lastT = 0; acc = 0;
    rafId = requestAnimationFrame(loop);
    $("btnPause").textContent = "暂停";
  }
  function pause() {
    running = false;
    cancelAnimationFrame(rafId);
    $("btnPause").textContent = "继续";
  }

  function loadBinaryString(str, name) {
    romData = str;
    try {
      makeNES(str);
    } catch (e) {
      status("加载失败：" + e.message);
      return;
    }
    running = false;
    cancelAnimationFrame(rafId);
    start();
    status("已载入：" + (name || "ROM"));
    document.body.classList.add("has-rom");
  }

  function fromFile(f) {
    if (!f) return;
    if (!/\.(nes|fds|unf|unif)$/i.test(f.name)) { status("请选择 .nes 文件"); return; }
    const fr = new FileReader();
    fr.onload = () => {
      const bytes = new Uint8Array(fr.result);
      let s = "";
      const CH = 0x8000;
      for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
      loadBinaryString(s, f.name);
    };
    fr.readAsArrayBuffer(f);
  }

  // ---- 控制 ----
  const K = window.jsnes.Controller;
  const keyMap = {
    ArrowUp: K.BUTTON_UP, ArrowDown: K.BUTTON_DOWN, ArrowLeft: K.BUTTON_LEFT, ArrowRight: K.BUTTON_RIGHT,
    KeyW: K.BUTTON_UP, KeyS: K.BUTTON_DOWN, KeyA: K.BUTTON_LEFT, KeyD: K.BUTTON_RIGHT,
    KeyZ: K.BUTTON_A, KeyJ: K.BUTTON_A, KeyX: K.BUTTON_B, KeyK: K.BUTTON_B,
    Enter: K.BUTTON_START, ShiftRight: K.BUTTON_SELECT, ShiftLeft: K.BUTTON_SELECT,
  };

  document.addEventListener("keydown", (e) => {
    const b = keyMap[e.code];
    if (b === undefined || !nes) return;
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Enter","Space"].includes(e.code)) e.preventDefault();
    try { nes.buttonDown(1, b); } catch (err) {}
  });
  document.addEventListener("keyup", (e) => {
    const b = keyMap[e.code];
    if (b === undefined || !nes) return;
    try { nes.buttonUp(1, b); } catch (err) {}
  });

  // 触屏
  document.querySelectorAll("[data-btn]").forEach((el) => {
    const b = Number(el.dataset.btn);
    const down = (e) => { e.preventDefault(); if (nes) try { nes.buttonDown(1, b); } catch (err) {} };
    const up = (e) => { e.preventDefault(); if (nes) try { nes.buttonUp(1, b); } catch (err) {} };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointerleave", up);
    el.addEventListener("pointercancel", up);
  });

  // ---- 按钮 ----
  const fileInput = $("rom");
  fileInput && fileInput.addEventListener("change", () => fromFile(fileInput.files[0]));

  $("btnPause") && $("btnPause").addEventListener("click", () => { if (!nes) return; running ? pause() : start(); });
  $("btnReset") && $("btnReset").addEventListener("click", () => { if (!romData) return; pause(); makeNES(romData); start(); });
  $("btnMute") && $("btnMute").addEventListener("click", () => {
    muted = !muted;
    $("btnMute").textContent = muted ? "🔇 已静音" : "🔊 声音";
    if (gain) gain.gain.value = muted ? 0 : 0.3;
  });
  $("btnFull") && $("btnFull").addEventListener("click", () => {
    const box = $("screenBox");
    if (document.fullscreenElement) document.exitFullscreen();
    else if (box && box.requestFullscreen) box.requestFullscreen();
  });

  // 拖拽
  const drop = $("screenBox");
  if (drop) {
    ["dragenter","dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
    ["dragleave","drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
    drop.addEventListener("drop", (e) => { const f = e.dataTransfer.files[0]; if (f) fromFile(f); });
  }
})();
