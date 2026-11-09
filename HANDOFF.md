# 交给前端设计智能体的交接说明

## 这是什么

一个纯静态个人小站，托管在 GitHub Pages：

- 仓库：https://github.com/mxdfghsh/pocket-tools
- 线上：https://mxdfghsh.github.io/pocket-tools/
- **没有构建步骤**：直接改 HTML/CSS/JS，push 即生效（GitHub Pages 自动构建，约 1 分钟）

## 硬性约束（很重要）

1. **不要引入构建工具**（不装 Webpack/Vite/React/TypeScript 编译）。改了就要能直接跑。
2. **不要依赖外部 CDN**。所有资源本地化（之前被墙的 CDN 坑过）。
3. **优先用系统字体**，不加载 webfont。
4. **移动端优先**：大部分访问来自手机 Chrome/Edge。
5. **保留 PWA**：`manifest.json`、`sw.js`、`icon-*.png` 不要删；改动后把 `sw.js` 里的 `CACHE` 版本号 +1。
6. **保留现有功能入口**：工具箱、游戏中心、API 检测、皮肤切换。

## 页面结构

```
index.html        主页（项目卡片 + AI 外链 + 中转站入口）
tools.html        工具箱（17 个工具 + API Key 检测入口，含全屏入口页 landing）
  ├ app.js        前 9 个工具 + 工具注册器
  ├ extra.js      后 8 个工具
  └ landing.js    工具箱入口页逻辑
hub.html          游戏中心（分类导航）
web.html          网页经典游戏（11 款，内嵌 web/ 下的第三方开源游戏）
play.html         休闲经营（10 款，play/ 下）
games.html        自己写的小游戏（8 款，games.js + games-more.js）
dos.html          DOS 经典（js-dos + .jsdos 包）
chess.html        中国象棋（chess.js）
nes.html          FC 模拟器（jsnes.min.js + nes.js）
relay.html        API Key 检测工具
about.html        关于页
```

样式：

```
home.css     主页/通用（导航、卡片、按钮）
style.css    工具箱页
games.css    小游戏页
theme.css    亮/暗主题变量
skins.css    怀旧风 / 科技风皮肤
splash.css   开屏动画（花瓣 / HUD）
theme.js     主题切换
skin.js      皮肤切换 + 开屏
```

## 设计变量（改皮肤从这里下手）

```css
/* theme.css / style.css 里的 :root */
--bg: #0b0f19;        /* 背景 */
--text: #e8edf7;      /* 正文 */
--muted: #8a95ab;     /* 次要文字 */
--line: rgba(255,255,255,.09);  /* 分割线 */
--accent: #6ee7ff;    /* 主强调色（青） */
--accent2: #a78bfa;   /* 次强调色（紫） */
--radius: 18px;
```

两套皮肤在 `skins.css`：

- `html[data-skin="retro"]`：米黄纸感、宋体、老电视扫描线、硬阴影
- `html[data-skin="tech"]`：近黑底、青紫霓虹、HUD 角标、透视网格

## 想改哪里

| 想改 | 改哪个文件 |
|---|---|
| 主页视觉 | `index.html` + `home.css` |
| 工具箱外观 | `tools.html` + `style.css` |
| 卡片的通用样式 | `home.css` 里的 `.card-link` / `.b` / `.wg` |
| 配色 | `theme.css` / `skins.css` 的变量 |
| 动效 | 各 CSS 里的 `transition` / `@keyframes` |

## 怎么提交

**请开 PR，不要直接 push main**（main 是线上分支，随时有人在用）。

```bash
git checkout -b design/v2
# 改文件
git commit -am "redesign: ..."
git push origin design/v2
```

## 测试清单（改完自测）

- [ ] 手机宽度 360px 下不横向滚动
- [ ] 亮色/暗色都看得清（右上角 🌗 按钮）
- [ ] 怀旧/科技皮肤切换正常（🎨 按钮）
- [ ] 工具箱 17 个工具能打开、能算
- [ ] 游戏页能进能出
- [ ] 没有 404 资源（控制台干净）

## 注意

- 站点里有一些第三方开源游戏（`web/`、`play/`、`dos.html` 引用的），**不要改它们的内部文件**，只改外面的卡片/入口。
- `relay.html` 是工具页，`noindex`，别放进导航。
