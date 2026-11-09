/* 口袋小站 · 轻量交互
   1) 滚动显现  2) 数字滚动  3) 导航状态  4) 卡片跟随光标
   无依赖，不开动画时自动降级 */
(() => {
  const root = document.documentElement;
  root.classList.remove("no-js");

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1) 滚动显现 */
  const reveals = document.querySelectorAll("[data-reveal]");
  if (!reduce && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
    );
    reveals.forEach((el, i) => {
      el.style.transitionDelay = Math.min(i * 45, 240) + "ms";
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* 2) 数字滚动：只滚 data-count 上写的真实值 */
  const counters = document.querySelectorAll("[data-count]");
  const runCount = (el) => {
    const target = Number(el.dataset.count);
    if (!isFinite(target)) return;
    if (reduce) { el.textContent = target; return; }
    const suffix = el.dataset.suffix || "";
    const dur = 700;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (counters.length) {
    if ("IntersectionObserver" in window) {
      const co = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            runCount(entry.target);
            co.unobserve(entry.target);
          });
        },
        { threshold: 0.4 }
      );
      counters.forEach((el) => { el.textContent = "0" + (el.dataset.suffix || ""); co.observe(el); });
    } else {
      counters.forEach(runCount);
    }
  }

  /* 3) 导航滚动状态 */
  const nav = document.querySelector(".nav");
  if (nav) {
    let last = 0;
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      nav.classList.toggle("scrolled", y > 8);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* 4) 卡片跟随光标（仅精确指针，触屏跳过） */
  if (!reduce && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let raf = 0;
    let pending = null;
    document.addEventListener(
      "pointermove",
      (e) => {
        const card = e.target.closest(".card, .b, .wg, .pg, .card-link, .api-entry");
        if (!card) return;
        pending = { card, x: e.clientX, y: e.clientY };
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const item = pending;
          if (!item) return;
          const r = item.card.getBoundingClientRect();
          item.card.style.setProperty("--mx", item.x - r.left + "px");
          item.card.style.setProperty("--my", item.y - r.top + "px");
        });
      },
      { passive: true }
    );
  }
})();
