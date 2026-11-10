/* 口袋小站 · 小游戏自适应
   游戏页面是给桌面写的固定尺寸，手机上一屏放不下就往里缩。
   用 zoom 而不是 transform，点击坐标不用换算，游戏内部逻辑不受影响。 */
(function () {
  var sel = window.__FIT_SEL;
  if (!sel) return;

  function pick() {
    if (sel === "canvas") {
      var cs = document.querySelectorAll("canvas");
      for (var i = 0; i < cs.length; i++) if (cs[i].offsetWidth > 200) return cs[i];
      return cs[0];
    }
    return document.querySelector(sel);
  }

  function fit() {
    var el = pick();
    if (!el) return;
    el.style.zoom = "";
    var natural = el.scrollWidth || el.offsetWidth || 0;
    if (natural <= 0) return;
    var avail = document.documentElement.clientWidth - 8;
    if (natural > avail && avail > 120) {
      el.style.zoom = Math.max(0.28, Math.min(1, avail / natural)).toFixed(3);
    }
  }

  window.addEventListener("load", fit);
  window.addEventListener("resize", fit);
  window.addEventListener("orientationchange", function () { setTimeout(fit, 200); });
  fit();
  setTimeout(fit, 600);
  setTimeout(fit, 1600);
})();
