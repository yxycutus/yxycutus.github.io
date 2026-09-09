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
