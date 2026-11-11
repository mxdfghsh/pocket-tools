/* 口袋小站 · 终端彩蛋
   右下角一个小图标，点开是个命令行：help / ls / open <工具> / b64 <文本> / ts / theme
   纯本地，没有任何请求。 */
(function () {
  if (document.getElementById("termBtn")) return;

  var TOOLS = [
    ["base64", "Base64 编解码"], ["url", "URL 编解码"], ["time", "时间戳转换"], ["json", "JSON 格式化"],
    ["hash", "哈希计算"], ["pwd", "密码生成器"], ["uuid", "UUID 生成"], ["text", "文本统计"],
    ["color", "颜色转换"], ["regex", "正则测试"], ["jwt", "JWT 解析"], ["case", "大小写转换"],
    ["query", "URL 参数解析"], ["radix", "进制转换"], ["md", "Markdown 预览"], ["img", "图片转 Base64"],
    ["draw", "随机抽签"], ["unit", "单位换算"], ["date", "日期计算"], ["dedup", "文本去重"],
    ["money", "人民币大写"], ["diff", "文本对比"], ["timer", "倒计时"], ["csv", "CSV 转 JSON"],
    ["morse", "摩斯电码"], ["tz", "时区转换"], ["tax", "个税计算"], ["loan", "房贷计算"],
    ["health", "健康计算"], ["tts", "文字朗读"], ["gradient", "渐变生成"], ["crypto", "文本加解密"],
    ["filehash", "文件哈希"], ["qrcode", "二维码生成"], ["strength", "密码强度"], ["stopwatch", "秒表"],
    ["random", "随机数"], ["text2img", "文字转图片"], ["watermark", "图片加水印"], ["eyedropper", "图片取色"],
    ["charinfo", "字符编码"], ["countdown", "倒数日"], ["discount", "折扣计算"], ["compound", "存钱复利"],
    ["clean", "文本清洗"], ["html", "HTML 转义"], ["http", "状态码速查"], ["contrast", "颜色对比度"],
    ["json2ts", "JSON 转 TS"], ["cron", "Cron 解析"], ["chmod", "文件权限"], ["cidr", "子网计算"],
    ["sqlfmt", "SQL 格式化"], ["mdtable", "表格转 Markdown"], ["htmlfmt", "HTML 美化"], ["curl", "curl 转代码"],
    ["codeimg", "代码快照"], ["mdmap", "Markdown 脑图"]
  ];

  var btn = document.createElement("button");
  btn.id = "termBtn";
  btn.type = "button";
  btn.setAttribute("aria-label", "打开终端");
  btn.textContent = ">_";
  document.body.appendChild(btn);

  var box = document.createElement("div");
  box.id = "termBox";
  box.hidden = true;
  box.innerHTML =
    '<div class="term-bar"><span>口袋终端</span><button type="button" class="term-x" aria-label="关闭">✕</button></div>' +
    '<div class="term-out" id="termOut"></div>' +
    '<form class="term-form"><span>&gt;</span><input id="termIn" type="text" autocomplete="off" spellcheck="false" placeholder="输入 help 看看能干什么"></form>';
  document.body.appendChild(box);

  var out = box.querySelector("#termOut");
  var input = box.querySelector("#termIn");
  var history = [], hpos = -1;

  function echo(text, cls) {
    var line = document.createElement("div");
    line.className = "term-line" + (cls ? " " + cls : "");
    line.textContent = text;
    out.appendChild(line);
    out.scrollTop = out.scrollHeight;
  }

  function help() {
    echo("可用命令：", "dim");
    echo("  help              这份说明");
    echo("  ls [关键词]       列出全部工具");
    echo("  open <工具>       打开某个工具（名字或 id 都行）");
    echo("  b64 <文本>        Base64 编码");
    echo("  ts                当前时间戳");
    echo("  theme dark|light  切换主题");
    echo("  pet [on|off]      召唤 / 关掉桌宠");
    echo("  clear             清屏");
  }

  function run(cmd) {
    var raw = cmd.trim();
    if (!raw) return;
    echo("> " + raw);
    var m = raw.match(/^(\S+)\s*([\s\S]*)$/);
    var name = m[1].toLowerCase(), arg = (m[2] || "").trim();

    if (name === "help" || name === "?") return help();
    if (name === "clear" || name === "cls") { out.innerHTML = ""; return; }
    if (name === "ls" || name === "list") {
      var hit = TOOLS.filter(function (t) { return !arg || t[1].indexOf(arg) >= 0 || t[0].indexOf(arg.toLowerCase()) >= 0; });
      if (!hit.length) return echo("没找到：" + arg, "dim");
      hit.forEach(function (t) { echo("  " + t[0].padEnd(12, " ") + t[1]); });
      return echo("共 " + hit.length + " 个", "dim");
    }
    if (name === "open") {
      if (!arg) return echo("用法：open 时间戳", "dim");
      var found = TOOLS.filter(function (t) { return t[0] === arg.toLowerCase() || t[1].indexOf(arg) >= 0; })[0];
      if (!found) return echo("没有这个工具：" + arg, "dim");
      echo("打开 " + found[1] + " …", "ok");
      setTimeout(function () { location.href = "tools.html#tool-" + found[0]; }, 320);
      return;
    }
    if (name === "b64") {
      if (!arg) return echo("用法：b64 你好", "dim");
      try { return echo(encodeURIComponent(arg).replace(/%([0-9A-F]{2})/g, function (_, p) { return String.fromCharCode(parseInt(p, 16)); }) === arg ? btoa(arg) : btoa(String.fromCharCode.apply(null, new TextEncoder().encode(arg))), "ok"); }
      catch (e) { return echo("编码失败：" + e.message, "dim"); }
    }
    if (name === "ts" || name === "time") {
      var d = new Date();
      echo("毫秒：" + d.getTime(), "ok");
      return echo("本地：" + d.toLocaleString("zh-CN"));
    }
    if (name === "theme") {
      if (arg !== "dark" && arg !== "light") return echo("用法：theme dark / theme light", "dim");
      document.documentElement.dataset.theme = arg;
      try { localStorage.setItem("theme", arg); } catch (e) {}
      return echo("已切到 " + arg, "ok");
    }
    if (name === "pet") {
      var pet = window.PocketPet;
      if (!pet) { echo("桌宠脚本没加载，先刷新一下", "dim"); return; }
      var want = arg === "off" ? false : arg === "on" ? true : !pet.isOn();
      if (want) { pet.enable(); echo("桌宠出来了 🦊", "ok"); }
      else { pet.disable(); echo("桌宠收起来了", "ok"); }
      return;
    }
    echo("未知命令：" + name + "，输入 help 看看", "dim");
  }

  function openBox() {
    box.hidden = false;
    btn.hidden = true;
    setTimeout(function () { input.focus(); }, 30);
    if (!out.children.length) {
      echo("口袋终端 v1 · 输入 help", "dim");
      echo("（这是个彩蛋，不会发任何请求）", "dim");
    }
  }
  function closeBox() { box.hidden = true; btn.hidden = false; }

  btn.addEventListener("click", openBox);
  box.querySelector(".term-x").addEventListener("click", closeBox);
  box.querySelector(".term-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var v = input.value;
    input.value = "";
    history.unshift(v); hpos = -1;
    run(v);
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeBox(); return; }
    if (e.key === "ArrowUp" && history.length) {
      hpos = Math.min(hpos + 1, history.length - 1);
      input.value = history[hpos];
      e.preventDefault();
    }
    if (e.key === "ArrowDown") {
      hpos = Math.max(hpos - 1, -1);
      input.value = hpos < 0 ? "" : history[hpos];
      e.preventDefault();
    }
  });
})();
