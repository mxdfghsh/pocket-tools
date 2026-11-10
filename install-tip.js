/* 口袋小站 · 「加到桌面」轻提示
   只在手机、第一次访问时出现一次，关掉就不再烦。 */
(function () {
  if (!matchMedia("(hover: none)").matches) return;
  var KEY = "pocket-install-tip";
  try { if (localStorage.getItem(KEY)) return; } catch (e) { return; }
  if (navigator.standalone || matchMedia("(display-mode: standalone)").matches) return;

  var deferred = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
  });

  var box = document.createElement("div");
  box.className = "install-tip";
  box.innerHTML =
    '<span class="it-ico">📌</span>' +
    '<div class="it-txt"><b>把口袋小站放到桌面</b><span>下次点一下就开，断网也能用</span></div>' +
    '<button class="it-go" type="button">添加</button>' +
    '<button class="it-x" type="button" aria-label="关掉">✕</button>';
  document.body.appendChild(box);

  var close = function (permanent) {
    box.classList.remove("on");
    if (permanent) { try { localStorage.setItem(KEY, "1"); } catch (e) {} }
    setTimeout(function () { box.remove(); }, 260);
  };

  box.querySelector(".it-x").addEventListener("click", function () { close(true); });
  box.querySelector(".it-go").addEventListener("click", function () {
    if (deferred) {
      deferred.prompt();
      deferred = null;
      close(true);
      return;
    }
    // 没有 beforeinstallprompt（iOS / 部分浏览器）：给出手动步骤
    var txt = box.querySelector(".it-txt");
    txt.innerHTML = '<b>手动加一下</b><span>浏览器菜单 → 添加到主屏幕</span>';
    setTimeout(function () { close(true); }, 5200);
  });

  requestAnimationFrame(function () { box.classList.add("on"); });
})();
