/* 口袋工具箱 · 追加工具包（第五批：倒数日 / 折扣 / 复利 / 文本清洗 / HTML 转义 / Base64 预览 / 状态码 / 对比度） */
(() => {
  "use strict";
  const PT = window.PocketTools;
  if (!PT) return;
  const { register, render, el, toast, copyBtn, debounce } = PT;

  const num = (v) => { const n = Number(String(v).replace(/[,，]/g, "")); return isFinite(n) ? n : NaN; };
  const money = (n) => (isFinite(n) ? n : 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* ================= 42. 倒数日 ================= */
  const DAY = 86400000;
  const KEY = "pocket-countdown";
  const ymd = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const daysTo = (dateStr, repeat) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (!m) return null;
    const today = startOfDay(new Date());
    let target = new Date(+m[1], +m[2] - 1, +m[3]);
    if (repeat) {
      target = new Date(today.getFullYear(), +m[2] - 1, +m[3]);
      if (target < today) target = new Date(today.getFullYear() + 1, +m[2] - 1, +m[3]);
    }
    return Math.round((target - today) / DAY);
  };

  register({
    id: "countdown", icon: "🎂", name: "倒数日",
    desc: "生日、纪念日、考试，还有几天一清二楚",
    tags: ["countdown", "倒数", "生日", "纪念日", "考试", "日子"],
    build() {
      const name = el("input", { type: "text", placeholder: "比如：生日 / 考试 / 发工资" });
      const date = el("input", { type: "date", value: ymd(new Date()) });
      const repeat = el("input", { type: "checkbox" });
      const repeatWrap = el("label", { class: "chk" }, repeat, "每年重复");
      const list = el("div", { style: "margin-top:12px;display:grid;gap:8px" });
      const msg = el("p", { class: "hint" });

      const load = () => {
        try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; }
      };
      const store = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };

      const draw = () => {
        const items = load();
        list.innerHTML = "";
        if (!items.length) {
          list.appendChild(el("p", { class: "hint" }, "还没有，下面加一个试试。"));
          return;
        }
        items
          .map((it) => ({ it, d: daysTo(it.date, it.repeat) }))
          .sort((a, b) => (a.d === null ? 1 : b.d === null ? -1 : a.d - b.d))
          .forEach(({ it, d }) => {
            const text = d === null ? "日期不对" : d === 0 ? "就是今天！" : d > 0 ? "还有 " + d + " 天" : "已经过了 " + -d + " 天";
            list.appendChild(el("div", {
              style: "display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:10px;background:var(--bg);border:1px solid var(--line)",
            },
              el("div", { style: "flex:1;min-width:0" },
                el("b", { style: "display:block;font-size:13.5px" }, it.name || "未命名"),
                el("span", { style: "font:11.5px var(--mono);color:var(--muted)" }, it.date + (it.repeat ? " · 每年" : ""))),
              el("b", { style: "font:700 14px var(--mono);color:" + (d !== null && d >= 0 && d <= 7 ? "var(--accent)" : "var(--ink)") }, text),
              el("button", {
                class: "btn mini", type: "button", title: "删掉",
                onclick: () => { store(load().filter((x) => x.id !== it.id)); draw(); },
              }, "✕")
            ));
          });
      };

      const add = () => {
        if (!date.value) { toast("先选个日期"); return; }
        const items = load();
        items.push({ id: Date.now() + "" + Math.random().toString(16).slice(2, 6), name: name.value.trim() || "未命名", date: date.value, repeat: repeat.checked });
        store(items);
        name.value = "";
        draw();
      };

      draw();
      msg.textContent = "存在这台手机上，换设备看不到。";
      return el("div", {},
        el("div", { class: "row" }, name),
        el("div", { class: "row" }, date, repeatWrap, el("button", { class: "btn primary", type: "button", onclick: add }, "加上")),
        list, msg
      );
    },
  });

  /* ================= 43. 折扣计算 ================= */
  const discountOf = (price, zhe, off, coupon) => {
    const first = price * (zhe / 10);
    const after = Math.max(0, first - off - coupon);
    return { pay: after, saved: Math.max(0, price - after), rate: price > 0 ? after / price * 10 : 0 };
  };

  register({
    id: "discount", icon: "🏷", name: "折扣计算",
    desc: "打完折、减完券，到底付多少、省多少",
    tags: ["discount", "折扣", "优惠", "满减", "省钱", "价格"],
    build() {
      const price = el("input", { type: "number", value: "299", step: "1" });
      const zhe = el("input", { type: "number", value: "8.5", step: "0.1" });
      const off = el("input", { type: "number", value: "0", step: "1" });
      const coupon = el("input", { type: "number", value: "0", step: "1" });
      const out = el("div", { class: "kv-list" });
      const msg = el("p", { class: "hint" });

      const run = () => {
        const p = num(price.value), z = num(zhe.value), o = num(off.value) || 0, c = num(coupon.value) || 0;
        if (!isFinite(p) || p <= 0 || !isFinite(z)) { out.innerHTML = ""; return; }
        const r = discountOf(p, z, o, c);
        out.innerHTML = "";
        out.append(
          el("div", { class: "kv-row" }, el("span", {}, "实付"), el("b", { class: "ok" }, "¥ " + money(r.pay))),
          el("div", { class: "kv-row" }, el("span", {}, "省了"), el("b", {}, "¥ " + money(r.saved))),
          el("div", { class: "kv-row" }, el("span", {}, "相当于"), el("b", {}, r.rate.toFixed(1) + " 折")),
          el("div", { class: "kv-row" }, el("span", {}, "优惠比例"), el("b", {}, (100 - r.rate * 10).toFixed(1) + "%"))
        );
        msg.textContent = "原价 " + money(p) + " × " + z + " 折 − 立减 " + money(o) + " − 券 " + money(c);
        msg.className = "hint ok";
      };

      [price, zhe, off, coupon].forEach((i) => i.addEventListener("input", debounce(run, 120)));
      run();

      return el("div", {},
        el("div", { class: "row" }, el("span", { class: "field-label", style: "margin:0" }, "原价"), price),
        el("div", { class: "row" }, el("span", { class: "field-label", style: "margin:0" }, "折扣（几折）"), zhe,
          el("span", { class: "field-label", style: "margin:0 0 0 8px" }, "立减"), off,
          el("span", { class: "field-label", style: "margin:0 0 0 8px" }, "券"), coupon),
        out, msg
      );
    },
  });

  /* ================= 44. 复利 / 存款 ================= */
  const compound = (P, ratePct, years, perYear) => {
    const r = ratePct / 100;
    const n = perYear || 1;
    const total = P * Math.pow(1 + r / n, n * years);
    return { total, interest: total - P, simple: P * (1 + r * years) };
  };

  register({
    id: "compound", icon: "💰", name: "存钱复利",
    desc: "本金放几年变多少，单利和复利差多少",
    tags: ["compound", "复利", "利息", "存款", "理财", "年化"],
    build() {
      const P = el("input", { type: "number", value: "10000", step: "1000" });
      const rate = el("input", { type: "number", value: "3", step: "0.1" });
      const years = el("input", { type: "number", value: "10", step: "1" });
      const freq = el("select", {},
        el("option", { value: "1" }, "每年"), el("option", { value: "4" }, "每季"),
        el("option", { value: "12", selected: "" }, "每月"), el("option", { value: "365" }, "每天")
      );
      const out = el("output", { class: "block", style: "min-height:auto;font:13.5px/1.9 var(--mono)" });
      const msg = el("p", { class: "hint" });

      const run = () => {
        const p = num(P.value), r = num(rate.value), y = num(years.value);
        if (!isFinite(p) || !isFinite(r) || !isFinite(y)) { out.textContent = ""; return; }
        const c = compound(p, r, y, Number(freq.value));
        out.textContent =
          "到期本息：" + money(c.total) + " 元\n" +
          "利息合计：" + money(c.interest) + " 元\n" +
          "同样利率单利：" + money(c.simple) + " 元\n" +
          "复利多赚：" + money(c.total - c.simple) + " 元\n" +
          "实际收益：" + ((c.total / p - 1) * 100).toFixed(2) + "%";
        msg.textContent = "年化 " + r + "%，" + y + " 年，" + freq.selectedOptions[0].textContent + "复利";
        msg.className = "hint ok";
      };

      [P, rate, years].forEach((i) => i.addEventListener("input", debounce(run, 150)));
      freq.addEventListener("change", run);
      run();

      return el("div", {},
        el("div", { class: "row" }, el("span", { class: "field-label", style: "margin:0" }, "本金"), P),
        el("div", { class: "row" }, el("span", { class: "field-label", style: "margin:0" }, "年化"), rate,
          el("span", { style: "color:var(--muted)" }, "%"), el("span", { class: "field-label", style: "margin:0 0 0 8px" }, "年数"), years),
        el("div", { class: "row" }, freq),
        out, msg
      );
    },
  });

  /* ================= 45. 文本清洗 ================= */
  const cleanText = (t, opt) => {
    let s = t;
    if (opt.zero) s = s.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "");
    if (opt.crlf) s = s.replace(/\r\n?/g, "\n");
    let lines = s.split("\n");
    if (opt.trim) lines = lines.map((l) => l.trim());
    if (opt.space) lines = lines.map((l) => l.replace(/[ \t]{2,}/g, " "));
    if (opt.blank) lines = lines.filter((l) => l.length);
    if (opt.dedup) lines = [...new Set(lines)];
    if (opt.reverse) lines = lines.reverse();
    if (opt.number) lines = lines.map((l, i) => String(i + 1).padStart(String(lines.length).length, " ") + ". " + l);
    return lines.join("\n");
  };

  register({
    id: "clean", icon: "🧽", name: "文本清洗",
    desc: "去零宽字符、多余空格、空行，还能加行号、倒着排",
    tags: ["clean", "清洗", "空格", "空行", "行号", "排版"],
    build() {
      const input = el("textarea", { rows: "6", placeholder: "粘一段从网页/PDF 复制来的文字…" });
      const out = el("textarea", { rows: "6", readonly: "" });
      const msg = el("p", { class: "hint" });
      const opt = { zero: true, crlf: true, trim: true, space: true, blank: true, dedup: false, reverse: false, number: false };

      const mk = (k, label) => {
        const cb = el("input", { type: "checkbox" });
        cb.checked = !!opt[k];
        cb.addEventListener("change", () => { opt[k] = cb.checked; run(); });
        return el("label", { class: "chk" }, cb, label);
      };

      const run = () => {
        const before = input.value.length;
        out.value = cleanText(input.value, opt);
        msg.textContent = "字符 " + before + " → " + out.value.length + " · 行 " + input.value.split(/\r?\n/).length + " → " + (out.value ? out.value.split("\n").length : 0);
        msg.className = "hint ok";
      };

      input.addEventListener("input", debounce(run, 150));
      return el("div", {},
        input,
        el("div", { class: "row", style: "margin-top:9px" },
          mk("zero", "去零宽"), mk("trim", "去首尾空格"), mk("space", "合并空格"), mk("blank", "去空行"),
          mk("dedup", "去重行"), mk("reverse", "倒序"), mk("number", "加行号")),
        out, el("div", { class: "row" }, copyBtn(() => out.value)), msg
      );
    },
  });

  /* ================= 46. HTML 转义 ================= */
  const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const unescapeHtml = (s) => s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

  register({
    id: "html", icon: "🧾", name: "HTML 转义",
    desc: "把尖括号变成安全字符，也能还原回去",
    tags: ["html", "转义", "escape", "实体", "entities"],
    build() {
      const input = el("textarea", { rows: "5", placeholder: '<div class="x">你好</div> 或 &lt;div&gt;' });
      const out = el("textarea", { rows: "5", readonly: "" });
      const msg = el("p", { class: "hint" });
      const run = (dir) => {
        out.value = dir === "esc" ? escapeHtml(input.value) : unescapeHtml(input.value);
        msg.textContent = dir === "esc" ? "已转义（可以直接塞进 HTML 里显示）" : "已还原";
        msg.className = "hint ok";
      };
      return el("div", {},
        input,
        el("div", { class: "row" },
          el("button", { class: "btn primary", type: "button", onclick: () => run("esc") }, "转义"),
          el("button", { class: "btn", type: "button", onclick: () => run("unesc") }, "还原")),
        out, el("div", { class: "row" }, copyBtn(() => out.value)), msg
      );
    },
  });

  /* ================= 47. Base64 图片预览 ================= */
  register({
    id: "imgview", icon: "🖼", name: "图片还原",
    desc: "把 data:image 或 Base64 粘进来，看看是什么图",
    tags: ["base64", "图片", "dataurl", "预览", "还原"],
    build() {
      const input = el("textarea", { rows: "4", placeholder: "data:image/png;base64,iVBORw0… 或者只粘 base64 也可以" });
      const img = el("img", { style: "max-width:100%;border-radius:12px;margin-top:10px;display:none;border:1px solid var(--line)" });
      const msg = el("p", { class: "hint" });

      const run = () => {
        let raw = input.value.trim();
        if (!raw) { img.style.display = "none"; msg.textContent = ""; return; }
        if (!raw.startsWith("data:")) {
          const head = raw.slice(0, 8);
          const mime = head.startsWith("iVBOR") ? "image/png" : head.startsWith("/9j/") ? "image/jpeg" : head.startsWith("R0lGOD") ? "image/gif" : head.startsWith("UklGR") ? "image/webp" : "image/png";
          raw = "data:" + mime + ";base64," + raw.replace(/\s/g, "");
        }
        img.onload = () => {
          img.style.display = "block";
          msg.textContent = img.naturalWidth + "×" + img.naturalHeight + " · 约 " + (raw.length * 0.75 / 1024).toFixed(1) + " KB";
          msg.className = "hint ok";
        };
        img.onerror = () => {
          img.style.display = "none";
          msg.textContent = "这不是一张能识别的图片";
          msg.className = "hint err";
        };
        img.src = raw;
      };

      input.addEventListener("input", debounce(run, 300));
      return el("div", {},
        input, img,
        el("div", { class: "row" }, el("button", {
          class: "btn", type: "button",
          onclick: () => {
            if (!img.src) return toast("先粘一段");
            fetch(img.src).then((r) => r.blob()).then((b) => {
              const a = el("a", { href: URL.createObjectURL(b), download: "image" });
              document.body.appendChild(a); a.click(); a.remove();
            }).catch(() => toast("存不下来"));
          },
        }, "存成文件")),
        msg,
        el("p", { class: "hint" }, "全部在本机解码，图不会上传。")
      );
    },
  });

  /* ================= 48. HTTP 状态码 ================= */
  const CODES = [
    [200, "OK", "成功"], [201, "Created", "已创建"], [204, "No Content", "成功但没内容"],
    [301, "Moved Permanently", "永久跳转"], [302, "Found", "临时跳转"], [304, "Not Modified", "没改过，用缓存"],
    [400, "Bad Request", "请求有错"], [401, "Unauthorized", "没登录/没权限"], [403, "Forbidden", "被拒绝"],
    [404, "Not Found", "找不到"], [405, "Method Not Allowed", "方法不对"], [408, "Request Timeout", "请求超时"],
    [409, "Conflict", "冲突"], [410, "Gone", "已经没了"], [413, "Payload Too Large", "内容太大"],
    [418, "I'm a teapot", "我是茶壶（彩蛋）"], [422, "Unprocessable Entity", "格式对但内容不对"],
    [429, "Too Many Requests", "请求太频繁"], [451, "Unavailable For Legal Reasons", "因法律不可用"],
    [500, "Internal Server Error", "服务器内部错误"], [501, "Not Implemented", "不支持"], [502, "Bad Gateway", "网关错误"],
    [503, "Service Unavailable", "服务不可用"], [504, "Gateway Timeout", "网关超时"],
  ];

  register({
    id: "http", icon: "📶", name: "状态码速查",
    desc: "4xx、5xx 到底什么意思，搜一下就知道",
    tags: ["http", "状态码", "404", "500", "错误"],
    build() {
      const q = el("input", { type: "text", placeholder: "搜 404 / 超时 / unauthorized" });
      const list = el("div", { style: "margin-top:10px;display:grid;gap:6px" });

      const draw = () => {
        const term = q.value.trim().toLowerCase();
        const rows = CODES.filter(([c, n, d]) => !term || String(c).includes(term) || (n + d).toLowerCase().includes(term));
        list.innerHTML = "";
        rows.forEach(([c, n, d]) => {
          list.appendChild(el("div", {
            style: "display:grid;grid-template-columns:52px 1fr;gap:10px;padding:7px 10px;border-radius:9px;background:var(--bg);border:1px solid var(--line)",
          },
            el("b", { style: "font:700 13px var(--mono);color:" + (c >= 500 ? "var(--err)" : c >= 400 ? "var(--warn)" : "var(--ok)") }, String(c)),
            el("div", {}, el("b", { style: "font-size:13px" }, d), el("span", { style: "display:block;font:11.5px var(--mono);color:var(--muted)" }, n))
          ));
        });
        if (!rows.length) list.appendChild(el("p", { class: "hint" }, "没找到，换个词试试"));
      };

      q.addEventListener("input", debounce(draw, 120));
      draw();
      return el("div", {}, q, list);
    },
  });

  /* ================= 49. 颜色对比度 ================= */
  const lum = (hex) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!m) return 0;
    const n = parseInt(m[1], 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const contrast = (a, b) => {
    const l1 = lum(a), l2 = lum(b);
    const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  };

  register({
    id: "contrast", icon: "⚖️", name: "颜色对比度",
    desc: "这俩颜色放一起看得清吗，WCAG 合不合格",
    tags: ["contrast", "对比度", "颜色", "wcag", "无障碍", "可读性"],
    build() {
      const fg = el("input", { type: "color", value: "#f0ece0", style: "width:52px;height:36px;padding:2px" });
      const bg = el("input", { type: "color", value: "#12130f", style: "width:52px;height:36px;padding:2px" });
      const preview = el("div", { style: "margin-top:10px;padding:16px;border-radius:12px;border:1px solid var(--line);font-size:15px" }, "这段字看得清吗？");
      const out = el("div", { class: "kv-list" });
      const msg = el("p", { class: "hint" });

      const run = () => {
        const ratio = contrast(fg.value, bg.value);
        preview.style.background = bg.value;
        preview.style.color = fg.value;
        out.innerHTML = "";
        const row = (k, ok) => el("div", { class: "kv-row" }, el("span", {}, k), el("b", { class: ok ? "ok" : "err" }, ok ? "通过" : "不通过"));
        out.append(
          el("div", { class: "kv-row" }, el("span", {}, "对比度"), el("b", {}, ratio.toFixed(2) + ":1")),
          row("AA 正文（≥4.5）", ratio >= 4.5),
          row("AAA 正文（≥7）", ratio >= 7),
          row("AA 大字（≥3）", ratio >= 3),
          el("div", { class: "kv-row" }, el("span", {}, "建议"), el("b", {}, ratio >= 7 ? "很清晰" : ratio >= 4.5 ? "够用" : ratio >= 3 ? "只适合大字" : "太糊了"))
        );
        msg.textContent = "前景 " + fg.value + " / 背景 " + bg.value + "（点色块换颜色）";
        msg.className = "hint ok";
      };

      [fg, bg].forEach((i) => i.addEventListener("input", run));
      run();
      return el("div", {},
        el("div", { class: "row" }, fg, bg, el("button", { class: "btn mini", type: "button", onclick: () => { const t = fg.value; fg.value = bg.value; bg.value = t; run(); } }, "对调")),
        preview, out, msg
      );
    },
  });

  render();
  window.__PT5 = { discountOf, compound, cleanText, escapeHtml, unescapeHtml, contrast, daysTo };
})();
