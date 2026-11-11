# 交接说明（给前端设计 / 外部智能体）

站点名：**月临汐岸**（英文 SULEN）。作者：沫小汐。

> 更新时间：2026-11-11，对应仓库 `main` 分支（缓存版本 `pocket-v75`）。

## 这是什么

一个纯静态个人小站（中文），托管在 GitHub Pages：

- 仓库：https://github.com/mxdfghsh/pocket-tools
- 线上：https://mxdfghsh.github.io/pocket-tools/
- **没有构建步骤**：直接改 HTML/CSS/JS，push 即生效（Pages 自动构建，1–6 分钟）

访问以**手机**为主（360–430px），桌面也做了独立排版（`pc.css`，≥1024px）。

## 现在的规模

| 部分 | 内容 |
|---|---|
| 工具箱 `tools.html` | **59** 个纯前端工具，可置顶、有 `#tool-<id>` 锚点、「最近用过」 |
| 游戏中心 `hub.html` / `web.html` | **10 款本站托管** + 20 个外链 + 中国象棋 |
| 在线资源 `nav.html` | **201 个入口**、17 个游戏分类 + AI 组；默认分批显示 24 个 |
| 模型检测 `relay.html` | 会联网，`noindex`，页面顶部有隐私说明 |
| 关于 `about.html` | 含「说明与免责」 |

## 硬性约束

1. **不引入构建工具**（Vite/Webpack/React/TS 都不行），改完必须能直接跑。
2. **不引用外部 CDN、外链字体、统计脚本**。全站零外链请求（工具里的外链跳转除外）。
3. **优先系统字体**，不加载 webfont。
4. **移动端优先**，桌面不能崩。
5. **第三方游戏必须有明确许可证**才能放进 `web/`；没有 LICENSE 的一律不收录（已经清过一轮）。
6. 改完静态资源后必须：`sw.js` 的 `CACHE` +1，页面里 `?v=N` 的资源版本 +1。

## 可以改 / 不要改

**可以改**：`index.html`、`hub.html`、`web.html`、`nav.html`、`about.html` 的结构与文案，
`home.css`、`style.css`、`directory.css`、`skins.css`、`splash.css`、`pc.css`。

**不要改**：`web/`（游戏本体）、`app.js`/`extra*.js`（工具逻辑）、`qrcode.js`、`fit.js`、`pad.js`、
`chess.js`、`pet*.js`、`sw.js` 的缓存逻辑、`manifest.json`。

## 样式体系

- **设计令牌**：`home.css` 的 `:root`（颜色、间距、圆角、字体栈）；皮肤在 `skins.css` 里覆盖变量。
- **组件**：`.card`（工具卡）、`.wg`（游戏/资源卡）、`.lk`（可点击）、`.nf-*`（在线资源的筛选栏）、
  `.blk` / `.grp` / `.grid`（分区容器）、`.chip`（分类胶囊）。
- **皮肤**：`html[data-skin="retro|tech|moon"]`，四套：默认 / 怀旧 / 科技 / 月汐。
- **动效**：`motion.css`；`html.calm` 会关掉全部动画（导航栏 🐢 切换）。
- **断点**：手机优先；`@media (min-width:560px)` 两列，`≥1024px` 走 `pc.css` 桌面排版。

## 协作方式

仓库是公开的，**读文件不用权限**：

```
https://raw.githubusercontent.com/mxdfghsh/pocket-tools/main/README.md
https://raw.githubusercontent.com/mxdfghsh/pocket-tools/main/hub.html
```

**写**：输出 **unified diff**（不是整份文件），路径相对仓库根目录，一次最多 3 个文件 / 300 行，
新建文件用 `--- /dev/null`。站长本地应用后会跑检查再上线。

## 当前待办

- 桌宠（`pet/`）只在首页终端 `pet` 里能开，没有界面开关
- `README` / `HANDOFF` 刚同步过，之后改动记得跟着更新
- AI 转正则一类的联网工具还没做（要做需单独页面并明确标注「会联网」）
