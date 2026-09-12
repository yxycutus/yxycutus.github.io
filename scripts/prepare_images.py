"""Prepare faithful, smaller web renditions; source files in picture/ stay intact."""
from pathlib import Path
from PIL import Image, ImageOps
import json
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'assets'/'gallery'
OUT.mkdir(parents=True,exist_ok=True)
entries=[
 ('asbeck-2006','Alan T. Asbeck spine示意图.png','微刺与粗糙表面的接触几何','Asbeck et al. · 2006','刺尖、接近方向与可用接触角的关系。'),
 ('hawkes-2015','Elliot W. Hawkes剪切敏感材料.png','剪切方向与干黏附接合','Hawkes et al. · 2015','不同加载方向下的微结构接触状态。'),
 ('pope-2017','Morgan T. Pope scamp攀爬无人机.png','SCAMP 飞行攀爬机器人','Pope et al. · 2017','装配、机构分解与机器人实物对照。'),
 ('ruffatto-2014','Donald Ruffatto 静电吸附.png','静电与干黏附复合垫','Ruffatto et al. · 2014','嵌入电极与方向性干黏附微结构。'),
 ('modabberifar-2018','Mehdi Modabberifar SMA驱动吸附.png','腱驱动夹爪的受力示意','Modabberifar et al. · 2018','相向剪切加载与竖直承载方向。'),
 ('federle-2019','Walter Federle剪切敏感.png','生物附着中的方向性','Federle · 2019','拉动、推动与附着垫接触稳定性的关系。'),
 ('shen-2025','Yunian Shen 机器学习.png','飞行栖停的预测与控制流程','Shen et al. · 2025','从仿真和实验数据，到学习模型与栖停控制。'),
 ('yu-2024','ZhiWei Yu 柔软 PU 黏附材料微重力黏附.png','柔软黏附材料的表面适应','Yu et al. · 2024','不同接触状态下的界面形貌与贴合对照。'),
 ('fang-2026','Zhiyue FANG仿猫爪.png','仿猫爪双模夹爪的工作原理','Fang et al. · 2026','穿刺与拔出两种动作的机构关系。'),
 ('perching-concept','双模态栖息无人机.png','双模态栖息无人机概念模型','Cutus · 项目概念图','整机布局与上置附着机构的概念设计。'),
 ('perching-side','侧视图.png','栖息机构侧视与部件标注','Cutus · 项目概念图','弹簧膜片、吸附装置、微刺与 SMA 的布局示意。'),
 ('crazyflie','crazyfile 2.1brushless.png','Crazyflie 2.1 Brushless 平台','Crazyflie · 学习平台','飞控学习与栖息研究采用的平台示意。'),
 ('ustc-campus','西区我爱科大.jpg','中国科大西区 · 我爱科大','USTC · 校园影像','科研与学习之外，也记录校园里的日常。')]
manifest=[]
for slug,name,title,credit,caption in entries:
 im=ImageOps.exif_transpose(Image.open(ROOT/'picture'/name))
 # This supplied campus JPEG has a damaged grey lower region; only the intact view is used.
 if slug=='ustc-campus': im=im.crop((0,0,im.width,1380))
 im.thumbnail((1600,1600),Image.Resampling.LANCZOS)
 if im.mode not in ('RGB','RGBA'): im=im.convert('RGB')
 im.save(OUT/(slug+'.webp'),'WEBP',quality=88,method=6)
 manifest.append(dict(slug=slug,file=name,title=title,credit=credit,caption=caption,width=im.width,height=im.height))
 thumb=im.copy();thumb.thumbnail((640,640),Image.Resampling.LANCZOS);thumb.save(OUT/(slug+'-thumb.webp'),'WEBP',quality=84,method=6)
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(f'{len(entries)} images prepared; full web renditions: {sum((OUT/(e[0]+".webp")).stat().st_size for e in entries):,} bytes')
