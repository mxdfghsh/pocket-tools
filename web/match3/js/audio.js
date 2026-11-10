/**
 * 音频引擎 - 使用 Web Audio API 合成所有音效
 * 无需外部音频文件
 */

const AudioEngine = (() => {
  let ctx = null;
  let masterGain = null;
  let enabled = true;

  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.4;
      masterGain.connect(ctx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function setEnabled(val) {
    enabled = val;
    if (masterGain) {
      masterGain.gain.setTargetAtTime(val ? 0.4 : 0, ctx.currentTime, 0.1);
    }
  }

  function isEnabled() { return enabled; }

  // 通用合成函数
  function playTone(opts) {
    if (!ctx || !enabled) return;
    resume();

    const {
      type = 'sine',
      freq = 440,
      freqEnd = null,
      startTime = 0,
      duration = 0.2,
      volume = 0.3,
      attack = 0.01,
      decay = 0.1,
      sustain = 0.5,
      release = 0.1
    } = opts;

    const now = ctx.currentTime + startTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration);
    }

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + attack);
    gain.gain.linearRampToValueAtTime(volume * sustain, now + attack + decay);
    gain.gain.setValueAtTime(volume * sustain, now + duration - release);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  function playNoise(opts) {
    if (!ctx || !enabled) return;
    resume();

    const {
      startTime = 0,
      duration = 0.1,
      volume = 0.1,
      filterFreq = 1000
    } = opts;

    const now = ctx.currentTime + startTime;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noise.start(now);
    noise.stop(now + duration);
  }

  // ====== 音效定义 ======

  // 选择宝石音效
  function playSelect() {
    playTone({ type: 'sine', freq: 660, duration: 0.12, volume: 0.25, attack: 0.005 });
  }

  // 交换音效
  function playSwap() {
    playTone({ type: 'triangle', freq: 440, freqEnd: 550, duration: 0.15, volume: 0.2 });
    playTone({ type: 'triangle', freq: 550, freqEnd: 440, duration: 0.15, volume: 0.2, startTime: 0.08 });
  }

  // 无效交换音效
  function playInvalid() {
    playTone({ type: 'sawtooth', freq: 200, freqEnd: 120, duration: 0.2, volume: 0.15 });
  }

  // 消除音效 (根据数量变化音调)
  function playMatch(count = 3, comboMultiplier = 1) {
    const baseFreq = 400 + (count - 3) * 80;
    const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];

    notes.forEach((freq, i) => {
      playTone({
        type: 'sine',
        freq: freq * comboMultiplier,
        duration: 0.25,
        volume: 0.25 + i * 0.05,
        attack: 0.01,
        decay: 0.05,
        sustain: 0.6,
        release: 0.1,
        startTime: i * 0.06
      });
    });

    // 添加冲击感
    playNoise({ duration: 0.08, volume: 0.08, filterFreq: 2000, startTime: 0 });
  }

  // 连击音效
  function playCombo(comboCount) {
    const freqs = [523, 659, 784, 1047, 1319, 1568];
    const freq = freqs[Math.min(comboCount - 2, freqs.length - 1)];

    // 和弦上扫
    for (let i = 0; i < 4; i++) {
      playTone({
        type: 'sine',
        freq: freq * Math.pow(1.25, i),
        duration: 0.3,
        volume: 0.2,
        startTime: i * 0.04
      });
    }

    // 加强低音
    playTone({ type: 'triangle', freq: freq / 2, duration: 0.4, volume: 0.15 });
  }

  // 爆炸特效音效
  function playExplosion() {
    // 低频冲击
    playTone({ type: 'sine', freq: 80, freqEnd: 20, duration: 0.5, volume: 0.3 });
    // 中频噪声
    playNoise({ duration: 0.3, volume: 0.25, filterFreq: 800 });
    // 高频噪声
    playNoise({ duration: 0.15, volume: 0.15, filterFreq: 4000, startTime: 0.05 });
  }

  // 行/列清除音效
  function playLineClear() {
    // 快速上扫
    const freqs = [440, 880, 1320, 1760];
    freqs.forEach((freq, i) => {
      playTone({
        type: 'triangle',
        freq,
        duration: 0.15,
        volume: 0.2,
        startTime: i * 0.04
      });
    });
  }

  // 宝石落下音效
  function playDrop(row) {
    const freq = 200 + row * 30;
    playTone({ type: 'sine', freq, freqEnd: freq * 0.8, duration: 0.1, volume: 0.1, attack: 0.005 });
  }

  // 关卡完成音效
  function playLevelComplete() {
    // 胜利fanfare
    const melody = [
      { freq: 523, dur: 0.12 },
      { freq: 659, dur: 0.12 },
      { freq: 784, dur: 0.12 },
      { freq: 1047, dur: 0.35 },
      { freq: 784, dur: 0.1 },
      { freq: 1047, dur: 0.5 }
    ];

    let time = 0;
    melody.forEach(note => {
      playTone({
        type: 'sine',
        freq: note.freq,
        duration: note.dur,
        volume: 0.28,
        attack: 0.02,
        sustain: 0.7,
        startTime: time
      });
      // 加和声
      playTone({
        type: 'triangle',
        freq: note.freq * 0.75,
        duration: note.dur,
        volume: 0.12,
        startTime: time
      });
      time += note.dur * 0.9;
    });
  }

  // 游戏结束音效
  function playGameOver() {
    const melody = [
      { freq: 400, dur: 0.2 },
      { freq: 350, dur: 0.2 },
      { freq: 300, dur: 0.2 },
      { freq: 200, dur: 0.5 }
    ];

    let time = 0;
    melody.forEach(note => {
      playTone({
        type: 'sawtooth',
        freq: note.freq,
        duration: note.dur,
        volume: 0.15,
        startTime: time
      });
      time += note.dur;
    });
  }

  // 按钮点击
  function playClick() {
    playTone({ type: 'sine', freq: 800, duration: 0.08, volume: 0.15, attack: 0.005 });
  }

  // 提示音效
  function playHint() {
    playTone({ type: 'sine', freq: 880, duration: 0.1, volume: 0.12 });
    playTone({ type: 'sine', freq: 1100, duration: 0.1, volume: 0.12, startTime: 0.12 });
  }

  // 新关卡音效
  function playNewLevel() {
    const freqs = [523, 659, 784, 880, 1047];
    freqs.forEach((freq, i) => {
      playTone({
        type: 'sine',
        freq,
        duration: 0.15,
        volume: 0.22,
        startTime: i * 0.08
      });
    });
  }

  return {
    init,
    setEnabled,
    isEnabled,
    playSelect,
    playSwap,
    playInvalid,
    playMatch,
    playCombo,
    playExplosion,
    playLineClear,
    playDrop,
    playLevelComplete,
    playGameOver,
    playClick,
    playHint,
    playNewLevel
  };
})();
