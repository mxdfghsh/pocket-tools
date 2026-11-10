# 口袋小站 · Pocket Site

个人小站：工具箱 + 游戏中心 + 中转站。纯静态，零构建。

## 线上地址

| 页面 | 地址 |
|---|---|
| 主页 | https://mxdfghsh.github.io/pocket-tools/ |
| 工具箱 | https://mxdfghsh.github.io/pocket-tools/tools.html |
| 游戏中心 | https://mxdfghsh.github.io/pocket-tools/hub.html |
| 关于 | https://mxdfghsh.github.io/pocket-tools/about.html |

## 结构

```
主页 index.html
 ├─ 工具箱 tools.html ── 49 个本地工具
 ├─ 游戏中心 hub.html
 │   ├─ 网页经典 web.html      （11 款，含马里奥/矿工/捕鱼/抓娃娃）
 │   ├─ 休闲经营 play.html     （10 款）
 │   ├─ 小游戏 games.html      （8 款）
 │   ├─ DOS 经典 dos.html      （DOOM/Wolf3D/Heretic/Hexen/Jazz）
 │   ├─ 中国象棋 chess.html
 │   └─ FC 模拟器 nes.html
 └─ 关于 about.html
```

## 皮肤

导航栏 🎨 按钮切换：默认 / 怀旧风（花瓣开屏）/ 科技风（HUD 开屏）。

## 许可

本站自己的代码是 MIT（见 `LICENSE`）。站内收录的第三方开源游戏、引擎和 DOS 共享版游戏，按各自许可证收录，逐个列在 `CREDITS.md` 里。

## 发布

```bash
node /root/push-git.js
```

git 协议直接推送，不怕 REST 限流。
