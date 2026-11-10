/* 口袋工具箱 · 追加工具包（第三批：时区 / 个税 / 房贷 / 健康 / 朗读 / 渐变 / 加密 / 文件哈希） */
(() => {
  "use strict";
  const PT = window.PocketTools;
  if (!PT) return;
  const { register, render, el, toast, copyBtn, debounce } = PT;

  const num = (v) => { const n = Number(String(v).replace(/,/g, "")); return isFinite(n) ? n : NaN; };
  const money = (n) => (n || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pad = (n) => String(n).padStart(2, "0");

  /* ================= 26. 时区转换 ================= */
  const ZONES = [
    ["Asia/Shanghai", "北京"], ["Asia/Tokyo", "东京"], ["Asia/Seoul", "首尔"],
    ["Asia/Singapore", "新加坡"], ["Asia/Kolkata", "新德里"], ["Asia/Dubai", "迪拜"],
    ["Europe/London", "伦敦"], ["Europe/Paris", "巴黎"], ["Europe/Moscow", "莫斯科"],
    ["America/New_York", "纽约"], ["America/Chicago", "芝加哥"], ["America/Los_Angeles", "洛杉矶"],
    ["America/Sao_Paulo", "圣保罗"], ["Australia/Sydney", "悉尼"], ["Pacific/Auckland", "奥克兰"], ["UTC", "UTC"],
  ];

  const partsAt = (date, tz) => {
    const f = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short",
    });
    const o = {};
    for (const p of f.formatToParts(date)) o[p.type] = p.value;
    if (o.hour === "24") o.hour = "00";
    return o;
  };
  const WEEK = { Mon: "周一", Tue: "周二", Wed: "周三", Thu: "周四", Fri: "周五", Sat: "周六", Sun: "周日" };

  register({
    id: "tz", icon: "🌍", name: "时区转换",
    desc: "选一个时间和时区，看全世界现在几点",
    tags: ["timezone", "时区", "世界时间", "时差", "clock"],
    build() {
      const dt = el("input", { type: "datetime-local" });
      const from = el("select", {}, ...ZONES.map(([z, n]) => el("option", { value: z }, n + " · " + z)));
      const out = el("div", { style: "margin-top:12px;display:grid;gap:6px" });
      const msg = el("p", { class: "hint" });

      const now = new Date();
      const init = () => {
        const p = partsAt(now, "Asia/Shanghai");
        dt.value = p.year + "-" + p.month + "-" + p.day + "T" + p.hour + ":" + p.minute;
      };

      const run = () => {
        // 把「某时区的墙上时间」还原成一个绝对时刻
        const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(dt.value);
        if (!m) { out.innerHTML = ""; return; }
        const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
        // 先按"该时区此刻的偏移"猜一个时刻，再修正一次
        let guess = wall;
        for (let i = 0; i < 2; i++) {
          const p = partsAt(new Date(guess), from.value);
          const asWall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
          guess = guess + (wall - asWall);
        }
        const t = new Date(guess);
        out.innerHTML = "";
        ZONES.forEach(([z, n]) => {
          const p = partsAt(t, z);
          const same = p.year + p.month + p.day === partsAt(now, z).year + partsAt(now, z).month + partsAt(now, z).day;
          out.appendChild(el("div", {
            style: "display:flex;justify-content:space-between;gap:10px;font:13px/1.7 var(--mono);padding:5px 9px;border-radius:8px;background:" + (same ? "rgba(255,107,69,.10)" : "var(--bg)"),
          },
            el("span", {}, n),
            el("span", {}, p.hour + ":" + p.minute + " · " + WEEK[p.weekday] + (same ? "" : " · " + p.month + "/" + p.day))
          ));
        });
        const ref = partsAt(t, "Asia/Shanghai");
        msg.textContent = "北京时间 " + ref.year + "-" + ref.month + "-" + ref.day + " " + ref.hour + ":" + ref.minute + "（高亮的是当地同一天）";
        msg.className = "hint ok";
      };

      init();
      dt.addEventListener("change", run);
      from.addEventListener("change", run);
      run();

      return el("div", {},
        el("div", { class: "row" }, dt, from),
        out, msg,
        el("p", { class: "hint" }, "用的是系统时区库，夏令时也算得对。")
      );
    },
  });

  /* ================= 27. 个税计算 ================= */
  const TAX = [
    [3000, 0.03, 0], [12000, 0.1, 210], [25000, 0.2, 1410], [35000, 0.25, 2660],
    [55000, 0.3, 4410], [80000, 0.35, 7160], [Infinity, 0.45, 15160],
  ];
  const monthTax = (salary, social, extra) => {
    const base = Math.max(0, salary - 5000 - social - extra);
    if (base <= 0) return 0;
    for (const [cap, rate, minus] of TAX) if (base <= cap) return base * rate - minus;
    return 0;
  };

  register({
    id: "tax", icon: "🧾", name: "个税计算",
    desc: "按最新月度税率算到手工资，五险一金和专项扣除都能填",
    tags: ["tax", "个税", "工资", "到手", "五险一金", "税后"],
    build() {
      const salary = el("input", { type: "number", value: "15000", step: "100" });
      const social = el("input", { type: "number", value: "2000", step: "100" });
      const extra = el("input", { type: "number", value: "0", step: "500" });
      const out = el("div", { class: "kv-list" });
      const msg = el("p", { class: "hint" });

      const row = (k, v, cls) => el("div", { class: "kv-row" }, el("span", {}, k), el("b", { class: cls || "" }, v));

      const run = () => {
        const s = num(salary.value), so = num(social.value) || 0, ex = num(extra.value) || 0;
        if (!isFinite(s) || s <= 0) { out.innerHTML = ""; msg.textContent = "填一下税前工资"; msg.className = "hint"; return; }
        const tax = Math.max(0, Math.round(monthTax(s, so, ex) * 100) / 100);
        const net = s - so - tax;
        const base = Math.max(0, s - 5000 - so - ex);
        out.innerHTML = "";
        out.append(
          row("应纳税所得额", money(base) + " 元"),
          row("个税", money(tax) + " 元", "err"),
          row("税后到手", money(net) + " 元", "ok"),
          row("实际税率", (s > 0 ? (tax / s * 100).toFixed(2) : "0.00") + "%")
        );
        msg.textContent = "按月度综合所得税率表估算；年终奖、多地收入等情况另算。";
        msg.className = "hint ok";
      };

      [salary, social, extra].forEach((i) => i.addEventListener("input", debounce(run, 150)));
      run();

      return el("div", {},
        el("div", { class: "row" }, el("span", { class: "field-label", style: "margin:0" }, "税前月薪"), salary),
        el("div", { class: "row" }, el("span", { class: "field-label", style: "margin:0" }, "五险一金"), social),
        el("div", { class: "row" }, el("span", { class: "field-label", style: "margin:0" }, "专项附加扣除"), extra),
        out, msg
      );
    },
  });

  /* ================= 28. 房贷计算 ================= */
  const loanEqual = (P, yearRate, months) => {
    const r = yearRate / 100 / 12;
    if (r === 0) return { pay: P / months, total: P, interest: 0 };
    const k = Math.pow(1 + r, months);
    const pay = (P * r * k) / (k - 1);
    return { pay, total: pay * months, interest: pay * months - P };
  };
  const loanPrincipal = (P, yearRate, months) => {
    const r = yearRate / 100 / 12;
    const first = P / months + P * r;
    const last = P / months + (P / months) * r;
    const interest = (months + 1) * P * r / 2;
    return { first, last, total: P + interest, interest };
  };

  register({
    id: "loan", icon: "🏠", name: "房贷计算",
    desc: "等额本息 / 等额本金，月供和总利息一眼看清",
    tags: ["loan", "房贷", "利息", "月供", "等额本息", "等额本金"],
    build() {
      const amount = el("input", { type: "number", value: "1000000", step: "10000" });
      const rate = el("input", { type: "number", value: "3.1", step: "0.05" });
      const years = el("input", { type: "number", value: "30", step: "1" });
      const kind = el("select", {}, el("option", { value: "eq" }, "等额本息（每月一样）"), el("option", { value: "pr" }, "等额本金（月供递减）"));
      const out = el("output", { class: "block", style: "min-height:auto;font:13.5px/1.9 var(--mono)" });
      const msg = el("p", { class: "hint" });

      const run = () => {
        const P = num(amount.value), R = num(rate.value), Y = num(years.value);
        if (!isFinite(P) || P <= 0 || !isFinite(R) || !isFinite(Y) || Y <= 0) { out.textContent = ""; return; }
        const n = Math.round(Y * 12);
        if (kind.value === "eq") {
          const r = loanEqual(P, R, n);
          out.textContent =
            "每月还：" + money(r.pay) + " 元\n" +
            "总还款：" + money(r.total) + " 元\n" +
            "总利息：" + money(r.interest) + " 元\n" +
            "利息占比：" + (r.interest / P * 100).toFixed(1) + "%";
        } else {
          const r = loanPrincipal(P, R, n);
          out.textContent =
            "首月还：" + money(r.first) + " 元\n" +
            "末月还：" + money(r.last) + " 元\n" +
            "每月递减：" + money((P / n) * (R / 100 / 12)) + " 元\n" +
            "总还款：" + money(r.total) + " 元\n" +
            "总利息：" + money(r.interest) + " 元";
        }
        msg.textContent = "共 " + n + " 期；" + (R !== 0 ? "利率按 " + R + "% 固定算" : "零利率");
        msg.className = "hint ok";
      };

      [amount, rate, years].forEach((i) => i.addEventListener("input", debounce(run, 150)));
      kind.addEventListener("change", run);
      run();

      return el("div", {},
        el("div", { class: "row" }, el("span", { class: "field-label", style: "margin:0" }, "贷款"), amount, el("span", { style: "color:var(--muted)" }, "元")),
        el("div", { class: "row" }, el("span", { class: "field-label", style: "margin:0" }, "年利率"), rate, el("span", { style: "color:var(--muted)" }, "%")),
        el("div", { class: "row" }, el("span", { class: "field-label", style: "margin:0" }, "年限"), years, el("span", { style: "color:var(--muted)" }, "年")),
        el("div", { class: "row" }, kind),
        out, msg,
        el("p", { class: "hint" }, "不含手续费、提前还款和利率调整；只用来估个数。")
      );
    },
  });

  /* ================= 29. 健康计算 ================= */
  const bmiOf = (kg, cm) => kg / Math.pow(cm / 100, 2);
  const bmrOf = (kg, cm, age, male) => 10 * kg + 6.25 * cm - 5 * age + (male ? 5 : -161);
  const bmiTag = (b) => b < 18.5 ? "偏瘦" : b < 24 ? "正常" : b < 28 ? "偏胖" : "肥胖";

  register({
    id: "health", icon: "💪", name: "健康计算",
    desc: "BMI、基础代谢、每天该吃多少千卡",
    tags: ["bmi", "健康", "体重", "代谢", "热量", "减肥"],
    build() {
      const kg = el("input", { type: "number", value: "65", step: "0.5" });
      const cm = el("input", { type: "number", value: "172", step: "1" });
      const age = el("input", { type: "number", value: "25", step: "1" });
      const male = el("select", {}, el("option", { value: "1" }, "男"), el("option", { value: "0" }, "女"));
      const act = el("select", {},
        el("option", { value: "1.2" }, "几乎不动"), el("option", { value: "1.375" }, "轻度活动"),
        el("option", { value: "1.55", selected: "" }, "中度活动"), el("option", { value: "1.725" }, "高强度")
      );
      const out = el("div", { class: "kv-list" });
      const msg = el("p", { class: "hint" });

      const run = () => {
        const w = num(kg.value), h = num(cm.value), a = num(age.value);
        if (!isFinite(w) || !isFinite(h) || h <= 0) { out.innerHTML = ""; return; }
        const bmi = bmiOf(w, h);
        const bmr = bmrOf(w, h, isFinite(a) ? a : 25, male.value === "1");
        const tdee = bmr * Number(act.value);
        const lo = 18.5 * Math.pow(h / 100, 2), hi = 24 * Math.pow(h / 100, 2);
        out.innerHTML = "";
        out.append(
          el("div", { class: "kv-row" }, el("span", {}, "BMI"), el("b", { class: bmi >= 18.5 && bmi < 24 ? "ok" : "err" }, bmi.toFixed(1) + " · " + bmiTag(bmi))),
          el("div", { class: "kv-row" }, el("span", {}, "正常体重范围"), el("b", {}, lo.toFixed(1) + "–" + hi.toFixed(1) + " kg")),
          el("div", { class: "kv-row" }, el("span", {}, "基础代谢 BMR"), el("b", {}, Math.round(bmr) + " kcal")),
          el("div", { class: "kv-row" }, el("span", {}, "每日消耗 TDEE"), el("b", { class: "ok" }, Math.round(tdee) + " kcal")),
          el("div", { class: "kv-row" }, el("span", {}, "减脂参考"), el("b", {}, Math.round(tdee - 400) + " kcal/天"))
        );
        msg.textContent = "BMI 公式按中国标准；BMR 用 Mifflin-St Jeor。";
        msg.className = "hint ok";
      };

      [kg, cm, age].forEach((i) => i.addEventListener("input", debounce(run, 150)));
      [male, act].forEach((i) => i.addEventListener("change", run));
      run();

      return el("div", {},
        el("div", { class: "row" }, el("span", { class: "field-label", style: "margin:0" }, "体重 kg"), kg, el("span", { class: "field-label", style: "margin:0 0 0 8px" }, "身高 cm"), cm),
        el("div", { class: "row" }, el("span", { class: "field-label", style: "margin:0" }, "年龄"), age, male, act),
        out, msg
      );
    },
  });

  /* ================= 30. 文字朗读 ================= */
  register({
    id: "tts", icon: "🔊", name: "文字朗读",
    desc: "用手机自带的语音把文字念出来，语速音调都能调",
    tags: ["tts", "朗读", "语音", "speak", "听书"],
    build() {
      const text = el("textarea", { rows: "5", placeholder: "粘贴一段文字，点下面开始念…" });
      const rate = el("input", { type: "range", min: "0.5", max: "2", step: "0.1", value: "1" });
      const pitch = el("input", { type: "range", min: "0", max: "2", step: "0.1", value: "1" });
      const voice = el("select");
      const msg = el("p", { class: "hint" });
      const btnPlay = el("button", { class: "btn primary", type: "button" }, "开始朗读");
      const btnPause = el("button", { class: "btn", type: "button" }, "暂停 / 继续");
      const btnStop = el("button", { class: "btn", type: "button" }, "停止");

      const ok = "speechSynthesis" in window;
      if (!ok) {
        msg.textContent = "这个浏览器不支持朗读功能。";
        msg.className = "hint err";
      }

      const fillVoices = () => {
        if (!ok) return;
        const list = speechSynthesis.getVoices().filter((v) => v.lang);
        list.sort((a, b) => (a.lang.startsWith("zh") ? -1 : 1) - (b.lang.startsWith("zh") ? -1 : 1));
        voice.innerHTML = "";
        list.forEach((v, i) => {
          const o = el("option", { value: String(i) }, v.name + " · " + v.lang);
          voice.appendChild(o);
          if (v.lang.startsWith("zh") && !voice.dataset.picked) { voice.dataset.picked = "1"; voice.selectedIndex = i; }
        });
        voice._list = list;
      };

      if (ok) {
        fillVoices();
        speechSynthesis.onvoiceschanged = fillVoices;
      }

      const speak = () => {
        if (!ok) return;
        const t = text.value.trim();
        if (!t) { toast("先写点东西"); return; }
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(t);
        const list = voice._list || [];
        const idx = Number(voice.value);
        if (list[idx]) { u.voice = list[idx]; u.lang = list[idx].lang; }
        u.rate = Number(rate.value);
        u.pitch = Number(pitch.value);
        u.onend = () => { msg.textContent = "念完了"; msg.className = "hint ok"; };
        u.onerror = (e) => { msg.textContent = "朗读出错：" + (e.error || "未知"); msg.className = "hint err"; };
        msg.textContent = "正在念…";
        msg.className = "hint";
        speechSynthesis.speak(u);
      };

      btnPlay.addEventListener("click", speak);
      btnPause.addEventListener("click", () => {
        if (!ok) return;
        if (speechSynthesis.paused) speechSynthesis.resume();
        else speechSynthesis.pause();
      });
      btnStop.addEventListener("click", () => { if (ok) speechSynthesis.cancel(); msg.textContent = "已停止"; msg.className = "hint"; });

      return el("div", {},
        text,
        el("div", { class: "row", style: "margin-top:9px" }, el("span", { class: "field-label", style: "margin:0" }, "语速"), rate),
        el("div", { class: "row" }, el("span", { class: "field-label", style: "margin:0" }, "音调"), pitch),
        el("div", { class: "row" }, voice),
        el("div", { class: "row" }, btnPlay, btnPause, btnStop),
        msg
      );
    },
  });

  /* ================= 31. 渐变色 ================= */
  const gradCss = (c1, c2, angle, radial) =>
    radial ? "radial-gradient(circle at 50% 50%, " + c1 + ", " + c2 + ")"
           : "linear-gradient(" + angle + "deg, " + c1 + ", " + c2 + ")";

  register({
    id: "gradient", icon: "🌈", name: "渐变生成",
    desc: "两个颜色调出 CSS 渐变，点一下复制代码",
    tags: ["gradient", "渐变", "css", "配色", "颜色"],
    build() {
      const c1 = el("input", { type: "color", value: "#ff6b45", style: "width:56px;height:38px;padding:2px" });
      const c2 = el("input", { type: "color", value: "#9bb0ff", style: "width:56px;height:38px;padding:2px" });
      const angle = el("input", { type: "range", min: "0", max: "360", value: "135", step: "5" });
      const radial = el("input", { type: "checkbox" });
      const box = el("div", { style: "height:150px;border-radius:12px;border:1px solid var(--line);margin-top:10px" });
      const code = el("textarea", { rows: "2", readonly: "" });
      const msg = el("p", { class: "hint" });
      const flip = el("button", { class: "btn mini", type: "button", onclick: () => { const t = c1.value; c1.value = c2.value; c2.value = t; run(); } }, "对调颜色");

      const run = () => {
        const css = gradCss(c1.value, c2.value, angle.value, radial.checked);
        box.style.background = css;
        code.value = "background: " + css + ";";
        msg.textContent = c1.value + " → " + c2.value + (radial.checked ? " · 径向" : " · " + angle.value + "°");
        msg.className = "hint ok";
      };

      [c1, c2].forEach((i) => i.addEventListener("input", run));
      angle.addEventListener("input", run);
      radial.addEventListener("change", run);
      run();

      return el("div", {},
        el("div", { class: "row" }, c1, c2, flip),
        el("div", { class: "row" }, el("span", { class: "field-label", style: "margin:0" }, "角度"), angle,
          el("label", { class: "chk" }, radial, "径向")),
        box, code,
        el("div", { class: "row" }, copyBtn(() => code.value)),
        msg
      );
    },
  });

  /* ================= 32. 文本加解密 ================= */
  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const keyOf = async (pass, salt) => {
    const enc = new TextEncoder();
    const base = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
      base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
  };

  register({
    id: "crypto", icon: "🔒", name: "文本加解密",
    desc: "AES-256-GCM + PBKDF2，密码只在你手机上，内容发出去也是密文",
    tags: ["aes", "加密", "解密", "密码", "crypto", "安全"],
    build() {
      const input = el("textarea", { rows: "4", placeholder: "要加密的文字，或要解密的密文…" });
      const pass = el("input", { type: "password", placeholder: "口令（自己记住，忘了就解不开）" });
      const out = el("textarea", { rows: "4", readonly: "" });
      const msg = el("p", { class: "hint" });

      const encBtn = el("button", { class: "btn primary", type: "button" }, "加密");
      const decBtn = el("button", { class: "btn", type: "button" }, "解密");

      const wrap = async (fn) => {
        try { await fn(); } catch (e) { msg.textContent = "失败：" + e.message; msg.className = "hint err"; }
      };

      encBtn.addEventListener("click", () => wrap(async () => {
        const t = input.value;
        if (!t || !pass.value) { msg.textContent = "文字和口令都要填"; msg.className = "hint err"; return; }
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await keyOf(pass.value, salt);
        const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(t));
        out.value = "PT1." + b64(salt) + "." + b64(iv) + "." + b64(ct);
        msg.textContent = "已加密，整段复制出去也只有拿到口令的人能看";
        msg.className = "hint ok";
      }));

      decBtn.addEventListener("click", () => wrap(async () => {
        const raw = input.value.trim();
        const p = raw.split(".");
        if (p.length !== 4 || p[0] !== "PT1") { msg.textContent = "这不像本工具的密文（应以 PT1. 开头）"; msg.className = "hint err"; return; }
        if (!pass.value) { msg.textContent = "要填口令"; msg.className = "hint err"; return; }
        const key = await keyOf(pass.value, unb64(p[1]));
        const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(p[2]) }, key, unb64(p[3]));
        out.value = new TextDecoder().decode(pt);
        msg.textContent = "解密成功";
        msg.className = "hint ok";
      }));

      return el("div", {},
        input, pass,
        el("div", { class: "row" }, encBtn, decBtn),
        out, el("div", { class: "row" }, copyBtn(() => out.value)), msg,
        el("p", { class: "hint" }, "全部在本机完成，没有网络请求；口令丢了就真解不开了。")
      );
    },
  });

  /* ================= 33. 文件哈希 ================= */
  register({
    id: "filehash", icon: "🧮", name: "文件哈希",
    desc: "选一个文件，算它的 SHA-256，用来核对下载有没有坏",
    tags: ["hash", "sha256", "文件", "校验", "md5"],
    build() {
      const file = el("input", { type: "file" });
      const algo = el("select", {},
        el("option", { value: "SHA-256" }, "SHA-256"),
        el("option", { value: "SHA-512" }, "SHA-512"),
        el("option", { value: "SHA-1" }, "SHA-1")
      );
      const out = el("textarea", { rows: "3", readonly: "" });
      const msg = el("p", { class: "hint" });

      const run = async () => {
        const f = file.files && file.files[0];
        if (!f) { out.value = ""; return; }
        msg.textContent = "计算中…";
        msg.className = "hint";
        try {
          const buf = await f.arrayBuffer();
          const digest = await crypto.subtle.digest(algo.value, buf);
          const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
          out.value = hex;
          msg.textContent = f.name + " · " + (f.size / 1024).toFixed(1) + " KB · " + algo.value;
          msg.className = "hint ok";
        } catch (e) {
          msg.textContent = "算不出来：" + e.message;
          msg.className = "hint err";
        }
      };

      file.addEventListener("change", run);
      algo.addEventListener("change", run);

      return el("div", {}, file, el("div", { class: "row" }, algo), out, el("div", { class: "row" }, copyBtn(() => out.value)), msg);
    },
  });

  render();
  window.__PT3 = { monthTax, loanEqual, loanPrincipal, bmiOf, bmrOf, gradCss };
})();
