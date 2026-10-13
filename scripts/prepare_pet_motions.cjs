// Package approved, aligned animation frames. The source directory is read-only.
// node scripts/prepare_pet_motions.cjs --source <动作轻动画目录>
// SHARP_MODULE can point to an existing installation of sharp.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require(process.env.SHARP_MODULE||'sharp');
const sourceArg=process.argv.indexOf('--source');
if(sourceArg<0||!process.argv[sourceArg+1])throw Error('Pass --source <动作轻动画目录>');
const source=path.resolve(process.argv[sourceArg+1]);
const destination=path.resolve(__dirname,'../assets/pet/motions');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const aliases={resources:'resource',results:'achievement',team:'recruit'};
const expected=['welcome','mentor','project','resource','achievement','notice','lecture','recruit','thinking'];
(async()=>{
 const manifestBytes=fs.readFileSync(path.join(source,'manifest.json'));
 const entries=JSON.parse(manifestBytes.toString('utf8'));
 if(entries.length!==9)throw Error('Expected nine approved animations');
 const motions={},sources=[{file:'manifest.json',sha256:hash(manifestBytes)}];
 for(const entry of entries){
  const id=aliases[entry.key]||entry.key;
  if(!expected.includes(id)||motions[id]||entry.width!==512||entry.height!==512)throw Error('Unexpected scene '+id);
  const used=[...new Set(entry.timeline.map(step=>step.frame))],excluded=entry.excludedFrames||[];
  if(used.some(frame=>!Number.isInteger(frame)||frame<0||frame>5||excluded.includes(frame)))throw Error('Invalid or excluded frame in '+id);
  if(entry.timeline.some(step=>!Number.isInteger(step.durationMs)||step.durationMs<50)||entry.timeline.reduce((sum,s)=>sum+s.durationMs,0)!==entry.durationMs)throw Error('Invalid timing in '+id);
  const inputs=[];
  for(const [index,frame] of used.entries()){
   const relative=`帧序列/${entry.key}/${frame}.png`,bytes=fs.readFileSync(path.join(source,relative));
   const meta=await sharp(bytes).metadata();
   if(meta.width!==512||meta.height!==512||!meta.hasAlpha)throw Error('Expected transparent 512px frame '+relative);
   const {data}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   let transparent=0;for(let i=3;i<data.length;i+=4)if(data[i]===0)transparent++;
   if(transparent<512*512*.2||[3,511*4+3,511*512*4+3,data.length-1].some(i=>data[i]!==0))throw Error('Background is not clear: '+relative);
   sources.push({file:relative,sha256:hash(bytes)});inputs.push({input:bytes,left:index*512,top:0});
  }
  const atlas=await sharp({create:{width:512*used.length,height:512,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(inputs).webp({quality:90,alphaQuality:100}).toBuffer();
  fs.mkdirSync(destination,{recursive:true});
  const file=`${id}-${hash(atlas).slice(0,12)}.webp`;fs.writeFileSync(path.join(destination,file),atlas);
  motions[id]={file,width:512,height:512,columns:used.length,timeline:entry.timeline.map(s=>({frame:used.indexOf(s.frame),durationMs:s.durationMs,sourceFrame:s.frame})),durationMs:entry.durationMs,excludedSourceFrames:excluded,bytes:atlas.length};
 }
 fs.writeFileSync(path.join(destination,'manifest.json'),JSON.stringify({version:1,motions,sourceFiles:sources},null,2)+'\n');
 console.log(`PASS: nine transparent atlases; ${sources.length-1} approved unique frames; ${Object.values(motions).reduce((sum,m)=>sum+m.bytes,0).toLocaleString()} bytes; source unchanged.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
