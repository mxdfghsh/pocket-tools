/* 口袋工具箱 · 追加工具包（第六批：开发者向：JSON 转 TS / Cron / 权限 / 子网 / SQL / Markdown 表 / HTML 美化 / curl 转代码） */
(() => {
  "use strict";
  const PT = window.PocketTools;
  if (!PT) return;
  const { register, render, el, toast, copyBtn, debounce } = PT;

  /* ================= 50. JSON 转 TypeScript ================= */
  const tsName = (s) => {
    const p = String(s).replace(/[^A-Za-z0-9]+(.)?/g, (m, c) => (c ? c.toUpperCase() : ""));
    const n = p ? p[0].toUpperCase() + p.slice(1) : "Field";
    return /^[0-9]/.test(n) ? "F" + n : n;
  };

  const jsonToTs = (data, rootName) => {
    const ifaces = new Map();
    const seen = new Map();

    const typeOf = (val, name) => {
      if (val === null) return "null";
      if (Array.isArray(val)) {
        if (!val.length) return "unknown[]";
        const inner = mergeTypes(val.map((v) => typeOf(v, name + "Item")));
        return inner.includes("|") ? "(" + inner + ")[]" : inner + "[]";
      }
      if (typeof val === "object") {
        const key = JSON.stringify(Object.keys(val).sort().map((k) => [k, typeof val[k]]));
        if (seen.has(key)) { const prev = seen.get(key); if (prev.length <= name.length) return prev; }
        const n = tsName(name);
        seen.set(key, n);
        ifaces.set(n, val);
        return n;
      }
      return typeof val === "string" ? "string" : typeof val === "number" ? "number" : typeof val === "boolean" ? "boolean" : "unknown";
    };

    const mergeTypes = (types) => {
      const uniq = [...new Set(types.flatMap((t) => t.split(" | ").map((x) => x.replace(/^\(|\)$/g, ""))))];
      return uniq.length === 1 ? uniq[0] : uniq.join(" | ");
    };

    const root = typeOf(data, rootName || "Root");
    const out = [];
    let guard = 0;
    while (ifaces.size && guard++ < 200) {
      const [name, obj] = ifaces.entries().next().value;
      ifaces.delete(name);
      const body = Object.entries(obj).map(([k, v]) => {
        const safe = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
        return "  " + safe + ": " + typeOf(v, name + tsName(k)) + ";";
      });
      out.push("export interface " + name + " {\n" + body.join("\n") + "\n}");
    }
    return { code: out.join("\n\n"), root };
  };

  register({
    id: "json2ts", icon: "🧬", name: "JSON 转 TS",
    desc: "粘一段 JSON，直接生成 TypeScript 接口，数组和嵌套都能处理",
    tags: ["json", "typescript", "ts", "类型", "interface", "开发"],
    build() {
      const input = el("textarea", { rows: "6", placeholder: '{"id":1,"name":"x","tags":["a"],"meta":{"ok":true}}' });
      const name = el("input", { type: "text", value: "Root", style: "width:130px" });
      const out = el("textarea", { rows: "10", readonly: "", style: "font-size:12.5px" });
      const msg = el("p", { class: "hint" });

      const run = () => {
        const t = input.value.trim();
        if (!t) { out.value = ""; msg.textContent = ""; return; }
        let data;
        try { data = JSON.parse(t); }
        catch (e) { msg.textContent = "JSON 语法错误：" + e.message; msg.className = "hint err"; return; }
        try {
          const r = jsonToTs(data, name.value.trim() || "Root");
          out.value = r.code + "\n";
          const n = (out.value.match(/export interface/g) || []).length;
          msg.textContent = "生成 " + n + " 个接口 · 根类型 " + r.root;
          msg.className = "hint ok";
        } catch (e) { msg.textContent = "生成失败：" + e.message; msg.className = "hint err"; }
      };

      input.addEventListener("input", debounce(run, 250));
      name.addEventListener("input", debounce(run, 250));
      return el("div", {},
        input,
        el("div", { class: "row", style: "margin-top:9px" }, el("span", { class: "field-label", style: "margin:0" }, "根接口名"), name,
          el("button", { class: "btn primary", type: "button", onclick: run }, "生成")),
        out, el("div", { class: "row" }, copyBtn(() => out.value)), msg
      );
    },
  });

  /* ================= 51. Cron 解析 ================= */
  const CRON_RANGE = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 6]];

  const parseField = (txt, idx) => {
    const [lo, hi] = CRON_RANGE[idx];
    const set = new Set();
    for (const part of String(txt).split(",")) {
      const stepM = /^(\*|\d+(?:-\d+)?)\/(\d+)$/.exec(part);
      let rangePart = part, step = 1;
      if (stepM) { rangePart = stepM[1]; step = Number(stepM[2]); }
      let a, b;
      if (rangePart === "*") { a = lo; b = hi; }
      else if (/^\d+-\d+$/.test(rangePart)) { a = Number(rangePart.split("-")[0]); b = Number(rangePart.split("-")[1]); }
      else if (/^\d+$/.test(rangePart)) { a = b = Number(rangePart); }
      else if (idx === 3 && /^[a-z]{3}$/i.test(rangePart)) {
        const i = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(rangePart.toLowerCase());
        if (i < 0) return null;
        a = b = i + 1;
      } else return null;
      if (a < lo || b > hi || a > b) return null;
      for (let v = a; v <= b; v += step) set.add(v);
    }
    return set;
  };

  const cronNext = (expr, count, from) => {
    const f = String(expr).trim().split(/\s+/);
    if (f.length !== 5) return { error: "需要 5 段：分 时 日 月 周" };
    const sets = f.map(parseField);
    if (sets.some((s) => !s)) return { error: "有字段解析不了，检查数字范围（分 0-59，时 0-23，日 1-31，月 1-12，周 0-6）" };
    const [min, hour, dom, mon, dow] = sets;
    const out = [];
    const d = new Date(from.getTime());
    d.setSeconds(0, 0);
    d.setMinutes(d.getMinutes() + 1);
    const limit = 60 * 24 * 400;
    for (let i = 0; i < limit && out.length < count; i++) {
      const mm = d.getMinutes(), hh = d.getHours(), dd = d.getDate(), mo = d.getMonth() + 1, wd = d.getDay();
      const domOk = dom.has(dd), dowOk = dow.has(wd);
      const dayOk = f[2] === "*" && f[4] === "*" ? true : (f[2] !== "*" && f[4] !== "*" ? (domOk || dowOk) : (domOk && dowOk));
      if (min.has(mm) && hour.has(hh) && dayOk && mon.has(mo)) out.push(new Date(d));
      d.setMinutes(d.getMinutes() + 1);
    }
    return { list: out };
  };

  register({
    id: "cron", icon: "⏰", name: "Cron 表达��",
    desc: "写了个 cron 不确定对不对？算接下来五次什么时候跑",
    tags: ["cron", "定时", "计划任务", "devops", "开发"],
    build() {
      const input = el("input", { type: "text", value: "*/15 9-18 * * 1-5" });
      const out = el("div", { class: "kv-list" });
      const msg = el("p", { class: "hint" });
      const chips = el("div", { class: "row" });

      const presets = [
        ["每分钟", "* * * * *"],
        ["每小时", "0 * * * *"],
        ["每天 3 点", "0 3 * * *"],
        ["工作日 9-18 每 15 分", "*/15 9-18 * * 1-5"],
        ["每月 1 号", "0 0 1 * *"],
      ];

      const run = () => {
        const now = new Date();
        const r = cronNext(input.value, 5, now);
        out.innerHTML = "";
        if (r.error) { msg.textContent = r.error; msg.className = "hint err"; return; }
        if (!r.list.length) { msg.textContent = "未来 400 天内没有匹配时间"; msg.className = "hint err"; return; }
        const fmt = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") +
          " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") +
          " · 周" + "日一二三四五六"[d.getDay()];
        r.list.forEach((d, i) => out.appendChild(el("div", { class: "kv-row" }, el("span", {}, "第 " + (i + 1) + " 次"), el("b", {}, fmt(d)))));
        const diff = Math.round((r.list[0] - now) / 60000);
        msg.textContent = "下次在 " + (diff < 60 ? diff + " 分钟后" : diff < 1440 ? Math.round(diff / 60) + " 小时后" : Math.round(diff / 1440) + " 天后") + "（本地时区）";
        msg.className = "hint ok";
      };

      presets.forEach(([label, expr]) => {
        chips.appendChild(el("button", { class: "btn mini", type: "button", onclick: () => { input.value = expr; run(); } }, label));
      });
      input.addEventListener("input", debounce(run, 300));
      run();

      return el("div", {}, input, chips, out, msg,
        el("p", { class: "hint" }, "支持 * / 数字 / a-b / a,b / */n；周用 0-6（0 是周日），月份也认 jan-dec。"));
    },
  });

  /* ================= 52. Unix 权限 ================= */
  const bitsToRwx = (n) => {
    const out = [];
    for (let shift = 6; shift >= 0; shift -= 3) {
      const v = (n >> shift) & 7;
      out.push((v & 4 ? "r" : "-") + (v & 2 ? "w" : "-") + (v & 1 ? "x" : "-"));
    }
    return out.join("");
  };
  const rwxToBits = (s) => {
    let n = 0;
    for (let i = 0; i < 9; i++) if ("rwx".includes(s[i]) && s[i]) n |= 1 << (8 - i);
    return n;
  };
  const chmodOf = (input) => {
    const t = String(input).trim();
    if (/^[0-7]{3,4}$/.test(t)) {
      const num = parseInt(t, 8);
      const special = t.length === 4 ? Number(t[0]) : 0;
      const perm = num & 0o777;
      return { mode: perm.toString(8).padStart(3, "0"), rwx: bitsToRwx(perm), special };
    }
    if (/^[-r][-w][-x][-r][-w][-x][-r][-w][-x]$/.test(t)) {
      const num = rwxToBits(t);
      return { mode: num.toString(8), rwx: t, special: 0 };
    }
    return null;
  };

  register({
    id: "chmod", icon: "🔐", name: "文件权限",
    desc: "755 和 rwxr-xr-x 互相换，顺便讲清每一位是什么意思",
    tags: ["chmod", "权限", "linux", "unix", "755", "开发"],
    build() {
      const input = el("input", { type: "text", value: "755" });
      const out = el("div", { class: "kv-list" });
      const msg = el("p", { class: "hint" });
      const run = () => {
        const r = chmodOf(input.value);
        out.innerHTML = "";
        if (!r) { msg.textContent = "填三位八进制（如 755）或 rwx 形式（如 rwxr-xr-x）"; msg.className = "hint err"; return; }
        out.append(
          el("div", { class: "kv-row" }, el("span", {}, "八进制"), el("b", {}, r.mode)),
          el("div", { class: "kv-row" }, el("span", {}, "符号"), el("b", {}, r.rwx)),
          el("div", { class: "kv-row" }, el("span", {}, "所有者"), el("b", {}, r.rwx.slice(0, 3))),
          el("div", { class: "kv-row" }, el("span", {}, "同组"), el("b", {}, r.rwx.slice(3, 6))),
          el("div", { class: "kv-row" }, el("span", {}, "其他人"), el("b", {}, r.rwx.slice(6, 9)))
        );
        msg.textContent = "r=读(4) w=写(2) x=执行(1)；比如 755 = 7(4+2+1) 5(4+1) 5(4+1)";
        msg.className = "hint ok";
      };
      input.addEventListener("input", debounce(run, 150));
      run();
      return el("div", {}, input, out, msg);
    },
  });

  /* ================= 53. 子网计算 ================= */
  const ipToInt = (ip) => {
    const p = String(ip).split(".").map(Number);
    if (p.length !== 4 || p.some((x) => !Number.isInteger(x) || x < 0 || x > 255)) return null;
    return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
  };
  const intToIp = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");

  const cidrInfo = (input) => {
    const m = /^(\d+\.\d+\.\d+\.\d+)(?:\/(\d{1,2}))?$/.exec(String(input).trim());
    if (!m) return { error: "格式应为 192.168.1.0/24" };
    const ip = ipToInt(m[1]);
    if (ip === null) return { error: "IP 不合法" };
    const bits = m[2] === undefined ? 32 : Number(m[2]);
    if (bits < 0 || bits > 32) return { error: "掩码位数 0-32" };
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    const network = (ip & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const hosts = bits >= 31 ? 0 : Math.pow(2, 32 - bits) - 2;
    const first = bits >= 31 ? network : (network + 1) >>> 0;
    const last = bits >= 31 ? broadcast : (broadcast - 1) >>> 0;
    return { ip: m[1], bits, mask: intToIp(mask), network: intToIp(network), broadcast: intToIp(broadcast), first: intToIp(first), last: intToIp(last), hosts };
  };

  register({
    id: "cidr", icon: "🌐", name: "子网计算",
    desc: "192.168.1.0/24 对应的掩码、网段、可用地址一次算清",
    tags: ["cidr", "子网", "掩码", "ip", "网络", "开发"],
    build() {
      const input = el("input", { type: "text", value: "192.168.1.10/24" });
      const out = el("div", { class: "kv-list" });
      const msg = el("p", { class: "hint" });
      const run = () => {
        const r = cidrInfo(input.value);
        out.innerHTML = "";
        if (r.error) { msg.textContent = r.error; msg.className = "hint err"; return; }
        out.append(
          el("div", { class: "kv-row" }, el("span", {}, "子网掩码"), el("b", {}, r.mask)),
          el("div", { class: "kv-row" }, el("span", {}, "网络地址"), el("b", {}, r.network + "/" + r.bits)),
          el("div", { class: "kv-row" }, el("span", {}, "广播地址"), el("b", {}, r.broadcast)),
          el("div", { class: "kv-row" }, el("span", {}, "可用范围"), el("b", {}, r.first + " – " + r.last)),
          el("div", { class: "kv-row" }, el("span", {}, "可用主机数"), el("b", { class: "ok" }, String(r.hosts)))
        );
        msg.textContent = "输入 " + r.ip + "，按 /" + r.bits + " 计算";
        msg.className = "hint ok";
      };
      input.addEventListener("input", debounce(run, 200));
      run();
      return el("div", {}, input, out, msg);
    },
  });

  /* ================= 54. SQL 格式化 ================= */
  const SQL_KEY = ["select", "from", "where", "and", "or", "group by", "order by", "having", "limit", "offset", "join", "left join", "right join", "inner join", "outer join", "on", "insert into", "values", "update", "set", "delete from", "union", "case", "when", "then", "else", "end", "as", "into"];
  const sqlFmt = (sql) => {
    let s = " " + String(sql).replace(/\s+/g, " ").trim() + " ";
    for (const k of SQL_KEY.slice().sort((a, b) => b.length - a.length)) {
      s = s.replace(new RegExp("\\s" + k.replace(/ /g, "\\s+") + "\\s", "gi"), "\n" + k.toUpperCase() + " ");
    }
    s = s.replace(/\s+(AND|OR)\s+/gi, "\n  $1 ").replace(/,\s*/g, ",\n  ");
    return s.split("\n").map((l) => l.trim()).filter(Boolean).join("\n");
  };

  register({
    id: "sqlfmt", icon: "🗄", name: "SQL 格式化",
    desc: "一行烂 SQL 贴进来，关键字换行大写、字段一行一个",
    tags: ["sql", "格式化", "数据库", "query", "开发"],
    build() {
      const input = el("textarea", { rows: "6", placeholder: "select a,b from t where x=1 and y=2 order by a desc" });
      const out = el("textarea", { rows: "10", readonly: "", style: "font-size:12.5px" });
      const msg = el("p", { class: "hint" });
      const run = () => {
        out.value = input.value.trim() ? sqlFmt(input.value) : "";
        msg.textContent = out.value ? "已格式化" : "";
        msg.className = "hint ok";
      };
      input.addEventListener("input", debounce(run, 200));
      return el("div", {}, input, el("div", { class: "row" }, el("button", { class: "btn primary", type: "button", onclick: run }, "格式化")), out, el("div", { class: "row" }, copyBtn(() => out.value)), msg);
    },
  });

  /* ================= 55. Markdown 表格 ================= */
  const mdTable = (text, delim) => {
    const rows = String(text).trim().split(/\r?\n/).map((l) => (delim === "\t" ? l.split("\t") : l.split(delim)).map((c) => c.trim()));
    if (!rows.length) return "";
    const cols = Math.max(...rows.map((r) => r.length));
    const norm = rows.map((r) => { const c = r.slice(); while (c.length < cols) c.push(""); return c; });
    const line = (r) => "| " + r.map((c) => c.replace(/\|/g, "\\|")).join(" | ") + " |";
    const sep = "| " + Array(cols).fill("---").join(" | ") + " |";
    return [line(norm[0]), sep, ...norm.slice(1).map(line)].join("\n");
  };

  register({
    id: "mdtable", icon: "📋", name: "表格转 Markdown",
    desc: "从 Excel 或 CSV 粘过来，直接变成 Markdown 表格",
    tags: ["markdown", "table", "表格", "csv", "开发"],
    build() {
      const input = el("textarea", { rows: "6", placeholder: "从 Excel 复制一行行贴进来（Tab 分隔），或逗号分隔" });
      const delim = el("select", {}, el("option", { value: "\t" }, "Tab"), el("option", { value: "," }, "逗号"), el("option", { value: "|" }, "竖线"));
      const out = el("textarea", { rows: "8", readonly: "", style: "font-size:12.5px" });
      const msg = el("p", { class: "hint" });
      const run = () => {
        out.value = input.value.trim() ? mdTable(input.value, delim.value) : "";
        msg.textContent = out.value ? (out.value.split("\n").length - 2) + " 行数据" : "";
        msg.className = "hint ok";
      };
      input.addEventListener("input", debounce(run, 200));
      delim.addEventListener("change", run);
      return el("div", {}, input, el("div", { class: "row" }, delim), out, el("div", { class: "row" }, copyBtn(() => out.value)), msg);
    },
  });

  /* ================= 56. HTML / XML 美化 ================= */
  const prettyMarkup = (src) => {
    const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
    const tokens = String(src).replace(/>\s+</g, "><").match(/<[^>]+>|[^<]+/g) || [];
    let depth = 0, out = [];
    for (const tk of tokens) {
      const t = tk.trim();
      if (!t) continue;
      if (t.startsWith("</")) {
        depth = Math.max(0, depth - 1);
        out.push("  ".repeat(depth) + t);
      } else if (t.startsWith("<!") || t.startsWith("<?")) {
        out.push("  ".repeat(depth) + t);
      } else if (t.startsWith("<")) {
        out.push("  ".repeat(depth) + t);
        const name = (t.match(/^<([a-zA-Z0-9:-]+)/) || [])[1];
        if (name && !VOID.has(name.toLowerCase()) && !t.endsWith("/>")) depth++;
      } else {
        out.push("  ".repeat(depth) + t);
      }
    }
    return out.join("\n");
  };

  register({
    id: "htmlfmt", icon: "🧹", name: "HTML 美化",
    desc: "压缩成一行的 HTML / XML 排成有缩进的样子",
    tags: ["html", "xml", "格式化", "美化", "开发"],
    build() {
      const input = el("textarea", { rows: "6", placeholder: "<div><p>hi</p><ul><li>a</li></ul></div>" });
      const out = el("textarea", { rows: "10", readonly: "", style: "font-size:12.5px" });
      const msg = el("p", { class: "hint" });
      const run = () => {
        try {
          out.value = input.value.trim() ? prettyMarkup(input.value) : "";
          msg.textContent = out.value ? out.value.split("\n").length + " 行" : "";
          msg.className = "hint ok";
        } catch (e) { msg.textContent = "处理失败：" + e.message; msg.className = "hint err"; }
      };
      input.addEventListener("input", debounce(run, 250));
      return el("div", {}, input, el("div", { class: "row" }, el("button", { class: "btn primary", type: "button", onclick: run }, "美化")), out, el("div", { class: "row" }, copyBtn(() => out.value)), msg);
    },
  });

  /* ================= 57. curl 转代码 ================= */
  const tokenizeShell = (s) => {
    const out = [];
    let cur = "", q = null;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (q) {
        if (c === q) q = null;
        else if (c === "\\" && q === '"') { cur += s[++i] || ""; }
        else cur += c;
      } else if (c === '"' || c === "'") q = c;
      else if (/\s/.test(c)) { if (cur) { out.push(cur); cur = ""; } }
      else if (c === "\\") cur += s[++i] || "";
      else cur += c;
    }
    if (cur) out.push(cur);
    return out;
  };

  const curlParse = (cmd) => {
    const t = tokenizeShell(String(cmd).replace(/\\\r?\n/g, " ")).filter((x) => x !== "curl" && x !== "$");
    const req = { method: "", headers: {}, body: "", url: "" };
    for (let i = 0; i < t.length; i++) {
      const a = t[i];
      if (a === "-X" || a === "--request") req.method = (t[++i] || "").toUpperCase();
      else if (a === "-H" || a === "--header") {
        const h = t[++i] || "";
        const k = h.indexOf(":");
        if (k > 0) req.headers[h.slice(0, k).trim()] = h.slice(k + 1).trim();
      } else if (["-d", "--data", "--data-raw", "--data-binary", "-F", "--form"].includes(a)) req.body = (t[++i] || "");
      else if (a === "-u" || a === "--user") req.auth = t[++i] || "";
      else if (a === "-b" || a === "--cookie") req.headers["Cookie"] = t[++i] || "";
      else if (!a.startsWith("-")) req.url = a;
    }
    req.method = req.method || (req.body ? "POST" : "GET");
    return req;
  };

  const toFetch = (r) => {
    const lines = ["const res = await fetch(" + JSON.stringify(r.url) + ", {"];
    lines.push('  method: "' + r.method + '",');
    const hk = Object.keys(r.headers);
    if (hk.length) lines.push("  headers: " + JSON.stringify(r.headers) + ",");
    if (r.body) lines.push("  body: " + JSON.stringify(r.body) + ",");
    lines.push("});", "const data = await res.json();");
    return lines.join("\n");
  };
  const toAxios = (r) => {
    const o = ['  url: ' + JSON.stringify(r.url) + ",", '  method: "' + r.method.toLowerCase() + '",'];
    if (Object.keys(r.headers).length) o.push("  headers: " + JSON.stringify(r.headers) + ",");
    if (r.body) o.push("  data: " + JSON.stringify(r.body) + ",");
    return "import axios from \"axios\";\n\nconst res = await axios({\n" + o.join("\n") + "\n});\nconst data = res.data;";
  };
  const toPy = (r) => {
    const hk = Object.keys(r.headers);
    const o = ["import requests", "", "resp = requests." + r.method.toLowerCase() + "(", "    " + JSON.stringify(r.url) + ","];
    if (hk.length) o.push("    headers=" + JSON.stringify(r.headers) + ",");
    if (r.body) o.push("    data=" + JSON.stringify(r.body) + ",");
    o.push(")", "print(resp.status_code, resp.text)");
    return o.join("\n");
  };

  register({
    id: "curl", icon: "🖥", name: "curl 转代码",
    desc: "从浏览器复制来的 curl，转成 fetch / axios / Python",
    tags: ["curl", "http", "fetch", "axios", "python", "开发"],
    build() {
      const input = el("textarea", { rows: "6", placeholder: "curl 'https://api.example.com/x' -X POST -H 'content-type: application/json' -d '{\"a\":1}'" });
      const sel = el("select", {}, el("option", { value: "fetch" }, "fetch"), el("option", { value: "axios" }, "axios"), el("option", { value: "python" }, "requests (Python)"));
      const out = el("textarea", { rows: "10", readonly: "", style: "font-size:12.5px" });
      const msg = el("p", { class: "hint" });
      const run = () => {
        const c = input.value.trim();
        if (!c) { out.value = ""; msg.textContent = ""; return; }
        try {
          const r = curlParse(c);
          if (!r.url) throw new Error("没找到 URL");
          out.value = sel.value === "fetch" ? toFetch(r) : sel.value === "axios" ? toAxios(r) : toPy(r);
          msg.textContent = r.method + " " + r.url + " · " + Object.keys(r.headers).length + " 个请求头";
          msg.className = "hint ok";
        } catch (e) { out.value = ""; msg.textContent = "解析失败：" + e.message; msg.className = "hint err"; }
      };
      input.addEventListener("input", debounce(run, 300));
      sel.addEventListener("change", run);
      return el("div", {}, input, el("div", { class: "row" }, sel), out, el("div", { class: "row" }, copyBtn(() => out.value)), msg);
    },
  });

  render();
  window.__PT6 = { jsonToTs, cronNext, chmodOf, cidrInfo, sqlFmt, mdTable, prettyMarkup, curlParse, toFetch, toPy };
})();
