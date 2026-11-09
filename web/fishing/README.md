<div align="center">
    <p>
        <img src=image/h5logo.png alt="H5LOGO"><br>
        Powered By HTML5<br>
        <u>
            <b>
                No Fishing No Life
            </b>
        </u>
        <br>
        <i>
            本地离线 · 纯文字 · 发育 + 钓鱼 单机放置游戏
        </i>
        <br>
        <a href=https://no-fishing-no-life.netlify.app>
            <img alt="Static Badge" src="https://img.shields.io/badge/%E4%B8%8D%E7%94%A8%E4%B8%8B%E8%BD%BD%EF%BC%8C%E7%82%B9%E5%87%BB%E5%8D%B3%E7%8E%A9-cyan?style=for-the-badge&logo=netlify&logoColor=black&logoSize=auto">
        </a>
    <img alt="GitHub License" src="https://img.shields.io/github/license/huajiniyixia/No-Fishing-No-Life?style=for-the-badge">
    <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/huajiniyixia/No-Fishing-No-Life?style=for-the-badge&color=yellow">
    </p>
</div>


<!-- 在线试玩：[no-fishing-no-life.netlify.app](https://no-fishing-no-life.netlify.app)　|　GitHub：[huajiniyixia/No-Fishing-No-Life](https://github.com/huajiniyixia/No-Fishing-No-Life) -->


## 玩法简介

- **钓鱼**：抛竿 → 按稀有度等待 16~21 秒（进度条显示百分比与倒计时）→ 上钩自动存入仓库；鱼竿/鱼饵/祝福/品级改变出货权重。
- **仓库与餐馆**：鱼获按五类入库，可批量出售（保底×数量 + 1d(上限×数量)）；海钓餐馆按鱼种组合收单，交付即刷新，收益 ×1.3~2.0 并附固定金币。
- **每日委托**：每天 3 条，动作 × 对象 × 数量三段组合（120 种），评分 3~20 分，奖励 1 万~20 万金币，三条全清有宝箱；任务数量设有可完成上限，做不完的可随时「刷新」换掉（不限次数）。
- **鱼竿品级**：一品~五品炼化，每品提升传说/彩蛋/黑市权重并缩短上钩时间（商店页「鱼竿品级」行与问号有完整说明：每品效果、升品费用、买新竿重置为一品）。
- **发育**：建号加点（力量/体质/技巧/意志/智力/魅力，220 自由点，建号 cap 100、之后无上限）→ 签到 / 六种工作赚金币 → 黑市商店（开盒提属性 / 魔盒防属性减少 / 集装箱赌钱 / 渔网 1000 金币：立即结算 10 次钓鱼，这 10 次内普通鱼权重 +10000000）。
- **成就**：19 个本地成就；图鉴 50 种鱼可收集。
- **摸鱼模式**：设置里一键把「钓」变「摸」（饵钓除外）。

## 快速上手
[更新日志](whatsnew.md)

clone本项目到本地，双击 `index.html` 即可开始。主菜单「新游戏」先播放新手引导（点击任意处翻页、可跳过）。

推荐路线：按工作流派特化加点 → 钓鱼赚钱升鱼竿到钻石鱼竿 → 全力开盒提属性、拉高工资 → 攒 1 亿金币买「屌炸天永恒鱼竿」毕业。

## 数值速览

| 项目 | 数值 |
|---|---|
| 六属性 | 力量/体质/技巧/意志/智力/魅力，基础 15，建号上限 100 |
| 自由点 | 220（建号时分配，全部 1:1） |
| 工作 | 搬砖/牛郎/直播/写文/打架/探险，共用 1 小时冷却；后期倍率最高 ×1.5（打架 ×1.5/×0.5） |
| 钓鱼冷却 | 10 秒（渔网为立即结算，不占冷却） |
| 鱼竿 | 初始 → 永恒（7 档，最高 1 亿金币）；可炼化一品~五品（每品：传说 +25 / 彩蛋 +3 / 黑市各 +10 / 上钩 -0.3 秒；费用 = 售价 ×0.4/0.8/1.6/3.2） |
| 鱼饵 | 小鱼 / 大米 / 棒棒糖 |
| 祝福 | 饵钓（缩短上钩时间）/ 海之眷顾（提高彩蛋率），最高 3 级 |
| 黑市商店 | 开盒 / 魔盒 / 未知的集装箱（各 10000 金币）；渔网 1000 金币（立即结算 10 次钓鱼，这 10 次内普通鱼权重 +10000000） |
| 成就 | 19 个 |
| 仓库 | 五类存放，批量出售 = 保底×数量 + 1d(上限×数量) |
| 每日委托 | 每天 3 条，评分制奖励 1 万~20 万；可无限次刷新 |
| 海钓餐馆 | 交付即刷新，收益 ×1.3~2.0 + 固定金币 |

## 存档

- 自动保存在浏览器 localStorage，支持「手动存档 / 读档 / 导出 / 导入」（旧档自动补全新字段）。
- 换设备：导出 JSON → 新设备导入即可。

