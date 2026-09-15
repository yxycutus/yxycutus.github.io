# Cutus's Personal Homepage — USTC Robotics Engineering

> **中国科学技术大学 (USTC) 机器人工程 · 专属工科工程设计主页**
> 以中科大官方蓝 (`#004182`) 为基调，以真实工程项目、研究问题和公开笔记组织个人主页。
> 真实记录校企合作 **Aloha Mini 开源双臂移动机器人** 研发落地实操、仿生飞行攀爬机器人文献精读，以及 USTC 专业核心课自学体系。

## 2026-09-14 外观与阅读体验

- 全站右下角「外观」及顶栏外观按钮提供夜间黑、科大蓝、Claude 橙、花嫁白（纯白升级）、B站粉、美团黄六套主题，以及 14–22 的基准字号调节。文字采用 rem 单位，默认 16；主题与字号保存在当前浏览器，并同步到同源标签页。旧版浅色偏好自动迁移到科大蓝，存储不可用时仍可在当前页面调节。
- 首页和各页面提供可收起侧栏。桌面记住展开状态，收起后正文恢复居中；窄屏默认关闭，按需打开抽屉，支持 Esc 关闭及键盘焦点返回。
- 18 篇文章自动生成二、三级标题目录，保留原有锚点，为未命名小标题生成稳定锚点。阅读时高亮当前位置，顶部进度条显示正文阅读位置，侧栏提供相邻章节跳转，章节间增加下一节入口。原有跨文章导航保留。
- `assets/theme-init.js` 在首次绘制前恢复外观；`assets/experience.css`、`assets/experience.js` 是共享入口，每页分别放在样式和脚本末尾。禁用 JavaScript 时正文及原有内嵌目录仍可阅读。
- 回归脚本 `scripts/check_experience.cjs` 需要 Playwright 和本地静态服务器，默认访问 `http://127.0.0.1:8000`，可用 `BASE_URL`、`PLAYWRIGHT_MODULE`、`CHROME_PATH` 环境变量覆盖。检查覆盖偏好保存、目录跳转、阅读进度、键盘操作、全部 27 页最大字号窄屏布局、图片查看、飞控进度及论文筛选；截图保存到不发布的 `.preview/`。

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

直接维护 HTML 即可。新增公开页面时，也请在 search.html 加入对应卡片，并同步 sitemap.xml、页面 canonical 和分享元信息。

## 飞控学习进度面板

首页首屏显示总体进度，首页面板和 `knowledge/crazyflie-learning.html` 共用 `assets/flight-roadmap.js` 的十阶段路线。点击阶段查看官网、步骤与验收产物，拖动滑杆记录百分比。100% 表示产物已验收，不只是读完网页。

- 当前浏览器自动保存百分比与文字笔记，刷新恢复，同源标签页同步；旧版 `cutus-cf-progress` 自动迁移到 `cutus-cf-progress-v2`。
- 导出备份包含进度与笔记；导入会校验格式并在替换前确认。存储失败会显示提示，此时应导出备份。
- 公开进度来自 `assets/flight-progress.json`。在面板底部展开“公开展示进度”，生成公开文件，上传到 GitHub 仓库的 `main/assets` 并提交；Pages 部署完成后访客可看到。公开文件仅含百分比与时间，不含笔记。
- 网站是静态 GitHub Pages，没有身份认证和写入后端。拖动不会自动提交仓库。浏览器已有本地记录时优先展示本地记录；无本地记录的访客默认读取公开版本。清理浏览器数据前先导出备份。
- 初始公开文件未声明任何阶段完成。原页面记录的“已阅读 Brushless 教程”不等同于已提交本路线要求的配置清单，因此不自动标为 100%。

用 HTTP 服务预览，以保证首页、详情页共享同一来源的存储并正常读取公开 JSON；不要依赖 `file://` 的浏览器存储行为。

## 2026-09-12 首页与阅读体验更新

- 首页按「个人定位 → 真实项目 → 公开笔记 → 学习面板 → 联系」组织。Aloha Mini 已完成的团队结果与个人分工分开说明；栖息研究明确列出已有观察和待验证事项。
- 首页项目图片来自仓库内的遥操作、Joy-Con 视频，不使用生成的机器人照片。视频入口直达项目页 `#demos`。
- 学习面板默认折叠；首屏入口和 `/#progress-tracker` 链接自动展开。既有进度、笔记、备份和发布机制保留。未发布公开百分比时显示「学习进行中」，本地编辑后明确标注「此浏览器的学习记录」。
- 长文补充章节锚点与原生可折叠目录；有 JavaScript 时显示估算阅读时间、复制链接和返回顶部，复制权限不可用时提供可手动复制的文本框。
- 全站移除 Google Fonts 请求，使用字体栈回退；在样式加载前应用主题，减少主题闪烁。补充分享卡片元信息、规范 URL、站点地图、robots.txt 与根路径 404 页面。
- 浏览器截图、自动化临时文件和测试进度都放在被 Git 忽略的 `.preview/`，不会发布。

### 发布前检查

```bash
python scripts/check_site.py
node --check assets/script.js
node --check assets/flight-roadmap.js
node --check assets/reader.js
node scripts/version_theme_assets.cjs --check
```

主题初始化、外观控制或主题 CSS 修改后，先运行 `node scripts/version_theme_assets.cjs`，统一更新全部 HTML 中的资源版本号。内部页面链接也携带此版本，避免浏览器混用旧页面和旧脚本。不要手工修改版本号。

主题偏好统一由 `assets/theme-init.js` 管理：有效的浏览器存储优先于旧链接参数；参数仅用于无存储时的跨页传递。修改主题会同步当前网址、内部链接与设置面板；浏览器返回缓存页面时重新读取最新设置。系统推断的默认配色不会写成用户选择。

跨页回归：启动本地 HTTP 服务后运行 `node scripts/check_theme_navigation.cjs`；可用 `CHROME_PATH` 指定 Edge 或 Chrome，可用 `PLAYWRIGHT_MODULE` 指定 Playwright 模块路径，`BASE_URL` 指向公网时可检查线上版本。测试包含旧 URL、刷新、返回、跨标签、六主题实际颜色、全部页面、旧缓存资源和存储受限时的新标签打开。

浏览器验收覆盖：浅色/深色、首页 320/390/768px、27 页的手机布局、折叠面板与深链接、键盘滑杆、笔记恢复、跨页/跨标签同步、备份导入校验、公开导出不含笔记、搜索组合筛选、目录、复制链接、视频播放，以及无 JavaScript 和公开进度加载失败时的回退。

下一步内容建设优先于增加页面模块：在项目页持续补充带日期的真实实验条件、结果、失败案例和产物链接；有可公开的阶段验收结果后，再更新 `assets/flight-progress.json`。不要用页面上线日期替代研究进展日期，也不要用读完教程代替产物验收。

## 2026-09-12 图片与配色更新

- 接入 `picture/` 的 13 张新增图片：9 张论文配图、2 张项目概念图、Crazyflie 平台图与科大西区照片。9 张论文图分别对应目录卡片与正文；项目概念图明确标注为方案构想。
- 首页维持原有信息顺序，以蓝、绿、浅紫和暖色卡片区分内容；增加带图论文入口、校园横幅、项目侧视图入口。关于页与飞控学习页同步增加对应影像。
- `assets/gallery/manifest.json` 记录源文件、标题、图注及展示尺寸。`python scripts/prepare_images.py`（需要 Pillow）可重新生成 WebP 展示版本，原文件不改动。科大原照片下部有灰色异常区域，展示版本仅采用上方完整画面。
- `assets/gallery.js` 在原生图片链接上增强放大查看：适应窗口 / 原始尺寸、Esc 关闭、焦点返回；无 JavaScript 时仍可直接打开图片。论文与机构图完整显示，不裁去图内标注。
- 图片按需加载，首屏平台图优先加载；页面不直接加载 6 MB 的校园源照片。临时截图和浏览器验证脚本仍放在 `.preview/`，不进入发布。
