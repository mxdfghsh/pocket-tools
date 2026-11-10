# 交给前端设计智能体的交接说明

> 更新时间：2026-11-10，对应仓库 `main` 分支。

## 这是什么

一个纯静态个人小站（中文），托管在 GitHub Pages：

- 仓库：https://github.com/mxdfghsh/pocket-tools
- 线上：https://mxdfghsh.github.io/pocket-tools/
- **没有构建步骤**：直接改 HTML/CSS/JS，push 即生效（Pages 自动构建，1–6 分钟）

日常访问基本都在**手机 Chrome/Edge** 上，所以一切以 360–430px 宽为准。

## 硬性约束（违反会直接出问题）

1. **不要引入构建工具**（Vite/Webpack/React/TS 编译都不行），改完必须能直接跑。
2. **不要引用外部 CDN / 外链字体 / 统计脚本**。历史上被墙的 CDN 坑过好几次，也承诺过「不收集数据」。
3. **优先系统字体**，不加载 webfont。
4. **移动端优先**，桌面也不能崩。
5. **保留 PWA**：`manifest.json`、`sw.js`、`icon-*.png` 不要删；改了静态资源就把 `sw.js` 里 `CACHE` 版本 +1（现在是 `pocket-v24`）。
6. **保留功能入口**：工具箱、游戏中心、外链页、API 检测、皮肤切换。
7. **不要动这些目录/文件的内容**（第三方开源游戏和工具逻辑）：
   `web/`、`play/`、`big/`、`js-dos/`、`web/*/*`、`*.jsdos`、
   `app.js`、`extra.js`、`extra2.js`、`extra3.js`、`extra4.js`、`extra5.js`、
   `games.js`、`games-more.js`、`chess.js`、`nes.js`、`qrcode.js`、
   `fit.js`、`pad.js`、`pwa.js`
   —— 这些是游戏本体和工具本体，只改外面的卡片、入口、排版。

## 页面清单

```
index.html        主页：项目目录行 + AI 外链 + 中转站入口
tools.html        工具箱：49 个工具（全屏入口页 landing）
hub.html          游戏中心：本站游戏分类 + 外链入口
web.html          网页经典 28 款（卡片指向 web/ 下的第三方开源游戏 + 1 个大游戏 HexGL）
play.html         休闲经营 10 款（play/ 下）
games.html        自研小游戏 8 款（games.js / games-more.js）
dos.html          DOS 经典 5 款（js-dos）
chess.html        中国象棋（与 AI 对弈）
nes.html          FC 模拟器（自己拖 .nes 进去）
links.html        外部游戏站：34 个入口（小游戏 / 页游 / 棋牌 / 云游戏 / 开源大作）
relay.html        API Key 检测（noindex，别放进导航）
relay-test.html   老的测试页（noindex）
about.html        关于
```

样式与脚本：

```
home.css     主页 / 通用（导航、卡片、按钮、目录行）
style.css    工具箱页 + 结果列表
games.css    小游戏页
theme.css    亮/暗主题变量
skins.css    怀旧风 / 科技风
splash.css   开屏动画（花瓣 / HUD）
motion.css   动效层（页面转场、逐字入场、导航胶囊、滚动进度…）
theme.js     主题切换      skin.js   皮肤 + 开屏
ui.js        滚动显现 / 数字滚动 / 导航阴影
motion.js    动效层的交互部分
fit.js       游戏页自适应缩放（zoom）
pad.js       给键盘游戏补的方向键
```

## 设计变量（改配色只改这里）

当前风格是「纸感目录」：暖纸底、墨色字、朱砂点缀。

```css
/* home.css 的 :root（默认暗色） */
--bg: #12130f;          /* 背景 */
--surface: #1a1c17;     /* 卡片 */
--surface-2: #22251e;   /* 次级面板 / 输入框内衬 */
--ink: #f0ece0;         /* 正文（--text 指向它） */
--muted: #9d9c90;       /* 次要文字 */
--line / --line-strong; /* 分割线 */
--accent: #ff6b45;      /* 主强调（朱砂） */
--accent2: #9bb0ff;     /* 次强调（少量用） */
--radius: 14px;
--nav-h: 62px;          /* 手机底栏高度，给 body 留底部间距 */
```

亮色在 `theme.css` 的 `html[data-theme="light"]` 里翻转（暖纸 #f3efe4 + 墨字 + 朱砂 #c03a20）。
**新写样式一律用变量，不要写死颜色**，否则亮色主题会脏。

两套皮肤在 `skins.css`：

- `html[data-skin="retro"]`：旧纸、宋体标题、硬阴影、扫描线
- `html[data-skin="tech"]`：近黑底、荧光绿 + 品红、等宽标题、网格背景、切角卡片

## 已经做过的动效（别重复造）

- `motion.css`：页面转场（View Transition）、标题逐字入场、导航滑动胶囊、顶部滚动进度、主题圆形扩散、卡片指针光晕、按钮涟漪、回到顶部
- `ui.js`：滚动淡入、数字滚动、导航阴影
- 全部挂在 `html.motion-on` 下，系统「减少动态效果」时整层不加载

## 想改哪里

| 想改 | 改哪个 |
|---|---|
| 主页视觉 | `index.html` + `home.css` |
| 工具箱外观 | `tools.html` + `style.css` |
| 游戏中心 / 外链页 | `hub.html` / `links.html` + `home.css` |
| 配色 | `home.css` 的 `:root`、`theme.css`、`skins.css` |
| 动效 | `motion.css`、`motion.js` |
| 游戏卡片 | `web.html` 里的 `.wg` 卡片（别改 `web/` 里的东西） |

## 可以重点美化的地方

1. **`links.html`** 是最新加的页面（34 个外链、5 个分组），样式最粗糙，信息密度也最高
2. **`hub.html`** 三块结构（本站游戏 / 中大型 / 外链入口）需要更清晰的分层
3. **`web.html`** 28 张卡片，颜色标签有点乱，可以归类统一下
4. **`tools.html`** 49 个工具卡片，可以按类型分组或加分类筛选
5. **亮色主题**下部分游戏卡片对比度偏低

## 怎么提交

**别直接 push main**（线上分支，随时有人在用）。

选一种：

- **补丁（推荐）**：`git diff > redesign.patch`（新文件先 `git add -N .`），把补丁交给站长
- **zip**：把改过的文件打包，注明清单
- 站长会应用、本地跑一遍、再开 PR 合并

本地预览需要用 HTTP 服务（不能双击打开，游戏页用了 XHR）：

```bash
python3 -m http.server 8080
# 或者 npx serve
```

## 自测清单

- [ ] 360px 宽不横向滚动
- [ ] 亮 / 暗主题都看得清（☀️/🌙 按钮）
- [ ] 怀旧 / 科技皮肤切换正常（🎨 按钮）
- [ ] 首页 → 工具箱 → 游戏中心 → 外链页，来回都能走通
- [ ] 工具箱随便挑三个工具算一下（Base64 / 时间戳 / JSON）
- [ ] 随便进两个游戏，能进能出（左上角有「← 口袋小站」）
- [ ] 控制台没有 404 / 报错
