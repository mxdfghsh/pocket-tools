/* 桌宠：按需加载 + 导航栏开关
   - 只在开启时才注入 pet.css / pet.js（默认关闭）
   - 开关状态存 localStorage: pocket-pet = "1" */
(function () {
  var KEY = "pocket-pet";
  var on = false;
  try { on = localStorage.getItem(KEY) === "1"; } catch (e) {}

  // 1) 开关按钮
  function mountBtn() {
    var links = document.querySelector(".nav-links");
    if (!links || links.querySelector(".pet-btn")) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "pet-btn";
    b.textContent = "🦊";
    b.title = on ? "桌宠已开（点一下关掉）" : "召唤桌宠（点一下开启）";
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.setAttribute("aria-label", b.title);
    b.addEventListener("click", function () {
      var next = !(localStorage.getItem(KEY) === "1");
      try { localStorage.setItem(KEY, next ? "1" : "0"); } catch (e) {}
      location.reload();
    });
    links.appendChild(b);
  }

  // 2) 开启时才加载桌宠本体
  function loadPet() {
    var css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "pet.css?v=3";
    document.head.appendChild(css);
    var js = document.createElement("script");
    js.src = "pet.js?v=4";
    document.body.appendChild(js);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { mountBtn(); if (on) loadPet(); });
  else { mountBtn(); if (on) loadPet(); }
})();
