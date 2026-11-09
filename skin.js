/* 皮肤（怀旧 / 科技）+ 开屏动画 */
(() => {
  const KEY = "pocket-skin";
  const SPLASH_KEY = "pocket-splash-done";
  const order = ["", "retro", "tech"];
  const names = { "": "默认", retro: "怀旧风", tech: "科技风" };

  const read = () => { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } };
  const save = (v) => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) {} };

  function apply(skin) {
    if (skin) document.documentElement.dataset.skin = skin;
    else delete document.documentElement.dataset.skin;
    document.querySelectorAll(".skin-btn").forEach((b) => {
      b.textContent = skin === "retro" ? "📺" : skin === "tech" ? "🛰️" : "🎨";
      b.title = "当前风格：" + (names[skin] || "默认") + "（点击切换）";
      b.setAttribute("aria-label", b.title);
    });
  }

  // ---------- 开屏 ----------
  function playSplash(skin) {
    if (!skin || skin === "") return;
    const old = document.querySelector(".splash");
    if (old) old.remove();
    const el = document.createElement("div");
    el.className = "splash splash-" + skin;

    if (skin === "retro") {
      let petals = "";
      for (let i = 0; i < 8; i++) petals += '<span class="petal" style="--i:' + i + '"></span>';
      el.innerHTML =
        '<div class="petals">' + petals + "</div>" +
        '<div class="splash-text">' +
        '<div class="l1">休息一下</div>' +
        '<div class="l2">马上回来</div>' +
        '<div class="l3">少 儿 频 道 · 请 稍 候</div>' +
        "</div>";
    } else {
      el.innerHTML =
        '<div class="gridbg"></div>' +
        '<div class="ring r1"></div><div class="ring r2"></div><div class="ring r3"></div>' +
        '<div class="scanbar"></div>' +
        '<div class="corner c1"></div><div class="corner c2"></div><div class="corner c3"></div><div class="corner c4"></div>' +
        '<div class="hud">' +
        '<div class="t1" data-t="SYSTEM ONLINE">SYSTEM ONLINE</div>' +
        '<div class="t2">口袋小站 · 正在接入</div>' +
        '<div class="bar"><i></i></div>' +
        "</div>";
    }

    document.body.appendChild(el);
    const dur = skin === "retro" ? 3000 : 2800;
    setTimeout(() => {
      el.classList.add("out");
      setTimeout(() => el.remove(), 600);
    }, dur);
  }

  // ---------- 切换按钮 ----------
  function mountButton() {
    const navLinks = document.querySelector(".nav-links");
    if (!navLinks || navLinks.querySelector(".skin-btn")) return;
    const btn = document.createElement("button");
    btn.className = "skin-btn";
    btn.type = "button";
    btn.addEventListener("click", () => {
      const cur = read();
      const next = order[(order.indexOf(cur) + 1) % order.length];
      save(next);
      apply(next);
      if (next) {
        try { sessionStorage.removeItem(SPLASH_KEY); } catch (e) {}
        playSplash(next);
      }
    });
    navLinks.appendChild(btn);
  }

  apply(read());
  document.addEventListener("DOMContentLoaded", () => {
    mountButton();
    apply(read());
    // 每次打开网站都放一次开屏（同一会话内只放一次）
    const skin = read();
    if (skin) {
      let done = null;
      try { done = sessionStorage.getItem(SPLASH_KEY); } catch (e) {}
      if (!done) {
        try { sessionStorage.setItem(SPLASH_KEY, "1"); } catch (e) {}
        playSplash(skin);
      }
    }
  });

  window.PocketSkin = { apply, play: playSplash, read, save };
})();
