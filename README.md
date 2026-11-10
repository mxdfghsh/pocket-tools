# 口袋小站 · Pocket Site

个人小站：工具箱 + 游戏 + 四张外链清单（小说/音乐/影视/漫画）。纯静态，零构建。

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
 ├─ 工具 tools.html          57 个本地工具（app.js + extra*.js 注册）
 ├─ 游戏中心 hub.html
 │   ├─ 网页经典 web.html     16 款本站托管 + 12 个外链（原作者 GitHub Pages demo）
 │   └─ 中国象棋 chess.html
 ├─ 外链 links.html           48 个游戏/平台入口（Steam、Switch、PS、Xbox、云游戏…）
 ├─ 小说 read.html            17 个正版阅读站
 ├─ 音乐 music.html           14 个在线音乐 / 播客 / 免版权
 ├─ 影视 video.html           13 个正版影视 / 直播
 ├─ 漫画 comic.html           10 个正版漫画
 ├─ 检测 relay.html           API Key 检测（noindex）
 └─ 关于 about.html
```

游戏与素材都在 `web/` 下，具体来源和许可证见 `CREDITS.md`。

## 皮肤

导航栏 🎨 按钮切换：默认 / 怀旧风（花瓣开屏）/ 科技风（HUD 开屏）。

## 许可

本站自己的代码是 MIT（见 `LICENSE`）。站内收录的第三方开源游戏和引擎按各自许可证收录，逐个列在 `CREDITS.md` 里。

## 发布

```bash
node /root/push-git.js
```

git 协议直接推送，不怕 REST 限流。
