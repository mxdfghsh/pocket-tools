/* 减少动效开关：一键关掉全站动画（存 localStorage） */
(function () {
  var KEY = "pocket-calm";
  var root = document.documentElement;

  function apply(on) {
    root.classList.toggle("calm", on);
    var b = document.querySelector(".calm-btn");
    if (b) {
      b.textContent = on ? "🐢" : "🐇";
      b.title = on ? "动效已关闭（点一下恢复）" : "动效已开启（点一下关掉）";
      b.setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  var links = document.querySelector(".nav-links");
  if (links && !links.querySelector(".calm-btn")) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "calm-btn";
    btn.setAttribute("aria-label", "切换动效");
    btn.addEventListener("click", function () {
      var next = !root.classList.contains("calm");
      try { localStorage.setItem(KEY, next ? "1" : "0"); } catch (e) {}
      apply(next);
    });
    links.appendChild(btn);
    apply(root.classList.contains("calm"));
  }
})();
