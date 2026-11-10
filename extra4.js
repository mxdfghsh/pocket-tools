/* 口袋工具箱 · 追加工具包（第四批：二维码 / 密码强度 / 秒表 / 随机数 / 文字转图 / 水印 / 取色 / 字符编码） */
(() => {
  "use strict";
  const PT = window.PocketTools;
  if (!PT) return;
  const { register, render, el, toast, copyBtn, debounce } = PT;

  /* 下载一个 Blob */
  const save = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const a = el("a", { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };
  const readFile = (f) => new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(f);
  });
  const loadImg = (src) => new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error("图片读不出来"));
    im.src = src;
  });

  /* ================= 34. 二维码生成 ================= */
  register({
    id: "qrcode", icon: "🔳", name: "二维码生成",
    desc: "文字或网址转二维码，能存成 PNG / SVG，尺寸颜色可调",
    tags: ["qrcode", "二维码", "扫码", "分享", "qr"],
    build() {
      const text = el("textarea", { rows: "3", placeholder: "https://…  或一段文字" });
      const size = el("input", { type: "range", min: "128", max: "512", step: "16", value: "256" });
      const ec = el("select", {},
        el("option", { value: "L" }, "低 L（脏了也能扫）"),
        el("option", { value: "M", selected: "" }, "中 M"),
        el("option", { value: "Q" }, "较高 Q"),
        el("option", { value: "H" }, "最高 H（很脏也能扫）")
      );
      const dark = el("input", { type: "color", value: "#12130f", style: "width:52px;height:34px;padding:2px" });
      const box = el("div", {
        style: "margin-top:10px;display:grid;place-items:center;background:#fff;border-radius:12px;padding:12px;min-height:120px",
      });
      const msg = el("p", { class: "hint" });
      let last = "";

      const run = () => {
        const t = text.value.trim();
        if (!t) { box.innerHTML = ""; last = ""; msg.textContent = ""; return; }
        if (!window.PocketQR) { msg.textContent = "二维码模块没加载（检查 qrcode.js）"; msg.className = "hint err"; return; }
        try {
          last = window.PocketQR.svg(t, {
            width: Number(size.value), margin: 2, errorCorrectionLevel: ec.value,
            color: { dark: dark.value, light: "#ffffff" },
          });
          box.innerHTML = last;
          msg.textContent = t.length + " 个字符 · 纠错 " + ec.value + " · " + size.value + "px";
          msg.className = "hint ok";
        } catch (e) {
          msg.textContent = "生成失败：" + e.message;
          msg.className = "hint err";
        }
      };

      const toPng = () => {
        if (!last) { toast("先写点内容"); return; }
        const svgUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(last);
        loadImg(svgUrl).then((im) => {
          const n = Number(size.value);
          const cv = document.createElement("canvas");
          cv.width = n; cv.height = n;
          const g = cv.getContext("2d");
          g.fillStyle = "#fff";
          g.fillRect(0, 0, n, n);
          g.drawImage(im, 0, 0, n, n);
          cv.toBlob((b) => b && save(b, "qrcode.png"), "image/png");
        }).catch((e) => toast("导出失败：" + e.message));
      };

      text.addEventListener("input", debounce(run, 200));
      [size, ec, dark].forEach((i) => i.addEventListener("input", run));
      ec.addEventListener("change", run);

      return el("div", {},
        text,
        el("div", { class: "row", style: "margin-top:9px" }, el("span", { class: "field-label", style: "margin:0" }, "尺寸"), size, dark, ec),
        box,
        el("div", { class: "row" },
          el("button", { class: "btn primary", type: "button", onclick: toPng }, "存成 PNG"),
          el("button", { class: "btn", type: "button", onclick: () => last && save(new Blob([last], { type: "image/svg+xml" }), "qrcode.svg") }, "存成 SVG")),
        msg,
        el("p", { class: "hint" }, "全部本机生成，图不会上传到任何地方。")
      );
    },
  });

  /* ================= 35. 密码强度 ================= */
  const CHARSETS = [[/[a-z]/, 26], [/[A-Z]/, 26], [/[0-9]/, 10], [/[^a-zA-Z0-9]/, 33]];
  const COMMON = /^(123456|password|qwerty|abc123|111111|admin|iloveyou|000000|666666|123456789|woaini|5201314)$/i;
  const strengthOf = (p) => {
    if (!p) return { bits: 0, pool: 0, label: "—", cls: "" };
    let pool = 0;
    for (const [re, n] of CHARSETS) if (re.test(p)) pool += n;
    const uniq = new Set(p).size;
    let bits = Math.log2(Math.max(pool, 2)) * p.length;
    if (uniq < p.length * 0.6) bits *= 0.85;
    if (COMMON.test(p)) bits = Math.min(bits, 12);
    const label = bits < 40 ? "很弱" : bits < 60 ? "偏弱" : bits < 80 ? "够用" : bits < 110 ? "强" : "很强";
    const cls = bits < 40 ? "err" : bits < 60 ? "" : "ok";
    return { bits, pool, label, cls };
  };
  const crackTime = (bits) => {
    const per = 1e10;
    const sec = Math.pow(2, bits) / per;
    if (sec < 1) return "不到 1 秒";
    if (sec < 60) return Math.round(sec) + " 秒";
    if (sec < 3600) return Math.round(sec / 60) + " 分钟";
    if (sec < 86400) return (sec / 3600).toFixed(1) + " 小时";
    if (sec < 31536000) return (sec / 86400).toFixed(1) + " 天";
    const y = sec / 31536000;
    if (y < 1e4) return Math.round(y) + " 年";
    return y.toExponential(2).replace("e+", "×10^") + " 年";
  };

  register({
    id: "strength", icon: "🛡️", name: "密码强度",
    desc: "算熵值，估一下暴力破解要多久",
    tags: ["password", "密码", "强度", "安全", "熵"],
    build() {
      const input = el("input", { type: "text", placeholder: "输入一个密码看看（不会发出去）", autocomplete: "off", spellcheck: "false" });
      const bar = el("div", { style: "height:8px;border-radius:99px;background:var(--line);overflow:hidden;margin-top:10px" });
      const fill = el("div", { style: "height:100%;width:0;background:var(--err);transition:width .25s,background .25s" });
      bar.appendChild(fill);
      const out = el("div", { class: "kv-list" });
      const msg = el("p", { class: "hint" });

      const run = () => {
        const p = input.value;
        const s = strengthOf(p);
        const pct = Math.max(2, Math.min(100, s.bits / 128 * 100));
        fill.style.width = pct + "%";
        fill.style.background = s.bits < 40 ? "var(--err)" : s.bits < 80 ? "var(--warn)" : "var(--ok)";
        out.innerHTML = "";
        out.append(
          el("div", { class: "kv-row" }, el("span", {}, "强度"), el("b", { class: s.cls }, s.label)),
          el("div", { class: "kv-row" }, el("span", {}, "熵"), el("b", {}, Math.round(s.bits) + " bit")),
          el("div", { class: "kv-row" }, el("span", {}, "字符池"), el("b", {}, s.pool + " 种")),
          el("div", { class: "kv-row" }, el("span", {}, "暴力破解"), el("b", {}, p ? crackTime(s.bits) : "—"))
        );
        msg.textContent = p.length + " 位，按每秒 100 亿次猜算";
        msg.className = "hint";
      };

      input.addEventListener("input", run);
      run();
      return el("div", {}, input, bar, out, msg);
    },
  });

  /* ================= 36. 秒表 ================= */
  register({
    id: "stopwatch", icon: "⏱", name: "秒表",
    desc: "开始、暂停、记圈，精确到 0.01 秒",
    tags: ["stopwatch", "秒表", "计时", "lap", "跑圈"],
    build() {
      const face = el("div", { style: "font:800 44px/1.2 var(--mono);text-align:center;letter-spacing:.02em" }, "00:00.00");
      const laps = el("div", { style: "margin-top:8px;font:12.5px/1.9 var(--mono);color:var(--muted)" });
      const msg = el("p", { class: "hint", style: "text-align:center" });
      const bStart = el("button", { class: "btn primary", type: "button" }, "开始");
      const bLap = el("button", { class: "btn", type: "button" }, "记一圈");
      const bReset = el("button", { class: "btn", type: "button" }, "归零");

      let t0 = 0, acc = 0, id = null, list = [];
      const now = () => acc + (id ? Date.now() - t0 : 0);
      const fmt = (ms) => {
        const m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60, c = Math.floor(ms / 10) % 100;
        return pad2(m) + ":" + pad2(s) + "." + pad2(c);
      };
      const pad2 = (n) => String(n).padStart(2, "0");
      const draw = () => { face.textContent = fmt(now()); };
      const renderLaps = () => {
        laps.innerHTML = "";
        list.forEach((ms, i) => {
          const d = ms - (list[i - 1] || 0);
          laps.appendChild(el("div", {}, "第 " + (i + 1) + " 圈 " + fmt(ms) + "  （+" + fmt(d) + "）"));
        });
      };
      const stop = () => { clearInterval(id); id = null; };
      const tick = () => { if (!face.isConnected) { stop(); return; } draw(); };

      bStart.addEventListener("click", () => {
        if (id) { acc = now(); stop(); bStart.textContent = "继续"; return; }
        t0 = Date.now(); id = setInterval(tick, 30); bStart.textContent = "暂停";
      });
      bLap.addEventListener("click", () => { if (now() > 0) { list.push(now()); renderLaps(); } });
      bReset.addEventListener("click", () => { stop(); acc = 0; list = []; bStart.textContent = "开始"; draw(); renderLaps(); });

      return el("div", {}, face, el("div", { class: "row", style: "justify-content:center" }, bStart, bLap, bReset), laps, msg);
    },
  });

  /* ================= 37. 随机数 ================= */
  register({
    id: "random", icon: "🎯", name: "随机数",
    desc: "区间内抽 N 个，可去重，也能生成随机小数",
    tags: ["random", "随机", "抽奖", "掷骰子", "数字"],
    build() {
      const min = el("input", { type: "number", value: "1", style: "width:90px" });
      const max = el("input", { type: "number", value: "100", style: "width:90px" });
      const count = el("input", { type: "number", value: "1", min: "1", max: "1000", style: "width:80px" });
      const uniq = el("input", { type: "checkbox" });
      uniq.checked = true;
      const out = el("textarea", { rows: "3", readonly: "" });
      const msg = el("p", { class: "hint" });

      const run = () => {
        let a = Math.ceil(Number(min.value)), b = Math.floor(Number(max.value));
        const n = Math.max(1, Math.min(1000, Math.floor(Number(count.value) || 1)));
        if (!isFinite(a) || !isFinite(b)) { out.value = ""; return; }
        if (a > b) { const t = a; a = b; b = t; }
        const span = b - a + 1;
        if (uniq.checked && n > span) { msg.textContent = "区间里只有 " + span + " 个数，抽不满 " + n + " 个不重复的"; msg.className = "hint err"; return; }
        const pool = Array.from({ length: span }, (_, i) => a + i);
        const res = [];
        if (uniq.checked) {
          for (let i = 0; i < n; i++) {
            const j = Math.floor(Math.random() * pool.length);
            res.push(pool.splice(j, 1)[0]);
          }
        } else {
          for (let i = 0; i < n; i++) res.push(a + Math.floor(Math.random() * span));
        }
        out.value = res.join(n > 10 ? ", " : "\n");
        msg.textContent = "在 " + a + "–" + b + " 里抽了 " + n + " 个" + (uniq.checked ? "，不重复" : "");
        msg.className = "hint ok";
      };

      return el("div", {},
        el("div", { class: "row" }, min, el("span", { style: "color:var(--muted)" }, "–"), max,
          el("span", { class: "field-label", style: "margin:0 0 0 8px" }, "个数"), count,
          el("label", { class: "chk" }, uniq, "不重复")),
        el("div", { class: "row" }, el("button", { class: "btn primary", type: "button", onclick: run }, "抽一次")),
        out, el("div", { class: "row" }, copyBtn(() => out.value)), msg
      );
    },
  });

  /* ================= 38. 文字转图片 ================= */
  register({
    id: "text2img", icon: "🖼", name: "文字转图片",
    desc: "把一段话做成图片，配色字号可调，直接存 PNG",
    tags: ["text", "image", "图片", "卡片", "金句", "分享"],
    build() {
      const text = el("textarea", { rows: "3", value: "把顺手做的小东西，收进一个口袋。" });
      const bg = el("input", { type: "color", value: "#12130f", style: "width:48px;height:34px;padding:2px" });
      const fg = el("input", { type: "color", value: "#f0ece0", style: "width:48px;height:34px;padding:2px" });
      const size = el("input", { type: "number", value: "30", min: "12", max: "80", style: "width:70px" });
      const width = el("input", { type: "number", value: "720", min: "240", max: "1600", style: "width:80px" });
      const cv = el("canvas", { style: "max-width:100%;border-radius:12px;border:1px solid var(--line);margin-top:10px;display:block" });
      const msg = el("p", { class: "hint" });

      const run = () => {
        const t = text.value.trim();
        if (!t) { msg.textContent = "写点文字"; return; }
        const W = Number(width.value) || 720;
        const F = Number(size.value) || 30;
        const pad = Math.round(W * 0.08);
        const lineH = Math.round(F * 1.55);
        const c = cv.getContext("2d");
        c.font = "600 " + F + "px -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif";
        const maxW = W - pad * 2;
        const lines = [];
        for (const para of t.split(/\n/)) {
          let cur = "";
          for (const ch of para) {
            if (c.measureText(cur + ch).width > maxW && cur) { lines.push(cur); cur = ch; }
            else cur += ch;
          }
          lines.push(cur);
        }
        const H = pad * 2 + lines.length * lineH;
        cv.width = W; cv.height = H;
        const g = cv.getContext("2d");
        g.fillStyle = bg.value;
        g.fillRect(0, 0, W, H);
        g.fillStyle = fg.value;
        g.font = "600 " + F + "px -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif";
        g.textBaseline = "top";
        lines.forEach((ln, i) => g.fillText(ln, pad, pad + i * lineH));
        msg.textContent = W + "×" + H + " · " + lines.length + " 行";
        msg.className = "hint ok";
      };

      const savePng = () => cv.toBlob((b) => b && save(b, "text.png"), "image/png");
      [text, bg, fg].forEach((i) => i.addEventListener("input", debounce(run, 200)));
      [size, width].forEach((i) => i.addEventListener("change", run));
      run();

      return el("div", {},
        text,
        el("div", { class: "row", style: "margin-top:9px" }, bg, fg,
          el("span", { class: "field-label", style: "margin:0 0 0 8px" }, "字号"), size,
          el("span", { class: "field-label", style: "margin:0 0 0 8px" }, "宽度"), width),
        cv,
        el("div", { class: "row", }, el("button", { class: "btn primary", type: "button", onclick: savePng }, "存成 PNG")),
        msg
      );
    },
  });

  /* ================= 39. 图片加水印 ================= */
  register({
    id: "watermark", icon: "💧", name: "图片加水印",
    desc: "选张图加一行字，位置透明度可调，导出新图",
    tags: ["watermark", "水印", "图片", "版权", "添加文字"],
    build() {
      const file = el("input", { type: "file", accept: "image/*" });
      const text = el("input", { type: "text", value: "口袋小站", placeholder: "水印文字" });
      const opacity = el("input", { type: "range", min: "10", max: "100", value: "55", style: "width:120px" });
      const pos = el("select", {},
        el("option", { value: "se", selected: "" }, "右下"), el("option", { value: "sw" }, "左下"),
        el("option", { value: "ne" }, "右上"), el("option", { value: "nw" }, "左上"), el("option", { value: "center" }, "中间")
      );
      const cv = el("canvas", { style: "max-width:100%;border-radius:12px;border:1px solid var(--line);margin-top:10px;display:none" });
      const msg = el("p", { class: "hint" });
      let img = null;

      const run = () => {
        if (!img) return;
        const W = img.naturalWidth, H = img.naturalHeight;
        cv.width = W; cv.height = H;
        const c = cv.getContext("2d");
        c.drawImage(img, 0, 0);
        const t = text.value.trim();
        if (t) {
          const fs = Math.max(16, Math.round(Math.min(W, H) * 0.045));
          c.font = "600 " + fs + "px -apple-system, 'PingFang SC', sans-serif";
          c.globalAlpha = Number(opacity.value) / 100;
          c.fillStyle = "#fff";
          c.shadowColor = "rgba(0,0,0,.45)";
          c.shadowBlur = fs * 0.25;
          const m = Math.round(fs * 0.7);
          const w = c.measureText(t).width;
          let x = W - m - w, y = H - m - fs * 0.2;
          if (pos.value === "sw") x = m;
          if (pos.value === "ne") { x = W - m - w; y = m + fs; }
          if (pos.value === "nw") { x = m; y = m + fs; }
          if (pos.value === "center") { x = (W - w) / 2; y = H / 2; }
          c.fillText(t, x, y);
          c.globalAlpha = 1;
          c.shadowBlur = 0;
        }
        cv.style.display = "block";
        msg.textContent = W + "×" + H + " · 水印 " + (Math.round(Number(opacity.value))) + "%";
        msg.className = "hint ok";
      };

      file.addEventListener("change", async () => {
        const f = file.files && file.files[0];
        if (!f) return;
        try { img = await loadImg(await readFile(f)); run(); }
        catch (e) { msg.textContent = "读图失败：" + e.message; msg.className = "hint err"; }
      });
      [text, opacity, pos].forEach((i) => i.addEventListener("input", debounce(run, 120)));
      pos.addEventListener("change", run);

      return el("div", {},
        file,
        el("div", { class: "row", style: "margin-top:9px" }, text),
        el("div", { class: "row" }, el("span", { class: "field-label", style: "margin:0" }, "透明度"), opacity, pos),
        cv,
        el("div", { class: "row" }, el("button", { class: "btn primary", type: "button", onclick: () => cv.toBlob((b) => b && save(b, "watermark.png"), "image/png") }, "存成 PNG")),
        msg
      );
    },
  });

  /* ================= 40. 图片取色 ================= */
  register({
    id: "eyedropper", icon: "🎨", name: "图片取色",
    desc: "点图片上任意一点，把那个颜色抠出来",
    tags: ["color", "取色", "吸管", "图片", "配色"],
    build() {
      const file = el("input", { type: "file", accept: "image/*" });
      const wrap = el("div", { style: "margin-top:10px;display:none" });
      const cv = el("canvas", { style: "max-width:100%;border-radius:12px;border:1px solid var(--line);cursor:crosshair;display:block;touch-action:manipulation" });
      const res = el("div", { style: "display:flex;gap:10px;align-items:center;margin-top:10px" });
      const chip = el("div", { style: "width:44px;height:44px;border-radius:10px;border:1px solid var(--line);flex:0 0 auto" });
      const val = el("div", { style: "font:13px/1.7 var(--mono)" });
      const msg = el("p", { class: "hint" });
      let img = null, hex = "";

      file.addEventListener("change", async () => {
        const f = file.files && file.files[0];
        if (!f) return;
        try {
          img = await loadImg(await readFile(f));
          const W = Math.min(900, img.naturalWidth);
          const H = Math.round(img.naturalHeight * (W / img.naturalWidth));
          cv.width = W; cv.height = H;
          cv.getContext("2d").drawImage(img, 0, 0, W, H);
          wrap.style.display = "block";
          msg.textContent = "点一下图片取色（原图 " + img.naturalWidth + "×" + img.naturalHeight + "）";
          msg.className = "hint";
        } catch (e) { msg.textContent = "读图失败：" + e.message; msg.className = "hint err"; }
      });

      const pick = (ev) => {
        const r = cv.getBoundingClientRect();
        const x = Math.round((ev.clientX - r.left) * (cv.width / r.width));
        const y = Math.round((ev.clientY - r.top) * (cv.height / r.height));
        const d = cv.getContext("2d").getImageData(x, y, 1, 1).data;
        hex = "#" + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, "0")).join("");
        chip.style.background = hex;
        val.textContent = hex + "\nrgb(" + d[0] + ", " + d[1] + ", " + d[2] + ")";
        return hex;
      };
      cv.addEventListener("click", pick);
      cv.addEventListener("pointerdown", pick);

      res.append(chip, val, el("button", { class: "btn mini", type: "button", onclick: () => hex && PT.copyText && PT.copyText(hex) }, "复制 HEX"));
      wrap.append(cv, res);

      return el("div", {}, file, wrap, msg);
    },
  });

  /* ================= 41. 字符编码 ================= */
  register({
    id: "charinfo", icon: "🔠", name: "字符编码",
    desc: "每个字是什么码点、UTF-8 占几字节、HTML 实体怎么写",
    tags: ["unicode", "编码", "utf8", "码点", "字符"],
    build() {
      const input = el("textarea", { rows: "2", placeholder: "粘一段文字，看看每个字" });
      const out = el("div", { style: "margin-top:10px;display:grid;gap:6px;font:12.5px/1.6 var(--mono)" });
      const msg = el("p", { class: "hint" });

      const utf8 = (ch) => [...new TextEncoder().encode(ch)];

      const run = () => {
        const t = [...input.value];
        out.innerHTML = "";
        if (!t.length) { msg.textContent = ""; return; }
        for (const ch of t.slice(0, 60)) {
          const cp = ch.codePointAt(0);
          const bytes = utf8(ch);
          out.appendChild(el("div", {
            style: "display:grid;grid-template-columns:28px 1fr;gap:10px;padding:5px 8px;background:var(--bg);border-radius:8px;align-items:center",
          },
            el("b", { style: "font-size:18px;text-align:center" }, ch === " " ? "␣" : ch),
            el("span", {},
              "U+" + cp.toString(16).toUpperCase().padStart(4, "0"),
              " · 十进制 " + cp,
              " · UTF-8 " + bytes.map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" ") + "（" + bytes.length + " 字节）",
              " · &#" + cp + ";"
            )
          ));
        }
        msg.textContent = t.length + " 个字符" + (t.length > 60 ? "（只列前 60 个）" : "");
        msg.className = "hint ok";
      };

      input.addEventListener("input", debounce(run, 150));
      run();
      return el("div", {}, input, out, msg);
    },
  });

  render();
  window.__PT4 = { strengthOf, crackTime };
})();
