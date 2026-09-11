/* Shared learning plan. Percentages describe deliverables, not time spent. */
(() => {
  'use strict';
  const base = 'https://www.bitcraze.io/documentation/';
  const fw = 'repository/crazyflie-firmware/master/';
  const py = 'repository/crazyflie-lib-python/master/';
  const client = 'repository/crazyflie-clients-python/master/';
  const chain = fw + 'functional-areas/sensor-to-control/';
  const plans = [
    ['明确机型', '认识平台，留下可复查的配置清单。', [['Brushless 入门', 'tutorials/getting-started-with-crazyflie-brushless/']], ['阅读入门教程，确认 Crazyflie 2.1 Brushless 机型及组件。', '记录电池、Crazyradio 型号、扩展板、固件版本与客户端版本；未知信息标为待确认。', '拍一张硬件配置照片，标明后续使用的计算机系统与连接方式。'], '配置清单 + 硬件照片；能说明 Brushless 对应 cf21bl 平台。', '认识硬件、软件与通信设备的分工。'],
    ['连上飞机', '先建立稳定连接，再开始采集数据。', [['cfclient 安装', client+'installation/install/'], ['USB / Crazyradio 权限', py+'installation/usb_permissions/'], ['cfclient GUI 指南', client+'userguides/userguide_client/']], ['按自己的操作系统安装 cfclient；Linux 检查 USB 权限，其他系统按安装文档处理驱动。', '拆桨后扫描并记录连接 URI，完成连接 → 断开 → 重连。', '查看电池与姿态遥测，轻轻改变机体方向观察响应，记录异常和解决方法。'], '连接记录：系统、软件版本、URI、重连结果和一张遥测截图。', '会连接、排查基本通信问题，读懂客户端的基础遥测。'],
    ['用 Python 读数据', '把第一次连接变成第一份实验数据。', [['cflib 安装', py+'installation/install/'], ['连接 / 日志 / 参数', py+'user-guides/sbs_connect_log_param/'], ['Log / Param 框架', fw+'userguides/logparam/'], ['日志变量查询', fw+'api/logs/']], ['编写或检查 connect_only.py，仅连接与断开；分清读取日志、设置参数、发送动作命令。', '编写 log_attitude.py，拆桨采集 60 秒 roll / pitch / yaw，CSV 保存时间戳、变量名、单位与采样周期。', '编写 plot_attitude.py 绘图，区分静止与手动倾转片段，说明噪声、漂移或缺失数据。'], '60 秒姿态 CSV + 曲线图 + 三个脚本 + 一段对曲线的解释。', '能用数据回答姿态如何变化，而不只看 GUI 的动画。'],
    ['编译 Brushless 固件', '跑通构建，建立可追溯的版本基线。', [['Firmware 总入口', fw], ['Building and Flashing', fw+'building-and-flashing/build/']], ['在 Ubuntu / WSL 按官方文档准备 ARM 工具链，递归克隆固件仓库并确认子模块齐全。', '在固件目录依次运行 make cf21bl_defconfig 和 make -j2；本阶段只编译。', '记录 Git commit、工具链版本、编译日志以及 build 目录中的产物路径。'], '成功构建日志 + Brushless 构建产物路径 + 版本记录。', '理解配置目标与编译产物；本机型使用 cf21bl，不套用 cf2 默认配置。'],
    ['看懂飞控总链路', '先画地图，再进入模块。', [['Stabilizer Module', chain], ['官方固件源码', 'https://github.com/bitcraze/crazyflie-firmware']], ['读 Stabilizer 总览，区分 sensor、state、setpoint、control 的角色。', '画图：传感器 → 状态估计 → state；Commander → setpoint；两路一起进入 controller → control → 电机分配 → 电机。', '在当前版本源码中找到稳定循环和各模块调用入口，记录文件路径、函数名与 commit。'], '一张含反馈关系的框图 + 模块输入输出表 + 源码入口索引。', 'state 是估计状态，setpoint 是目标；两者不是简单的串行处理关系。'],
    ['学习 PID 控制器', '沿着误差如何变成控制输出往下读。', [['Controllers', chain+'controllers/']], ['先聚焦 PID，画出位置、姿态、角速度环的级联关系。', '逐环写清目标值、测量值、误差、输出和单位，并在源码中对应变量。', '追踪输出到电机分配的路径，记录限幅与控制模式相关疑问；先用笔记解释链路。'], 'PID 环路表 + 变量对应笔记；能解释各环输出如何成为下一环输入。', '理解反馈控制与级联关系，为以后分析接触扰动做准备。'],
    ['学习状态估计', '知道数据从哪来，也知道它的边界。', [['State estimation', chain+'state_estimators/']], ['确认当前使用的估计器和传感器配置，梳理输入测量与输出状态。', '回看第 2 阶段姿态曲线，说明 roll / pitch / yaw 的来源与可能的漂移。', '做可靠性表：姿态、位置、速度分别依赖哪些观测；缺少定位系统时，不默认位置可信。'], '估计器数据流图 + 观测依赖 / 可靠性表 + 对姿态日志的补充解释。', '分清姿态估计和位置估计，以及测量、估计与真值。'],
    ['学习指令与保护', '为接触和栖息整理系统约束。', [['Commander / Setpoints', chain+'commanders_setpoints/'], ['Supervisor', fw+'functional-areas/supervisor/'], ['Supervisor CRTP', fw+'functional-areas/crtp/crtp_supervisor/'], ['cflib Supervisor API', py+'api/cflib/crazyflie/supervisor/']], ['查清 setpoint 来源、优先级、超时处理与控制模式，按当前固件版本记下依据。', '整理 arm、急停、锁定与恢复条件，区分指令请求和实际系统状态。', '写出接近、接触、附着时可能触发的保护，以及失败后应转入的安全状态；不以屏蔽保护作为解决方案。'], '一页保护条件表：触发条件、系统响应、观测变量、恢复条件与源码依据。', '解释为什么栖息不能简单等同于停桨，以及失联时系统会如何处理。'],
    ['设计栖息状态机', '把学习内容变成项目的判断逻辑。', [['App layer', fw+'userguides/app_layer/'], ['Log variables', fw+'api/logs/'], ['Parameters', fw+'api/params/']], ['按模式就绪 → 接近 → 接触 → 附着 → 载荷转移 → 保持 → 脱附 → 离墙建立状态表。', '每个状态填写进入条件、动作、成功信号、失败信号、超时、退出目标；阈值未测量时明确标为待实验。', '对照日志与参数 API，列出可直接观测、需新增传感、需台架确认的信号；阅读 App layer 决定应用逻辑入口。'], '状态机表 + 信号映射表 + 失败 / 超时分支；每次转换都有可验证判据。', '将控制链路、保护逻辑和机构观测量组织成可验证的算法设计。'],
    ['并行做机构实验', '让真实机构结果反推状态机。', [['双模态栖息项目指南', 'local:scamp-climbing.html'], ['文献知识库', 'local:papers/index.html']], ['在台架分别安排 SMA 双向翻转、粗糙面挂附、光滑面保持，每项记录 20 次。', '记录试验条件、成功 / 失败、失败类型和照片 / 视频；保持实验还记录载荷与持续时间。', '汇总成功率与失败模式，反推接触、附着、载荷转移和脱附需要测量的信号，更新第 8 阶段判据。'], '三组各 20 次实验记录 + 失败分类 + 影像索引 + 状态机修订。', '用台架证据修正假设；可与第 8 阶段并行，不必等待全部飞控学习完成。']
  ];
  const host = document.querySelector('[data-flight-roadmap]');
  if (!host) return;
  const inKnowledge = location.pathname.includes('/knowledge/');
  const local = inKnowledge ? '' : 'knowledge/';
  const href = p => p.startsWith('local:') ? local+p.slice(6) : p.startsWith('https:') ? p : base+p;
  const key = 'cutus-cf-progress-v2';
  const empty = () => ({version:2, phases:plans.map(() => ({progress:0,note:''})), updatedAt:null});
  const valid = d => d && d.version === 2 && Array.isArray(d.phases) && d.phases.length === 10 && d.phases.every(p => p && Number.isInteger(p.progress) && p.progress>=0 && p.progress<=100 && typeof p.note==='string' && p.note.length<=10000);
  let data = empty(), loadMessage = '尚未记录 · 拖动后自动保存', storageOK = true, hasLocal = false, edited = false;
  try {
    const raw = localStorage.getItem(key);
    if(raw) { const parsed = JSON.parse(raw); if(!valid(parsed)) throw Error(); data=parsed; hasLocal=true; loadMessage='已恢复此浏览器的学习记录'; }
    else {
      const old = JSON.parse(localStorage.getItem('cutus-cf-progress') || '{}');
      if(old && typeof old==='object' && Object.keys(old).length) {
        data.phases.forEach((p,i) => { const n=Number(old[i]); p.progress=Number.isFinite(n)?Math.max(0,Math.min(100,Math.round(n))):0; });
        localStorage.setItem(key, JSON.stringify(data)); hasLocal=true; loadMessage='已迁移旧版进度';
      }
    }
  } catch (_) { storageOK=false; loadMessage='无法读取记录：请检查浏览器存储或导入备份，原记录未删除'; }
  let selected = Math.max(0,data.phases.findIndex(p=>p.progress<100));
  host.innerHTML = `<div class="flight-heading"><div><span class="section-label">FLIGHT LAB / LEARNING ROADMAP</span><h2>飞控学习，一步一个产物。</h2><p>Crazyflie 2.1 Brushless <span>·</span> 从连接与日志，到飞行栖息</p></div><a href="${local}crazyflie-learning.html#progress-tracker">完整学习路线 ↗</a></div>
    <div class="flight-overview"><div><span>总体完成度</span><strong id="flight-total">0<small>%</small></strong></div><div class="flight-overview-track"><progress id="flight-meter" max="100" value="0" aria-label="总体学习完成度"></progress><p><span id="flight-completed"></span><span>按 10 个阶段等权计算</span></p></div></div>
    <div class="flight-weeks"><span>01 / 连接与数据 <b>阶段 0–3</b></span><span>02 / 理解飞控 <b>阶段 4–7</b></span><span>03 / 栖息实验 <b>阶段 8–9</b></span></div>
    <nav class="flight-nodes" aria-label="选择学习阶段">${plans.map((p,i)=>`<button type="button" data-node="${i}" aria-controls="flight-detail"><span class="flight-node-number">${String(i).padStart(2,'0')}</span><span>${p[0]}</span><small data-node-pct="${i}">0%</small></button>`).join('')}</nav>
    <div id="flight-detail">${plans.map((p,i)=>`<section class="flight-stage" data-stage="${i}" aria-labelledby="flight-title-${i}" ${i===selected?'':'hidden'}><div class="flight-stage-head"><div><span class="section-label">STAGE ${String(i).padStart(2,'0')} ${i===9?'· 并行实验':''}</span><h3 id="flight-title-${i}">${p[0]}</h3><p>${p[1]}</p></div><output for="flight-slider-${i}" data-pct="${i}">0%</output></div><label class="flight-slider-label" for="flight-slider-${i}">拖动记录阶段进度 <span>0 未开始 / 50 实践中 / 100 产物已验收</span></label><input class="flight-slider" id="flight-slider-${i}" type="range" min="0" max="100" step="1" value="0" data-slider="${i}"><div class="flight-task-grid"><div><h4>01 / 先看这些网页</h4><div class="flight-links">${p[2].map(l=>`<a href="${href(l[1])}" ${l[1].startsWith('local:')?'':'target="_blank" rel="noopener noreferrer"'}>${l[0]} ↗</a>`).join('')}</div><p class="flight-understand">学会什么：${p[5]}</p></div><div><h4>02 / 然后动手做</h4><ol>${p[3].map(t=>`<li>${t}</li>`).join('')}</ol></div></div><div class="flight-deliverable"><span>03 / 验收产物</span><p>${p[4]}</p></div><details class="flight-notes"><summary>实验笔记 / 产物位置 <span data-note-hint="${i}"></span></summary><label for="flight-note-${i}">记录文件路径、结果、疑问与下一步（仅保存文字，不上传文件）</label><textarea id="flight-note-${i}" data-note="${i}" maxlength="10000" rows="3" placeholder="例如：2026-09-11，CSV 存在 experiments/attitude/；下一步检查 yaw 漂移。"></textarea></details><div class="flight-stage-actions"><button type="button" data-complete="${i}">产物已验收，标为完成 ✓</button><button type="button" data-next="${i}">${i===9?'回到阶段 0':'下一阶段 →'}</button></div></section>`).join('')}</div>
    <div class="flight-footer"><div><p id="flight-save" role="status" aria-live="polite"></p><small>保存于当前浏览器；不会自动同步到其他设备或公开给访客。清理浏览器数据前请导出备份。</small></div><div class="flight-backup"><button type="button" id="flight-export">导出备份</button><button type="button" id="flight-import">导入备份</button><input type="file" id="flight-file" accept=".json,application/json" hidden></div></div>`;
  const status = host.querySelector('#flight-save');
  status.textContent=loadMessage;
  const publishing = document.createElement('details');
  publishing.className='flight-publishing';
  publishing.innerHTML='<summary>公开展示进度 <span id="flight-public-status">正在读取公开记录…</span></summary><p>访客默认看到网站中已发布的进度。你拖动后的记录先保存在本地；发布后其他设备和访客才能看到。</p><ol><li><button type="button" id="flight-public-export">生成公开进度文件</button>（仅百分比，不含笔记）</li><li><a href="https://github.com/yxycutus/yxycutus.github.io/upload/main/assets" target="_blank" rel="noopener">打开 GitHub 的 assets 上传页面 ↗</a>，上传刚生成的 flight-progress.json 并提交，等待 Pages 更新。</li></ol><p>只有仓库维护者能更新公开文件。访客的拖动只影响他们自己的浏览器。</p>';
  host.append(publishing);
  host.querySelector('.flight-footer small').textContent='编辑自动保存在当前浏览器。公开展示需在下方发布进度；笔记不进入公开文件。清理数据前请导出备份。';
  host.querySelector('#flight-public-export').addEventListener('click',()=>{
    const snapshot={version:1,updatedAt:new Date().toISOString(),progress:data.phases.map(p=>p.progress)};
    const url=URL.createObjectURL(new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='flight-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    host.querySelector('#flight-public-status').textContent='文件已生成，上传提交后才会公开';
  });
  fetch((inKnowledge?'../':'')+'assets/flight-progress.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(snapshot=>{
    if(snapshot.version!==1 || !Array.isArray(snapshot.progress) || snapshot.progress.length!==10 || !snapshot.progress.every(n=>Number.isInteger(n)&&n>=0&&n<=100))throw Error();
    host.querySelector('#flight-public-status').textContent=snapshot.updatedAt?'公开版本 · '+new Date(snapshot.updatedAt).toLocaleDateString('zh-CN'):'尚未发布个人进度';
    if(!hasLocal&&!edited&&storageOK){data.phases.forEach((p,i)=>p.progress=snapshot.progress[i]);selected=Math.max(0,data.phases.findIndex(p=>p.progress<100));render();status.textContent=snapshot.updatedAt?'正在展示已发布进度 · 拖动可建立本地记录':'尚未记录 · 拖动后自动保存';}
  }).catch(()=>{host.querySelector('#flight-public-status').textContent='公开记录暂不可用，本地记录仍可编辑';});
  function save() {
    edited=true;
    data.updatedAt=new Date().toISOString();
    try { localStorage.setItem(key,JSON.stringify(data)); storageOK=true; status.textContent='已保存到此浏览器 · '+new Date().toLocaleTimeString('zh-CN'); }
    catch(_) {storageOK=false; status.textContent='保存失败：浏览器存储不可用，请立即导出备份';}
  }
  function render() {
    const average=Math.round(data.phases.reduce((s,p)=>s+p.progress,0)/10);
    host.querySelector('#flight-total').innerHTML=average+'<small>%</small>';
    host.querySelector('#flight-meter').value=average;
    const hero=document.querySelector('#flight-hero-progress');
    if(hero){hero.textContent=average+'%';document.querySelector('#flight-hero-status').textContent=data.phases.filter(p=>p.progress===100).length+' / 10 阶段完成 · '+(plans[data.phases.findIndex(p=>p.progress<100)]?.[0] || '全部完成');}
    host.querySelector('#flight-completed').textContent=data.phases.filter(p=>p.progress===100).length+' / 10 阶段已完成';
    data.phases.forEach((p,i)=>{
      const node=host.querySelector(`[data-node="${i}"]`);
      node.classList.toggle('is-complete',p.progress===100);
      node.setAttribute('aria-pressed',String(i===selected));
      node.style.setProperty('--progress',p.progress+'%');
      host.querySelector(`[data-node-pct="${i}"]`).textContent=p.progress+'%';
      const slider=host.querySelector(`[data-slider="${i}"]`);
      slider.value=p.progress; slider.style.setProperty('--progress',p.progress+'%');
      host.querySelector(`[data-pct="${i}"]`).textContent=p.progress+'%';
      host.querySelector(`[data-stage="${i}"]`).hidden=i!==selected;
      const note=host.querySelector(`[data-note="${i}"]`);
      if(note.value!==p.note) note.value=p.note;
      host.querySelector(`[data-note-hint="${i}"]`).textContent=p.note?'· 已记录':'';
    });
  }
  host.addEventListener('input',e=>{
    if(e.target.matches('[data-slider]')) {data.phases[Number(e.target.dataset.slider)].progress=Number(e.target.value); save(); render();}
    if(e.target.matches('[data-note]')) {data.phases[Number(e.target.dataset.note)].note=e.target.value; save(); render();}
  });
  host.addEventListener('click',e=>{
    const node=e.target.closest('[data-node]');
    const next=e.target.closest('[data-next]');
    const complete=e.target.closest('[data-complete]');
    if(node) {selected=Number(node.dataset.node);render();}
    if(next) {selected=(Number(next.dataset.next)+1)%10;render();host.querySelector(`[data-node="${selected}"]`).focus();}
    if(complete) {data.phases[Number(complete.dataset.complete)].progress=100;save();render();}
  });
  host.querySelector('#flight-export').addEventListener('click',()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const a=document.createElement('a'); a.href=url;a.download='cutus-flight-progress-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    status.textContent=storageOK?'已生成备份文件，请妥善保留':'已生成备份；浏览器保存仍不可用';
  });
  const file=host.querySelector('#flight-file');
  host.querySelector('#flight-import').addEventListener('click',()=>file.click());
  file.addEventListener('change',async()=>{
    try {
      if(!file.files[0]) return;
      if(file.files[0].size>250000) throw Error();
      const imported=JSON.parse(await file.files[0].text());
      if(!valid(imported)) throw Error();
      if(!confirm('将用备份替换当前 10 个阶段的进度与笔记，是否继续？')) return;
      data={version:2,phases:imported.phases.map(p=>({progress:p.progress,note:p.note})),updatedAt:null};save();render();
    } catch(_){status.textContent='导入失败：请选择有效的学习进度 JSON 备份，当前记录未改变';}
    finally {file.value='';}
  });
  window.addEventListener('storage',e=>{
    if(e.key!==key) return;
    try {const incoming=JSON.parse(e.newValue);if(valid(incoming)){data=incoming;render();status.textContent='已同步另一个标签页的记录';}}
    catch(_) {status.textContent='另一个标签页的记录无效，保留当前显示';}
  });
  render();
})();
