# 月临汐岸 · SULEN

个人小站（沫小汐自用）：工具箱 + 网页游戏 + 一份在线资源清单。纯静态，零构建，离线可用。

- 中文名：月临汐岸
- 英文名：SULEN（没啥含义，就是好念）

## 线上地址

| 页面 | 地址 |
|---|---|
| 主页 | https://mxdfghsh.github.io/pocket-tools/ |
| 工具箱 | https://mxdfghsh.github.io/pocket-tools/tools.html |
| 游戏中心 | https://mxdfghsh.github.io/pocket-tools/hub.html |
| 在线资源 | https://mxdfghsh.github.io/pocket-tools/nav.html |
| 关于 | https://mxdfghsh.github.io/pocket-tools/about.html |

## 结构

```
index.html                 首页：场景入口 + 三块（工具 / 游戏 / 资源）
├─ tools.html              工具箱：59 个纯前端工具
├─ hub.html                游戏中心
│   ├─ web.html            网页经典：10 款本站托管 + 20 个外链
│   ├─ chess.html          中国象棋
│   └─ web/                本站托管的游戏（全部有许可证）
├─ nav.html                在线资源：201 个入口、17 个游戏分类 + AI
├─ relay.html              模型检测（noindex，会联网）
└─ about.html              关于 + 说明与免责
```

## 游戏分类

网页经典（10 款本站）之外，在线资源页按类型分了 17 组：
肉鸽 / 塔防 / 动作 / 策略 / 竞速 / 解谜 / 音乐 / 模拟 / 割草 / 剧情 / 放置 / 养成 / RPG /
在线 MMO / 网页大游戏 / 小游戏站 / 游戏平台（另有云游戏、棋牌、独立、竞技、AI 等）。

## 皮肤与彩蛋

- 导航栏 🎨：默认 / 怀旧风 / 科技风 / 月汐（月亮升起开屏）
- 导航栏 🌙：切主题；🐢：一键关闭全站动画
- 首页右下角 `>_`：终端，输入 `pet` 召唤桌宠、`help` 看命令

## 构建与发布

没有构建步骤，改完直接推：

```bash
node /root/git-trees-push.js    # 或者 REST Trees API 脚本
```

每次改静态资源记得同时：

1. 把 `sw.js` 的 `CACHE` 版本 +1
2. 把页面里 `?v=N` 的资源版本 +1

## 许可

本站代码 MIT（见 `LICENSE`）。第三方开源游戏和引擎按各自许可证收录，逐个列在 `CREDITS.md`；
**没有许可证的作品一律不收录**，站内托管游戏全部有明确 LICENSE。
