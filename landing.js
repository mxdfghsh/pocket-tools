/* 口袋工具箱 · 入口页逻辑 */
(() => {
  "use strict";
  const KEY = "pocket-entered";
  const body = document.body;
  const landing = document.getElementById("landing");
  const enterBtn = document.getElementById("enterBtn");
  const backBtn = document.getElementById("backHome");
  const countEl = document.getElementById("landingCount");

  const store = {
    get() { try { return sessionStorage.getItem(KEY); } catch (e) { return null; } },
    set(v) { try { v ? sessionStorage.setItem(KEY, "1") : sessionStorage.removeItem(KEY); } catch (e) {} },
  };

  // 工具数量（等 app.js/extra.js 注册完再读）
  const fillCount = () => {
    const n = window.PocketTools && window.PocketTools.tools ? window.PocketTools.tools.length : 0;
    if (countEl && n) countEl.textContent = n;
  };

  function enter(silent) {
    body.classList.add("entered");
    store.set(true);
    if (landing) {
      landing.classList.add("hide");
      setTimeout(() => { landing.style.display = "none"; }, silent ? 0 : 560);
    }
    if (!silent) fillCount();
  }

  function back() {
    store.set(false);
    body.classList.remove("entered");
    if (landing) {
      landing.style.display = "";
      // 强制 reflow 后再移除 hide，保证过渡重播
      void landing.offsetHeight;
      landing.classList.remove("hide");
    }
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    if (enterBtn) enterBtn.focus({ preventScroll: true });
  }

  // 图片/emoji 悬浮
  const icons = document.querySelectorAll(".landing-icons span");

  enterBtn && enterBtn.addEventListener("click", () => enter(false));
  backBtn && backBtn.addEventListener("click", back);

  // 同一会话内刷新不重复看入口
  if (store.get() === "1") enter(true);
  if (location.hash === "#tools") enter(false);

  document.addEventListener("keydown", (e) => {
    if (body.classList.contains("entered")) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      enter(false);
    }
  });

  fillCount();
})();
