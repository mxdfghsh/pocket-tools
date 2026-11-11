/* 桌宠：按需加载 + 界面开关
   - 默认关闭，存在 localStorage 的 pocket-pet === "1" 时自动加载
   - 导航栏会多一个 🦊 按钮，点一下即时开关，不用刷新
   - 终端里的 pet 命令也走同一套 API */
(function () {
  var KEY = "pocket-pet";
  var CSS = "pet.css?v=3";
  var JS = "pet.js?v=4";

  function isOn() {
    try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; }
  }

  function setFlag(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
    syncButton();
  }

  function enable() {
    if (document.getElementById("pocket-pet")) { setFlag("1"); return; }
    if (!document.querySelector('link[href*="pet.css"]')) {
      var css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = CSS;
      document.head.appendChild(css);
    }
    var js = document.createElement("script");
    js.src = JS;
    js.onload = function () { setFlag("1"); };
    document.body.appendChild(js);
  }

  function disable() {
    var pet = document.getElementById("pocket-pet");
    if (pet) pet.remove();
    var css = document.querySelector('link[href*="pet.css"]');
    if (css) css.remove();
    setFlag("0");
  }

  function toggle() {
    if (isOn() || document.getElementById("pocket-pet")) disable();
    else enable();
  }

  function syncButton() {
    var b = document.querySelector(".pet-btn");
    if (!b) return;
    var on = isOn() || !!document.getElementById("pocket-pet");
    b.textContent = on ? "🦊" : "💤";
    b.title = on ? "桌宠开着，点一下收起来" : "叫出桌宠";
    b.setAttribute("aria-pressed", on ? "true" : "false");
  }

  function mountButton() {
    var links = document.querySelector(".nav-links");
    if (!links || links.querySelector(".pet-btn")) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "pet-btn";
    b.setAttribute("aria-label", "桌宠开关");
    b.addEventListener("click", function () { toggle(); syncButton(); });
    links.appendChild(b);
    syncButton();
  }

  window.PocketPet = { isOn: isOn, enable: enable, disable: disable, toggle: toggle };

  function boot() {
    mountButton();
    if (isOn()) enable();
    syncButton();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
