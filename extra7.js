/* 口袋工具箱 · 第七批：代码快照 / Markdown 脑图 */
(() => {
  "use strict";
  const PT = window.PocketTools;
  if (!PT) return;
  const { register, render, el, toast, copyBtn, debounce } = PT;

  /* ================= 58. 代码快照（代码转图片） ================= */
  const KEYWORDS = {
    js: "const let var function return if else for while class new import from export default await async try catch throw typeof instanceof of in this null undefined true false",
    json: "true false null",
    css: "important inherit initial unset auto none block flex grid absolute relative fixed",
    html: "",
    plain: "",
  };

  const THEMES = [
    { id: "midnight", name: "午夜蓝", bg: ["#1a1b26", "#24283b"], chrome: "#16161e", text: "#c0caf5", accent: "#7aa2f7" },
    { id: "sunset", name: "落日橙", bg: ["#2d1b2e", "#4a2545"], chrome: "#241522", text: "#ffe3d3", accent: "#ff8a5c" },
    { id: "paper", name: "纸感", bg: ["#f6f1e7", "#efe7d8"], chrome: "#e6dccb", text: "#3a3227", accent: "#c0562b" },
  ];

  const COLORS = {
    dark: { str: "#9ece6a", com: "#6b7280", num: "#ff9e64", kw: "#bb9af7", fn: "#7aa2f7", tag: "#f7768e", punc: "#89ddff" },
    light: { str: "#3f7d28", com: "#9a8f7f", num: "#b45309", kw: "#7c3aed", fn: "#1d4ed8", tag: "#be123c", punc: "#0e7490" },
  };

  const tokenize = (line, lang) => {
    const out = [];
    const push = (type, text) => out.push({ type, text });
    let i = 0;
    const kw = new Set((KEYWORDS[lang] || "").split(" ").filter(Boolean));
    while (i < line.length) {
      const rest = line.slice(i);
      let m;
      if ((m = /^\/\/.*/.exec(rest)) || (m = /^#.*/.exec(rest) && lang !== "css" && line.trim().startsWith("#"))) {
        push("com", m[0]); i += m[0].length; continue;
      }
      if ((m = /^"[^"]*"?|^'[^']*'?|^`[^`]*`?/.exec(rest))) { push("str", m[0]); i += m[0].length; continue; }
      if (lang === "html" && (m = /^<\/?[\w-]+/.exec(rest))) { push("tag", m[0]); i += m[0].length; continue; }
      if ((m = /^\b\d+(?:\.\d+)?\b/.exec(rest))) { push("num", m[0]); i += m[0].length; continue; }
      if ((m = /^[A-Za-z_$][\w$]*/.exec(rest))) {
        const w = m[0];
        push(kw.has(w) ? "kw" : /^[A-Za-z_$][\w$]*\s*\(/.test(rest) ? "fn" : "plain", w);
        i += w.length; continue;
      }
      if ((m = /^[{}()[\];:,.<>=+\-*/%!&|?]+/.exec(rest))) { push("punc", m[0]); i += m[0].length; continue; }
      push("plain", line[i]); i++;
    }
    return out;
  };

  const roundRect = (g, x, y, w, h, r) => {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  };

  register({
    id: "codeimg", icon: "📸", name: "代码快照",
    desc: "把代码贴进来，生成一张带窗口和背景的好看截图，能存 PNG",
    tags: ["code", "image", "截图", "carbon", "分享", "开发"],
    build() {
      const input = el("textarea", { rows: "8", style: "font-family:var(--mono);font-size:12.5px", placeholder: 'const greet = (name) => `你好，${name}`;\nconsole.log(greet("世界"));' });
      const lang = el("select", {}, ...["js", "json", "css", "html", "plain"].map((x) => el("option", { value: x }, x)));
      const theme = el("select", {}, ...THEMES.map((t) => el("option", { value: t.id }, t.name)));
      const title = el("input", { type: "text", value: "snippet.js", style: "width:140px" });
      const font = el("input", { type: "range", min: "12", max: "22", value: "15", style: "width:100px" });
      const cv = el("canvas", { style: "max-width:100%;border-radius:12px;border:1px solid var(--line);margin-top:10px;display:block" });
      const msg = el("p", { class: "hint" });

      const draw = () => {
        const code = input.value.replace(/\t/g, "  ").replace(/\s+$/, "");
        if (!code) { msg.textContent = "贴点代码进来"; return; }
        const th = THEMES.find((t) => t.id === theme.value) || THEMES[0];
        const isLight = th.id === "paper";
        const C = isLight ? COLORS.light : COLORS.dark;
        const fs = Number(font.value);
        const lh = Math.round(fs * 1.65);
        const lines = code.split("\n");
        const padX = 22, padY = 18, gutter = String(lines.length).length * fs * 0.62 + 16;
        const maxChars = Math.max(...lines.map((l) => l.length), 24);
        const W = Math.min(1400, Math.round(padX * 2 + gutter + maxChars * fs * 0.62));
        const H = Math.round(padY * 2 + 34 + lines.length * lh);

        cv.width = W * 2; cv.height = H * 2;
        cv.style.width = W + "px";
        const g = cv.getContext("2d");
        g.scale(2, 2);

        const grad = g.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, th.bg[0]); grad.addColorStop(1, th.bg[1]);
        g.fillStyle = grad; g.fillRect(0, 0, W, H);

        // 窗口
        const winY = 14, winH = H - 28;
        g.globalAlpha = 0.55; g.fillStyle = th.chrome;
        roundRect(g, 12, winY, W - 24, winH, 12); g.fill();
        g.globalAlpha = 1;
        g.strokeStyle = isLight ? "rgba(0,0,0,.12)" : "rgba(255,255,255,.12)";
        g.lineWidth = 1; roundRect(g, 12, winY, W - 24, winH, 12); g.stroke();

        // 三个点 + 文件名
        const dots = ["#ff5f57", "#febc2e", "#28c840"];
        dots.forEach((c, i) => {
          g.beginPath(); g.arc(30 + i * 16, winY + 17, 5, 0, Math.PI * 2); g.fillStyle = c; g.fill();
        });
        g.fillStyle = th.text; g.globalAlpha = 0.65;
        g.font = `600 ${Math.round(fs * 0.82)}px ui-monospace, Menlo, monospace`;
        g.fillText(title.value || "snippet", 90, winY + 22);
        g.globalAlpha = 1;

        // 代码
        g.font = `${fs}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
        g.textBaseline = "top";
        const x0 = 26 + gutter;
        lines.forEach((line, i) => {
          const y = winY + 40 + i * lh;
          g.fillStyle = th.text; g.globalAlpha = 0.35;
          const num = String(i + 1);
          g.fillText(num, x0 - 14 - num.length * fs * 0.6, y);
          g.globalAlpha = 1;
          let x = x0;
          for (const t of tokenize(line, lang.value)) {
            g.fillStyle = t.type === "plain" ? th.text : C[t.type] || th.text;
            g.fillText(t.text, x, y);
            x += g.measureText(t.text).width;
          }
        });

        msg.textContent = W + "×" + H + " · " + lines.length + " 行";
        msg.className = "hint ok";
      };

      [input, title].forEach((x) => x.addEventListener("input", debounce(draw, 220)));
      [lang, theme, font].forEach((x) => x.addEventListener("input", draw));
      theme.addEventListener("change", draw);
      draw();

      return el("div", {},
        input,
        el("div", { class: "row", style: "margin-top:9px" }, lang, theme,
          el("span", { class: "field-label", style: "margin:0 0 0 8px" }, "字号"), font, title),
        cv,
        el("div", { class: "row" }, el("button", {
          class: "btn primary", type: "button",
          onclick: () => cv.toBlob((b) => {
            if (!b) return;
            const a = el("a", { href: URL.createObjectURL(b), download: (title.value || "snippet").replace(/\.[a-z]+$/, "") + ".png" });
            document.body.appendChild(a); a.click(); a.remove();
          }, "image/png"),
        }, "存成 PNG")),
        msg,
        el("p", { class: "hint" }, "全在本机画，代码不会发到任何地方。")
      );
    },
  });

  /* ================= 59. Markdown 脑图 ================= */
  const parseOutline = (text) => {
    const root = { text: "脑图", children: [], level: 0 };
    const stack = [root];
    let lastH = 0;
    String(text).split(/\r?\n/).forEach((raw) => {
      if (!raw.trim()) return;
      const h = /^(#{1,6})\s+(.*)$/.exec(raw);
      const li = /^(\s*)[-*+]\s+(.*)$/.exec(raw);
      let level, text2;
      if (h) {
        level = Math.min(h[1].length, 6);
        lastH = level;
        text2 = h[2].trim();
      } else if (li) {
        const indent = Math.floor(li[1].replace(/\t/g, "  ").length / 2);
        level = (lastH || 1) + 1 + indent;
        text2 = li[2].trim();
      } else return;
      while (stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop();
      const node = { text: text2, children: [], level };
      stack[stack.length - 1].children.push(node);
      stack.push(node);
    });
    return root;
  };

  const layoutTree = (root, opts) => {
    const lh = 30, gap = 18, padX = 14;
    let x = 0;
    const nodes = [], links = [];
    const measure = (n, ctx) => {
      ctx.font = "600 13px system-ui, sans-serif";
      n.w = Math.min(220, Math.round(ctx.measureText(n.text).width) + padX * 2);
    };
    const measureCtx = document.createElement("canvas").getContext("2d");
    const walk = (n, depth) => {
      measure(n, measureCtx);
      n.depth = depth;
      n.h = 26;
      if (!n.children.length) {
        n.y = nodes.length * (n.h + gap);
        n.x = depth * 200;
        nodes.push(n);
        return n.y + n.h / 2;
      }
      const ys = n.children.map((c) => walk(c, depth + 1));
      n.x = depth * 200;
      n.y = (ys[0] + ys[ys.length - 1]) / 2 - n.h / 2;
      n.cy = ys[0] + (ys[ys.length - 1] - ys[0]) / 2;
      nodes.push(n);
      n.children.forEach((c) => links.push({ from: n, to: c }));
      return n.cy + n.h / 2 - n.h / 2;
    };
    walk(root, 0);
    const W = Math.max(...nodes.map((n) => n.x + n.w)) + 40;
    const H = Math.max(...nodes.map((n) => n.y + n.h)) + 40;
    return { nodes, links, W, H };
  };

  register({
    id: "mdmap", icon: "🗺", name: "Markdown 脑图",
    desc: "大纲或 Markdown 直接画成思维导图，能存 SVG",
    tags: ["markdown", "脑图", "思维导图", "map", "开发"],
    build() {
      const sample = "# 项目\n## 前端\n- 页面\n- 组件\n## 后端\n- 接口\n- 数据库\n## 部署\n- GitHub Pages";
      const input = el("textarea", { rows: "8", style: "font-family:var(--mono);font-size:12.5px" });
      input.value = sample;
      const box = el("div", { style: "margin-top:10px;overflow:auto;border:1px solid var(--line);border-radius:12px;background:var(--bg);padding:10px" });
      const msg = el("p", { class: "hint" });
      let lastSvg = "";

      const draw = () => {
        const text = input.value.trim();
        if (!text) { box.innerHTML = ""; msg.textContent = ""; return; }
        const tree = parseOutline(text);
        const { nodes, links, W, H } = layoutTree(tree);
        const css = getComputedStyle(document.documentElement);
        const ink = css.getPropertyValue("--ink").trim() || "#f0ece0";
        const accent = css.getPropertyValue("--accent").trim() || "#ff6b45";
        const surface = css.getPropertyValue("--surface").trim() || "#1a1c17";
        const line = css.getPropertyValue("--line-strong").trim() || "rgba(255,255,255,.3)";

        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="system-ui, -apple-system, 'PingFang SC', sans-serif">`;
        svg += `<rect width="${W}" height="${H}" fill="transparent"/>`;
        links.forEach(({ from, to }) => {
          const x1 = from.x + from.w, y1 = from.y + from.h / 2, x2 = to.x, y2 = to.y + to.h / 2;
          const mx = (x1 + x2) / 2;
          svg += `<path d="M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}" fill="none" stroke="${line}" stroke-width="1.5"/>`;
        });
        nodes.forEach((n) => {
          const isRoot = n.depth === 0;
          const fill = isRoot ? accent : surface;
          const color = isRoot ? "#fff" : ink;
          svg += `<g><rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="8" fill="${fill}" stroke="${line}"/>`;
          svg += `<text x="${n.x + n.w / 2}" y="${n.y + n.h / 2 + 4.5}" text-anchor="middle" font-size="13" font-weight="${isRoot ? 700 : 500}" fill="${color}">${n.text.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]))}</text></g>`;
        });
        svg += "</svg>";
        lastSvg = svg;
        box.innerHTML = svg;
        msg.textContent = nodes.length + " 个节点 · " + W + "×" + H;
        msg.className = "hint ok";
      };

      input.addEventListener("input", debounce(draw, 250));
      draw();

      return el("div", {},
        input,
        el("div", { class: "row", style: "margin-top:9px" },
          el("button", { class: "btn primary", type: "button", onclick: draw }, "生成"),
          el("button", {
            class: "btn", type: "button",
            onclick: () => {
              if (!lastSvg) return toast("先生成一张");
              const blob = new Blob([lastSvg], { type: "image/svg+xml" });
              const a = el("a", { href: URL.createObjectURL(blob), download: "mindmap.svg" });
              document.body.appendChild(a); a.click(); a.remove();
            },
          }, "存成 SVG")),
        box, msg,
        el("p", { class: "hint" }, "用 # 表示层级、- 表示同级条目；纯前端布局，不发请求。")
      );
    },
  });

  render();
  window.__PT7 = { parseOutline, tokenize };
})();
