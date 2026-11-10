/* 口袋小站 · 给小游戏补一个方向键
   有些游戏只认键盘，手机上玩不了；这里画一个半透明方向键，
   按下时往 window/document/body 上都派发 keydown，松开派发 keyup。 */
(function () {
  var cfg = window.__PAD_KEYS || ["left", "right"];
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) return; // 有鼠标就不用

  var MAP = {
    left: { key: "ArrowLeft", code: 37 },
    up: { key: "ArrowUp", code: 38 },
    right: { key: "ArrowRight", code: 39 },
    down: { key: "ArrowDown", code: 40 },
    space: { key: " ", code: 32 },
  };

  function fire(name, down) {
    var m = MAP[name];
    if (!m) return;
    var ev = new KeyboardEvent(down ? "keydown" : "keyup", {
      key: m.key, code: m.key, bubbles: true, cancelable: true, view: window,
    });
    try {
      Object.defineProperty(ev, "keyCode", { get: function () { return m.code; } });
      Object.defineProperty(ev, "which", { get: function () { return m.code; } });
    } catch (e) {}
    [window, document, document.body].forEach(function (t) { if (t) t.dispatchEvent(ev); });
  }

  var css = document.createElement("style");
  css.textContent = [
    ".pad{position:fixed;right:10px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:99998;display:grid;grid-template-columns:repeat(3,54px);grid-template-rows:repeat(2,54px);gap:6px;opacity:.55}",
    ".pad button{width:54px;height:54px;border-radius:14px;border:1px solid rgba(255,255,255,.5);background:rgba(0,0,0,.45);color:#fff;font:700 20px/1 system-ui;backdrop-filter:blur(4px);-webkit-tap-highlight-color:transparent;user-select:none;touch-action:none}",
    ".pad button:active{background:rgba(255,255,255,.35)}",
    ".pad .l{grid-area:2/1}.pad .u{grid-area:1/2}.pad .d{grid-area:2/2}.pad .r{grid-area:2/3}.pad .s{grid-area:1/3;font-size:12px}",
  ].join("");
  document.head.appendChild(css);

  var pad = document.createElement("div");
  pad.className = "pad";
  var order = [
    ["l", "left", "←"], ["u", "up", "↑"], ["d", "down", "↓"], ["r", "right", "→"], ["s", "space", "发射"],
  ];
  order.forEach(function (o) {
    if (cfg.indexOf(o[1]) < 0) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = o[0];
    b.textContent = o[2];
    b.setAttribute("data-k", o[1]);
    function start(e) { e.preventDefault(); fire(o[1], true); }
    function end(e) { e.preventDefault(); fire(o[1], false); }
    b.addEventListener("touchstart", start, { passive: false });
    b.addEventListener("touchend", end, { passive: false });
    b.addEventListener("touchcancel", end, { passive: false });
    b.addEventListener("mousedown", start);
    b.addEventListener("mouseup", end);
    b.addEventListener("mouseleave", end);
    pad.appendChild(b);
  });
  document.body.appendChild(pad);
})();
