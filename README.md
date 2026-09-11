# Cutus's Personal Homepage — USTC Robotics Engineering

> **中国科学技术大学 (USTC) 机器人工程 · 专属工科工程设计主页**
> 以中科大官方蓝 (`#004182`) 为基调，结合 Bento Grid 现代网格与机器人遥测（Telemetry）视觉元素构建。
> 真实记录校企合作 **Aloha Mini 开源双臂移动机器人** 研发落地实操、仿生飞行攀爬机器人文献精读，以及 USTC 专业核心课自学体系。

---

## 核心内容与结构

- **校企合作项目 · Aloha Mini 开源双臂移动机器人**：
  - 角色：电子组 / 软件组成员
  - 开源链接：[liyiteng/AlohaMini](https://github.com/liyiteng/AlohaMini)
  - 核心工作：树莓派底层调测、Ubuntu SSH 控制链路构建、Nintendo Switch Joy-Con 手柄遥操作底盘/升降控制、示教数据集采集与特定物体视觉抓取放置任务落地。
- **仿生飞行攀爬机器人足端机构（文献精读与方案构想）**：
  - 基于 SCAMP、Asbeck2006、Hawkes2015、Pope2017 等文献；
  - 构想双稳态薄板两模式足端（微刺粗糙面 / 干黏附光滑面），提出 SMA 形状记忆合金热致脉冲 snap-through 触发与断电自保持。
- **USTC 机器人工程核心课自学体系**：
  - 包含自主利用 Typst 编撰的《理论力学B》、《人工智能数学原理与算法B》、《复变函数B》自学讲义手记。

---

## 本地预览与更新

### 本地预览
```bash
cd D:\cutus-homepage
start index.html
# 或启动本地测试服务器：
python3 -m http.server 8000
```

### 推送更新到 GitHub Pages 公网
```bash
cd D:\cutus-homepage
git add .
git commit -m "update: add aloha mini project and genuine reading notes"
git push
```
公网网址：[https://yxycutus.github.io/](https://yxycutus.github.io/)

## 2026-09-10 内容与体验更新

- 研究进展以 9 月 9 日交接和工作规划为依据，分开呈现初步记录、未验证问题与实验计划。
- 新增研究工作流与全站搜索；检索支持空格组合关键词、分类和可分享 URL。
- 恢复移动端导航，补充键盘焦点、跳至正文、主题存储容错与减少动画偏好。
- 全站页脚开发者名单：Cutus、Antigravity (Gemini 3.8 Flash)、Codex（GPT-6-Astra）。
- 日记只提炼公开项目节点，未复制私人记录或本地知识库。

直接维护 HTML 即可。新增公开页面时，也请在 search.html 加入对应卡片。

## 飞控学习进度面板

首页首屏显示总体进度，首页面板和 `knowledge/crazyflie-learning.html` 共用 `assets/flight-roadmap.js` 的十阶段路线。点击阶段查看官网、步骤与验收产物，拖动滑杆记录百分比。100% 表示产物已验收，不只是读完网页。

- 当前浏览器自动保存百分比与文字笔记，刷新恢复，同源标签页同步；旧版 `cutus-cf-progress` 自动迁移到 `cutus-cf-progress-v2`。
- 导出备份包含进度与笔记；导入会校验格式并在替换前确认。存储失败会显示提示，此时应导出备份。
- 公开进度来自 `assets/flight-progress.json`。在面板底部展开“公开展示进度”，生成公开文件，上传到 GitHub 仓库的 `main/assets` 并提交；Pages 部署完成后访客可看到。公开文件仅含百分比与时间，不含笔记。
- 网站是静态 GitHub Pages，没有身份认证和写入后端。拖动不会自动提交仓库。浏览器已有本地记录时优先展示本地记录；无本地记录的访客默认读取公开版本。清理浏览器数据前先导出备份。
- 初始公开文件未声明任何阶段完成。原页面记录的“已阅读 Brushless 教程”不等同于已提交本路线要求的配置清单，因此不自动标为 100%。

用 HTTP 服务预览，以保证首页、详情页共享同一来源的存储并正常读取公开 JSON；不要依赖 `file://` 的浏览器存储行为。
