import express from 'express';import cors from 'cors';
const {GROQ_API_KEY:GK,GEMINI_API_KEY:MK,ADMIN_PASSPHRASE:AP,ALLOWED_ORIGIN}=process.env;
const app=express();app.disable('x-powered-by');app.use((q,r,n)=>{r.set({'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store'});n()});app.use(cors({origin:ALLOWED_ORIGIN||'*'}));app.use(express.json({limit:'1mb'}));
const SYS=`You are AMITH, an autonomous multimodal intelligent technology hub: polished, calm, mildly witty, J.A.R.V.I.S.-like. Address the user as "sir". Replies are spoken aloud, so use short plain sentences with no markdown. Never reveal keys or secrets. Irreversible actions (deletes, reboots, payments) need explicit verbal authorisation. You are a chat assistant: do not claim to control devices or cameras.`;
// rate limit: 30 req/min/IP
const hits=new Map();app.use((q,r,n)=>{const k=q.ip,t=Date.now(),a=(hits.get(k)||[]).filter(x=>t-x<6e4);a.push(t);hits.set(k,a);a.length>30?r.status(429).json({error:'slow down'}):n()});
// auto-detect best live model per provider (cached 1h)
let cache,at=0;
async function detect(){if(cache&&Date.now()-at<36e5)return cache;const o={};
if(GK)try{const j=await(await fetch('https://api.groq.com/openai/v1/models',{headers:{Authorization:'Bearer '+GK}})).json();
const ids=j.data.filter(m=>m.active!==false).map(m=>m.id).filter(i=>!/whisper|tts|guard|playai|embed|orpheus/.test(i));
o.groq=[/llama-3\.3-70b/,/gpt-oss-120b/,/llama-3\.1-70b/,/gpt-oss-20b/,/llama-3\.1-8b/].map(p=>ids.find(i=>p.test(i))).find(Boolean)||ids[0]}catch{}
if(MK)try{const j=await(await fetch('https://generativelanguage.googleapis.com/v1beta/models',{headers:{'x-goog-api-key':MK}})).json();
const ok=j.models.filter(m=>m.supportedGenerationMethods?.includes('generateContent')).map(m=>m.name.replace('models/','')).filter(n=>/^gemini-[\d.]+-flash(-lite)?$/.test(n));
ok.sort((a,b)=>parseFloat(b.split('-')[1])-parseFloat(a.split('-')[1])||a.length-b.length);o.gemini=ok[0]}catch{}
at=Date.now();return cache=o}
async function groq(m,msgs,sys){const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+GK,'Content-Type':'application/json'},body:JSON.stringify({model:m,messages:[{role:'system',content:sys},...msgs],temperature:.6,max_tokens:500})});if(!r.ok)throw 0;return(await r.json()).choices[0].message.content}
async function gem(m,msgs,sys){const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`,{method:'POST',headers:{'x-goog-api-key':MK,'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:sys}]},contents:msgs.map(x=>({role:x.role==='assistant'?'model':'user',parts:[{text:x.content}]}))})});if(!r.ok)throw 0;return(await r.json()).candidates[0].content.parts[0].text}
app.get('/',(q,r)=>r.send('AMITH API online'));
app.get('/api/health',(q,r)=>r.json({ok:true,t:Date.now()}));
app.get('/api/models',async(q,r)=>{const m=await detect(),p=m.groq?'groq':m.gemini?'gemini':null;p?r.json({provider:p,model:m[p],available:m}):r.status(503).json({error:'no provider key set'})});
app.post('/api/chat',async(q,r)=>{const m=await detect(),admin=!!AP&&q.body.passphrase===AP;
const msgs=(q.body.messages||[]).slice(-12).map(x=>({role:x.role==='assistant'?'assistant':'user',content:String(x.content).slice(0,2000)}));
const sys=SYS+(q.body.ctx?' Context: '+String(q.body.ctx).slice(0,500)+'.':'')+(admin?' The speaker is verified ADMIN.':' The speaker is an unverified GUEST: read-only information only.');
for(const[p,f]of[['groq',groq],['gemini',gem]])if(m[p])try{return r.json({reply:await f(m[p],msgs,sys),provider:p,model:m[p],admin})}catch{}
r.status(503).json({error:'all providers failed'})});
app.post('/api/vision',async(q,r)=>{const m=await detect(),img=String(q.body.image||'');if(!MK||!m.gemini)return r.status(503).json({error:'vision needs GEMINI_API_KEY'});if(!img||img.length>9e5)return r.status(400).json({error:'bad image'});
try{const x=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m.gemini}:generateContent`,{method:'POST',headers:{'x-goog-api-key':MK,'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:SYS}]},contents:[{role:'user',parts:[{inline_data:{mime_type:'image/jpeg',data:img}},{text:String(q.body.prompt||'Describe this.').slice(0,500)}]}]})});if(!x.ok)throw 0;r.json({reply:(await x.json()).candidates[0].content.parts[0].text,model:m.gemini})}catch{r.status(502).json({error:'vision failed'})}});
app.listen(process.env.PORT||3000,()=>console.log('AMITH API up'));
