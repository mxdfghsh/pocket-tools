# 口袋小站 · Pocket Site

个人小站：工具箱 + 小游戏。纯静态，零依赖，无后端。

## 线上地址

| 页面 | 地址 |
|---|---|
| 主页 | https://mxdfghsh.github.io/pocket-tools/ |
| 工具箱 | https://mxdfghsh.github.io/pocket-tools/tools.html |
| 小游戏 | https://mxdfghsh.github.io/pocket-tools/games.html |

## 结构

```
主页 ──▶ 工具箱（入口 → 17 个工具）
  └──▶ 小游戏（7 个经典复刻）
```

## 文件

| 文件 | 作用 |
|---|---|
| `index.html` + `home.css` | 主页 |
| `tools.html` + `style.css` | 工具箱（全屏入口 + 17 工具） |
| `app.js` | 前 9 个工具 + 注册器 |
| `extra.js` | 后 8 个工具 |
| `landing.js` | 工具箱入口页逻辑 |
| `games.html` + `games.css` + `games.js` | 小游戏页（7 个游戏） |

## 游戏清单与操作

| 游戏 | 操作 |
|---|---|
| 贪吃蛇 | 方向键 / WASD / 滑动 / 屏幕按钮 |
| 俄罗斯方块 | ← → 移动，↑ 旋转，↓ 下落，空格落底 |
| 2048 | 方向键 / 滑动棋盘 |
| 扫雷 | 点击翻开，长按或右键插旗，也可开「标记模式」 |
| 打砖块 | 左右滑动 / ← → |
| 记忆翻牌 | 点击翻开 |
| 井字棋 | 点击落子（电脑用 minimax，必和） |

## 怎么加东西

- **加游戏**：`games.js` 里 `add({...})`，用 `el()` 构建 UI，`init()` 返回清理函数
- **加工具**：`extra.js` 里 `register({...})`，末尾 `render()`
- **加页面**：新建 `.html`，在 `index.html` 项目区加卡片链接

## 发布

```bash
/root/deploy-github.js
```

上传目录下所有 `.html/.css/.js`，GitHub 需 30~60 秒构建。
