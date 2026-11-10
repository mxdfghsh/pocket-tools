/* 注册 Service Worker（离线 + 可安装） */
(() => {
  /* 防御：如果浏览器拿到的是旧版本的落地页，而 landing.js 已经不在，
     页面会一直卡在「进入工具箱」那一屏。这里直接把那一屏拆掉。 */
  function guard() {
    var l = document.querySelector("#landing");
    if (l) { l.remove(); document.body.classList.add("entered"); }
    else document.body.classList.add("entered");
    var g = document.querySelector("#grid");
    if (g && !g.children.length) {
      setTimeout(function () {
        if (!g.children.length && window.PocketTools && window.PocketTools.render) window.PocketTools.render();
      }, 800);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", guard);
  else guard();

  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
})();
