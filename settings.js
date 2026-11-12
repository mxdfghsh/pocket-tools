/* 把右下角那排小按钮（主题 / 皮肤 / 动效 / 桌宠）收进一个齿轮菜单 */
(function () {
  // 隐藏原有的独立按钮
  var css = document.createElement("style");
  css.textContent = ".theme-btn,.skin-btn,.calm-btn,.pet-btn{display:none!important}";
  document.head.appendChild(css);

  var SKINS = ["", "retro", "tech", "moon"];
  var NAMES = { "": "默认", retro: "怀旧", tech: "科技", moon: "月汐" };

  function themeNow() {
    var t = "system";
    try { t = localStorage.getItem("theme") || "system"; } catch (e) {}
    return t;
  }
  function setTheme(v) {
    try { v === "system" ? localStorage.removeItem("theme") : localStorage.setItem("theme", v); } catch (e) {}
    var d = v === "system" ? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : v;
    document.documentElement.dataset.theme = d;
  }
  function skinNow() { return (window.PocketSkin && window.PocketSkin.read()) || ""; }
  function calmNow() { try { return localStorage.getItem("pocket-calm") === "1"; } catch (e) { return false; } }
  function petNow() { try { return localStorage.getItem("pocket-pet") === "1"; } catch (e) { return false; } }

  function mount() {
    var links = document.querySelector(".nav-links");
    if (!links || links.querySelector(".set-btn")) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "set-btn";
    btn.setAttribute("aria-label", "设置");
    btn.textContent = "⚙️";

    var panel = document.createElement("div");
    panel.className = "set-panel";
    panel.hidden = true;
    panel.innerHTML =
      '<div class="set-row"><span>主题</span><button class="set-opt" data-act="theme">浅色 / 深色</button></div>' +
      '<div class="set-row"><span>皮肤</span><button class="set-opt" data-act="skin">—</button></div>' +
      '<div class="set-row"><span>减少动效</span><button class="set-opt" data-act="calm" aria-pressed="false">关</button></div>' +
      '<div class="set-row"><span>桌宠</span><button class="set-opt" data-act="pet" aria-pressed="false">关</button></div>';

    links.appendChild(btn);
    document.body.appendChild(panel);

    function refresh() {
      var t = themeNow();
      panel.querySelector('[data-act="theme"]').textContent = t === "light" ? "浅色（点切换）" : t === "dark" ? "深色（点切换）" : "跟随系统（点切换）";
      panel.querySelector('[data-act="skin"]').textContent = NAMES[skinNow()] || "默认";
      var cb = panel.querySelector('[data-act="calm"]');
      cb.textContent = calmNow() ? "开" : "关";
      cb.setAttribute("aria-pressed", calmNow() ? "true" : "false");
      var pb = panel.querySelector('[data-act="pet"]');
      pb.textContent = petNow() ? "开" : "关";
      pb.setAttribute("aria-pressed", petNow() ? "true" : "false");
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      panel.hidden = !panel.hidden;
      if (!panel.hidden) refresh();
    });
    document.addEventListener("click", function (e) {
      if (!panel.hidden && !panel.contains(e.target) && e.target !== btn) panel.hidden = true;
    });

    panel.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]");
      if (!b) return;
      var act = b.getAttribute("data-act");
      if (act === "theme") {
        var order = ["system", "light", "dark"];
        var next = order[(order.indexOf(themeNow()) + 1) % order.length];
        setTheme(next);
      }
      if (act === "skin" && window.PocketSkin) {
        var cur = skinNow();
        var n2 = SKINS[(SKINS.indexOf(cur) + 1) % SKINS.length];
        window.PocketSkin.save(n2);
        window.PocketSkin.apply(n2);
        if (n2) window.PocketSkin.play(n2);
      }
      if (act === "calm") {
        var c = !calmNow();
        try { localStorage.setItem("pocket-calm", c ? "1" : "0"); } catch (err) {}
        document.documentElement.classList.toggle("calm", c);
      }
      if (act === "pet") {
        var p = !petNow();
        try { localStorage.setItem("pocket-pet", p ? "1" : "0"); } catch (err) {}
        location.reload();
        return;
      }
      refresh();
    });

    refresh();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
