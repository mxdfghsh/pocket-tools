# 月临汐岸 · SULEN

个人小站（沫小汐自用）：工具箱 + 网页游戏 + 一份在线资源清单。纯静态，零构建。

- 中文名：月临汐岸
- 英文名：SULEN（没啥含义，就是好念）

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
 ├─ 工具 tools.html        59 个本地工具
 ├─ 游戏中心 hub.html
 │   ├─ 网页经典 web.html   16 款本站托管 + 12 个外链
 │   └─ 中国象棋 chess.html
 ├─ 在线资源 nav.html       167 个入口（游戏平台 / 云游戏 / 小游戏 / 小说 / 音乐 / 影视 / 漫画），
 │                          标明「要装 App」「需代理」，其余网页直接能用
 ├─ 检测 relay.html         API Key 检测（noindex）
 └─ 关于 about.html
```

游戏和素材在 `web/` 下，来源与许可证见 `CREDITS.md`。

## 皮肤

导航栏 🎨 按钮切换：默认 / 怀旧风（花瓣开屏）/ 科技风（HUD 开屏）/ 月汐（月亮升起 + 潮水）。

## 许可

本站自己的代码是 MIT（见 `LICENSE`）。站内收录的第三方开源游戏和引擎按各自许可证收录，逐个列在 `CREDITS.md` 里。

## 发布

```bash
node /root/push-git.js
```

git 协议直接推送，不怕 REST 限流。
