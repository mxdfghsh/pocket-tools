/* 主题切换：亮 / 暗，记住选择，首次跟随系统 */
(() => {
  const KEY = "theme";
  const sys = () => (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  const read = () => { try { return localStorage.getItem(KEY) || "system"; } catch (e) { return "system"; } };
  const apply = (mode) => {
    const eff = mode === "system" ? sys() : mode;
    document.documentElement.dataset.theme = eff;
    document.querySelectorAll(".theme-btn").forEach((b) => {
      b.textContent = eff === "light" ? "🌙" : "☀️";
      b.title = eff === "light" ? "切换到暗色" : "切换到亮色";
      b.setAttribute("aria-label", b.title);
    });
    return eff;
  };
  const save = (mode) => { try { localStorage.setItem(KEY, mode); } catch (e) {} };

  window.PocketTheme = { apply, read, save };

  document.querySelectorAll(".theme-btn").forEach((b) => {
    b.addEventListener("click", () => {
      const cur = document.documentElement.dataset.theme;
      const next = cur === "light" ? "dark" : "light";
      const flip = () => { save(next); apply(next); };
      // 支持 View Transition 的浏览器：从按钮位置圆形扩散过去
      if (document.startViewTransition) {
        const r = b.getBoundingClientRect();
        document.documentElement.style.setProperty("--vt-x", r.left + r.width / 2 + "px");
        document.documentElement.style.setProperty("--vt-y", r.top + r.height / 2 + "px");
        document.documentElement.classList.add("vt-theme");
        const t = document.startViewTransition(flip);
        t.finished.finally(() => document.documentElement.classList.remove("vt-theme"));
      } else {
        flip();
      }
    });
  });

  apply(read());

  if (window.matchMedia) {
    try {
      window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
        if (read() === "system") apply("system");
      });
    } catch (e) {}
  }
})();
