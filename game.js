// ═══════════════════════════════════════════
// 萌糖消了个消 — 微信小游戏 Canvas 版
// 视觉 1:1 复刻 ct256.cn/unscrew
// ═══════════════════════════════════════════

const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');

// ── roundRect polyfill ──
if (!ctx.roundRect) {
  ctx.roundRect = function(x, y, w, h, r) {
    if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
    this.beginPath();
    this.moveTo(x + r.tl, y);
    this.lineTo(x + w - r.tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
    this.lineTo(x + w, y + h - r.br);
    this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
    this.lineTo(x + r.bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
    this.lineTo(x, y + r.tl);
    this.quadraticCurveTo(x, y, x + r.tl, y);
    this.closePath();
  };
}

// ── ellipse polyfill ──
if (!ctx.ellipse) {
  ctx.ellipse = function(x, y, rx, ry, rotation, startAngle, endAngle, anticlockwise) {
    this.save();
    this.translate(x, y);
    this.rotate(rotation);
    this.scale(rx / ry, 1);
    this.arc(0, 0, ry, startAngle, endAngle, anticlockwise);
    this.restore();
  };
}

const sysInfo = wx.getSystemInfoSync();
const W = sysInfo.windowWidth, H = sysInfo.windowHeight;
canvas.width = W; canvas.height = H;

// ── 颜色（完整：face + pattern 从 web 版 1:1） ──
const COLORS = [
  { name:'白', hex:'#e8e8e0', light:'#ffffff', face:'bunny', pattern:'crosshatch' },
  { name:'紫', hex:'#af52de', light:'#d4a0f0', face:'shy',   pattern:'diagonal' },
  { name:'红', hex:'#ff3b30', light:'#ff8a80', face:'happy', pattern:'dots' },
  { name:'蓝', hex:'#007aff', light:'#6cb6ff', face:'cool',  pattern:'vstripes' },
  { name:'橙', hex:'#ff9500', light:'#ffc04d', face:'wow',   pattern:'concentric' },
  { name:'绿', hex:'#34c759', light:'#84d89a', face:'silly', pattern:'checker' },
  { name:'黄', hex:'#ffcc00', light:'#ffe566', face:'chill', pattern:'hstripes' },
  { name:'粉', hex:'#ff6b35', light:'#ffb088', face:'fire',  pattern:'waves' }
];

// ── 面孔表情渲染函数（web CSS .face-xxx .screw-inner::after） ──
function drawFace(ctx, face, sx, sy, sr) {
  // web .screw-inner::after: top:55% left:50% → center at (sx, sy+0.10*sr), 56%×36% ellipse
  // Default eyes: dark circle r=0.168*sr at ±0.269*sr horizontal, sy+0.028*sr vertical
  // White highlights: dot r=0.056*sr at slightly offset positions
  const fcy = sy + sr * 0.10, frx = sr * 0.56, fry = sr * 0.36;
  const eX = sr * 0.27;       // eye horizontal offset from center
  const eY = sy + sr * 0.03;  // eye vertical position
  const eR = sr * 0.17;       // default eye radius (web: 18% of gradient radius)
  const hR = sr * 0.05;       // white highlight dot radius (web: 6%)
  ctx.save();
  // 裁剪到表情椭圆区域
  ctx.beginPath(); ctx.ellipse(sx, fcy, frx, fry, 0, 0, Math.PI * 2); ctx.clip();

  // ── 共有的半透明高光 ──
  const fg = ctx.createRadialGradient(sx, fcy, 0, sx, fcy, frx);
  fg.addColorStop(0.3, 'rgba(255,255,255,0.5)');
  fg.addColorStop(0.7, 'transparent');
  ctx.fillStyle = fg;
  ctx.beginPath(); ctx.ellipse(sx, fcy, frx, fry, 0, 0, Math.PI * 2); ctx.fill();

  // ── WEB 风格：纯黑圆眼（无白眼球底） ──
  if (face === 'happy' || face === 'shy') {
    // 眯眼 = thin dark ring (web: transparent 6%, #1a1a1a 7%, transparent 9%)
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = sr*0.028;
    [sx-eX, sx+eX].forEach(ex => {
      ctx.beginPath(); ctx.arc(ex, eY, eR*0.38, 0, Math.PI*2); ctx.stroke();
    });
    if (face === 'shy') {
      ctx.fillStyle = 'rgba(255, 150, 150, 0.6)';
      ctx.beginPath(); ctx.arc(sx - sr*0.28, sy + sr*0.18, sr*0.1, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + sr*0.28, sy + sr*0.18, sr*0.1, 0, Math.PI*2); ctx.fill();
    }
  } else if (face === 'cool') {
    // 大眼珠 (web: 15% of face gradient radius = 0.14*sr) + 墨镜水平线
    ctx.fillStyle = '#1a1a1a';
    [sx-eX, sx+eX].forEach(ex => {
      ctx.beginPath(); ctx.arc(ex, eY, eR*0.82, 0, Math.PI*2); ctx.fill();
    });
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = sr*0.06;
    ctx.beginPath(); ctx.moveTo(sx-sr*0.28, eY-sr*0.1); ctx.lineTo(sx+sr*0.28, eY-sr*0.1); ctx.stroke();
  } else if (face === 'silly') {
    // 中眼珠 (web: 15% = 0.14*sr) + 吐舌头
    ctx.fillStyle = '#1a1a1a';
    [sx-eX, sx+eX].forEach(ex => {
      ctx.beginPath(); ctx.arc(ex, eY + sr*0.02, eR*0.82, 0, Math.PI*2); ctx.fill();
    });
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath(); ctx.arc(sx, sy + sr*0.25, sr*0.1, 0, Math.PI*2); ctx.fill();
  } else if (face === 'wow') {
    // 超大眼珠 + 白高光 + 全边框 (web: border:3px solid)
    ctx.fillStyle = '#1a1a1a';
    [sx-eX, sx+eX].forEach(ex => {
      ctx.beginPath(); ctx.arc(ex, eY, eR*1.1, 0, Math.PI*2); ctx.fill();
    });
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(sx-eX-sr*0.03, eY-sr*0.03, hR*1.1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx+eX-sr*0.03, eY-sr*0.03, hR*1.1, 0, Math.PI*2); ctx.fill();
  } else if (face === 'chill') {
    // 小眼珠 (web: 10% = 0.094*sr)
    ctx.fillStyle = '#1a1a1a';
    [sx-sr*0.2, sx+sr*0.2].forEach(ex => {
      ctx.beginPath(); ctx.arc(ex, eY + sr*0.02, eR*0.55, 0, Math.PI*2); ctx.fill();
    });
  } else if (face === 'bunny') {
    // 大眼珠 (web: 18% = 0.168*sr) — bunny 无白高光
    ctx.fillStyle = '#1a1a1a';
    [sx-eX, sx+eX].forEach(ex => {
      ctx.beginPath(); ctx.arc(ex, eY, eR*1.0, 0, Math.PI*2); ctx.fill();
    });
  } else if (face === 'fire') {
    // 大眼珠 (web: 16% = 0.15*sr) + 白高光 + 火焰
    ctx.fillStyle = '#1a1a1a';
    [sx-eX, sx+eX].forEach(ex => {
      ctx.beginPath(); ctx.arc(ex, eY, eR*0.9, 0, Math.PI*2); ctx.fill();
    });
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(sx-eX-sr*0.02, eY-sr*0.02, hR, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx+eX-sr*0.02, eY-sr*0.02, hR, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffd700';
    ctx.beginPath(); ctx.arc(sx, sy-sr*0.3, hR*1.5, 0, Math.PI*2); ctx.fill();
  }

  // 嘴角 — web border-bottom: 3px (bunny=2px), wow=全边框3px
  if (face === 'bunny') {
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = sr*0.04;
    ctx.beginPath(); ctx.ellipse(sx, fcy+fry*0.65, frx*0.55, fry*0.06, 0, Math.PI*1.15, Math.PI*1.85); ctx.stroke();
  } else if (face === 'wow') {
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = sr*0.06;
    ctx.beginPath(); ctx.ellipse(sx, fcy, frx, fry, 0, 0, Math.PI*2); ctx.stroke();
  } else {
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = sr*0.064;
    ctx.beginPath(); ctx.ellipse(sx, fcy+fry*0.65, frx*0.55, fry*0.06, 0, Math.PI*1.15, Math.PI*1.85); ctx.stroke();
  }
  ctx.restore();
}

// ── 图案纹理（web CSS .pat-xxx::after） ──
function drawPattern(ctx, pattern, sx, sy, sr) {
  ctx.save();
  ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.clip();
  const alpha = 0.15;
  if (pattern === 'crosshatch') {
    ctx.strokeStyle = `rgba(0,0,0,${alpha})`; ctx.lineWidth = sr * 0.03;
    for (let i = -sr; i < sr * 2; i += sr * 0.25) {
      ctx.beginPath(); ctx.moveTo(sx - sr, sy + i); ctx.lineTo(sx + sr, sy + i); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx + i, sy - sr); ctx.lineTo(sx + i, sy + sr); ctx.stroke();
    }
  } else if (pattern === 'diagonal') {
    ctx.strokeStyle = `rgba(0,0,0,${alpha * 1.2})`; ctx.lineWidth = sr * 0.036;
    for (let i = -sr * 2; i < sr * 3; i += sr * 0.3) {
      ctx.beginPath(); ctx.moveTo(sx + i, sy - sr); ctx.lineTo(sx + i + sr * 1.4, sy + sr); ctx.stroke();
    }
  } else if (pattern === 'dots') {
    ctx.fillStyle = `rgba(0,0,0,${alpha * 1.2})`;
    const ds = sr * 0.35;
    for (let dy = -sr; dy < sr; dy += ds) {
      for (let dx = -sr; dx < sr; dx += ds) {
        ctx.beginPath(); ctx.arc(sx + dx + ds * 0.5 * ((dy / ds) % 2), sy + dy, sr * 0.06, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else if (pattern === 'vstripes') {
    ctx.strokeStyle = `rgba(0,0,0,${alpha * 1.3})`; ctx.lineWidth = sr * 0.035;
    for (let x = sx - sr; x <= sx + sr; x += sr * 0.25) {
      ctx.beginPath(); ctx.moveTo(x, sy - sr); ctx.lineTo(x, sy + sr); ctx.stroke();
    }
  } else if (pattern === 'concentric') {
    ctx.strokeStyle = `rgba(0,0,0,${alpha * 0.9})`; ctx.lineWidth = sr * 0.04;
    for (let r = sr * 0.15; r < sr; r += sr * 0.28) {
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (pattern === 'checker') {
    ctx.fillStyle = `rgba(0,0,0,${alpha * 1.0})`;
    const cs = sr * 0.45;
    for (let dy = -sr; dy < sr; dy += cs) {
      for (let dx = -sr; dx < sr; dx += cs) {
        if (((dx / cs + dy / cs) % 2 + 2) % 2 === 0) {
          ctx.beginPath(); ctx.arc(sx + dx + cs * 0.5, sy + dy + cs * 0.5, cs * 0.4, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  } else if (pattern === 'hstripes') {
    ctx.strokeStyle = `rgba(0,0,0,${alpha * 1.3})`; ctx.lineWidth = sr * 0.035;
    for (let y = sy - sr; y <= sy + sr; y += sr * 0.25) {
      ctx.beginPath(); ctx.moveTo(sx - sr, y); ctx.lineTo(sx + sr, y); ctx.stroke();
    }
  } else if (pattern === 'waves') {
    ctx.fillStyle = `rgba(0,0,0,${alpha * 0.8})`;
    const ws = sr * 0.22;
    for (let dy = -sr; dy < sr; dy += ws) {
      for (let dx = -sr; dx < sr; dx += ws * 1.5) {
        ctx.beginPath(); ctx.arc(sx + dx, sy + dy, sr * 0.04, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  ctx.restore();
}

const MAX_SLOTS=5, MATCH_COUNT=3, COMBO_TIMEOUT=1500;

// ── 状态 ──
let screws=[], slots=[], score=0, level=1, combo=0;
let history=[], processing=false, paused=false;
let comboTimer=null, totalScrewCount=0, starMoves=0, winStars=0, winEfficiency=0;
let props={undo:5,bomb:3,peek:3,lightning:3,shuffle:3};
let coins=30, particles=[], dyingScrews=[], comboPops=[], slotAnims=[];
let toastMsg='', toastTimer=null, showWinOverlay=false, showLoseOverlay=false, losePct=0;
let peekTargets=[], peekTimer=null, propButtons=[], boardShake=0;

// ── 主题系统 ──
const SKINS=[
  {id:'default',name:'星空',bgTop:'#0c0c1d',bgMid:'#16162e',bgBot:'#0d0d1f', boardTop:'#c89b5e',boardMid:'#d4a96a',boardBot:'#8a6028', boardBorder:'#5a3a1a'},
  {id:'metal',name:'金属',bgTop:'#1a1a2e',bgMid:'#16213e',bgBot:'#0f3460', boardTop:'#64748b',boardMid:'#787f8a',boardBot:'#4a5058', boardBorder:'#334155'},
  {id:'gem',name:'宝石',bgTop:'#0f0720',bgMid:'#1a0a2e',bgBot:'#120522', boardTop:'#1e1035',boardMid:'#251545',boardBot:'#0f0818', boardBorder:'#4a2080'},
  {id:'candy',name:'糖果',bgTop:'#2d1520',bgMid:'#3d1f2a',bgBot:'#251018', boardTop:'#fcd9e0',boardMid:'#f8b8c8',boardBot:'#e88296', boardBorder:'#d4607a'},
  {id:'nature',name:'自然',bgTop:'#1a2a1a',bgMid:'#1e3018',bgBot:'#142014', boardTop:'#c4a87c',boardMid:'#d4b88c',boardBot:'#a08050', boardBorder:'#6b5030'},
];
let activeSkin='default', showSkinPicker=false;

// ── 每日签到 ──
const CK_REWARDS=[{d:1,c:10},{d:2,c:15,prop:'undo'},{d:3,c:20},{d:4,c:25,prop:'bomb'},{d:5,c:30},{d:6,c:40,prop:'peek'},{d:7,c:50,props:['lightning','shuffle']}];
let ckData={streak:0,lastDate:''}, showCheckin=false;

// ── 背景音乐 ──
let bgmOn=false, bgmInterval=null, bgmNoteIdx=0;

function saveGame(){try{wx.setStorageSync('u_lv',level);wx.setStorageSync('u_sc',score);wx.setStorageSync('u_co',coins);wx.setStorageSync('u_pr',props)}catch(e){}}
function loadGame(){try{level=wx.getStorageSync('u_lv')||1;score=wx.getStorageSync('u_sc')||0;coins=wx.getStorageSync('u_co')||30;const p=wx.getStorageSync('u_pr');if(p)props=p}catch(e){}}

// ── 主题 ──
function loadSkin(){try{activeSkin=wx.getStorageSync('skin')||'default'}catch(e){}}
function setSkin(sid){activeSkin=sid;try{wx.setStorageSync('skin',sid)}catch(e){};showSkinPicker=false}
function getSkin(){return SKINS.find(s=>s.id===activeSkin)||SKINS[0]}

// ── 每日签到 ──
function loadCheckin(){try{const d=wx.getStorageSync('checkin');if(d){ckData=d}}catch(e){}}
function getToday(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}
function doCheckin(){
  const today=getToday();
  if(ckData.lastDate===today)return;
  const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
  const yd=yesterday.getFullYear()+'-'+(yesterday.getMonth()+1)+'-'+yesterday.getDate();
  if(ckData.lastDate===yd)ckData.streak++;else ckData.streak=1;
  if(ckData.streak>7)ckData.streak=1;
  ckData.lastDate=today;
  const rwd=CK_REWARDS[ckData.streak-1];
  coins+=rwd.c;
  if(rwd.prop){props[rwd.prop]=(props[rwd.prop]||0)+1}
  if(rwd.props){rwd.props.forEach(p=>{props[p]=(props[p]||0)+1})}
  try{wx.setStorageSync('checkin',ckData)}catch(e){}
  const propNames=[rwd.prop,...(rwd.props||[])].filter(Boolean);
  showToast('签到第'+ckData.streak+'天! +'+rwd.c+'🪙'+(propNames.length?' +'+propNames.join('+'):''));
  saveGame();
}

// ── 商店 ──
const SHOP_ITEMS=[{id:'undo',icon:'↩️',name:'撤回',desc:'撤回一步',price:10,qty:5},{id:'bomb',icon:'💣',name:'炸弹',desc:'清空收集槽',price:10,qty:3},{id:'peek',icon:'👁️',name:'透视',desc:'高亮可点糖果3秒',price:10,qty:3},{id:'lightning',icon:'⚡',name:'闪电',desc:'消除槽内最多颜色×2',price:15,qty:3},{id:'shuffle',icon:'🔀',name:'洗牌',desc:'随机重排棋盘颜色',price:20,qty:3}];
let showShopOverlay=false;
function buyItem(id,price,qty){if(coins<price){showToast('金币不足');return}coins-=price;props[id]+=qty;saveGame();showToast('购买成功! +'+qty+' '+id)}

// ── 每日挑战 ──
let dailyMode=false;
function seedRandom(s){var a=s;return function(){var t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function getDailySeed(){var d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate()}
let _origRandom=Math.random;
function startDailyChallenge(){dailyMode=true;Math.random=seedRandom(getDailySeed());generateLevel();Math.random=_origRandom;dailyMode=false;showToast('🔥 每日挑战!')}

// ── 选关 ──
let showLvlPicker=false, lvlPickerScroll=0;
function getCleared(){try{return JSON.parse(wx.getStorageSync('cleared')||'[]')}catch(e){return[]}}
function markCleared(lv){var c=getCleared();if(c.indexOf(lv)<0){c.push(lv);wx.setStorageSync('cleared',JSON.stringify(c))}}

// ── 教程 ──
const TUT_STEPS=[{icon:'🍬',title:'点击萌糖',desc:'点击彩色萌糖把它摘下来，萌糖会自动飞入下方收集槽'},{icon:'✨',title:'凑齐3个消除',desc:'收集槽里凑齐3个同色萌糖自动消除，获得30分！'},{icon:'🔥',title:'连击加分',desc:'连续消除触发连击，每次连击额外加分。3连击以上有大奖！'},{icon:'💣',title:'道具助阵',desc:'卡住了用道具：撤回/炸弹/透视/闪电/洗牌，商店购买更划算'}];
let tutIdx=0, tutDone=false, showTutorialOverlay=false;
function nextTutorial(){tutIdx++;if(tutIdx>=TUT_STEPS.length){showTutorialOverlay=false;tutDone=true;try{wx.setStorageSync('tut_done','1')}catch(e){}}}
function skipTutorial(){showTutorialOverlay=false;tutDone=true;try{wx.setStorageSync('tut_done','1')}catch(e){}}

// ── 分享卡 ──
let showShareOverlay=false;
function generateShareCard(){showShareOverlay=true;showToast('📤 用微信分享给好友')}

// ── 排行榜 ──
let showLB=false, lbData=[], lbPeriod='all';
function loadLB(){try{lbData=JSON.parse(wx.getStorageSync('lb')||'[]')}catch(e){lbData=[]}}
function submitLB(){var today=getToday();var entry={nick:nickname||'萌糖玩家',score:score,level:level,date:today};lbData.push(entry);lbData.sort((a,b)=>b.score-a.score);if(lbData.length>50)lbData=lbData.slice(0,50);wx.setStorageSync('lb',JSON.stringify(lbData))}

// ── 本地登录/昵称 ──
let nickname='', avatarUrl='', showLoginOverlay=false, userInfoBtn=null;
function loadNick(){try{nickname=wx.getStorageSync('nick')||'';avatarUrl=wx.getStorageSync('avatar')||''}catch(e){}}
function setNick(n,a){nickname=n;avatarUrl=a||'';try{wx.setStorageSync('nick',n);if(a)wx.setStorageSync('avatar',a)}catch(e){}}
function logoutUser(){nickname='';avatarUrl='';setNick('','');showToast('已退出')}
function showWxLoginBtn(){
  if(userInfoBtn){try{userInfoBtn.destroy()}catch(e){}}
  userInfoBtn=wx.createUserInfoButton({type:'text',text:'微信一键登录',style:{left:W/2-70,top:H/2+40,width:140,height:40,lineHeight:40,backgroundColor:'#07c160',color:'#ffffff',textAlign:'center',fontSize:15,borderRadius:20}});
  userInfoBtn.onTap(res=>{if(res.userInfo){setNick(res.userInfo.nickName,res.userInfo.avatarUrl);showToast('欢迎 '+res.userInfo.nickName);showLoginOverlay=false}try{userInfoBtn.destroy()}catch(e){}userInfoBtn=null})
}
function hideWxLoginBtn(){if(userInfoBtn){try{userInfoBtn.destroy()}catch(e){}userInfoBtn=null}}

// ── 背景音乐 ──
const BGM_NOTES=[262,294,330,349,392,440,494,523,440,392,349,330,294,262,330,392]; // C4-C5简谱
function stopBgm(){if(bgmInterval){clearInterval(bgmInterval);bgmInterval=null}}
function startBgm(){
  stopBgm();
  if(!bgmOn||!audioCtx)return;
  bgmNoteIdx=0;
  bgmInterval=setInterval(()=>{
    if(!bgmOn||!audioCtx){stopBgm();return}
    playTone(BGM_NOTES[bgmNoteIdx%BGM_NOTES.length],0.5,'sine',0.03);
    bgmNoteIdx++;
  },800);
}
function toggleBgm(){bgmOn=!bgmOn;try{wx.setStorageSync('bgm',bgmOn?'1':'0')}catch(e){};if(bgmOn)startBgm();else stopBgm()}

function showToast(msg){toastMsg=msg;if(toastTimer)clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toastMsg=''},1500)}
function shadeColor(hex,p){const n=parseInt(hex.slice(1),16),a=Math.round(2.55*p);const R=Math.max(0,Math.min(255,(n>>16)+a)),G=Math.max(0,Math.min(255,(n>>8&0xFF)+a)),B=Math.max(0,Math.min(255,(n&0xFF)+a));return'#'+(0x1000000+R*0x10000+G*0x100+B).toString(16).slice(1)}
function dist(a,b){return Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2)}
function circleOverlap(r1,r2,d){if(d>=r1+r2)return 0;if(d<=Math.abs(r1-r2))return Math.PI*Math.min(r1,r2)**2;const a=r1*r1*Math.acos((d*d+r1*r1-r2*r2)/(2*d*r1)),b=r2*r2*Math.acos((d*d+r2*r2-r1*r1)/(2*d*r2)),c=0.5*Math.sqrt((-d+r1+r2)*(d+r1-r2)*(d-r1+r2)*(d+r1+r2));return a+b-c}

function spawnParticles(cx,cy,hex){for(let i=0;i<10;i++){const a=Math.random()*Math.PI*2,s=1+Math.random()*3;particles.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,life:1,decay:0.02+Math.random()*0.03,size:2+Math.random()*4,color:hex})}}
function spawnComboPop(cx,cy,txt){comboPops.push({x:cx,y:cy,text:txt,life:1,size:txt.length>3?36:txt.length>1?28:22})}

// ── 遮挡 ──
function updateBlocked(removedId){
  if(removedId!==undefined){const rs=screws.find(s=>s.id===removedId);if(!rs)return;const rr=rs.size/2;for(const s of screws){if(s.removed||s.layer<=rs.layer)continue;const d=dist(s,rs);if(d<rr+s.size/2){let tc=0;const myA=Math.PI*(s.size/2)**2;for(const o of screws){if(o.removed||o.id===removedId||o.layer>=s.layer)continue;const d2=dist(s,o);if(d2<s.size/2+o.size/2)tc+=circleOverlap(s.size/2,o.size/2,d2)}s.blockedPct=Math.min(1,tc/myA);s.blocked=s.blockedPct>Math.max(0.35,0.5-Math.floor(level/10)*0.05)}}return}
  for(const s of screws){s.blocked=false;s.blockedPct=0}
  for(const s of screws){if(s.removed)continue;let tc=0;const myA=Math.PI*(s.size/2)**2;for(const o of screws){if(o.removed||o.layer>=s.layer)continue;const d=dist(s,o);if(d<s.size/2+o.size/2)tc+=circleOverlap(s.size/2,o.size/2,d)}s.blockedPct=Math.min(1,tc/myA);s.blocked=s.blockedPct>Math.max(0.35,0.5-Math.floor(level/10)*0.05)}
}

// ── 关卡生成 ──
function generateLevel(){
  screws=[];slots=[];history=[];combo=0;processing=false;starMoves=0;if(comboTimer){clearTimeout(comboTimer);comboTimer=null}particles=[];dyingScrews=[];comboPops=[];slotAnims=[];
  const numColors=Math.min(COLORS.length,5+(level%4)),screwsPerColor=Math.round(3*level),total=numColors*screwsPerColor;
  const levelColors=COLORS.slice(0,numColors),screwList=[];
  for(let c=0;c<numColors;c++)for(let i=0;i<screwsPerColor;i++)screwList.push({color:levelColors[c]});
  for(let i=screwList.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[screwList[i],screwList[j]]=[screwList[j],screwList[i]]}
  const numLayers=Math.max(3,Math.floor(total/7)),mid=(numLayers-1)/2,sigma=numLayers/3;
  const weights=[];let totalWeight=0;for(let li=0;li<numLayers;li++){const w=Math.exp(-(((li-mid)/sigma)**2));weights.push(w);totalWeight+=w}
  let idx=0;
  for(let li=0;li<numLayers&&idx<total;li++){
    const count=li===numLayers-1?total-idx:Math.round(total*weights[li]/totalWeight),used={};
    for(let b=0;b<count&&idx<total;b++){let x,y,key,attempts=0;do{x=4+Math.random()*92;y=4+Math.random()*92;key=Math.round(x/5)+'_'+Math.round(y/5);attempts++}while(used[key]&&attempts<30);used[key]=1;
      screws.push({id:idx,x,y,size:Math.max(10,22-Math.floor(level/3)*2),layer:li,color:screwList[idx].color,removed:false,blocked:false,blockedPct:0,removing:false});idx++}
  }
  screws.sort((a,b)=>b.layer-a.layer);screws.forEach((s,i)=>s.id=i);
  updateBlocked();
  for(let rr=0;rr<15;rr++){const bad=levelColors.filter(lc=>!screws.some(s=>!s.removed&&!s.blocked&&s.color.name===lc.name));if(bad.length===0)break;for(const bc of bad)for(const s of screws)if(!s.removed&&s.blocked&&s.color.name===bc.name)s.blocked=false;updateBlocked()}
  totalScrewCount=total;console.log('[unscrew] level',level,'screws',total,'colors',numColors);
}

// ── 求解器 ──
function isSolvable(){
  const N=screws.length,bt=Math.max(0.35,0.5-Math.floor(level/10)*0.05),coveredBy={};
  for(const s of screws){if(s.removed)continue;coveredBy[s.id]=[]}
  for(const s of screws){if(s.removed)continue;const r=s.size/2,myArea=Math.PI*r*r;let tc=0;for(const o of screws){if(o.removed||o.id===s.id||o.layer>=s.layer)continue;const d=dist(s,o);if(d<r+o.size/2){const a=circleOverlap(r,o.size/2,d);coveredBy[s.id].push({id:o.id,area:a/myArea});tc+=a}}if(tc/myArea<=bt)coveredBy[s.id]=[]}
  function isBlocked(sid,removed){const cb=coveredBy[sid];if(!cb||cb.length===0)return false;let sum=0;for(const c of cb)if(!removed[c.id])sum+=c.area;return sum>bt}
  const visited={},startTime=Date.now();
  function dfs(removed,slotsArr,remaining,depth){if(Date.now()-startTime>3000)return false;if(remaining===0&&slotsArr.length===0)return true;const key=remaining+'|'+slotsArr.slice().sort().join(',');if(visited[key])return false;visited[key]=true;const candidates=[];for(const s of screws){if(removed[s.id])continue;if(!isBlocked(s.id,removed))candidates.push(s)}candidates.sort((a,b)=>{const inA=slotsArr.filter(c=>c===a.color.name).length,inB=slotsArr.filter(c=>c===b.color.name).length;return inB-inA});for(const screw of candidates){if(slotsArr.length>=5&&slotsArr.filter(c=>c===screw.color.name).length<2)continue;let ns=slotsArr.slice();ns.push(screw.color.name);const cnt={};for(const c of ns)cnt[c]=(cnt[c]||0)+1;for(const cn in cnt){if(cnt[cn]>=3){ns=ns.filter(c=>c!==cn);break}}removed[screw.id]=true;if(dfs(removed,ns,remaining-1,depth+1))return true;delete removed[screw.id]}return false}
  const ri={};let riC=0;for(const s of screws){if(s.removed)ri[s.id]=true;else riC++}const si=slots.filter(Boolean).map(s=>s.color.name);return dfs(ri,si,riC,0)
}

// ── 游戏逻辑 ──
let _clickLock=0;
function processClick(screw){if(processing||paused||!screw||screw.blocked||screw.removed)return;const now=Date.now();if(now-_clickLock<250)return;_clickLock=now;processing=true;history.push({screwId:screw.id,slots:slots.map(s=>s?{id:s.id,color:s.color}:null),score,combo});dyingScrews.push({id:screw.id,x:screw.x,y:screw.y,size:screw.size,color:screw.color,life:1});screw.removed=true;starMoves++;slots.push({id:screw.id,color:screw.color});const slotIdx=slots.length-1;slotAnims.push({idx:slotIdx,type:'popIn',startTime:Date.now(),duration:250,color:screw.color.hex});sfxClick();updateBlocked(screw.id);checkMatches()}
function checkMatches(){const count={};slots.forEach((s,i)=>{if(!s)return;const k=s.color.name;if(!count[k])count[k]=[];count[k].push(i)});let mi=null;for(const cn in count){if(count[cn].length>=MATCH_COUNT){mi=count[cn].slice(0,MATCH_COUNT);break}}if(mi){processing=true;if(comboTimer)clearTimeout(comboTimer);combo++;const bonus=combo>1?combo*5:0;score+=30+bonus;sfxMatch();const cx=BOARD_X+BOARD_W/2,cy=BOARD_Y+BOARD_H*0.55;spawnParticles(cx,cy,slots[mi[0]].color.hex);const now2=Date.now();mi.forEach(idx=>slotAnims.push({idx,type:'glow',startTime:now2,duration:200,color:slots[idx].color.hex}));if(combo>=2)spawnComboPop(cx,cy-20,combo>=7?'🔥超级连击!':combo>=4?'⚡连击x'+combo:'combo x'+combo);comboTimer=setTimeout(()=>{combo=0},COMBO_TIMEOUT);setTimeout(()=>{mi.sort((a,b)=>b-a).forEach(i=>slots.splice(i,1));slots=slots.filter(Boolean);processing=false;if(screws.every(s=>s.removed)){sfxWin();setTimeout(winLevel,600)}},200)}else{if(slots.filter(Boolean).length>=MAX_SLOTS){processing=true;sfxLose();boardShake=1;const remain=screws.filter(s=>!s.removed).length;losePct=Math.round((totalScrewCount-remain)/totalScrewCount*100);setTimeout(()=>{showLoseOverlay=true;processing=false},400)}else{setTimeout(()=>{processing=false},250)}}saveGame()}
function winLevel(){
  // ⭐ 双维评级
  const efficiency=starMoves>0?Math.min(totalScrewCount/starMoves,1):1;
  const baseScore=totalScrewCount*10;
  const scoreRate=score>0?Math.min(score/baseScore/1.5,1):0;
  const combined=efficiency*0.6+scoreRate*0.4;
  winStars=combined>=0.85?3:combined>=0.70?2:1;
  winEfficiency=Math.round(efficiency*100);
  const clearedLv=level;
  score+=level*50;coins+=10+level*2;
  markCleared(clearedLv);
  submitLB();
  saveGame();
  showWinOverlay=true;
}
function restartLevel(){showLoseOverlay=false;showWinOverlay=false;generateLevel()}

// ── 道具 ──
function doUndo(){if(history.length===0)return false;showLoseOverlay=false;const last=history.pop();if(last.screwId!==null&&last.screwId!==undefined){const s=screws.find(x=>x.id===last.screwId);if(s){s.removed=false;s.blocked=false}const idx=slots.findIndex(sl=>sl&&sl.id===last.screwId);if(idx>=0)slots.splice(idx,1)}if(last.shuffleColors){for(const sc of last.shuffleColors){const s=screws.find(x=>x.id===sc.id);if(s)s.color=sc.color}}slots=last.slots.filter(Boolean);score=last.score;combo=last.combo;updateBlocked();return true}
function doBomb(){if(slots.filter(Boolean).length===0)return false;const last=slots.pop();const s=screws.find(x=>x.id===last.id);if(s){s.removed=false;s.blocked=false}sfxBomb();updateBlocked();return true}
function doPeek(){const targets=screws.filter(s=>!s.removed&&s.blocked);if(targets.length===0||props.peek<=0)return false;props.peek--;peekTargets=targets.map(t=>t.id);sfxPeek();if(peekTimer)clearTimeout(peekTimer);peekTimer=setTimeout(()=>{peekTargets=[]},3000);return true}
function doLightning(){const filled=slots.filter(Boolean);if(filled.length<2||props.lightning<=0)return false;props.lightning--;const groups={};filled.forEach(s=>{const k=s.color.name;if(!groups[k])groups[k]=[];groups[k].push(s)});let target=null;for(const k in groups){if(groups[k].length>=2){target=groups[k];break}}if(!target)return false;while(target.length>0&&slots.filter(Boolean).length>0){const idx=slots.findIndex(sl=>sl&&sl.color.name===target[0].color.name);if(idx>=0)slots.splice(idx,1);target.shift()}updateBlocked();return true}
function doShuffle(){const alive=screws.filter(s=>!s.removed);if(alive.length<2||props.shuffle<=0)return false;props.shuffle--;const colors=alive.map(s=>s.color);for(let i=colors.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[colors[i],colors[j]]=[colors[j],colors[i]]}history.push({screwId:null,slots:slots.map(s=>s?{id:s.id,color:s.color}:null),score,combo,shuffleColors:alive.map((s,i)=>({id:s.id,color:s.color}))});alive.forEach((s,i)=>{s.color=colors[i]});updateBlocked();return true}
function useProp(type){if(type==='undo'){if(doUndo()){props.undo--;showToast('已撤回')}}else if(type==='bomb'){if(doBomb()){props.bomb--;showToast('炸弹!')}}else if(type==='peek'){doPeek()}else if(type==='lightning'){if(doLightning())showToast('闪电!')}else if(type==='shuffle'){if(doShuffle())showToast('已洗牌')}}

// ═══════════════════ Canvas 渲染 — 1:1 CSS 翻译 ═══════════════════
// ═══ 层叠布局：9:16板(自适应满宽20px边距) → 槽 → 道具 → 信息 ═══
const TOP_BAR_H = 94;
const PAD = 10; // 左右各10px
const BOARD_W = W - PAD*2; // 撑满宽
const BOARD_H_RAW = Math.min(Math.round(BOARD_W * 16 / 9), H - TOP_BAR_H - 130) - 30;
const BOARD_H = Math.round(BOARD_H_RAW * 0.60); // 上下各缩20%
const BOARD_X = (W - BOARD_W) / 2;
// 槽位 — 等比撑满棋盘宽
const SLOT_ROW_PAD = 10;
const SLOT_W = Math.floor((BOARD_W - SLOT_ROW_PAD*2 - 8*(MAX_SLOTS-1)) / MAX_SLOTS);
const SLOT_GAP = 8;
const SLOT_ROW_H = SLOT_W + SLOT_ROW_PAD * 2;
// 道具按钮 — 撑满棋盘宽
const PROP_GAP = 8;
const PROP_BTN = Math.floor((BOARD_W - 10*2 - PROP_GAP*4) / 5);
const PROP_LABEL = 12;
const BOTTOM_H = PROP_BTN + PROP_LABEL + 16;
// 总内容：板子 + 间距 + 槽 + 间距 + 底部
const GAP = 8;
const contentH = BOARD_H + GAP + SLOT_ROW_H + GAP + BOTTOM_H;
const BOARD_Y = TOP_BAR_H + Math.max(0, Math.floor((H - TOP_BAR_H - contentH) / 2));
const SLOT_BAR_Y = BOARD_Y + BOARD_H + GAP;
const PROPS_Y = SLOT_BAR_Y + SLOT_ROW_H + GAP;

function drawBoard(){
  // 1. 深色背景渐变 — 使用主题色
  const sk=getSkin();
  const bg=ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,sk.bgTop);bg.addColorStop(0.4,sk.bgMid);bg.addColorStop(1,sk.bgBot);
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  const bx=BOARD_X+3,by=BOARD_Y,bw=BOARD_W-6,bh=BOARD_H;
  // 2. 外圈阴影
  ctx.save();ctx.shadowColor='rgba(0,0,0,0.55)';ctx.shadowBlur=40;ctx.shadowOffsetY=8;
  ctx.fillStyle='rgba(0,0,0,0.55)';ctx.beginPath();ctx.roundRect(BOARD_X,BOARD_Y,BOARD_W,BOARD_H,14);ctx.fill();ctx.restore();
  ctx.fillStyle=sk.boardBorder;ctx.beginPath();ctx.roundRect(BOARD_X-3,BOARD_Y-3,BOARD_W+6,BOARD_H+6,16);ctx.fill();
  // 3. 木板渐变
  const a175=175*Math.PI/180,dx175=Math.sin(a175),dy175=-Math.cos(a175);
  const wbg=ctx.createLinearGradient(bx,by,bx+dx175*bw,by+dy175*bh);
  wbg.addColorStop(0,sk.boardTop);wbg.addColorStop(0.15,sk.boardMid);
  wbg.addColorStop(0.3,sk.boardTop);
  wbg.addColorStop(0.55,sk.boardMid);wbg.addColorStop(0.8,sk.boardBot);
  wbg.addColorStop(1,sk.boardBot);
  ctx.fillStyle=wbg;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,14);ctx.fill();
  // 4. 边框
  ctx.strokeStyle=sk.boardBorder;ctx.lineWidth=6;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,14);ctx.stroke();
  // 5. 木纹 ::before (inset: 6px, border-radius: 8px)
  ctx.save();ctx.beginPath();ctx.roundRect(bx+6,by+6,bw-12,bh-12,8);ctx.clip();
  // layer 1: repeating-linear-gradient(2deg, transparent 0 5px, rgba(120,70,30,0.06) 5px 6px)
  ctx.strokeStyle='rgba(120,70,30,0.06)';ctx.lineWidth=1.5;
  for(let y=by+6;y<by+bh-6;y+=6){let off=Math.tan(2*Math.PI/180)*(y-by);ctx.beginPath();ctx.moveTo(bx+off,y);ctx.lineTo(bx+off+bw,y);ctx.stroke()}
  // layer 2: repeating-linear-gradient(94deg, transparent 0 28px, rgba(0,0,0,0.04) 28px 30px)
  ctx.strokeStyle='rgba(0,0,0,0.04)';ctx.lineWidth=2;
  for(let x=bx;x<bx+bw;x+=30){ctx.beginPath();ctx.moveTo(x,by-2);ctx.lineTo(x-(bh*Math.tan(4*Math.PI/180)),by+bh+2);ctx.stroke()}
  // layer 3: repeating-linear-gradient(176deg, transparent 0 40px, rgba(180,130,80,0.05) 40px 42px)
  ctx.strokeStyle='rgba(180,130,80,0.05)';ctx.lineWidth=1.2;
  for(let d=-bh;d<bw+bh;d+=42){ctx.beginPath();ctx.moveTo(bx+d,by);ctx.lineTo(bx+d+bh*Math.tan(4*Math.PI/180),by+bh);ctx.stroke()}
  ctx.restore();
  // 6. ::after 内阴影 (inset: 0px, border-radius: 10px): box-shadow rgba(0,0,0,0.15) 0 2px 8px inset + rgba(0,0,0,0.1) 0 -2px 4px inset
  ctx.save();ctx.beginPath();ctx.roundRect(bx,by,bw,bh,14);ctx.clip();
  const ish=ctx.createLinearGradient(0,by,0,by+bh);
  ish.addColorStop(0,'rgba(0,0,0,0.15)');ish.addColorStop(0.15,'rgba(0,0,0,0.05)');ish.addColorStop(0.5,'rgba(0,0,0,0)');
  ish.addColorStop(0.85,'rgba(0,0,0,0.03)');ish.addColorStop(1,'rgba(0,0,0,0.1)');
  ctx.fillStyle=ish;ctx.fillRect(bx,by,bw,bh);
  // 顶部高光 (box-shadow: rgba(255,255,255,.08) 0 1px 0 inset)
  ctx.strokeStyle='rgba(255,255,255,0.08)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(bx+10,by+3);ctx.lineTo(bx+bw-10,by+3);ctx.stroke();
  ctx.restore();
}

function drawOneScrew(s, isDying, dyingLife){
  const mapX=v=>v/100*(BOARD_W-8)+BOARD_X+4,mapY=v=>v/100*(BOARD_H-8)+BOARD_Y+4,mapR=v=>v*Math.min(BOARD_W,BOARD_H)/100/2;
  // 孔
  if(s.removed && !isDying){
    const hx=mapX(s.x),hy=mapY(s.y),hr=mapR(s.size); // 孔=螺丝等大
    const hg=ctx.createRadialGradient(hx-2,hy-2,0,hx,hy,hr);
    hg.addColorStop(0,'#1c1208');hg.addColorStop(0.5,'#0a0502');hg.addColorStop(1,'#000');
    ctx.fillStyle=hg;ctx.beginPath();ctx.arc(hx,hy,hr,0,Math.PI*2);ctx.fill();
    return;
  }
  const sx=mapX(s.x),sy=mapY(s.y),sr=mapR(s.size);
  ctx.globalAlpha = isDying ? dyingLife : (s.blocked ? 0.35 : 1); // 被挡更明显(0.55→0.35)
  
  // ═══ 1. 外阴影 box-shadow: rgba(0,0,0,0.25) 0 4px 12px ═══
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.25)';ctx.shadowBlur=12;ctx.shadowOffsetY=4;
  ctx.beginPath();ctx.arc(sx,sy+4,sr,0,Math.PI*2);
  ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fill();
  ctx.restore();

  // ═══ 2. 主体渐变 radial-gradient(circle at 35% 35%, light, hex 50%, shadeColor(-30)) ═══
  const gx=sx-sr*0.30,gy=sy-sr*0.30; // 35% offset from center = 0.30*sr
  const gR=sr*1.84; // farthest-corner distance
  const g=ctx.createRadialGradient(gx,gy,0,gx,gy,gR);
  g.addColorStop(0,s.color.light);g.addColorStop(0.5,s.color.hex);g.addColorStop(1,shadeColor(s.color.hex,-30));
  ctx.beginPath();ctx.arc(sx,sy,sr,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();

  // ═══ 3. 内高光 box-shadow: rgba(255,255,255,0.35) 0 3px 6px inset ═══
  // 内阴影在 CSS 里覆盖在背景之上，范围约顶部 10% (3px偏移+6px模糊≈9px区域, sr≈47→19%)
  const igY=sy-sr,igR=sr*0.22; // gradient covers top 22% of screw
  const ig=ctx.createLinearGradient(0,igY,0,igY+igR);
  ig.addColorStop(0,'rgba(255,255,255,0.35)');
  ig.addColorStop(0.1,'rgba(255,255,255,0.28)');
  ig.addColorStop(0.25,'rgba(255,255,255,0.10)');
  ig.addColorStop(0.55,'rgba(255,255,255,0.02)');
  ig.addColorStop(1,'rgba(255,255,255,0)');
  ctx.save();ctx.beginPath();ctx.arc(sx,sy,sr,0,Math.PI*2);ctx.clip();
  ctx.fillStyle=ig;ctx.fillRect(sx-sr,igY,sr*2,igR);ctx.restore();

  // ═══ 4. ::before 左上镜面高光 ═══
  // web: top:12% left:18%, 30%×24%, borderRadius:50%, bg:rgba(255,255,255,0.45), rotate(-15deg)
  const bx=sx-sr*0.34,by2=sy-sr*0.52,brx=sr*0.30,bry=sr*0.24;
  ctx.save();ctx.beginPath();ctx.arc(sx,sy,sr,0,Math.PI*2);ctx.clip();
  ctx.fillStyle='rgba(255,255,255,0.45)';
  try{ctx.beginPath();ctx.ellipse(bx,by2,brx,bry,-0.262,0,Math.PI*2);ctx.fill()}catch(e){
    ctx.beginPath();ctx.arc(bx,by2,brx,0,Math.PI*2);ctx.fill()}
  ctx.restore();

  // ═══ 5. ::after 面孔 ═══
  drawFace(ctx, s.color.face, sx, sy, sr);

  ctx.globalAlpha=1;
}

function drawSlots(){
  const totalW = BOARD_W;
  const sx = BOARD_X;
  const sy = SLOT_BAR_Y; // 板下槽位
  const warn = slots.filter(Boolean).length >= MAX_SLOTS;
  // 背景条 (.slots-row: padding 10px 14px, border-radius 16px)
  const sbg = ctx.createLinearGradient(0, sy, 0, sy + SLOT_ROW_H);
  sbg.addColorStop(0, 'rgba(70,55,35,0.6)'); sbg.addColorStop(1, 'rgba(40,30,18,0.6)');
  ctx.fillStyle = warn ? 'rgba(80,15,15,0.55)' : sbg;
  ctx.beginPath(); ctx.roundRect(sx, sy, totalW, SLOT_ROW_H, 16); ctx.fill();
  // 边框
  ctx.strokeStyle = warn ? 'rgba(255,60,60,0.55)' : 'rgba(180,150,120,0.18)';
  ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(sx, sy, totalW, SLOT_ROW_H, 16); ctx.stroke();
  // 内阴影 (box-shadow: rgba(0,0,0,0.2) 0 2px 4px inset)
  ctx.save(); ctx.beginPath(); ctx.roundRect(sx, sy, totalW, SLOT_ROW_H, 16); ctx.clip();
  const si = ctx.createLinearGradient(0, sy, 0, sy + SLOT_ROW_H);
  si.addColorStop(0, 'rgba(0,0,0,0.2)'); si.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = si; ctx.fillRect(sx, sy, totalW, SLOT_ROW_H); ctx.restore();
  // 各个槽位
  for (let i = 0; i < MAX_SLOTS; i++) {
    const x = sx + SLOT_ROW_PAD + i * (SLOT_W + SLOT_GAP), y = sy + SLOT_ROW_PAD, s = slots[i];
    ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.roundRect(x, y, SLOT_W, SLOT_W, 12); ctx.fill();
    if (!s) {
      ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.roundRect(x, y, SLOT_W, SLOT_W, 12); ctx.stroke(); ctx.setLineDash([]);
    } else {
      // 查找当前槽位的动画
      const now=Date.now();
      const popA=slotAnims.find(a=>a.idx===i&&a.type==='popIn');
      const glowA=slotAnims.find(a=>a.idx===i&&a.type==='glow');
      // 匹配光晕：彩色 glow（web matchGlow: box-shadow pulse 10→35px）
      const glowT=glowA?Math.min(1,(now-glowA.startTime)/glowA.duration):0;
      const glowAlpha=(0.5-Math.abs(glowT-0.5)*1)*0.6; // 0→0.3→0
      // web .slot.filled: background rgba(0,0,0,0.12) + border 2.5px solid (JS sets borderColor=s.color.hex)
      ctx.fillStyle='rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.roundRect(x, y, SLOT_W, SLOT_W, 12); ctx.fill();
      if(glowAlpha>0){
        ctx.save();ctx.shadowColor=s.color.hex;ctx.shadowBlur=10+glowAlpha*50;
        ctx.strokeStyle=s.color.hex;ctx.lineWidth=2.5;
        ctx.beginPath();ctx.roundRect(x,y,SLOT_W,SLOT_W,12);ctx.stroke();ctx.restore();
      }else{
        ctx.strokeStyle=s.color.hex;ctx.lineWidth=2.5;
        ctx.beginPath();ctx.roundRect(x,y,SLOT_W,SLOT_W,12);ctx.stroke();
      }
      const dotR = SLOT_W * 0.32, dx = x + SLOT_W / 2, dy = y + SLOT_W / 2;
      // popIn 弹入动画（web popIn: scale 1.12→1, 250ms ease-out）
      const popT=popA?Math.min(1,(now-popA.startTime)/popA.duration):1;
      const popS=1+(1-popT)*(1-popT)*0.12; // ease-out cubic
      ctx.save();ctx.translate(dx,dy);ctx.scale(popS,popS);ctx.translate(-dx,-dy);
      // 阴影 (box-shadow: rgba(0,0,0,.25) 0 4px 12px — web 统一像素值)
      ctx.save();ctx.shadowColor='rgba(0,0,0,0.25)';ctx.shadowBlur=12;ctx.shadowOffsetY=4;
      ctx.fillStyle='rgba(0,0,0,0.25)';ctx.beginPath();ctx.arc(dx,dy,dotR,0,Math.PI*2);ctx.fill();ctx.restore();
      // 主体渐变
      const dg=ctx.createRadialGradient(dx-dotR*0.3,dy-dotR*0.3,0,dx-dotR*0.3,dy-dotR*0.3,dotR*1.84);
      dg.addColorStop(0,s.color.light);dg.addColorStop(0.5,s.color.hex);dg.addColorStop(1,shadeColor(s.color.hex,-30));
      ctx.fillStyle=dg;ctx.beginPath();ctx.arc(dx,dy,dotR,0,Math.PI*2);ctx.fill();
      // 内高光 (box-shadow inset) — match web 3px+6px inset
      const ssig=ctx.createLinearGradient(dx,dy-dotR,dx,dy-dotR*0.85);
      ssig.addColorStop(0,'rgba(255,255,255,0.35)');ssig.addColorStop(0.06,'rgba(255,255,255,0.30)');
      ssig.addColorStop(0.15,'rgba(255,255,255,0.12)');ssig.addColorStop(0.35,'rgba(255,255,255,0.02)');
      ssig.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=ssig;ctx.beginPath();ctx.arc(dx,dy,dotR,0,Math.PI*2);ctx.fill();
      if (s.color.pattern) {} // patterns disabled
      drawFace(ctx, s.color.face, dx, dy, dotR);
      ctx.restore(); // end popIn scale
    }
  }
}

function drawPropsBar(){
  const propY = PROPS_Y;
  const btnW=PROP_BTN, gap=PROP_GAP, list=[{id:'undo',icon:'↩',label:'撤回'},{id:'bomb',icon:'💣',label:'炸弹'},{id:'peek',icon:'👁',label:'透视'},{id:'lightning',icon:'⚡',label:'闪电'},{id:'shuffle',icon:'🔀',label:'洗牌'}];
  const padX=10, totalW=list.length*btnW+(list.length-1)*gap, startX=BOARD_X+(BOARD_W-totalW)/2;
  propButtons=list.map((p,i)=>({id:p.id, x:startX+i*(btnW+gap), y:propY, w:btnW, h:btnW+PROP_LABEL}));
  list.forEach((p,i)=>{
    const bx=startX+i*(btnW+gap);
    const count=props[p.id]||0, available=count>0;
    ctx.fillStyle=available?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.02)'; ctx.beginPath(); ctx.roundRect(bx,propY,btnW,btnW,12); ctx.fill();
    ctx.strokeStyle=available?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.04)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.roundRect(bx,propY,btnW,btnW,12); ctx.stroke();
    ctx.font='bold 17px sans-serif'; ctx.fillStyle=available?'#cbd5e1':'#475569'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(p.icon, bx+btnW/2, propY+btnW/2-1);
    ctx.font='10px sans-serif'; ctx.fillStyle=available?'#64748b':'#3b3f4a'; ctx.fillText(p.label, bx+btnW/2, propY+btnW+8);
    const badgeR=8;
    ctx.fillStyle=count===0?'rgba(255,255,255,0.06)':'#fbbf24'; ctx.beginPath(); ctx.arc(bx+btnW-badgeR+2, propY+badgeR-1, badgeR, 0, Math.PI*2); ctx.fill();
    ctx.font='bold 9px sans-serif'; ctx.fillStyle=count===0?'#555':'#0c0c1d'; ctx.fillText(count, bx+btnW-badgeR+2, propY+badgeR+2);
  });
}

let topButtons=[]; // {id, x, y, w, h} for top-row buttons
let ckButton=null; // checkin button rect
let skinButtons=[]; // skin picker option rects
let shopBuyBB=[], shopCloseBB=null;
let lvlListBB=[], lvlCloseBB=null;
let tutSkipBB=null, tutNextBB=null;
let shareCloseBB=null;
let lbTabBB=[], lbCloseBB=null;
let loginCloseBB=null, loginBtnBB=null;
let winShareBB=null, winLbBB=null, winNextBB=null, winReplayBB=null;
let loseContinueBB=null, loseUndoBB=null;
function drawUI(){
  // ═══ 顶栏 2行 (94px: 上48px微信留白) ═══
  const r1y=48, r1h=20, r2y=70, r2h=24;
  // 半透明底条
  ctx.fillStyle='rgba(10,12,30,0.6)';ctx.fillRect(0,0,W,TOP_BAR_H);
  // 底部分割线
  ctx.strokeStyle='rgba(255,255,255,0.06)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,TOP_BAR_H);ctx.lineTo(W,TOP_BAR_H);ctx.stroke();
  // 行间分割线
  ctx.strokeStyle='rgba(255,255,255,0.04)';ctx.beginPath();ctx.moveTo(0,r2y);ctx.lineTo(W,r2y);ctx.stroke();
  // ── 行1: 关卡(左) + 🎵BGM/🎨皮肤/🔊音效/⏸暂停(右) ──
  topButtons=[];
  skinButtons=[];
  const lvW=80, lvH=20, lvX=10, lvY=r1y;
  ctx.fillStyle='rgba(99,102,241,0.25)';ctx.beginPath();ctx.roundRect(lvX,lvY,lvW,lvH,11);ctx.fill();
  ctx.font='bold 13px sans-serif';ctx.fillStyle='#c7d2fe';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('第 '+level+' 关 ▼',lvX+lvW/2,lvY+lvH/2);
  topButtons.push({id:'level',x:lvX,y:lvY,w:lvW,h:lvH});
  // 右侧按钮组：bgm, skin, sound, pause
  const btnS=24, btnGap=4, pauseX=W-btnS-8, soundX=pauseX-btnS-btnGap;
  const skinX=soundX-btnS-btnGap, bgmX=skinX-btnS-btnGap;
  const btnY2=r1y;
  // 🎵 BGM
  ctx.fillStyle=bgmOn?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.08)';ctx.beginPath();ctx.roundRect(bgmX,btnY2,btnS,btnS,8);ctx.fill();
  ctx.font='13px sans-serif';ctx.fillStyle=bgmOn?'#818cf8':'#94a3b8';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🎵',bgmX+btnS/2,btnY2+btnS/2);
  topButtons.push({id:'bgm',x:bgmX,y:btnY2,w:btnS,h:btnS});
  // 🎨 皮肤
  ctx.fillStyle=showSkinPicker?'rgba(251,191,36,0.2)':'rgba(255,255,255,0.08)';ctx.beginPath();ctx.roundRect(skinX,btnY2,btnS,btnS,8);ctx.fill();
  ctx.font='13px sans-serif';ctx.fillStyle=showSkinPicker?'#fbbf24':'#94a3b8';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🎨',skinX+btnS/2,btnY2+btnS/2);
  topButtons.push({id:'skin',x:skinX,y:btnY2,w:btnS,h:btnS});
  // 🔊/🔇 音效
  ctx.fillStyle=soundOn?'rgba(255,255,255,0.08)':'rgba(255,80,80,0.15)';ctx.beginPath();ctx.roundRect(soundX,btnY2,btnS,btnS,8);ctx.fill();
  ctx.font='14px sans-serif';ctx.fillStyle=soundOn?'#94a3b8':'#ef4444';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(soundOn?'🔊':'🔇',soundX+btnS/2,btnY2+btnS/2);
  topButtons.push({id:'sound',x:soundX,y:btnY2,w:btnS,h:btnS});
  // ⏸/▶ 暂停
  ctx.fillStyle=paused?'rgba(251,191,36,0.2)':'rgba(255,255,255,0.08)';ctx.beginPath();ctx.roundRect(pauseX,btnY2,btnS,btnS,8);ctx.fill();
  ctx.font='14px sans-serif';ctx.fillStyle=paused?'#fbbf24':'#94a3b8';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(paused?'▶':'⏸',pauseX+btnS/2,btnY2+btnS/2);
  topButtons.push({id:'pause',x:pauseX,y:btnY2,w:btnS,h:btnS});
  // ── 行1右额外：🏆排行 👤账号 ──
  const ldBtX=W-btnS-8, ldBtY=r2y;
  ctx.fillStyle='rgba(255,255,255,0.08)';ctx.beginPath();ctx.roundRect(ldBtX-btnS-btnGap,ldBtY,btnS,btnS,8);ctx.fill();
  ctx.font='13px sans-serif';ctx.fillStyle='#94a3b8';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🏆',ldBtX-btnS-btnGap+btnS/2,ldBtY+btnS/2);
  topButtons.push({id:'leaderboard',x:ldBtX-btnS-btnGap,y:ldBtY,w:btnS,h:btnS});
  ctx.fillStyle=nickname?'rgba(7,193,96,0.25)':'rgba(255,255,255,0.08)';ctx.beginPath();ctx.roundRect(ldBtX,ldBtY,btnS,btnS,8);ctx.fill();
  ctx.font='13px sans-serif';ctx.fillStyle=nickname?'#07c160':'#94a3b8';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(nickname?'✓':'👤',ldBtX+btnS/2,ldBtY+btnS/2);
  topButtons.push({id:'user',x:ldBtX,y:ldBtY,w:btnS,h:btnS});
  // ── 行2: ⭐分数(左) + 🛒商店 + 📅每日 + 🎁签到 + 🪙金币(右) ──
  ctx.font='bold 15px sans-serif';ctx.textBaseline='middle';
  ctx.fillStyle='#fbbf24';ctx.textAlign='left';ctx.fillText('⭐ '+score, 10, r2y+r2h/2+1);
  // 🛒 商店按钮 — 3D立体
  const shopW=62, shopH=22, shopX=10+52, shopY=r2y;
  ctx.save();ctx.shadowColor='rgba(6,182,212,0.35)';ctx.shadowBlur=8;ctx.shadowOffsetY=3;
  const sg=ctx.createLinearGradient(0,shopY,0,shopY+shopH);
  sg.addColorStop(0,'#22d3ee');sg.addColorStop(1,'#0e7490');
  ctx.fillStyle=sg;ctx.beginPath();ctx.roundRect(shopX,shopY,shopW,shopH,14);ctx.fill();ctx.restore();
  ctx.save();ctx.beginPath();ctx.roundRect(shopX,shopY,shopW,shopH,14);ctx.clip();
  ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(shopX+0.5,shopY+0.5,shopW-1,shopH-1,13.5);ctx.stroke();
  const sh=ctx.createLinearGradient(0,shopY,0,shopY+shopH*0.45);
  sh.addColorStop(0,'rgba(255,255,255,0.30)');sh.addColorStop(1,'transparent');
  ctx.fillStyle=sh;ctx.beginPath();ctx.roundRect(shopX+1,shopY+1,shopW-2,shopH*0.45,13);ctx.fill();ctx.restore();
  ctx.font='bold 13px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('🛒商店',shopX+shopW/2,shopY+shopH/2+1);
  topButtons.push({id:'shop',x:shopX,y:shopY,w:shopW,h:shopH});
  // 📅 每日挑战 — 3D立体
  const dcW=62, dcH=22, dcX=shopX+shopW+10, dcY=r2y;
  ctx.save();ctx.shadowColor='rgba(239,68,68,0.35)';ctx.shadowBlur=8;ctx.shadowOffsetY=3;
  const dg=ctx.createLinearGradient(0,dcY,0,dcY+dcH);
  dg.addColorStop(0,'#f87171');dg.addColorStop(1,'#dc2626');
  ctx.fillStyle=dg;ctx.beginPath();ctx.roundRect(dcX,dcY,dcW,dcH,14);ctx.fill();ctx.restore();
  ctx.save();ctx.beginPath();ctx.roundRect(dcX,dcY,dcW,dcH,14);ctx.clip();
  ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(dcX+0.5,dcY+0.5,dcW-1,dcH-1,13.5);ctx.stroke();
  const dh=ctx.createLinearGradient(0,dcY,0,dcY+dcH*0.45);
  dh.addColorStop(0,'rgba(255,255,255,0.30)');dh.addColorStop(1,'transparent');
  ctx.fillStyle=dh;ctx.beginPath();ctx.roundRect(dcX+1,dcY+1,dcW-2,dcH*0.45,13);ctx.fill();ctx.restore();
  ctx.font='bold 13px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('📅每日',dcX+dcW/2,dcY+dcH/2+1);
  topButtons.push({id:'daily',x:dcX,y:dcY,w:dcW,h:dcH});
  // 🎁 签到按钮 — 3D立体
  const today=getToday(), ckClaimed=ckData.lastDate===today;
  const ckBtnW=72, ckBtnH=22, ckBtnX=dcX+dcW+10, ckBtnY=r2y;
  ctx.save();ctx.shadowColor=ckClaimed?'rgba(99,102,241,0.35)':'rgba(251,191,36,0.4)';ctx.shadowBlur=8;ctx.shadowOffsetY=3;
  const ckg=ctx.createLinearGradient(0,ckBtnY,0,ckBtnY+ckBtnH);
  if(ckClaimed){ckg.addColorStop(0,'#818cf8');ckg.addColorStop(1,'#4f46e5');}
  else{ckg.addColorStop(0,'#fbbf24');ckg.addColorStop(1,'#d97706');}
  ctx.fillStyle=ckg;ctx.beginPath();ctx.roundRect(ckBtnX,ckBtnY,ckBtnW,ckBtnH,14);ctx.fill();ctx.restore();
  ctx.save();ctx.beginPath();ctx.roundRect(ckBtnX,ckBtnY,ckBtnW,ckBtnH,14);ctx.clip();
  ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(ckBtnX+0.5,ckBtnY+0.5,ckBtnW-1,ckBtnH-1,13.5);ctx.stroke();
  const ckh=ctx.createLinearGradient(0,ckBtnY,0,ckBtnY+ckBtnH*0.45);
  ckh.addColorStop(0,'rgba(255,255,255,0.30)');ckh.addColorStop(1,'transparent');
  ctx.fillStyle=ckh;ctx.beginPath();ctx.roundRect(ckBtnX+1,ckBtnY+1,ckBtnW-2,ckBtnH*0.45,13);ctx.fill();ctx.restore();
  ctx.font='bold 13px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText((ckClaimed?'✅':'🎁')+' 签到',ckBtnX+ckBtnW/2,ckBtnY+ckBtnH/2+1);
  ckButton={id:'checkin',x:ckBtnX,y:ckBtnY,w:ckBtnW,h:ckBtnH};
  ctx.textAlign='right';ctx.fillText('🪙 '+coins, W-10, r2y+r2h/2);
  // 底部信息
  const remain=screws.filter(s=>!s.removed).length;
  const infoY=PROPS_Y+PROP_BTN+PROP_LABEL+8;
  ctx.font='11px sans-serif';ctx.textAlign='left';ctx.fillStyle='#64748b';ctx.fillText('剩余 '+remain+'/'+totalScrewCount,12,infoY);
  ctx.textAlign='right';
  if(combo>1){ctx.fillStyle='#fbbf24';ctx.fillText('连击 ×'+combo,W-12,infoY)}
  // Toast
  if(toastMsg){
    const tw=ctx.measureText(toastMsg).width+30;
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.beginPath();ctx.roundRect(W/2-tw/2,H/2-18,tw,36,18);ctx.fill();
    ctx.font='14px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(toastMsg,W/2,H/2);
  }
  // 暂停遮罩
  if(paused){
    ctx.fillStyle='rgba(0,0,0,0.45)';ctx.fillRect(0,TOP_BAR_H,W,H-TOP_BAR_H);
    ctx.font='bold 22px sans-serif';ctx.fillStyle='#e0e0e0';ctx.textAlign='center';ctx.fillText('⏸ 已暂停',W/2,H/2-10);
    ctx.font='13px sans-serif';ctx.fillStyle='#94a3b8';ctx.fillText('点击 ▶ 继续',W/2,H/2+18);
  }
}

function drawOverlays(){
  // 皮肤选择器
  if(showSkinPicker){
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(0,0,W,H);
    const pw=200,ph=SKINS.length*34+40,px=(W-pw)/2,py=(H-ph)/2;
    ctx.fillStyle='#1e293b';ctx.beginPath();ctx.roundRect(px,py,pw,ph,14);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(px,py,pw,ph,14);ctx.stroke();
    ctx.font='bold 14px sans-serif';ctx.fillStyle='#e2e8f0';ctx.textAlign='center';ctx.fillText('🎨 选择主题',px+pw/2,py+24);
    skinButtons=[];
    SKINS.forEach((sk,i)=>{
      const bx=px+14,by=py+34+i*34,bw=pw-28,bh=28;
      ctx.fillStyle=sk.id===activeSkin?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.05)';
      ctx.beginPath();ctx.roundRect(bx,by,bw,bh,10);ctx.fill();
      if(sk.id===activeSkin){ctx.strokeStyle='#6366f1';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,10);ctx.stroke()}
      ctx.font='13px sans-serif';ctx.fillStyle=sk.id===activeSkin?'#c7d2fe':'#94a3b8';ctx.textAlign='left';ctx.textBaseline='middle';
      ctx.fillText((sk.id===activeSkin?'● ':'○ ')+sk.name,bx+10,by+bh/2);
      // 颜色预览条
      ctx.fillStyle=sk.boardMid;ctx.beginPath();ctx.roundRect(bx+bw-36,by+4,28,bh-8,4);ctx.fill();
      skinButtons.push({id:sk.id,x:bx,y:by,w:bw,h:bh});
    });
    return;
  }
  // 签到弹窗
  if(showCheckin){
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(0,0,W,H);
    const cw=290,ch=240,cx=(W-cw)/2,cy=(H-ch)/2;
    ctx.fillStyle='#1e293b';ctx.beginPath();ctx.roundRect(cx,cy,cw,ch,16);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(cx,cy,cw,ch,16);ctx.stroke();
    ctx.font='bold 16px sans-serif';ctx.fillStyle='#fbbf24';ctx.textAlign='center';ctx.fillText('🎁 每日签到',cx+cw/2,cy+28);
    // 7天网格
    const gx=cx+16,gy=cy+44,gw=cw-32,gh=26,ggap=16,gs=(gw-ggap*6)/7;
    const today=getToday(),claimed=ckData.lastDate===today;
    for(let i=0;i<7;i++){
      const dx=gx+i*(gs+ggap), dy=gy;
      const rwd=CK_REWARDS[i];
      let bgClr='rgba(255,255,255,0.05)', txtClr='#64748b', txt='D'+(i+1);
      if(i<ckData.streak-1){bgClr='rgba(99,102,241,0.3)';txtClr='#a5b4fc';txt='✓'}
      else if(i===ckData.streak-1&&claimed){bgClr='rgba(99,102,241,0.4)';txtClr='#c7d2fe';txt='✓'}
      else if(i===ckData.streak-1&&!claimed){bgClr='rgba(251,191,36,0.4)';txtClr='#fbbf24';txt='📌'}
      ctx.fillStyle=bgClr;ctx.beginPath();ctx.roundRect(dx,dy,gs,gh,8);ctx.fill();
      if(i===ckData.streak-1&&!claimed){ctx.strokeStyle='#fbbf24';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(dx,dy,gs,gh,8);ctx.stroke()}
      ctx.font='11px sans-serif';ctx.fillStyle=txtClr;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,dx+gs/2,dy+gh/2);
      ctx.font='9px sans-serif';ctx.fillStyle=txtClr;ctx.fillText('+'+rwd.c,dx+gs/2,dy+gh+12);
      const pps=[rwd.prop,...(rwd.props||[])].filter(Boolean);
      if(pps.length){ctx.font='8px sans-serif';ctx.fillText(pps.join('+'),dx+gs/2,dy+gh+22)}
    }
    // 签到按钮
    const signBtnW=100,signBtnH=34,signBtnX=cx+(cw-signBtnW)/2,signBtnY=cy+152;
    if(!claimed){
      const sgb=ctx.createLinearGradient(0,signBtnY,0,signBtnY+signBtnH);
      sgb.addColorStop(0,'#6366f1');sgb.addColorStop(1,'#06b6d4');
      ctx.fillStyle=sgb;ctx.beginPath();ctx.roundRect(signBtnX,signBtnY,signBtnW,signBtnH,17);ctx.fill();
      ctx.font='bold 14px sans-serif';ctx.fillStyle='#fff';ctx.fillText('✅ 签到领奖',signBtnX+signBtnW/2,signBtnY+signBtnH/2+1);
    } else {
      ctx.fillStyle='rgba(99,102,241,0.3)';ctx.beginPath();ctx.roundRect(signBtnX,signBtnY,signBtnW,signBtnH,17);ctx.fill();
      ctx.font='13px sans-serif';ctx.fillStyle='#818cf8';ctx.fillText('今日已签到',signBtnX+signBtnW/2,signBtnY+signBtnH/2+1);
    }
    // 关闭
    ctx.fillStyle='rgba(255,255,255,0.06)';ctx.beginPath();ctx.roundRect(cx+cw-32,cy+6,24,24,12);ctx.fill();
    ctx.font='12px sans-serif';ctx.fillStyle='#64748b';ctx.fillText('✕',cx+cw-20,cy+21);
    ckButton={id:'checkinClose',x:cx+cw-32,y:cy+6,w:24,h:24};
    if(!claimed)ckButton={id:'checkinSign',x:signBtnX,y:signBtnY,w:signBtnW,h:signBtnH};
    return;
  }
  // 商店弹窗
  if(showShopOverlay){
    ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillRect(0,0,W,H);
    const sw=280,sh=320,sx=(W-sw)/2,sy=(H-sh)/2;
    ctx.fillStyle='#1e293b';ctx.beginPath();ctx.roundRect(sx,sy,sw,sh,18);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(sx,sy,sw,sh,18);ctx.stroke();
    ctx.font='bold 18px sans-serif';ctx.fillStyle='#fbbf24';ctx.textAlign='center';ctx.fillText('🛒 道具商店',W/2,sy+32);
    ctx.font='13px sans-serif';ctx.fillStyle='#fbbf24';ctx.fillText('🪙 '+coins,W/2,sy+54);
    SHOP_ITEMS.forEach((item,i)=>{
      const ix=sx+16,iy=sy+68+i*46,iw=sw-32,ih=40;
      ctx.fillStyle='rgba(255,255,255,0.04)';ctx.beginPath();ctx.roundRect(ix,iy,iw,ih,12);ctx.fill();
      ctx.font='22px sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(item.icon,ix+10,iy+ih/2);
      ctx.font='bold 13px sans-serif';ctx.fillStyle='#e2e8f0';ctx.fillText(item.name+' ×'+item.qty,ix+42,iy+10);
      ctx.font='10px sans-serif';ctx.fillStyle='#64748b';ctx.fillText(item.desc,ix+42,iy+28);
      const canBuy=coins>=item.price;
      const buyW=54,buyH=26,buyX=ix+iw-buyW-8,buyY=iy+7;
      ctx.fillStyle=canBuy?'rgba(251,191,36,0.2)':'rgba(255,255,255,0.05)';ctx.beginPath();ctx.roundRect(buyX,buyY,buyW,buyH,10);ctx.fill();
      ctx.font='bold 12px sans-serif';ctx.fillStyle=canBuy?'#fbbf24':'#64748b';ctx.textAlign='center';ctx.fillText('🪙'+item.price,buyX+buyW/2,buyY+buyH/2+1);
      if(canBuy)shopBuyBB.push({id:item.id,price:item.price,qty:item.qty,x:buyX,y:buyY,w:buyW,h:buyH});
    });
    const closeX=sx+sw-32,closeY=sy+6;
    ctx.fillStyle='rgba(255,255,255,0.06)';ctx.beginPath();ctx.roundRect(closeX,closeY,24,24,12);ctx.fill();
    ctx.font='12px sans-serif';ctx.fillStyle='#64748b';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('✕',closeX+12,closeY+14);
    shopCloseBB={x:closeX,y:closeY,w:24,h:24};
    return;
  }
  // 选关弹窗
  if(showLvlPicker){
    ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillRect(0,0,W,H);
    const pw=220,ph=320,px=(W-pw)/2,py=(H-ph)/2;
    ctx.fillStyle='#1e293b';ctx.beginPath();ctx.roundRect(px,py,pw,ph,16);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(px,py,pw,ph,16);ctx.stroke();
    ctx.font='bold 16px sans-serif';ctx.fillStyle='#c7d2fe';ctx.textAlign='center';ctx.fillText('🎯 选择关卡',px+pw/2,py+28);
    const cleared=getCleared(),maxLv=Math.max(level,10);
    lvlListBB=[];
    for(let i=1;i<=maxLv;i++){
      const unlocked=cleared.includes(i)||i<=level;
      const bx=px+14,by=py+36+(i-1)*24,bw=pw-28,bh=20;
      ctx.fillStyle=unlocked?(i===level?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.05)'):'rgba(255,255,255,0.02)';
      ctx.beginPath();ctx.roundRect(bx,by,bw,bh,10);ctx.fill();
      ctx.font='12px sans-serif';ctx.fillStyle=unlocked?(i===level?'#c7d2fe':'#94a3b8'):'#475569';ctx.textAlign='left';ctx.textBaseline='middle';
      ctx.fillText('第 '+i+' 关'+(i===level?' 👈':''),bx+10,by+bh/2);
      if(unlocked)lvlListBB.push({lv:i,x:bx,y:by,w:bw,h:bh});
    }
    const closeX=px+pw-32,closeY=py+6;
    ctx.fillStyle='rgba(255,255,255,0.06)';ctx.beginPath();ctx.roundRect(closeX,closeY,24,24,12);ctx.fill();
    ctx.font='12px sans-serif';ctx.fillStyle='#64748b';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('✕',closeX+12,closeY+14);
    lvlCloseBB={x:closeX,y:closeY,w:24,h:24};
    return;
  }
  // 教程弹窗
  if(showTutorialOverlay){
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,W,H);
    const tw=280,th=260,tx=(W-tw)/2,ty=(H-th)/2;
    ctx.fillStyle='#1e293b';ctx.beginPath();ctx.roundRect(tx,ty,tw,th,20);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(tx,ty,tw,th,20);ctx.stroke();
    const step=TUT_STEPS[tutIdx];
    ctx.font='44px sans-serif';ctx.textAlign='center';ctx.fillText(step.icon,W/2,ty+56);
    ctx.font='bold 18px sans-serif';ctx.fillStyle='#fbbf24';ctx.fillText(step.title,W/2,ty+88);
    ctx.font='13px sans-serif';ctx.fillStyle='#94a3b8';ctx.textAlign='center';
    // word wrap
    const words=step.desc.split(''),lineH=20;let line='',ly=ty+120;
    for(const ch of words){
      const test=line+ch;
      if(ctx.measureText(test).width<tw-40){line=test}else{ctx.fillText(line,W/2,ly);line=ch;ly+=lineH}
    }
    if(line)ctx.fillText(line,W/2,ly);
    // dots
    for(let i=0;i<TUT_STEPS.length;i++){
      const dx=W/2+(i-1.5)*14,dy=ty+180;
      ctx.fillStyle=i===tutIdx?'#fbbf24':'rgba(255,255,255,0.15)';ctx.beginPath();ctx.arc(dx,dy,4,0,Math.PI*2);ctx.fill();
    }
    // buttons
    const skipW=70, skipH=34, skipX=tx+20, skipY=ty+200;
    ctx.fillStyle='rgba(255,255,255,0.08)';ctx.beginPath();ctx.roundRect(skipX,skipY,skipW,skipH,17);ctx.fill();
    ctx.font='13px sans-serif';ctx.fillStyle='#94a3b8';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('跳过',skipX+skipW/2,skipY+skipH/2);
    const nextW=100, nextH=34, nextX=tx+tw-nextW-20, nextY=ty+200;
    const ng=ctx.createLinearGradient(0,nextY,0,nextY+nextH);
    ng.addColorStop(0,'#fbbf24');ng.addColorStop(1,'#f59e0b');
    ctx.fillStyle=ng;ctx.beginPath();ctx.roundRect(nextX,nextY,nextW,nextH,17);ctx.fill();
    ctx.font='bold 14px sans-serif';ctx.fillStyle='#1e1b4b';ctx.fillText(tutIdx===TUT_STEPS.length-1?'🎮 开始游戏':'下一步',nextX+nextW/2,nextY+nextH/2+1);
    tutSkipBB={x:skipX,y:skipY,w:skipW,h:skipH};
    tutNextBB={x:nextX,y:nextY,w:nextW,h:nextH};
    return;
  }
  // 分享卡
  if(showShareOverlay){
    ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(0,0,W,H);
    const sw=300,sh=220,sx=(W-sw)/2,sy=(H-sh)/2;
    ctx.fillStyle='#1e293b';ctx.beginPath();ctx.roundRect(sx,sy,sw,sh,20);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(sx,sy,sw,sh,20);ctx.stroke();
    ctx.font='bold 20px sans-serif';ctx.fillStyle='#fbbf24';ctx.textAlign='center';ctx.fillText('📤 分享战绩',W/2,sy+36);
    ctx.font='40px sans-serif';ctx.fillText('🎉',W/2,sy+80);
    ctx.font='bold 36px sans-serif';ctx.fillStyle='#fbbf24';ctx.fillText(score,W/2,sy+128);
    ctx.font='13px sans-serif';ctx.fillStyle='#94a3b8';ctx.fillText('第 '+level+' 关 · 🪙'+coins,W/2,sy+152);
    ctx.font='11px sans-serif';ctx.fillStyle='#64748b';ctx.fillText('用微信分享给好友',W/2,sy+180);
    const closeX=sx+sw-32,closeY=sy+6;
    ctx.fillStyle='rgba(255,255,255,0.06)';ctx.beginPath();ctx.roundRect(closeX,closeY,24,24,12);ctx.fill();
    ctx.font='12px sans-serif';ctx.fillStyle='#64748b';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('✕',closeX+12,closeY+14);
    shareCloseBB={x:closeX,y:closeY,w:24,h:24};
    return;
  }
  // 排行榜
  if(showLB){
    ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,W,H);
    const lw=300,lh=360,lx=(W-lw)/2,ly=(H-lh)/2;
    ctx.fillStyle='#1e293b';ctx.beginPath();ctx.roundRect(lx,ly,lw,lh,18);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(lx,ly,lw,lh,18);ctx.stroke();
    ctx.font='bold 18px sans-serif';ctx.fillStyle='#fbbf24';ctx.textAlign='center';ctx.fillText('🏆 排行榜',W/2,ly+28);
    // tabs
    ['all','today'].forEach((p,i)=>{
      const tx=lx+60+i*90,ty=ly+36,tw=80,th=24;
      ctx.fillStyle=p===lbPeriod?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.04)';ctx.beginPath();ctx.roundRect(tx,ty,tw,th,12);ctx.fill();
      ctx.font='11px sans-serif';ctx.fillStyle=p===lbPeriod?'#c7d2fe':'#64748b';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(p==='all'?'总榜':'今日',tx+tw/2,ty+th/2);
    });
    lbTabBB=[{period:'all',x:lx+60,y:ly+36,w:80,h:24},{period:'today',x:lx+150,y:ly+36,w:80,h:24}];
    // list
    const filtered=lbPeriod==='today'?lbData.filter(e=>e.date===getToday()):lbData;
    const top=filtered.slice(0,10);
    if(top.length===0){
      ctx.font='14px sans-serif';ctx.fillStyle='#64748b';ctx.textAlign='center';ctx.fillText('暂无数据',W/2,ly+180);
    }else{
      top.forEach((r,i)=>{
        const rx=lx+16,ry=ly+72+i*26,rw=lw-32,rh=22;
        ctx.fillStyle=i%2===0?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.01)';ctx.beginPath();ctx.roundRect(rx,ry,rw,rh,10);ctx.fill();
        ctx.font='bold 13px sans-serif';ctx.fillStyle=i===0?'#fbbf24':i===1?'#94a3b8':i===2?'#d97706':'#64748b';
        ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText((i+1)+'.',rx+6,ry+rh/2);
        ctx.fillStyle='#e2e8f0';ctx.fillText(r.nick,rx+30,ry+rh/2);
        ctx.fillStyle='#fbbf24';ctx.textAlign='right';ctx.fillText(r.score,rx+rw-8,ry+rh/2);
      });
    }
    const closeX=lx+lw-32,closeY=ly+6;
    ctx.fillStyle='rgba(255,255,255,0.06)';ctx.beginPath();ctx.roundRect(closeX,closeY,24,24,12);ctx.fill();
    ctx.font='12px sans-serif';ctx.fillStyle='#64748b';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('✕',closeX+12,closeY+14);
    lbCloseBB={x:closeX,y:closeY,w:24,h:24};
    return;
  }
  // 登录/昵称
  if(showLoginOverlay){
    ctx.fillStyle='rgba(0,0,0,0.65)';ctx.fillRect(0,0,W,H);
    const mw=280,mh=220,mx=(W-mw)/2,my=(H-mh)/2;
    ctx.fillStyle='#1e293b';ctx.beginPath();ctx.roundRect(mx,my,mw,mh,18);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(mx,my,mw,mh,18);ctx.stroke();
    ctx.font='bold 18px sans-serif';ctx.fillStyle='#c7d2fe';ctx.textAlign='center';ctx.fillText('👤 '+(nickname?nickname:'登录账号'),W/2,my+32);
    if(nickname){
      if(avatarUrl){
        // Draw avatar as circle
        try{const img=wx.createImage();img.src=avatarUrl;img.onload=()=>{};ctx.save();ctx.beginPath();ctx.arc(W/2,my+65,22,0,Math.PI*2);ctx.clip();ctx.drawImage(img,W/2-22,my+43,44,44);ctx.restore()}catch(e){}
      }
      ctx.font='bold 18px sans-serif';ctx.fillStyle='#fbbf24';ctx.textAlign='center';ctx.fillText(nickname,W/2,my+100);
      const logoutW=100,logoutH=34,logoutX=W/2-logoutW/2,logoutY=my+120;
      ctx.fillStyle='rgba(239,68,68,0.2)';ctx.beginPath();ctx.roundRect(logoutX,logoutY,logoutW,logoutH,17);ctx.fill();
      ctx.font='13px sans-serif';ctx.fillStyle='#f87171';ctx.fillText('退出登录',W/2,logoutY+logoutH/2+5);
      loginBtnBB={id:'logout',x:logoutX,y:logoutY,w:logoutW,h:logoutH};
      hideWxLoginBtn();
    } else {
      ctx.font='12px sans-serif';ctx.fillStyle='#94a3b8';ctx.textAlign='center';ctx.fillText('点击下方绿色按钮登录',W/2,my+75);
      ctx.font='11px sans-serif';ctx.fillStyle='#64748b';ctx.fillText('登录后同步排行数据',W/2,my+95);
      // Show native WeChat login button
      if(!userInfoBtn)showWxLoginBtn();
    }
    const closeX=mx+mw-32,closeY=my+6;
    ctx.fillStyle='rgba(255,255,255,0.06)';ctx.beginPath();ctx.roundRect(closeX,closeY,24,24,12);ctx.fill();
    ctx.font='12px sans-serif';ctx.fillStyle='#64748b';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('✕',closeX+12,closeY+14);
    loginCloseBB={x:closeX,y:closeY,w:24,h:24};
    return;
  } else { hideWxLoginBtn(); }
  if(showWinOverlay){
    ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,W,H);
    const cw=280,ch=280,cx=(W-cw)/2,cy=(H-ch)/2;
    const cbg=ctx.createLinearGradient(0,cy,0,cy+ch);
    cbg.addColorStop(0,'#1e293b');cbg.addColorStop(1,'#0f172a');
    ctx.fillStyle=cbg;ctx.beginPath();ctx.roundRect(cx,cy,cw,ch,20);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(cx,cy,cw,ch,20);ctx.stroke();
    // 图标
    ctx.font='40px sans-serif';ctx.textAlign='center';ctx.fillText('🎉',W/2,cy+48);
    // 星星
    const stars='⭐'.repeat(winStars)+'☆'.repeat(3-winStars);
    ctx.font='28px sans-serif';ctx.fillText(stars,W/2,cy+82);
    // 评级说明
    ctx.font='11px sans-serif';ctx.fillStyle='#64748b';
    ctx.fillText('步效'+winEfficiency+'%  ⭐⭐⭐≥85% ⭐⭐≥70%',W/2,cy+102);
    // 分数
    ctx.font='bold 28px sans-serif';ctx.fillStyle='#fbbf24';
    ctx.fillText('⭐ '+score,W/2,cy+138);
    // 下一关按钮
    const bx=cx+30,by=cy+160,bw=cw-60,bh=42;
    const bg=ctx.createLinearGradient(0,by,0,by+bh);
    bg.addColorStop(0,'#6366f1');bg.addColorStop(1,'#06b6d4');
    ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,21);ctx.fill();
    ctx.font='bold 16px sans-serif';ctx.fillStyle='#fff';ctx.fillText('▶ 下一关',W/2,by+bh/2+5);
    // 重玩
    const by2=by+52;
    ctx.fillStyle='rgba(255,255,255,0.06)';ctx.beginPath();ctx.roundRect(bx,by2,bw,36,18);ctx.fill();
    ctx.font='13px sans-serif';ctx.fillStyle='#94a3b8';ctx.fillText('🔄 重玩',W/2,by2+24);
    // 分享 & 排行
    const by3=by2+44;
    ctx.fillStyle='rgba(255,255,255,0.06)';ctx.beginPath();ctx.roundRect(bx,by3,bw/2-4,32,16);ctx.fill();
    ctx.font='12px sans-serif';ctx.fillStyle='#94a3b8';ctx.fillText('📤 分享',bx+bw/4-2,by3+21);
    ctx.fillStyle='rgba(255,255,255,0.06)';ctx.beginPath();ctx.roundRect(bx+bw/2+4,by3,bw/2-4,32,16);ctx.fill();
    ctx.font='12px sans-serif';ctx.fillStyle='#94a3b8';ctx.fillText('🏆 排行',bx+bw*3/4+2,by3+21);
    winNextBB={x:bx,y:by,w:bw,h:bh};
    winReplayBB={x:bx,y:by2,w:bw,h:36};
    winShareBB={x:bx,y:by3,w:bw/2-4,h:32};
    winLbBB={x:bx+bw/2+4,y:by3,w:bw/2-4,h:32};
    return;
  }
  // 失败弹框
  if(showLoseOverlay){
    ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,W,H);
    const cw=280,ch=270,cx=(W-cw)/2,cy=(H-ch)/2;
    const cbg=ctx.createLinearGradient(0,cy,0,cy+ch);
    cbg.addColorStop(0,'#1e293b');cbg.addColorStop(1,'#0f172a');
    ctx.fillStyle=cbg;ctx.beginPath();ctx.roundRect(cx,cy,cw,ch,20);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(cx,cy,cw,ch,20);ctx.stroke();
    ctx.font='40px sans-serif';ctx.textAlign='center';ctx.fillText('😵',W/2,cy+48);
    ctx.font='bold 20px sans-serif';ctx.fillStyle='#ef4444';ctx.fillText('卡住了！',W/2,cy+82);
    ctx.font='12px sans-serif';ctx.fillStyle='#94a3b8';ctx.fillText('收集栏已满，换个顺序试试',W/2,cy+104);
    ctx.font='bold 22px sans-serif';ctx.fillStyle='#fbbf24';ctx.fillText(losePct+'%',W/2,cy+132);
    ctx.font='13px sans-serif';ctx.fillStyle='#64748b';ctx.fillText('⭐ '+score,W/2,cy+152);
    // 继续
    const bx=cx+30,by=cy+168,bw=cw-60,bh=40;
    const bg=ctx.createLinearGradient(0,by,0,by+bh);
    bg.addColorStop(0,'#6366f1');bg.addColorStop(1,'#06b6d4');
    ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,20);ctx.fill();
    ctx.font='bold 15px sans-serif';ctx.fillStyle='#fff';ctx.fillText('▶ 继续冲',W/2,by+bh/2+5);
    loseContinueBB={x:bx,y:by,w:bw,h:bh};
    const by2=by+48;
    const canUndo=history.length>0&&props.undo>0;
    ctx.fillStyle=canUndo?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.02)';
    ctx.beginPath();ctx.roundRect(bx,by2,bw,32,16);ctx.fill();
    ctx.font='12px sans-serif';ctx.fillStyle=canUndo?'#94a3b8':'#475569';ctx.fillText('↩ 撤回一步',W/2,by2+22);
    loseUndoBB={x:bx,y:by2,w:bw,h:32};
    return;
  }
}

function drawParticles(){
  for(const p of particles){ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1
}
function drawComboPops(){
  for(const c of comboPops){ctx.globalAlpha=c.life;ctx.fillStyle='#fbbf24';ctx.font='bold '+c.size+'px sans-serif';ctx.textAlign='center';ctx.fillText(c.text,c.x,c.y)}ctx.globalAlpha=1
}

// ── 主渲染 ──
function render(){
  let err='';function safe(n,f){if(err)return;try{f()}catch(e){err=n+':'+(e.message||e)}}
  try{
    safe('bg',()=>drawBoard());
    // 按 layer 从小到大画（底层先画，顶层后画）
    // 孔先画(最底) → 透明被挡 → 实体螺丝(最上)
    const sorted=[...screws].sort((a,b)=>(a.removed?0:1)-(b.removed?0:1)||(b.blocked?1:0)-(a.blocked?1:0)||a.layer-b.layer||a.id-b.id);
    safe('screws',()=>{for(const s of sorted){drawOneScrew(s,false,1)}});
    // Peek 高亮
    safe('peek',()=>{for(const id of peekTargets){const s=screws.find(x=>x.id===id);if(s){const sx=s.x/100*(BOARD_W-8)+BOARD_X+4,sy=s.y/100*(BOARD_H-8)+BOARD_Y+4,sr=s.size*Math.min(BOARD_W,BOARD_H)/100/2;ctx.save();ctx.strokeStyle=s.color.hex;ctx.shadowColor=s.color.hex;ctx.shadowBlur=14+Math.sin(Date.now()*0.005)*6;ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,sy,sr+3,0,Math.PI*2);ctx.stroke();ctx.restore()}}});
    // 死亡动画螺丝
    safe('dying',()=>{for(const d of dyingScrews){drawOneScrew(d,true,d.life)}});
    safe('particles',()=>drawParticles());
    safe('slots',()=>drawSlots());
    safe('props',()=>drawPropsBar());
    safe('ui',()=>drawUI());
    safe('overlays',()=>drawOverlays());
    safe('comboPop',()=>drawComboPops());
  }catch(e){err='render:'+(e.message||e)}
  if(err){ctx.fillStyle='#ef4444';ctx.fillRect(0,0,W,40);ctx.fillStyle='white';ctx.font='11px sans-serif';ctx.textAlign='left';ctx.fillText(err,10,25)}
}

// ── 触控 ──
let _lastTap=0;
function handleTouch(tx,ty){
  // ── 商店弹窗 ──
  if(showShopOverlay){
    if(shopCloseBB&&tx>=shopCloseBB.x&&tx<=shopCloseBB.x+shopCloseBB.w&&ty>=shopCloseBB.y&&ty<=shopCloseBB.y+shopCloseBB.h){showShopOverlay=false;return}
    for(const b of shopBuyBB){if(tx>=b.x&&tx<=b.x+b.w&&ty>=b.y&&ty<=b.y+b.h){buyItem(b.id,b.price,b.qty);return}}
    showShopOverlay=false;return;
  }
  // ── 选关弹窗 ──
  if(showLvlPicker){
    if(lvlCloseBB&&tx>=lvlCloseBB.x&&tx<=lvlCloseBB.x+lvlCloseBB.w&&ty>=lvlCloseBB.y&&ty<=lvlCloseBB.y+lvlCloseBB.h){showLvlPicker=false;return}
    for(const b of lvlListBB){if(tx>=b.x&&tx<=b.x+b.w&&ty>=b.y&&ty<=b.y+b.h){level=b.lv;score=0;showLvlPicker=false;generateLevel();return}}
    showLvlPicker=false;return;
  }
  // ── 教程弹窗 ──
  if(showTutorialOverlay){
    if(tutSkipBB&&tx>=tutSkipBB.x&&tx<=tutSkipBB.x+tutSkipBB.w&&ty>=tutSkipBB.y&&ty<=tutSkipBB.y+tutSkipBB.h){skipTutorial();return}
    if(tutNextBB&&tx>=tutNextBB.x&&tx<=tutNextBB.x+tutNextBB.w&&ty>=tutNextBB.y&&ty<=tutNextBB.y+tutNextBB.h){nextTutorial();return}
    return;
  }
  // ── 分享 ──
  if(showShareOverlay){
    if(shareCloseBB&&tx>=shareCloseBB.x&&tx<=shareCloseBB.x+shareCloseBB.w&&ty>=shareCloseBB.y&&ty<=shareCloseBB.y+shareCloseBB.h){showShareOverlay=false;return}
    showShareOverlay=false;return;
  }
  // ── 排行榜 ──
  if(showLB){
    if(lbCloseBB&&tx>=lbCloseBB.x&&tx<=lbCloseBB.x+lbCloseBB.w&&ty>=lbCloseBB.y&&ty<=lbCloseBB.y+lbCloseBB.h){showLB=false;return}
    for(const b of lbTabBB){if(tx>=b.x&&tx<=b.x+b.w&&ty>=b.y&&ty<=b.y+b.h){lbPeriod=b.period;showLB=true;return}}
    return;
  }
  // ── 登录 ──
  if(showLoginOverlay){
    if(loginCloseBB&&tx>=loginCloseBB.x&&tx<=loginCloseBB.x+loginCloseBB.w&&ty>=loginCloseBB.y&&ty<=loginCloseBB.y+loginCloseBB.h){showLoginOverlay=false;return}
    if(loginBtnBB&&tx>=loginBtnBB.x&&tx<=loginBtnBB.x+loginBtnBB.w&&ty>=loginBtnBB.y&&ty<=loginBtnBB.y+loginBtnBB.h){
      if(loginBtnBB.id==='logout'){logoutUser();showLoginOverlay=false}return;}
    return; // 其余区域点不动（登录由微信原生按钮处理）
  }
  if(showSkinPicker){
    for(const sb of skinButtons){if(tx>=sb.x&&tx<=sb.x+sb.w&&ty>=sb.y&&ty<=sb.y+sb.h){setSkin(sb.id);return}}
    showSkinPicker=false;return;
  }
  if(showCheckin){
    if(ckButton&&tx>=ckButton.x&&tx<=ckButton.x+ckButton.w&&ty>=ckButton.y&&ty<=ckButton.y+ckButton.h){
      if(ckButton.id==='checkinSign'){doCheckin();showCheckin=false}
      else showCheckin=false;
      return;
    }
    showCheckin=false;return;
  }
  if(showWinOverlay){
    if(winNextBB&&tx>=winNextBB.x&&tx<=winNextBB.x+winNextBB.w&&ty>=winNextBB.y&&ty<=winNextBB.y+winNextBB.h){level++;saveGame();showWinOverlay=false;generateLevel();return}
    if(winReplayBB&&tx>=winReplayBB.x&&tx<=winReplayBB.x+winReplayBB.w&&ty>=winReplayBB.y&&ty<=winReplayBB.y+winReplayBB.h){showWinOverlay=false;restartLevel();return}
    if(winShareBB&&tx>=winShareBB.x&&tx<=winShareBB.x+winShareBB.w&&ty>=winShareBB.y&&ty<=winShareBB.y+winShareBB.h){showWinOverlay=false;generateShareCard();return}
    if(winLbBB&&tx>=winLbBB.x&&tx<=winLbBB.x+winLbBB.w&&ty>=winLbBB.y&&ty<=winLbBB.y+winLbBB.h){showWinOverlay=false;loadLB();showLB=true;return}
    return; // 遮罩拦截其余点击
  }
  if(showLoseOverlay){
    if(loseContinueBB&&tx>=loseContinueBB.x&&tx<=loseContinueBB.x+loseContinueBB.w&&ty>=loseContinueBB.y&&ty<=loseContinueBB.y+loseContinueBB.h){showLoseOverlay=false;restartLevel();return}
    if(loseUndoBB&&tx>=loseUndoBB.x&&tx<=loseUndoBB.x+loseUndoBB.w&&ty>=loseUndoBB.y&&ty<=loseUndoBB.y+loseUndoBB.h){if(history.length>0&&props.undo>0){doUndo();props.undo--;showLoseOverlay=false;return}}
    return;
  }
  // 签到快捷按钮 (行2)
  if(ckButton&&ckButton.id==='checkin'&&tx>=ckButton.x&&tx<=ckButton.x+ckButton.w&&ty>=ckButton.y&&ty<=ckButton.y+ckButton.h){showCheckin=true;return}
  // 顶栏按钮（优先，暂停时也响应）
  for(const tb of topButtons){if(tx>=tb.x&&tx<=tb.x+tb.w&&ty>=tb.y&&ty<=tb.y+tb.h){
    if(tb.id==='sound'){soundOn=!soundOn;try{wx.setStorageSync('sound',soundOn?'1':'0')}catch(e){};return}
    if(tb.id==='pause'){paused=!paused;return}
    if(tb.id==='skin'){showSkinPicker=!showSkinPicker;return}
    if(tb.id==='bgm'){toggleBgm();return}
    if(tb.id==='level'){showLvlPicker=!showLvlPicker;return}
    if(tb.id==='shop'){showShopOverlay=!showShopOverlay;shopBuyBB=[];return}
    if(tb.id==='daily'){startDailyChallenge();return}
    if(tb.id==='leaderboard'){loadLB();showLB=!showLB;return}
    if(tb.id==='user'){showLoginOverlay=!showLoginOverlay;return}
  }}
  if(processing||paused)return;
  for(const pb of propButtons){if(tx>=pb.x&&tx<=pb.x+pb.w&&ty>=pb.y&&ty<=pb.y+pb.h){useProp(pb.id);return}}
  const sorted=[...screws].sort((a,b)=>b.layer-a.layer);
  for(const s of sorted){if(s.removed||s.blocked)continue;const sx=s.x/100*(BOARD_W-8)+BOARD_X+4,sy=s.y/100*(BOARD_H-8)+BOARD_Y+4,sr=s.size*Math.min(BOARD_W,BOARD_H)/100/2;if(Math.hypot(tx-sx,ty-sy)<sr*0.95){processClick(s);return}}
}
wx.onTouchStart(()=>{_lastTap=Date.now()});wx.onTouchEnd(e=>{handleTouch(e.changedTouches[0].clientX,e.changedTouches[0].clientY)});
try{canvas.addEventListener('click',e=>{if(Date.now()-_lastTap<100)return;handleTouch(e.clientX,e.clientY)});console.log('[unscrew] mouse fallback added')}catch(e){}

// ── 音效 ──
let audioCtx=null,soundOn=true;
try{audioCtx=wx.createWebAudioContext()}catch(e){}
if(!audioCtx)try{audioCtx=wx.createInnerAudioContext()}catch(e){}
function playTone(f,d,t,v){if(!soundOn||!audioCtx)return;try{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=t;o.frequency.value=f;g.gain.setValueAtTime(v,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+d);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+d)}catch(e){}}
function sfxClick(){playTone(800,0.06,'sine',0.08)}
function sfxMatch(){[523,659,784].forEach((f,i)=>setTimeout(()=>playTone(f,0.15,'sine',0.07),i*70))}
function sfxWin(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>playTone(f,0.3,'triangle',0.08),i*100))}
function sfxLose(){[300,250,200].forEach((f,i)=>setTimeout(()=>playTone(f,0.2,'sawtooth',0.04),i*150))}
function sfxBomb(){playTone(200,0.3,'sawtooth',0.12);playTone(50,0.35,'sawtooth',0.08)}
function sfxUndo(){playTone(200,0.2,'sine',0.08);playTone(600,0.22,'sine',0.06)}
function sfxPeek(){playTone(400,0.25,'sine',0.05);playTone(1600,0.3,'sine',0.03)}

// ── 游戏循环 ──
function loop(){
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=0.06;p.life-=p.decay;if(p.life<=0)particles.splice(i,1)}
  for(let i=dyingScrews.length-1;i>=0;i--){dyingScrews[i].life-=0.06;if(dyingScrews[i].life<=0)dyingScrews.splice(i,1)}
  for(let i=comboPops.length-1;i>=0;i--){comboPops[i].life-=0.025;comboPops[i].y-=1.5;if(comboPops[i].life<=0)comboPops.splice(i,1)}
  for(let i=slotAnims.length-1;i>=0;i--){const a=slotAnims[i];if(Date.now()-a.startTime>a.duration)slotAnims.splice(i,1)}
  if(boardShake>0)boardShake-=0.1;
  render();requestAnimationFrame(loop)
}

// ── 启动 ──
try{console.log('[unscrew] W=',W,'H=',H,'board=',BOARD_W,'x',BOARD_H);loadGame();loadSkin();loadCheckin();loadNick();loadLB();try{tutDone=!!wx.getStorageSync('tut_done')}catch(e){}try{soundOn=wx.getStorageSync('sound')!=='0'}catch(e){}try{bgmOn=wx.getStorageSync('bgm')==='1'}catch(e){}generateLevel();requestAnimationFrame(loop);console.log('[unscrew] started');if(!tutDone)setTimeout(()=>{showTutorialOverlay=true;tutIdx=0},400)}catch(e){console.error('[unscrew] init error:',e.message,e.stack)}
