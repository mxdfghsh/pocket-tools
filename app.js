/* 口袋工具箱 —— 纯前端工具合集（零依赖，所有计算在本机完成） */
(() => {
  "use strict";

  /* ============ 基础工具函数 ============ */
  const $ = (sel, root = document) => root.querySelector(sel);

  function el(tag, props = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === undefined || v === null) continue;
      if (k === "class") n.className = v;
      else if (k === "html") n.innerHTML = v;
      else if (k === "style") n.style.cssText = v;
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === "dataset") Object.assign(n.dataset, v);
      else n.setAttribute(k, v);
    }
    for (const kid of kids.flat()) {
      if (kid === null || kid === undefined || kid === false) continue;
      n.appendChild(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return n;
  }

  let toastTimer = null;
  function toast(msg) {
    const t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1600);
  }

  async function copyText(text) {
    if (!text) return toast("没有可复制的内容");
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = el("textarea", { style: "position:fixed;opacity:0;top:0;left:0" });
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      toast("已复制到剪贴板");
    } catch (e) {
      toast("复制失败，请手动选中复制");
    }
  }

  function copyBtn(getText, label = "复制") {
    return el("button", { class: "btn mini", type: "button", onclick: () => copyText(typeof getText === "function" ? getText() : getText) }, label);
  }

  const debounce = (fn, ms = 180) => {
    let t = null;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  const enc = new TextEncoder();
  const dec = new TextDecoder();

  /* ============ 工具注册表 ============ */
  const tools = [];
  const register = (t) => tools.push(t);

  /* ---------- 1. Base64 ---------- */
  register({
    id: "base64", icon: "🔤", name: "Base64 编解码",
    desc: "文本与 Base64 互转，支持中文和 URL 安全模式",
    tags: ["base64", "编码", "解码", "encode", "decode"],
    build() {
      const input = el("textarea", { placeholder: "输入文字或 Base64 字符串…", rows: "3" });
      const output = el("textarea", { placeholder: "结果…", rows: "3", readonly: "" });
      const urlSafe = el("input", { type: "checkbox" });
      const mode = el("p", { class: "hint" }, "");

      const enc64 = (s) => {
        const bytes = enc.encode(s);
        let bin = "";
        for (const b of bytes) bin += String.fromCharCode(b);
        let out = btoa(bin);
        if (urlSafe.checked) out = out.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        return out;
      };
      const dec64 = (s) => {
        let t = s.trim().replace(/\s+/g, "");
        if (urlSafe.checked || /[-_]/.test(t)) t = t.replace(/-/g, "+").replace(/_/g, "/");
        while (t.length % 4) t += "=";
        const bin = atob(t);
        const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
        return dec.decode(bytes, { stream: false });
      };

      const doEncode = () => {
        if (!input.value) { output.value = ""; mode.textContent = ""; return; }
        try {
          output.value = enc64(input.value);
          mode.textContent = "编码完成 · " + input.value.length + " 字符 → " + output.value.length + " 字符";
          mode.className = "hint ok";
        } catch (e) {
          output.value = ""; mode.textContent = "编码失败：" + e.message; mode.className = "hint err";
        }
      };
      const doDecode = () => {
        if (!input.value.trim()) { output.value = ""; mode.textContent = ""; return; }
        try {
          output.value = dec64(input.value);
          mode.textContent = "解码完成"; mode.className = "hint ok";
        } catch (e) {
          output.value = ""; mode.textContent = "不是合法的 Base64（或包含非法字符）"; mode.className = "hint err";
        }
      };

      urlSafe.addEventListener("change", () => {
        if ((mode.textContent || "").indexOf("编码完成") >= 0) doEncode();
      });

      return el("div", {},
        input,
        el("div", { class: "row" },
          el("button", { class: "btn primary", type: "button", onclick: doEncode }, "编码 →"),
          el("button", { class: "btn", type: "button", onclick: doDecode }, "← 解码"),
          el("label", { class: "chk" }, urlSafe, "URL 安全"),
          el("span", { class: "spacer" }),
          copyBtn(() => output.value),
          el("button", { class: "btn mini", type: "button", onclick: () => { input.value = output.value; toast("已回填到输入框"); } }, "回填")
        ),
        output,
        mode
      );
    },
  });

  /* ---------- 2. URL 编解码 ---------- */
  register({
    id: "url", icon: "🔗", name: "URL 编解码",
    desc: "encodeURIComponent / decodeURIComponent 互转",
    tags: ["url", "uri", "编码", "转义", "encode"],
    build() {
      const input = el("textarea", { placeholder: "输入要编码的文字，或要解码的 %xx 字符串…", rows: "3" });
      const output = el("textarea", { placeholder: "结果…", rows: "3", readonly: "" });
      const msg = el("p", { class: "hint" });
      const encd = () => {
        try { output.value = encodeURIComponent(input.value); msg.textContent = "已编码"; msg.className = "hint ok"; }
        catch (e) { msg.textContent = e.message; msg.className = "hint err"; }
      };
      const decd = () => {
        try { output.value = decodeURIComponent(input.value.trim()); msg.textContent = "已解码"; msg.className = "hint ok"; }
        catch (e) { output.value = ""; msg.textContent = "解码失败：输入里有非法的 % 转义"; msg.className = "hint err"; }
      };
      return el("div", {},
        input,
        el("div", { class: "row" },
          el("button", { class: "btn primary", type: "button", onclick: encd }, "编码"),
          el("button", { class: "btn", type: "button", onclick: decd }, "解码"),
          el("span", { class: "spacer" }),
          copyBtn(() => output.value)
        ),
        output, msg
      );
    },
  });

  /* ---------- 3. 时间戳转换 ---------- */
  register({
    id: "time", icon: "⏱️", name: "时间戳转换",
    desc: "Unix 时间戳 ↔ 本地/UTC 时间，自动识别秒与毫秒",
    tags: ["timestamp", "unix", "时间", "日期", "date"],
    build() {
      const pad = (n, w) => String(n).padStart(w || 2, "0");
      const fmtLocal = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
      const fmtUTC = (d) => d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()) + " " + pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds()) + " UTC";
      let tz = "本地时区";
      try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || tz; } catch (e) {}

      const num = el("span", { class: "num" }, "—");
      const when = el("span", { class: "when" }, "");
      const clock = el("div", { class: "clock" }, num, when);

      const tick = () => {
        const now = new Date();
        num.textContent = String(Math.floor(now.getTime() / 1000));
        when.textContent = fmtLocal(now) + " · " + tz;
      };
      tick();
      setInterval(tick, 1000);

      const input = el("input", { type: "text", placeholder: "粘贴 10/13 位时间戳，或 2026-11-08 22:00:00" });
      const out = el("div", { class: "kv" },
        el("dt", {}, "本地时间"), el("dd", { class: "v-local" }, "—"),
        el("dt", {}, "UTC 时间"), el("dd", { class: "v-utc" }, "—"),
        el("dt", {}, "秒级"), el("dd", { class: "v-s" }, "—"),
        el("dt", {}, "毫秒级"), el("dd", { class: "v-ms" }, "—"),
        el("dt", {}, "星期"), el("dd", { class: "v-week" }, "—")
      );
      const msg = el("p", { class: "hint" });
      const WEEK = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

      function parse(v) {
        const s = v.trim();
        if (!s) return null;
        if (/^\d{10}$/.test(s)) return new Date(Number(s) * 1000);
        if (/^\d{13}$/.test(s)) return new Date(Number(s));
        if (/^\d{11,12}$/.test(s)) return new Date(Number(s) * 1000);
        let d = new Date(s);
        if (!isNaN(d)) return d;
        d = new Date(s.replace(/-/g, "/").replace("T", " "));
        if (!isNaN(d)) return d;
        return null;
      }

      function convert() {
        const d = parse(input.value);
        if (!d) {
          out.querySelectorAll("dd").forEach((n) => (n.textContent = "—"));
          msg.textContent = input.value.trim() ? "无法识别，换个格式试试（如 1762612800 或 2026-11-08 22:00）" : "";
          msg.className = "hint err";
          return;
        }
        const ms = d.getTime();
        out.querySelector(".v-local").textContent = fmtLocal(d) + " (" + tz + ")";
        out.querySelector(".v-utc").textContent = fmtUTC(d);
        out.querySelector(".v-s").textContent = String(Math.floor(ms / 1000));
        out.querySelector(".v-ms").textContent = String(ms);
        out.querySelector(".v-week").textContent = WEEK[d.getDay()];
        msg.textContent = /^\d+$/.test(input.value.trim()) ? "已按数字时间戳解析" : "已按日期字符串解析";
        msg.className = "hint ok";
      }

      input.addEventListener("input", debounce(convert, 200));

      return el("div", {},
        clock,
        input,
        el("div", { class: "row" },
          el("button", { class: "btn", type: "button", onclick: () => { input.value = String(Math.floor(Date.now() / 1000)); convert(); } }, "现在"),
          copyBtn(() => out.querySelector(".v-ms").textContent, "复制毫秒"),
          copyBtn(() => out.querySelector(".v-local").textContent.split(" (")[0], "复制本地时间")
        ),
        out, msg
      );
    },
  });

  /* ---------- 4. JSON 格式化 ---------- */
  register({
    id: "json", icon: "🧩", name: "JSON 格式化",
    desc: "美化 / 压缩 / 校验 JSON，报错时定位到行",
    tags: ["json", "格式化", "压缩", "校验", "format"],
    build() {
      const input = el("textarea", { placeholder: '粘贴 JSON，例如 {"name":"dsh","ok":true}', rows: "4" });
      const output = el("textarea", { placeholder: "格式化结果…", rows: "4", readonly: "" });
      const msg = el("p", { class: "hint" });

      function countKeys(o) {
        let n = 0;
        (function walk(v) {
          if (Array.isArray(v)) v.forEach(walk);
          else if (v && typeof v === "object") { for (const k of Object.keys(v)) { n++; walk(v[k]); } }
        })(o);
        return n;
      }

      const run = (mode) => {
        const src = input.value.trim();
        if (!src) { output.value = ""; msg.textContent = ""; return; }
        try {
          const obj = JSON.parse(src);
          if (mode === "min") {
            output.value = JSON.stringify(obj);
            const saved = src.length - output.value.length;
            msg.textContent = "已压缩 · 省下 " + (saved > 0 ? saved : 0) + " 字符";
          } else {
            output.value = JSON.stringify(obj, null, 2);
            msg.textContent = "校验通过 · " + countKeys(obj) + " 个键";
          }
          msg.className = "hint ok";
        } catch (e) {
          output.value = "";
          msg.textContent = "解析失败：" + e.message;
          msg.className = "hint err";
        }
      };

      return el("div", {},
        input,
        el("div", { class: "row" },
          el("button", { class: "btn primary", type: "button", onclick: () => run("pretty") }, "美化"),
          el("button", { class: "btn", type: "button", onclick: () => run("min") }, "压缩"),
          el("span", { class: "spacer" }),
          copyBtn(() => output.value)
        ),
        output, msg
      );
    },
  });

  /* ---------- 5. 哈希计算 ---------- */
  register({
    id: "hash", icon: "🔐", name: "哈希计算",
    desc: "SHA-1 / SHA-256 / SHA-384 / SHA-512（WebCrypto，本地）",
    tags: ["hash", "sha", "摘要", "校验", "md5"],
    build() {
      const input = el("textarea", { placeholder: "输入要计算摘要的文字…", rows: "3" });
      const algo = el("select", {},
        el("option", { value: "SHA-1" }, "SHA-1"),
        el("option", { value: "SHA-256", selected: "" }, "SHA-256"),
        el("option", { value: "SHA-384" }, "SHA-384"),
        el("option", { value: "SHA-512" }, "SHA-512")
      );
      algo.style.width = "auto";
      const out = el("output", { class: "block" });
      const msg = el("p", { class: "hint" });

      const run = async () => {
        const text = input.value;
        if (!text) { out.textContent = ""; msg.textContent = ""; return; }
        try {
          const buf = await crypto.subtle.digest(algo.value, enc.encode(text));
          const hex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
          out.textContent = hex;
          msg.textContent = algo.value + " · " + hex.length + " 位十六进制";
          msg.className = "hint ok";
        } catch (e) {
          out.textContent = "";
          msg.textContent = "计算失败：当前环境不支持 WebCrypto（需要 https 或 localhost）";
          msg.className = "hint err";
        }
      };
      input.addEventListener("input", debounce(run, 250));
      algo.addEventListener("change", run);

      return el("div", {},
        input,
        el("div", { class: "row" },
          algo,
          el("button", { class: "btn primary", type: "button", onclick: run }, "计算"),
          el("span", { class: "spacer" }),
          copyBtn(() => out.textContent)
        ),
        out, msg
      );
    },
  });

  /* ---------- 6. 密码生成器 ---------- */
  register({
    id: "pwd", icon: "🔑", name: "密码生成器",
    desc: "基于 crypto 随机源，可调长度与字符集",
    tags: ["密码", "password", "随机", "生成"],
    build() {
      const out = el("output", { class: "mono-big" }, "点「生成」试试");
      const len = el("input", { type: "range", min: "6", max: "64", value: "20" });
      const lenVal = el("b", {}, "20");
      const upper = el("input", { type: "checkbox", checked: "" });
      const lower = el("input", { type: "checkbox", checked: "" });
      const digit = el("input", { type: "checkbox", checked: "" });
      const sym = el("input", { type: "checkbox", checked: "" });
      const similar = el("input", { type: "checkbox" });
      const msg = el("p", { class: "hint" });

      const SETS = { upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", lower: "abcdefghijklmnopqrstuvwxyz", digit: "0123456789", sym: "!@#$%^&*()-_=+[]{};:,.?/" };
      const AMBIG = "Il1O0o";

      const rnd = (n) => {
        const a = new Uint32Array(1);
        const lim = Math.floor(4294967296 / n) * n;
        let v;
        do { crypto.getRandomValues(a); v = a[0]; } while (v >= lim);
        return v % n;
      };

      const gen = () => {
        let pool = "";
        if (upper.checked) pool += SETS.upper;
        if (lower.checked) pool += SETS.lower;
        if (digit.checked) pool += SETS.digit;
        if (sym.checked) pool += SETS.sym;
        if (similar.checked) pool = Array.from(pool).filter((c) => AMBIG.indexOf(c) < 0).join("");
        if (!pool) { out.textContent = ""; msg.textContent = "至少勾选一种字符类型"; msg.className = "hint err"; return; }

        const n = Number(len.value);
        const required = [];
        const pickSet = (s) => (similar.checked ? (Array.from(s).filter((c) => AMBIG.indexOf(c) < 0).join("") || s) : s);
        if (upper.checked) required.push(SETS.upper);
        if (lower.checked) required.push(SETS.lower);
        if (digit.checked) required.push(SETS.digit);
        if (sym.checked) required.push(SETS.sym);

        const chars = required.slice(0, n).map((s) => { const p = pickSet(s); return p[rnd(p.length)]; });
        while (chars.length < n) chars.push(pool[rnd(pool.length)]);
        for (let i = chars.length - 1; i > 0; i--) { const j = rnd(i + 1); const tmp = chars[i]; chars[i] = chars[j]; chars[j] = tmp; }

        out.textContent = chars.join("");
        const entropy = Math.round(n * Math.log2(pool.length));
        msg.textContent = "长度 " + n + " · 字符集 " + pool.length + " 种 · 熵约 " + entropy + " bit";
        msg.className = "hint ok";
      };

      len.addEventListener("input", () => { lenVal.textContent = len.value; });

      return el("div", {},
        out,
        el("div", { class: "row" }, el("span", { class: "field-label", style: "margin:0" }, "长度"), len, lenVal),
        el("div", { class: "row" },
          el("label", { class: "chk" }, upper, "大写 A-Z"),
          el("label", { class: "chk" }, lower, "小写 a-z"),
          el("label", { class: "chk" }, digit, "数字 0-9"),
          el("label", { class: "chk" }, sym, "符号"),
          el("label", { class: "chk" }, similar, "排除易混 Il1O0o")
        ),
        el("div", { class: "row" },
          el("button", { class: "btn primary", type: "button", onclick: gen }, "生成"),
          copyBtn(() => out.textContent)
        ),
        msg
      );
    },
  });

  /* ---------- 7. UUID ---------- */
  register({
    id: "uuid", icon: "🆔", name: "UUID 生成",
    desc: "批量生成 v4 随机 UUID",
    tags: ["uuid", "guid", "随机", "id"],
    build() {
      const out = el("textarea", { rows: "3", readonly: "", placeholder: "点击生成…" });
      const count = el("select", {}, [1, 3, 5, 10, 20].map((n) => el("option", { value: String(n) }, n + " 个")));
      count.value = "3";
      count.style.width = "auto";
      const one = () => {
        if (crypto.randomUUID) return crypto.randomUUID();
        const b = new Uint8Array(16);
        crypto.getRandomValues(b);
        b[6] = (b[6] & 0x0f) | 0x40;
        b[8] = (b[8] & 0x3f) | 0x80;
        const h = Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
        return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
      };
      const gen = () => {
        const n = Number(count.value);
        out.value = Array.from({ length: n }, one).join("\n");
        toast("已生成 " + n + " 个 UUID");
      };
      return el("div", {},
        el("div", { class: "row" },
          count,
          el("button", { class: "btn primary", type: "button", onclick: gen }, "生成"),
          el("span", { class: "spacer" }),
          copyBtn(() => out.value, "复制全部")
        ),
        out
      );
    },
  });

  /* ---------- 8. 文本统计 ---------- */
  register({
    id: "text", icon: "📝", name: "文本统计",
    desc: "字数、词数、行数、字节数，中英文都准",
    tags: ["字数", "统计", "文本", "word", "count"],
    build() {
      const input = el("textarea", { placeholder: "输入或粘贴文本，实时统计…", rows: "4" });
      const mk = (label) => {
        const b = el("b", {}, "0");
        return { node: el("div", { class: "stat" }, b, el("span", {}, label)), b };
      };
      const s1 = mk("字符数"), s2 = mk("不含空格"), s3 = mk("词 / 汉字");
      const s4 = mk("行数"), s5 = mk("段落"), s6 = mk("字节 (UTF-8)");
      const grid = el("div", { class: "stats-grid" }, s1.node, s2.node, s3.node, s4.node, s5.node, s6.node);

      input.addEventListener("input", () => {
        const t = input.value;
        const chars = Array.from(t).length;
        const noSpace = Array.from(t.replace(/\s/g, "")).length;
        const cjk = (t.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g) || []).length;
        const latinWords = (t.match(/[A-Za-z0-9_'-]+/g) || []).length;
        const lines = t ? t.split("\n").length : 0;
        const paras = t.trim() ? t.trim().split(/\n\s*\n/).length : 0;
        s1.b.textContent = chars.toLocaleString();
        s2.b.textContent = noSpace.toLocaleString();
        s3.b.textContent = (cjk + latinWords).toLocaleString();
        s4.b.textContent = lines.toLocaleString();
        s5.b.textContent = paras.toLocaleString();
        s6.b.textContent = enc.encode(t).length.toLocaleString();
      });

      return el("div", {}, input, grid);
    },
  });

  /* ---------- 9. 颜色转换 ---------- */
  register({
    id: "color", icon: "🎨", name: "颜色转换",
    desc: "HEX / RGB / HSL 互转，带取色与预览",
    tags: ["color", "hex", "rgb", "hsl", "颜色"],
    build() {
      const picker = el("input", { type: "color", value: "#6ee7ff" });
      const hexIn = el("input", { type: "text", value: "#6EE7FF", spellcheck: "false" });
      hexIn.style.textTransform = "uppercase";
      const swatch = el("div", { class: "swatch", style: "background:#6ee7ff" });
      const kvs = el("div", { class: "kv" },
        el("dt", {}, "HEX"), el("dd", { class: "c-hex" }, "#6EE7FF"),
        el("dt", {}, "RGB"), el("dd", { class: "c-rgb" }, "rgb(110, 231, 255)"),
        el("dt", {}, "HSL"), el("dd", { class: "c-hsl" }, "hsl(188, 100%, 72%)")
      );

      const hex2rgb = (h) => {
        let s = h.trim().replace(/^#/, "");
        if (s.length === 3) s = s.split("").map((c) => c + c).join("");
        if (!/^[0-9a-f]{6}$/i.test(s)) return null;
        return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
      };
      const rgb2hex = (r, g, b) => "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
      const rgb2hsl = (r, g, b) => {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;
        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          else if (max === g) h = ((b - r) / d + 2) / 6;
          else h = ((r - g) / d + 4) / 6;
        }
        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
      };

      const apply = (hex) => {
        const rgb = hex2rgb(hex);
        if (!rgb) { toast("HEX 格式不对，应为 #RRGGBB"); return; }
        const r = rgb[0], g = rgb[1], b = rgb[2];
        const hx = rgb2hex(r, g, b);
        const hsl = rgb2hsl(r, g, b);
        picker.value = "#" + hx.slice(1).toLowerCase();
        hexIn.value = hx;
        swatch.style.background = hx;
        kvs.querySelector(".c-hex").textContent = hx;
        kvs.querySelector(".c-rgb").textContent = "rgb(" + r + ", " + g + ", " + b + ")";
        kvs.querySelector(".c-hsl").textContent = "hsl(" + hsl[0] + ", " + hsl[1] + "%, " + hsl[2] + "%)";
      };

      picker.addEventListener("input", () => apply(picker.value));
      hexIn.addEventListener("input", debounce(() => apply(hexIn.value), 300));
      const copyKv = (cls) => copyBtn(() => kvs.querySelector(cls).textContent);

      return el("div", {},
        el("div", { class: "color-row" }, picker, hexIn),
        el("div", { style: "margin-top:10px" }, swatch),
        kvs,
        el("div", { class: "row" }, copyKv(".c-hex"), copyKv(".c-rgb"), copyKv(".c-hsl"))
      );
    },
  });

  /* ============ 渲染 ============ */
  const grid = $("#grid");
  const empty = $("#empty");
  const q = $("#q");

  function card(t, i) {
    const animated = firstRender ? { style: "animation-delay:" + Math.min(i * 45, 400) + "ms" } : {};
    return el("article", Object.assign({ class: "card", id: "tool-" + t.id, "data-tool": t.id }, animated),
      el("div", { class: "card-head" },
        el("span", { class: "ico" }, t.icon),
        el("div", {}, el("h2", {}, t.name), el("p", {}, t.desc)),
        el("button", { class: "pin", type: "button", "data-pin": t.id, title: "置顶这个工具", "aria-label": "置顶" }, "☆")
      ),
      t.build()
    );
  }

  /* ---- 首屏固定 8 个大众向工具 ---- */
  const FEATURED = ["time", "unit", "tax", "loan", "color", "text", "img", "money"];
  const rank = (t) => { const i = FEATURED.indexOf(t.id); return i < 0 ? 99 : i; };

  /* ---- 置顶（最多 3 个） ---- */
  const PKEY = "pocket-pinned";
  const readPinned = () => { try { return JSON.parse(localStorage.getItem(PKEY) || "[]"); } catch (e) { return []; } };
  const isPinned = (id) => readPinned().indexOf(id) >= 0;
  const flushPinned = () => {
    document.querySelectorAll(".pin").forEach((b) => {
      const on = isPinned(b.getAttribute("data-pin"));
      b.textContent = on ? "★" : "☆";
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  };

  /* ---- 最近用过 ---- */
  const RKEY = "pocket-recent";
  const readRecent = () => { try { return JSON.parse(localStorage.getItem(RKEY) || "[]"); } catch (e) { return []; } };
  const pushRecent = (id) => {
    try {
      const r = readRecent().filter((x) => x !== id);
      r.unshift(id);
      localStorage.setItem(RKEY, JSON.stringify(r.slice(0, 6)));
    } catch (e) {}
  };
  const recentEl = $("#recent"), recentList = $("#recentList");
  const renderRecent = () => {
    if (!recentEl || !recentList) return;
    const items = readRecent().map((id) => tools.find((t) => t.id === id)).filter(Boolean);
    recentEl.hidden = false;
    recentList.innerHTML = "";
    if (!items.length) {
      recentList.appendChild(el("span", { class: "recent-empty" }, "用过哪个工具，它就会出现在这儿（最多 6 个）"));
      if (recentClear) recentClear.hidden = true;
      return;
    }
    if (recentClear) recentClear.hidden = false;
    items.forEach((t) => {
      const a = el("a", { href: "#tool-" + t.id, class: "recent-chip", "data-tool": t.id },
        el("span", {}, t.icon), el("b", {}, t.name));
      recentList.appendChild(a);
    });
  };
  const recentClear = $("#recentClear");
  if (recentClear) recentClear.addEventListener("click", () => { try { localStorage.removeItem(RKEY); } catch (e) {} renderRecent(); });

  let firstRender = true;
  function render() {
    const term = q.value.trim().toLowerCase();
    const list = tools
      .filter((t) => {
        if (!term) return true;
        const hay = (t.name + " " + t.desc + " " + t.tags.join(" ") + " " + t.id).toLowerCase();
        return hay.indexOf(term) >= 0;
      })
      .sort((a, b) => {
        const pa = isPinned(a.id) ? 0 : 1, pb = isPinned(b.id) ? 0 : 1;
        return pa - pb || rank(a) - rank(b);
      });
    grid.classList.toggle("no-anim", !firstRender);
    grid.innerHTML = "";
    list.forEach((t, i) => grid.appendChild(card(t, i)));
    empty.hidden = list.length > 0;
    $("#stat-count").textContent = tools.length + " 个工具";
    renderRecent();
    flushPinned();
    firstRender = false;
  }

  q.addEventListener("input", debounce(render, 120));
  window.addEventListener("keydown", (e) => {
    const tag = (document.activeElement && document.activeElement.tagName) || "";
    if (e.key === "/" && document.activeElement !== q && !/input|textarea|select/i.test(tag)) {
      e.preventDefault();
      q.focus();
    }
    if (e.key === "Escape" && document.activeElement === q) q.blur();
  });

  /* 点了卡片就记一笔最近，同时把 hash 换成它，方便收藏/分享 */
  grid.addEventListener("click", (e) => {
    const pinBtn = e.target.closest && e.target.closest(".pin");
    if (pinBtn) {
      e.preventDefault();
      const id = pinBtn.getAttribute("data-pin");
      let list = readPinned();
      if (list.indexOf(id) >= 0) list = list.filter((x) => x !== id);
      else { list.unshift(id); if (list.length > 3) list = list.slice(0, 3); }
      try { localStorage.setItem(PKEY, JSON.stringify(list)); } catch (err) {}
      render();
      return;
    }
    const c = e.target.closest && e.target.closest(".card");
    if (!c || !c.id) return;
    const id = c.getAttribute("data-tool");
    if (id) pushRecent(id);
    try { history.replaceState(null, "", "#" + c.id); } catch (err) {}
  });
  q.addEventListener("change", () => {
    if (!q.value.trim()) render();
  });

  /* 带 #tool-xxx 进来：滚到那个工具并闪一下 */
  function jumpToHash() {
    const h = decodeURIComponent(location.hash || "").replace(/^#/, "");
    if (!h) return;
    let target = document.getElementById(h);
    if (!target && h.startsWith("tool-")) {
      const id = h.slice(5);
      const t = tools.find((x) => x.id === id);
      if (t) { q.value = ""; render(); target = document.getElementById("tool-" + id); }
    }
    if (!target) return;
    setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.classList.add("flash");
      setTimeout(() => target.classList.remove("flash"), 1800);
    }, 80);
  }
  window.addEventListener("hashchange", jumpToHash);

  render();
  jumpToHash();
  window.PocketTools = { register, render, toast, el, copyBtn, copyText, debounce, enc, tools };
})();
