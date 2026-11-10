/* 口袋工具箱 · 追加工具包（第二批：单位 / 日期 / 去重 / 大写 / 对比 / 倒计时 / CSV / 摩斯） */
(() => {
  "use strict";
  const PT = window.PocketTools;
  if (!PT) return;
  const { register, render, el, toast, copyBtn, debounce } = PT;

  const num = (v) => {
    const n = Number(String(v).replace(/,/g, ""));
    return isFinite(n) ? n : NaN;
  };
  const fmt = (n, digits = 6) => {
    if (!isFinite(n)) return "—";
    const a = Math.abs(n);
    if (a !== 0 && (a < 1e-6 || a >= 1e12)) return n.toExponential(4);
    let s = Number(n.toFixed(digits)).toString();
    return s;
  };

  /* ================= 18. 单位换算 ================= */
  const UNITS = {
    长度: { 米: 1, 千米: 1000, 厘米: 0.01, 毫米: 0.001, 微米: 1e-6, 英寸: 0.0254, 英尺: 0.3048, 码: 0.9144, 英里: 1609.344, 里: 500 },
    重量: { 千克: 1, 克: 0.001, 毫克: 1e-6, 吨: 1000, 斤: 0.5, 两: 0.05, 磅: 0.45359237, 盎司: 0.028349523125 },
    面积: { 平方米: 1, 平方千米: 1e6, 公顷: 1e4, 亩: 2000 / 3, 平方英尺: 0.09290304, 平方厘米: 1e-4 },
    体积: { 升: 1, 毫升: 0.001, 立方米: 1000, 加仑: 3.785411784, 品脱: 0.473176473 },
    数据: { MB: 1, B: 1 / 1048576, KB: 1 / 1024, GB: 1024, TB: 1048576 },
    速度: { "米/秒": 1, "千米/时": 1 / 3.6, "英里/时": 0.44704, 节: 0.514444 },
  };
  const TEMPS = ["摄氏度", "华氏度", "开尔文"];
  const toC = (v, u) => (u === "摄氏度" ? v : u === "华氏度" ? (v - 32) / 1.8 : v - 273.15);
  const fromC = (c, u) => (u === "摄氏度" ? c : u === "华氏度" ? c * 1.8 + 32 : c + 273.15);

  const convert = (cat, val, from, to) => {
    if (!isFinite(val)) return NaN;
    if (cat === "温度") return fromC(toC(val, from), to);
    const t = UNITS[cat];
    if (!t || !t[from] || !t[to]) return NaN;
    return (val * t[from]) / t[to];
  };

  register({
    id: "unit", icon: "📐", name: "单位换算",
    desc: "长度、重量、面积、体积、数据、速度、温度，一次换完",
    tags: ["unit", "单位", "换算", "长度", "重量", "温度", "英寸", "斤"],
    build() {
      const cats = Object.keys(UNITS).concat(["温度"]);
      const cat = el("select", {}, ...cats.map((c) => el("option", { value: c }, c)));
      const from = el("select");
      const to = el("select");
      const input = el("input", { type: "number", value: "1", step: "any", inputmode: "decimal" });
      const out = el("output", { class: "block", style: "font:600 22px/1.5 var(--mono)" });
      const msg = el("p", { class: "hint" });

      const fill = () => {
        const list = cat.value === "温度" ? TEMPS : Object.keys(UNITS[cat.value]);
        from.innerHTML = "";
        to.innerHTML = "";
        list.forEach((u) => {
          from.appendChild(el("option", { value: u }, u));
          to.appendChild(el("option", { value: u }, u));
        });
        from.selectedIndex = 0;
        to.selectedIndex = Math.min(1, list.length - 1);
        run();
      };

      const run = () => {
        const v = num(input.value);
        const r = convert(cat.value, v, from.value, to.value);
        if (!isFinite(r)) {
          out.textContent = "—";
          msg.textContent = "输入一个数字";
          msg.className = "hint";
          return;
        }
        out.textContent = fmt(r) + " " + to.value;
        msg.textContent = input.value + " " + from.value + " = " + fmt(r) + " " + to.value;
        msg.className = "hint ok";
      };

      input.style.width = "120px";
      from.style.width = "auto";
      to.style.width = "auto";
      cat.addEventListener("change", fill);
      [from, to].forEach((s) => s.addEventListener("change", run));
      input.addEventListener("input", debounce(run, 80));
      fill();

      return el("div", {},
        el("div", { class: "row" }, cat),
        el("div", { class: "row", style: "margin-top:9px" }, input, from, el("span", { style: "color:var(--muted)" }, "→"), to),
        out, msg,
        el("p", { class: "hint" }, "换温度时选「温度」，其余按类别选。")
      );
    },
  });

  /* ================= 19. 日期计算 ================= */
  const DAY = 86400000;
  const ymd = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const parseDate = (s) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d;
  };
  const WEEK = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

  register({
    id: "date", icon: "📅", name: "日期计算",
    desc: "两个日期差几天、加 N 天、星期几、算年龄",
    tags: ["date", "日期", "天数", "星期", "年龄", "计算"],
    build() {
      const today = new Date();
      const a = el("input", { type: "date", value: ymd(today) });
      const b = el("input", { type: "date", value: ymd(addDays(today, 30)) });
      const gap = el("output", { class: "block", style: "font:600 20px/1.6 var(--mono)" });
      const addN = el("input", { type: "number", value: "100", step: "1", inputmode: "numeric" });
      const addOut = el("output", { class: "block", style: "min-height:auto" });
      const msg = el("p", { class: "hint" });

      const runGap = () => {
        const d1 = parseDate(a.value), d2 = parseDate(b.value);
        if (!d1 || !d2) { gap.textContent = "—"; return; }
        const diff = Math.round((d2 - d1) / DAY);
        const abs = Math.abs(diff);
        const weeks = Math.floor(abs / 7), days = abs % 7;
        gap.textContent = diff + " 天";
        msg.textContent = d1.getFullYear() + "年 到 " + d2.getFullYear() + "年 · 约 " +
          (abs / 30.44).toFixed(1) + " 个月 · " + weeks + " 周" + (days ? " " + days + " 天" : "") +
          " · 起止各算一天共 " + (abs + 1) + " 天";
        msg.className = "hint ok";
      };

      const runAdd = () => {
        const d1 = parseDate(a.value);
        const n = num(addN.value);
        if (!d1 || !isFinite(n)) { addOut.textContent = "—"; return; }
        const r = addDays(d1, Math.trunc(n));
        addOut.textContent = ymd(r) + "（" + WEEK[r.getDay()] + "）";
      };

      [a, b].forEach((i) => i.addEventListener("change", () => { runGap(); runAdd(); }));
      addN.addEventListener("input", debounce(runAdd, 120));
      runGap(); runAdd();

      return el("div", {},
        el("div", { class: "row" }, a, el("span", { style: "color:var(--muted)" }, "→"), b),
        gap, msg,
        el("div", { class: "row", style: "margin-top:14px" },
          el("span", { class: "field-label", style: "margin:0" }, "往前/往后推"), addN,
          el("span", { class: "field-label", style: "margin:0 0 0 8px" }, "天")),
        addOut,
        el("p", { class: "hint" }, "只算日期，不含时分秒；跨时区不影响。")
      );
    },
  });

  /* ================= 20. 文本去重 ================= */
  register({
    id: "dedup", icon: "🧹", name: "文本去重",
    desc: "按行去重、排序、去空行，顺便数一数重复几次",
    tags: ["dedup", "去重", "排序", "重复", "unique", "清理"],
    build() {
      const input = el("textarea", { rows: "6", placeholder: "一行一条，粘进来…" });
      const out = el("textarea", { rows: "6", readonly: "", placeholder: "结果在这里" });
      const msg = el("p", { class: "hint" });
      const opt = { uniq: true, sort: false, blank: true, trim: true };

      const mk = (key, label) => {
        const box = el("label", { class: "chk" }, el("input", { type: "checkbox", checked: opt[key] ? "" : undefined }), label);
        const cb = box.querySelector("input");
        cb.checked = opt[key];
        cb.addEventListener("change", () => { opt[key] = cb.checked; run(); });
        return box;
      };

      const run = () => {
        let lines = input.value.split(/\r?\n/);
        if (opt.trim) lines = lines.map((s) => s.trim());
        if (opt.blank) lines = lines.filter((s) => s.length);
        const before = lines.length;
        let dup = 0;
        if (opt.uniq) {
          const seen = new Map();
          for (const s of lines) seen.set(s, (seen.get(s) || 0) + 1);
          dup = [...seen.values()].filter((n) => n > 1).reduce((a, n) => a + n - 1, 0);
          lines = [...seen.keys()];
        }
        if (opt.sort) lines.sort((x, y) => x.localeCompare(y, "zh-Hans-CN"));
        out.value = lines.join("\n");
        msg.textContent = "输入 " + before + " 行 → 输出 " + lines.length + " 行" + (dup ? "，去掉重复 " + dup + " 行" : "");
        msg.className = "hint ok";
      };

      input.addEventListener("input", debounce(run, 160));
      return el("div", {},
        input,
        el("div", { class: "row", style: "margin-top:9px" }, mk("uniq", "去重"), mk("sort", "排序"), mk("blank", "去空行"), mk("trim", "去首尾空格")),
        out,
        el("div", { class: "row" }, copyBtn(() => out.value)),
        msg
      );
    },
  });

  /* ================= 21. 人民币大写 ================= */
  const DIGIT = "零壹贰叁肆伍陆柒捌玖";
  const SEC = ["", "万", "亿", "万亿"];
  const moneyUpper = (v) => {
    if (!isFinite(v)) return "";
    const neg = v < 0;
    v = Math.abs(v);
    if (v >= 1e16) return "太大了，超过 1 万亿亿";
    let yuan = Math.floor(v);
    let cents = Math.round((v - yuan) * 100);
    if (cents >= 100) { yuan += 1; cents -= 100; }

    const group = (n) => {
      let s = "", zero = false;
      const d = [Math.floor(n / 1000), Math.floor(n / 100) % 10, Math.floor(n / 10) % 10, n % 10];
      const names = ["仟", "佰", "拾", ""];
      for (let i = 0; i < 4; i++) {
        if (d[i] === 0) { zero = true; }
        else {
          if (zero && s) s += "零";
          s += DIGIT[d[i]] + names[i];
          zero = false;
        }
      }
      return s;
    };

    let intPart = "";
    if (yuan === 0) intPart = "零";
    else {
      const groups = [];
      let n = yuan;
      while (n > 0) { groups.push(n % 10000); n = Math.floor(n / 10000); }
      for (let i = groups.length - 1; i >= 0; i--) {
        const g = groups[i];
        if (g === 0) { if (intPart && !intPart.endsWith("零")) intPart += "零"; continue; }
        if (intPart && g < 1000 && !intPart.endsWith("零")) intPart += "零";
        intPart += group(g) + SEC[i];
      }
      intPart = intPart.replace(/零+$/, "");
    }

    const jiao = Math.floor(cents / 10), fen = cents % 10;
    let frac = "";
    if (cents === 0) frac = "整";
    else {
      if (jiao) frac += DIGIT[jiao] + "角";
      if (fen) frac += (jiao ? "" : "零") + DIGIT[fen] + "分";
      else if (jiao) frac += "整";
    }
    return (neg ? "负" : "") + intPart + "元" + frac;
  };

  register({
    id: "money", icon: "💴", name: "人民币大写",
    desc: "报销、合同用，数字转「壹仟贰佰叁拾肆元伍角陆分」",
    tags: ["money", "大写", "人民币", "金额", "报销", "合同"],
    build() {
      const input = el("input", { type: "number", value: "1234.56", step: "0.01", inputmode: "decimal" });
      const out = el("textarea", { rows: "2", readonly: "", style: "font-size:16px" });
      const msg = el("p", { class: "hint" });
      const run = () => {
        const v = num(input.value);
        if (!isFinite(v)) { out.value = ""; msg.textContent = "输入一个金额"; msg.className = "hint"; return; }
        const s = moneyUpper(v);
        out.value = s;
        msg.textContent = v.toFixed(2) + " → " + s + "（" + [...s].length + " 字）";
        msg.className = "hint ok";
      };
      input.addEventListener("input", debounce(run, 120));
      run();
      return el("div", {}, input, out, el("div", { class: "row" }, copyBtn(() => out.value)), msg);
    },
  });

  /* ================= 22. 文本对比 ================= */
  const diffLines = (A, B) => {
    const a = A.split(/\r?\n/), b = B.split(/\r?\n/);
    const n = a.length, m = b.length;
    if (n * m > 4e6) return null;
    const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--)
      for (let j = m - 1; j >= 0; j--)
        dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const rows = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) { rows.push(["same", a[i]]); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { rows.push(["del", a[i]]); i++; }
      else { rows.push(["add", b[j]]); j++; }
    }
    while (i < n) rows.push(["del", a[i++]]);
    while (j < m) rows.push(["add", b[j++]]);
    return rows;
  };

  register({
    id: "diff", icon: "🆚", name: "文本对比",
    desc: "两段文字逐行比对，标出新增和删除的行",
    tags: ["diff", "对比", "比较", "差异", "文本"],
    build() {
      const A = el("textarea", { rows: "5", placeholder: "旧文本…" });
      const B = el("textarea", { rows: "5", placeholder: "新文本…" });
      const out = el("div", {
        style: "margin-top:10px;font:12.5px/1.75 var(--mono);background:rgba(0,0,0,.22);border:1px solid var(--line);border-radius:11px;padding:8px 10px;max-height:320px;overflow:auto;white-space:pre-wrap;word-break:break-word",
      });
      const msg = el("p", { class: "hint" });

      const run = () => {
        const rows = diffLines(A.value, B.value);
        if (!rows) { out.textContent = "文本太长，先拆小一点再比"; return; }
        const add = rows.filter((r) => r[0] === "add").length;
        const del = rows.filter((r) => r[0] === "del").length;
        out.innerHTML = "";
        for (const [kind, text] of rows) {
          const line = el("div", {
            style: kind === "add"
              ? "background:rgba(110,231,168,.14);color:var(--ink);border-left:2px solid var(--ok);padding-left:6px;margin-left:-6px"
              : kind === "del"
              ? "background:rgba(255,122,122,.12);color:var(--muted);border-left:2px solid var(--err);padding-left:6px;margin-left:-6px;text-decoration:line-through"
              : "padding-left:6px;margin-left:-6px",
          }, (kind === "add" ? "+ " : kind === "del" ? "− " : "  ") + text);
          out.appendChild(line);
        }
        msg.textContent = "新增 " + add + " 行，删除 " + del + " 行，其余相同";
        msg.className = "hint ok";
      };

      [A, B].forEach((t) => t.addEventListener("input", debounce(run, 200)));
      return el("div", {}, A, B, out, msg);
    },
  });

  /* ================= 23. 倒计时 / 番茄钟 ================= */
  register({
    id: "timer", icon: "⏳", name: "倒计时",
    desc: "番茄钟或任意时长，结束响三声，页面标题也会倒数",
    tags: ["timer", "倒计时", "番茄钟", "计时", "专注"],
    build() {
      const min = el("input", { type: "number", value: "25", min: "0", max: "600", style: "width:80px" });
      const sec = el("input", { type: "number", value: "0", min: "0", max: "59", style: "width:70px" });
      const face = el("div", { style: "font:800 54px/1.15 var(--mono);letter-spacing:.02em;text-align:center;margin:6px 0 2px" }, "25:00");
      const msg = el("p", { class: "hint", style: "text-align:center" });
      const startBtn = el("button", { class: "btn primary", type: "button" }, "开始");
      const resetBtn = el("button", { class: "btn", type: "button" }, "重置");
      const preset = (m) => el("button", { class: "btn mini", type: "button", onclick: () => { min.value = m; sec.value = 0; reset(); } }, m + " 分钟");

      let left = 0, timer = null, running = false, endAt = 0;
      const title0 = document.title;

      const draw = () => {
        const t = Math.max(0, Math.ceil(left / 1000));
        const mm = String(Math.floor(t / 60)).padStart(2, "0");
        const ss = String(t % 60).padStart(2, "0");
        face.textContent = mm + ":" + ss;
        document.title = running ? mm + ":" + ss + " · 倒计时" : title0;
      };

      const beep = () => {
        try {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          const ac = new AC();
          [0, 0.22, 0.44].forEach((delay) => {
            const o = ac.createOscillator(), g = ac.createGain();
            o.type = "sine";
            o.frequency.value = 880;
            g.gain.value = 0;
            o.connect(g).connect(ac.destination);
            const t0 = ac.currentTime + delay;
            g.gain.setValueAtTime(0, t0);
            g.gain.linearRampToValueAtTime(0.25, t0 + 0.02);
            g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
            o.start(t0); o.stop(t0 + 0.2);
          });
          setTimeout(() => ac.close().catch(() => {}), 900);
        } catch (e) {}
      };

      const tick = () => {
        if (!face.isConnected) { clearInterval(timer); timer = null; running = false; document.title = title0; return; }
        left = endAt - Date.now();
        if (left <= 0) {
          left = 0; running = false; clearInterval(timer); timer = null;
          startBtn.textContent = "开始";
          draw(); beep();
          msg.textContent = "时间到！";
          msg.className = "hint ok";
          return;
        }
        draw();
      };

      const reset = () => {
        clearInterval(timer); timer = null; running = false;
        startBtn.textContent = "开始";
        left = ((Number(min.value) || 0) * 60 + (Number(sec.value) || 0)) * 1000;
        document.title = title0;
        draw();
        msg.textContent = "共 " + Math.round(left / 60000) + " 分钟";
        msg.className = "hint";
      };

      startBtn.addEventListener("click", () => {
        if (running) {
          running = false; clearInterval(timer); timer = null;
          startBtn.textContent = "继续";
          document.title = title0;
          msg.textContent = "已暂停，剩 " + Math.ceil(left / 1000) + " 秒";
          return;
        }
        if (left <= 0) reset();
        if (left <= 0) { msg.textContent = "先设一个时长"; return; }
        running = true;
        endAt = Date.now() + left;
        startBtn.textContent = "暂停";
        msg.textContent = "进行中…";
        msg.className = "hint";
        timer = setInterval(tick, 200);
        draw();
      });
      resetBtn.addEventListener("click", reset);
      [min, sec].forEach((i) => i.addEventListener("change", reset));
      reset();

      return el("div", {},
        face,
        el("div", { class: "row", style: "justify-content:center" }, min, el("span", { style: "color:var(--muted)" }, "分"), sec, el("span", { style: "color:var(--muted)" }, "秒")),
        el("div", { class: "row", style: "justify-content:center" }, startBtn, resetBtn),
        el("div", { class: "row", style: "justify-content:center" }, preset(5), preset(10), preset(25), preset(45)),
        msg
      );
    },
  });

  /* ================= 24. CSV ↔ JSON ================= */
  const parseCsv = (text, delim, header) => {
    const rows = [];
    let row = [], cell = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; }
          else q = false;
        } else cell += c;
      } else if (c === '"') q = true;
      else if (c === delim) { row.push(cell); cell = ""; }
      else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
      else if (c !== "\r") cell += c;
    }
    if (cell.length || row.length) { row.push(cell); rows.push(row); }
    const clean = rows.filter((r) => r.length > 1 || (r[0] || "").trim() !== "");
    if (!clean.length) return [];
    if (!header) return clean;
    const head = clean[0].map((h, i) => (h || "列" + (i + 1)).trim());
    return clean.slice(1).map((r) => {
      const o = {};
      head.forEach((h, i) => { o[h] = r[i] === undefined ? "" : r[i]; });
      return o;
    });
  };

  register({
    id: "csv", icon: "📊", name: "CSV 转 JSON",
    desc: "表格粘贴进来，自动认逗号、制表符、分号",
    tags: ["csv", "json", "表格", "excel", "转换"],
    build() {
      const input = el("textarea", { rows: "6", placeholder: "姓名,年龄\n张三,18\n李四,20" });
      const delim = el("select", {},
        el("option", { value: "auto" }, "自动识别"),
        el("option", { value: "," }, "逗号 ,"),
        el("option", { value: "\t" }, "制表符 Tab"),
        el("option", { value: ";" }, "分号 ;")
      );
      const head = el("input", { type: "checkbox" });
      head.checked = true;
      const headWrap = el("label", { class: "chk" }, head, "首行是表头");
      const out = el("textarea", { rows: "6", readonly: "" });
      const msg = el("p", { class: "hint" });

      const run = () => {
        const t = input.value;
        if (!t.trim()) { out.value = ""; msg.textContent = ""; return; }
        let d = delim.value;
        if (d === "auto") {
          const first = t.split(/\r?\n/)[0] || "";
          d = first.includes("\t") ? "\t" : first.includes(";") && !first.includes(",") ? ";" : ",";
        }
        try {
          const data = parseCsv(t, d, head.checked);
          out.value = JSON.stringify(data, null, 2);
          msg.textContent = "解析出 " + data.length + " 行（分隔符 " + (d === "\t" ? "Tab" : d) + "）";
          msg.className = "hint ok";
        } catch (e) {
          msg.textContent = "解析失败：" + e.message;
          msg.className = "hint err";
        }
      };

      input.addEventListener("input", debounce(run, 200));
      delim.addEventListener("change", run);
      head.addEventListener("change", run);

      return el("div", {}, input, el("div", { class: "row", style: "margin-top:9px" }, delim, headWrap), out, el("div", { class: "row" }, copyBtn(() => out.value)), msg);
    },
  });

  /* ================= 25. 摩斯电码 ================= */
  const MORSE = { A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.", ".": ".-.-.-", ",": "--..--", "?": "..--..", "/": "-..-.", "-": "-....-", "(": "-.--.", ")": "-.--.-", " ": "/" };
  const REV = {};
  for (const [k, v] of Object.entries(MORSE)) if (!REV[v]) REV[v] = k;

  const toMorse = (s) => [...s.toUpperCase()].map((c) => MORSE[c] || "").filter(Boolean).join(" ").replace(/\s+\/\s+/g, " / ");
  const fromMorse = (s) => s.trim().split(/\s+/).map((w) => (w === "/" ? " " : REV[w] || "")).join("");

  register({
    id: "morse", icon: "📡", name: "摩斯电码",
    desc: "英文数字转点和划，也能反过来念",
    tags: ["morse", "摩斯", "电码", "编码", "解谜"],
    build() {
      const input = el("textarea", { rows: "3", placeholder: "SOS 或 ... --- ..." });
      const out = el("textarea", { rows: "3", readonly: "" });
      const msg = el("p", { class: "hint" });

      const run = (dir) => {
        const v = input.value;
        if (!v.trim()) { out.value = ""; msg.textContent = ""; return; }
        out.value = dir === "enc" ? toMorse(v) : fromMorse(v);
        msg.textContent = dir === "enc" ? "编码完成" : "解码完成";
        msg.className = "hint ok";
      };

      return el("div", {},
        input,
        el("div", { class: "row" },
          el("button", { class: "btn", type: "button", onclick: () => run("enc") }, "文字 → 电码"),
          el("button", { class: "btn", type: "button", onclick: () => run("dec") }, "电码 → 文字")),
        out, el("div", { class: "row" }, copyBtn(() => out.value)), msg,
        el("p", { class: "hint" }, "字母之间空一格，单词之间用 / 分开；支持 A–Z、0–9 和常用标点。")
      );
    },
  });

  render();

  /* 给测试用：核心算法挂在 window 上，页面里不占位置 */
  window.__PT2 = { convert, moneyUpper, diffLines, parseCsv, toMorse, fromMorse };
})();
