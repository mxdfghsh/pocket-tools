/* 桌宠按需加载：只有手动开启（终端里输入 pet）才会注入样式和脚本 */
(function () {
  var on = false;
  try { on = localStorage.getItem("pocket-pet") === "1"; } catch (e) {}
  if (!on) return;
  var css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "pet.css?v=2";
  document.head.appendChild(css);
  var js = document.createElement("script");
  js.src = "pet.js?v=2";
  document.body.appendChild(js);
})();
