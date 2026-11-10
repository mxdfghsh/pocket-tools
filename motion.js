/* 口袋小站 · 动效层
   滚动进度 / 首屏逐字 / 导航胶囊 / 指针光晕 / 按钮涟漪 / 回到顶部
   零依赖；系统开了「减少动态效果」就整层不启动 */
(() => {
  const root = document.documentElement;
  const body = document.body;
  if (!body) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- 1. 首屏标题逐字 ---------- */
  const splitTitle = (el) => {
    if (el.dataset.split) return;
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const text = n.textContent;
          if (!text) return;
          const frag = document.createDocumentFragment();
          for (const ch of text) {
            const span = document.createElement("span");
            span.className = "ch";
            span.textContent = ch === " " ? "\u00a0" : ch;
            span.style.setProperty("--d", i++);
            frag.appendChild(span);
          }
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") {
          walk(n);
        }
      });
    };
    if (!el.getAttribute("aria-label")) el.setAttribute("aria-label", el.textContent.trim());
    walk(el);
    el.dataset.split = "1";
    el.classList.add("split");
  };

  document.querySelectorAll(".hero-home h1, .hero h1, .landing-title").forEach(splitTitle);

  // 拆完字再打开动效，避免闪一下
  root.classList.add("motion-on");

  /* ---------- 2. 滚动进度 + 回到顶部 + 首屏视差 ---------- */
  const bar = document.createElement("div");
  bar.className = "m-bar";
  bar.setAttribute("aria-hidden", "true");

  const top = document.createElement("button");
  top.className = "m-top";
  top.type = "button";
  top.innerHTML = "↑";
  top.setAttribute("aria-label", "回到顶部");
  top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  body.append(bar, top);

  const hero = document.querySelector(".hero-home, .hero");
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
    bar.classList.toggle("on", y > 4);
    top.classList.toggle("on", y > window.innerHeight * 0.9);
    if (hero) {
      if (y < 760) hero.style.transform = y > 0 ? "translate3d(0," + (-y * 0.045).toFixed(1) + "px,0)" : "";
      else hero.style.transform = "translate3d(0,-34px,0)";
    }
    ticking = false;
  };
  const queue = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScroll);
  };
  window.addEventListener("scroll", queue, { passive: true });
  onScroll();

  /* ---------- 3. 导航选中胶囊 ---------- */
  const samePage = (a) => {
    try {
      const u = new URL(a.getAttribute("href"), location.href);
      if (u.origin !== location.origin) return false;
      const norm = (p) => p.replace(/index\.html$/, "");
      return norm(u.pathname) === norm(location.pathname);
    } catch (e) { return false; }
  };

  document.querySelectorAll(".nav-links").forEach((box) => {
    const links = [...box.querySelectorAll("a")];
    if (!links.length) return;
    const pill = document.createElement("span");
    pill.className = "m-pill";
    pill.setAttribute("aria-hidden", "true");
    box.appendChild(pill);

    const place = () => {
      const active = links.find((a) => a.classList.contains("active")) || links.find(samePage);
      if (!active) return;
      pill.style.width = active.offsetWidth + "px";
      pill.style.transform = "translate(" + active.offsetLeft + "px, -50%)";
      pill.classList.add("ready");
    };
    place();
    window.addEventListener("resize", () => requestAnimationFrame(place), { passive: true });
    window.addEventListener("load", place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place).catch(() => {});
  });

  /* ---------- 4. 指针光晕（只对精确指针） ---------- */
  if (fine) {
    let raf = 0;
    let last = null;
    document.addEventListener("pointermove", (e) => {
      const el = e.target.closest && e.target.closest(".card, .ai-card, .index-row, .wg, .pg, .gcard, .b");
      if (!el) return;
      last = { el, x: e.clientX, y: e.clientY };
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!last) return;
        const r = last.el.getBoundingClientRect();
        last.el.style.setProperty("--mx", last.x - r.left + "px");
        last.el.style.setProperty("--my", last.y - r.top + "px");
      });
    }, { passive: true });
  }

  /* ---------- 5. 按钮涟漪 ---------- */
  document.addEventListener("pointerdown", (e) => {
    const el = e.target.closest && e.target.closest(
      ".btn-primary, .btn-ghost, .landing-cta, .theme-btn, .skin-btn, .m-top, .g-btn"
    );
    if (!el) return;
    const r = el.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 0.95;
    const dot = document.createElement("span");
    dot.className = "m-ripple";
    dot.style.width = dot.style.height = size + "px";
    dot.style.left = e.clientX - r.left - size / 2 + "px";
    dot.style.top = e.clientY - r.top - size / 2 + "px";
    el.appendChild(dot);
    setTimeout(() => dot.remove(), 620);
  }, { passive: true });
})();
