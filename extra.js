/* 口袋工具箱 · 追加工具包 */
(() => {
  "use strict";
  const PT = window.PocketTools;
  if (!PT) return;
  const { register, render, toast, el, copyBtn, debounce, enc } = PT;

  const escHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const MARK = 'style="background:rgba(110,231,255,.35);color:#eaffff;border-radius:3px;padding:0 2px"';

  /* ---------- 10. 正则测试 ---------- */
  register({
    id: "regex", icon: "🔍", name: "正则测试",
    desc: "实时高亮命中片段，支持常用 flags",
    tags: ["regex", "正则", "匹配", "test", "pattern"],
    build() {
      const pattern = el("input", { type: "text", placeholder: "例如 \\d{3}-\\d{4}  或  [a-z]+@[a-z.]+" });
      const flags = el("input", { type: "text", value: "g", placeholder: "g" });
      flags.style.width = "70px";
      const text = el("textarea", { placeholder: "粘贴要测试的文本…", rows: "4" });
      const out = el("div", {
        style: "white-space:pre-wrap;word-break:break-word;font:13px/1.7 var(--mono);background:rgba(0,0,0,.28);border:1px solid var(--line);border-radius:11px;padding:10px 12px;max-height:220px;overflow:auto;min-height:60px",
      });
      const msg = el("p", { class: "hint" });

      const run = () => {
        const p = pattern.value;
        const f = flags.value.trim();
        if (!p) { out.innerHTML = ""; msg.textContent = ""; return; }
        let re;
        try { re = new RegExp(p, f.indexOf("g") >= 0 ? f : f + "g"); }
        catch (e) { out.innerHTML = ""; msg.textContent = "正则语法错误：" + e.message; msg.className = "hint err"; return; }
        const t = text.value;
        let html = "", last = 0, count = 0;
        for (const m of t.matchAll(re)) {
          if (m.index === undefined) break;
          count++;
          html += escHtml(t.slice(last, m.index)) + "<mark " + MARK + ">" + escHtml(m[0]) + "</mark>";
          last = m.index + m[0].length;
          if (m[0].length === 0) { last++; if (last > t.length) break; }
        }
        html += escHtml(t.slice(last));
        out.innerHTML = html || "<span style='color:#5a6478'>（文本为空）</span>";
        msg.textContent = count ? "命中 " + count + " 处" : "没有匹配";
        msg.className = count ? "hint ok" : "hint";
      };
      pattern.addEventListener("input", debounce(run, 150));
      flags.addEventListener("input", debounce(run, 150));
      text.addEventListener("input", debounce(run, 150));

      return el("div", {},
        el("div", { class: "row" }, pattern, flags),
        text, out, msg
      );
    },
  });

  /* ---------- 11. JWT 解析 ---------- */
  register({
    id: "jwt", icon: "🎫", name: "JWT 解析",
    desc: "本地解码 header / payload，不校验签名",
    tags: ["jwt", "token", "解码", "json", "auth"],
    build() {
      const input = el("textarea", { placeholder: "粘贴 JWT（eyJhbGciOi...）", rows: "3" });
      const head = el("output", { class: "block", style: "min-height:auto" });
      const body = el("output", { class: "block", style: "min-height:auto" });
      const msg = el("p", { class: "hint" });

      const b64url = (s) => {
        let t = s.replace(/-/g, "+").replace(/_/g, "/");
        while (t.length % 4) t += "=";
        const bin = atob(t);
        return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
      };

      const run = () => {
        const raw = input.value.trim();
        if (!raw) { head.textContent = ""; body.textContent = ""; msg.textContent = ""; return; }
        const parts = raw.split(".");
        if (parts.length < 2) { head.textContent = ""; body.textContent = ""; msg.textContent = "不是 JWT（至少要有两段）"; msg.className = "hint err"; return; }
        try {
          const h = JSON.parse(b64url(parts[0]));
          const p = JSON.parse(b64url(parts[1]));
          head.textContent = JSON.stringify(h, null, 2);
          body.textContent = JSON.stringify(p, null, 2);
          let extra = "";
          if (p.exp) {
            const d = new Date(p.exp * 1000);
            const expired = Date.now() > p.exp * 1000;
            extra = " · " + (expired ? "已过期" : "有效期至 " + d.toLocaleString());
            msg.className = expired ? "hint err" : "hint ok";
          } else msg.className = "hint";
          msg.textContent = "header + payload 解析完成（签名不校验）" + extra;
        } catch (e) {
          head.textContent = ""; body.textContent = "";
          msg.textContent = "解析失败：" + e.message; msg.className = "hint err";
        }
      };
      input.addEventListener("input", debounce(run, 200));

      return el("div", {},
        input,
        el("div", { class: "row" },
          el("button", { class: "btn primary", type: "button", onclick: run }, "解析"),
          copyBtn(() => body.textContent, "复制 payload")
        ),
        el("div", { class: "field-label", style: "margin-top:10px" }, "HEADER"), head,
        el("div", { class: "field-label", style: "margin-top:10px" }, "PAYLOAD"), body,
        msg
      );
    },
  });

  /* ---------- 12. 大小写转换 ---------- */
  register({
    id: "case", icon: "🔤", name: "大小写转换",
    desc: "大写 / 小写 / 首字母 / 驼峰 / 蛇形 / 短横线",
    tags: ["case", "大写", "小写", "驼峰", "snake", "camel"],
    build() {
      const input = el("textarea", { placeholder: "输入文字，例如 hello world", rows: "3" });
      const output = el("textarea", { rows: "3", readonly: "" });
      const msg = el("p", { class: "hint" });

      const words = (s) => s
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_\-\s]+/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

      const ops = {
        "全大写": (s) => s.toUpperCase(),
        "全小写": (s) => s.toLowerCase(),
        "首字母大写": (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
        "camelCase": (s) => { const w = words(s); return w.map((x, i) => i ? x[0].toUpperCase() + x.slice(1).toLowerCase() : x.toLowerCase()).join(""); },
        "PascalCase": (s) => words(s).map((x) => x[0].toUpperCase() + x.slice(1).toLowerCase()).join(""),
        "snake_case": (s) => words(s).map((x) => x.toLowerCase()).join("_"),
        "kebab-case": (s) => words(s).map((x) => x.toLowerCase()).join("-"),
      };

      const apply = (name) => {
        output.value = ops[name](input.value);
        msg.textContent = "已转换为 " + name;
        msg.className = "hint ok";
      };

      return el("div", {},
        input,
        el("div", { class: "row" }, Object.keys(ops).map((k) => el("button", { class: "btn mini", type: "button", onclick: () => apply(k) }, k))),
        output,
        el("div", { class: "row" }, copyBtn(() => output.value)),
        msg
      );
    },
  });

  /* ---------- 13. URL 参数解析 ---------- */
  register({
    id: "query", icon: "🧾", name: "URL 参数解析",
    desc: "把 ?a=1&b=2 拆成表格，含 URL 解码",
    tags: ["url", "query", "参数", "parse", "query-string"],
    build() {
      const input = el("textarea", { placeholder: "粘贴完整网址，或只要 a=1&b=2 部分", rows: "3" });
      const table = el("div", { class: "kv", style: "margin-top:10px" });
      const msg = el("p", { class: "hint" });

      const run = () => {
        table.innerHTML = "";
        const raw = input.value.trim();
        if (!raw) { msg.textContent = ""; return; }
        let qs = raw;
        const qi = raw.indexOf("?");
        if (qi >= 0) qs = raw.slice(qi + 1).split("#")[0];
        if (!qs) { msg.textContent = "没有参数部分"; msg.className = "hint err"; return; }
        const rows = [];
        for (const seg of qs.split("&")) {
          if (!seg) continue;
          const eq = seg.indexOf("=");
          const k = eq < 0 ? seg : seg.slice(0, eq);
          const v = eq < 0 ? "" : seg.slice(eq + 1);
          try { rows.push([decodeURIComponent(k.replace(/\+/g, " ")), decodeURIComponent(v.replace(/\+/g, " "))]); }
          catch (e) { rows.push([k, v]); }
        }
        rows.forEach(([k, v]) => {
          table.appendChild(el("dt", {}, k));
          table.appendChild(el("dd", {}, v));
        });
        msg.textContent = rows.length + " 个参数";
        msg.className = "hint ok";
      };
      input.addEventListener("input", debounce(run, 250));

      return el("div", {}, input, el("div", { class: "row" }, el("button", { class: "btn primary", type: "button", onclick: run }, "解析")), table, msg);
    },
  });

  /* ---------- 14. 进制转换 ---------- */
  register({
    id: "radix", icon: "🔢", name: "进制转换",
    desc: "二 / 八 / 十 / 十六进制互转，支持超大整数",
    tags: ["radix", "进制", "hex", "binary", "bin"],
    build() {
      const input = el("input", { type: "text", placeholder: "例如 255 或 0xFF 或 11111111" });
      const from = el("select", {}, [
        ["10", "十进制"], ["16", "十六进制"], ["2", "二进制"], ["8", "八进制"],
      ].map(([v, t]) => el("option", { value: v }, t)));
      from.value = "10";
      from.style.width = "auto";
      const out = el("div", { class: "kv" });
      const msg = el("p", { class: "hint" });

      const run = () => {
        out.innerHTML = "";
        let raw = input.value.trim().replace(/^0[xX]/, "");
        if (!raw) { msg.textContent = ""; return; }
        const base = Number(from.value);
        let n;
        try { n = BigInt(parseInt(raw, base)); }
        catch (e) { msg.textContent = "无法解析这个数"; msg.className = "hint err"; return; }
        if (isNaN(Number(n))) { msg.textContent = "无法解析这个数"; msg.className = "hint err"; return; }
        const pairs = [["十进制", n.toString(10)], ["十六进制", "0x" + n.toString(16).toUpperCase()], ["八进制", "0o" + n.toString(8)], ["二进制", n.toString(2)]];
        pairs.forEach(([k, v]) => { out.appendChild(el("dt", {}, k)); out.appendChild(el("dd", {}, v)); });
        msg.textContent = "已转换"; msg.className = "hint ok";
      };
      input.addEventListener("input", debounce(run, 200));
      from.addEventListener("change", run);

      return el("div", {}, el("div", { class: "row" }, input, from), out, msg);
    },
  });

  /* ---------- 15. Markdown 预览 ---------- */
  register({
    id: "md", icon: "📄", name: "Markdown 预览",
    desc: "左边写、右边实时渲染（轻量解析器）",
    tags: ["markdown", "md", "预览", "写作"],
    build() {
      const input = el("textarea", { rows: "8", placeholder: "# 标题\n\n支持 **粗体**、*斜体*、`代码`、列表、引用、链接…" });
      const preview = el("div", { class: "md-body", style: "border:1px solid var(--line);border-radius:11px;padding:12px 14px;background:rgba(0,0,0,.22);min-height:120px;max-height:340px;overflow:auto" });

      const esc = escHtml;
      const inline = (s) => {
        let r = esc(s);
        const codes = [];
        r = r.replace(/`([^`]+)`/g, (m, a) => { codes.push(a); return "\u0000" + (codes.length - 1) + "\u0000"; });
        r = r.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        r = r.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
        r = r.replace(/~~([^~]+)~~/g, "<del>$1</del>");
        r = r.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        r = r.replace(/\u0000(\d+)\u0000/g, (m, i) => "<code>" + codes[Number(i)] + "</code>");
        return r;
      };

      const md = (src) => {
        const lines = src.replace(/\r\n/g, "\n").split("\n");
        let html = "", inCode = false, buf = [], listType = null;
        const closeList = () => { if (listType) { html += "</" + listType + ">\n"; listType = null; } };
        for (const line of lines) {
          if (/^```/.test(line)) {
            if (inCode) { html += "<pre><code>" + esc(buf.join("\n")) + "</code></pre>\n"; buf = []; inCode = false; }
            else { closeList(); inCode = true; }
            continue;
          }
          if (inCode) { buf.push(line); continue; }
          if (/^\s*$/.test(line)) { closeList(); continue; }
          let m;
          if ((m = line.match(/^(#{1,6})\s+(.*)$/))) { closeList(); const n = m[1].length; html += "<h" + n + ">" + inline(m[2]) + "</h" + n + ">\n"; continue; }
          if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) { closeList(); html += "<hr>\n"; continue; }
          if ((m = line.match(/^>\s?(.*)$/))) { closeList(); html += "<blockquote>" + inline(m[1]) + "</blockquote>\n"; continue; }
          if ((m = line.match(/^\s*[-*+]\s+(.*)$/))) { if (listType !== "ul") { closeList(); html += "<ul>\n"; listType = "ul"; } html += "<li>" + inline(m[1]) + "</li>\n"; continue; }
          if ((m = line.match(/^\s*\d+\.\s+(.*)$/))) { if (listType !== "ol") { closeList(); html += "<ol>\n"; listType = "ol"; } html += "<li>" + inline(m[1]) + "</li>\n"; continue; }
          closeList(); html += "<p>" + inline(line) + "</p>\n";
        }
        if (inCode) html += "<pre><code>" + esc(buf.join("\n")) + "</code></pre>\n";
        closeList();
        return html;
      };

      const run = () => { preview.innerHTML = md(input.value) || "<p style='color:#5a6478'>预览区</p>"; };
      input.addEventListener("input", debounce(run, 120));

      return el("div", {}, input,
        el("div", { class: "row" }, el("button", { class: "btn", type: "button", onclick: run }, "刷新预览"), copyBtn(() => preview.innerHTML, "复制 HTML")),
        preview);
    },
  });

  /* ---------- 16. 图片转 Base64 ---------- */
  register({
    id: "img", icon: "🖼️", name: "图片转 Base64",
    desc: "本地压缩后转 Base64，可调尺寸与质量",
    tags: ["image", "base64", "图片", "压缩", "dataurl"],
    build() {
      const file = el("input", { type: "file", accept: "image/*", style: "font-size:12.5px" });
      const maxW = el("input", { type: "number", value: "800", min: "32", max: "4000" });
      maxW.style.width = "90px";
      const quality = el("input", { type: "range", min: "40", max: "100", value: "80", style: "width:110px" });
      const out = el("textarea", { rows: "3", readonly: "", placeholder: "转换后这里是 data URL…" });
      const img = el("img", { style: "max-width:100%;border-radius:10px;margin-top:10px;display:none" });
      const msg = el("p", { class: "hint" });

      file.addEventListener("change", async () => {
        const f = file.files && file.files[0];
        if (!f) return;
        try {
          const dataUrl = await new Promise((res, rej) => {
            const fr = new FileReader();
            fr.onload = () => res(fr.result);
            fr.onerror = rej;
            fr.readAsDataURL(f);
          });
          const im = new Image();
          im.src = dataUrl;
          await im.decode();
          const w0 = im.naturalWidth || im.width;
          const h0 = im.naturalHeight || im.height;
          const w = Math.min(Number(maxW.value) || 800, w0);
          const h = Math.round(h0 * (w / w0));
          const cv = document.createElement("canvas");
          cv.width = w; cv.height = h;
          cv.getContext("2d").drawImage(im, 0, 0, w, h);
          const isPng = (f.type || "").indexOf("png") >= 0;
          const res = isPng ? cv.toDataURL("image/png") : cv.toDataURL("image/jpeg", Number(quality.value) / 100);
          out.value = res;
          img.src = res;
          img.style.display = "block";
          const kb = (n) => (n / 1024).toFixed(1) + "KB";
          msg.textContent = f.name + " · 原始 " + kb(f.size) + " → 输出 " + kb(res.length * 0.75) + " · " + w + "×" + h;
          msg.className = "hint ok";
        } catch (e) {
          msg.textContent = "处理失败：" + e.message;
          msg.className = "hint err";
        }
      });

      return el("div", {},
        file,
        el("div", { class: "row", style: "margin-top:10px" },
          el("span", { class: "field-label", style: "margin:0" }, "最大宽度"), maxW,
          el("span", { class: "field-label", style: "margin:0 0 0 8px" }, "质量"), quality
        ),
        out,
        el("div", { class: "row" }, copyBtn(() => out.value)),
        img, msg
      );
    },
  });

  /* ---------- 17. 随机抽签 ---------- */
  register({
    id: "draw", icon: "🎲", name: "随机抽签",
    desc: "每行一个选项，随机抽一个，可选不重复",
    tags: ["随机", "抽签", "random", "picker"],
    build() {
      const items = el("textarea", { rows: "5", placeholder: "每行一个选项，例如：\n火锅\n烧烤\n日料" });
      const out = el("output", { class: "mono-big", style: "text-align:center;font-size:22px" }, "——");
      const noRepeat = el("input", { type: "checkbox" });
      const msg = el("p", { class: "hint" });
      let pool = [];

      const list = () => items.value.split("\n").map((s) => s.trim()).filter(Boolean);

      const draw = () => {
        const all = list();
        if (!all.length) { out.textContent = "先填选项"; msg.textContent = ""; return; }
        if (!noRepeat.checked) pool = all.slice();
        else if (!pool.length) pool = all.slice();
        if (!pool.length) pool = all.slice();
        const a = new Uint32Array(1);
        crypto.getRandomValues(a);
        const i = a[0] % pool.length;
        out.textContent = pool[i];
        msg.textContent = "剩下 " + (pool.length - 1) + " 个候选";
        msg.className = "hint ok";
        pool.splice(i, 1);
      };

      const reset = () => { pool = list(); out.textContent = "——"; msg.textContent = "已重置（" + pool.length + " 个候选）"; msg.className = "hint"; };

      return el("div", {},
        items,
        el("div", { class: "row" },
          el("button", { class: "btn primary", type: "button", onclick: draw }, "抽一个"),
          el("button", { class: "btn", type: "button", onclick: reset }, "重置"),
          el("label", { class: "chk" }, noRepeat, "不重复抽取")
        ),
        out, msg
      );
    },
  });

  render();
})();
