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
const DPR = Math.min(sysInfo.pixelRatio || 1, 2); // 最高2x防性能问题
canvas.width = W * DPR; canvas.height = H * DPR;
ctx.scale(DPR, DPR);
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
const MAX_SLOTS=7, MATCH_COUNT=3, COMBO_TIMEOUT=1500;
// ── 状态 ──
let screws=[], slots=[], score=0, level=1, combo=0;
let history=[], processing=false, paused=false, pauseBtnBB=null;
let comboTimer=null, totalScrewCount=0, starMoves=0, winStars=0, winEfficiency=0;
let props={undo:5,bomb:3,peek:3,lightning:3,shuffle:3};
let coins=30, particles=[], dyingScrews=[], comboPops=[], slotAnims=[];
let toastMsg='', toastTimer=null, showWinOverlay=false, showLoseOverlay=false, losePct=0;
let peekTargets=[], peekTimer=null, propButtons=[], boardShake=0;
// ── 主题系统 ──
const SKINS=[
  {id:'default',name:'星空',bgTop:'#0a0b24',bgMid:'#13143a',bgBot:'#0b0c20', boardTop:'#d4a660',boardMid:'#dbb472',boardBot:'#9a6a30', boardBorder:'#684420'},
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
function loadGame(){try{level=wx.getStorageSync('u_lv')||1;score=wx.getStorageSync('u_sc')||0;coins=wx.getStorageSync('u_co')||30;const p=wx.getStorageSync('u_pr');if(p){for(const k in p){if(p[k]<0)p[k]=0}props=p}privacyAgreed=!!wx.getStorageSync('privacy')}catch(e){}}
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
let showLB=false, lbData=[], lbPeriod='all', _fromWinOverlay=false;
function loadLB(){try{lbData=JSON.parse(wx.getStorageSync('lb')||'[]')}catch(e){lbData=[]}}
function submitLB(){var today=getToday();var entry={nick:nickname||'萌糖玩家',score:score,level:level,date:today};lbData.push(entry);lbData.sort((a,b)=>b.score-a.score);if(lbData.length>50)lbData=lbData.slice(0,50);wx.setStorageSync('lb',JSON.stringify(lbData))}
// ── 隐私协议 ──
let privacyCheckOn=false, privacyCB=null, privacyAgreeBB=null, privacyUserBB=null, privacyPolicyBB=null, privacyTextCloseBB=null;
const PRIVACY_POLICY=`隐私政策

更新日期：2026年7月16日

萌糖消了个消（以下简称"本游戏"）尊重并保护用户隐私。

一、信息收集
本游戏仅通过微信官方接口获取您的昵称和头像，用于游戏内排行榜展示。不会收集您的真实姓名、手机号、身份证号、地理位置等个人敏感信息。

二、信息使用
您的昵称和头像仅用于：
1. 游戏内排行榜展示
2. 个性化游戏体验
您的信息不会用于任何其他目的，也不会共享、转让或公开披露给任何第三方。

三、信息存储
您的游戏数据（关卡进度、分数、道具数量等）仅存储在您的本地设备上。昵称和头像存储在微信本地缓存中。我们不会将您的数据上传至任何服务器。

四、您的权利
您可以在游戏设置中随时退出登录，退出后昵称和头像信息将被清除。您也可以删除微信小游戏数据来清除所有存储信息。

五、未成年人保护
若您是未成年人，请在监护人指导下使用本游戏。

六、政策更新
我们可能会不时更新本隐私政策，更新后的政策将在游戏内公示。

如有疑问，请联系开发者。`;

const USER_AGREEMENT=`用户服务协议

更新日期：2026年7月16日

欢迎使用萌糖消了个消！

一、服务说明
本游戏是一款休闲益智类微信小游戏，提供免费的关卡挑战、道具使用和排行榜功能。

二、用户行为规范
您在使用本游戏时应遵守法律法规，不得利用本游戏从事违法违规活动，包括但不限于作弊、外挂、利用漏洞等行为。

三、知识产权
本游戏的所有内容（包括但不限于代码、美术资源、音乐、界面设计）均受知识产权法保护，未经许可不得复制、修改或传播。

四、免责声明
本游戏按"现状"提供，不保证服务无中断或无错误。因设备兼容性、微信平台限制等原因导致的服务中断，开发者不承担责任。

五、服务变更与终止
开发者有权随时修改或终止本游戏服务，但会尽量提前通知用户。

六、争议解决
本协议的解释与适用均适用中华人民共和国法律。因本协议产生的争议，双方应友好协商解决。

开始使用即表示您同意本协议的全部条款。`;
let nickname='', avatarUrl='', showLoginOverlay=false, userInfoBtn=null, privacyAgreed=false, showPrivacyText='';
function loadNick(){try{nickname=wx.getStorageSync('nick')||'';avatarUrl=wx.getStorageSync('avatar')||''}catch(e){}}
function setNick(n,a){nickname=n;avatarUrl=a||'';try{wx.setStorageSync('nick',n);if(a)wx.setStorageSync('avatar',a)}catch(e){}}
function logoutUser(){nickname='';avatarUrl='';setNick('','');showToast('已退出')}
function showWxLoginBtn(){
  if(!userInfoBtn){
    try{
      userInfoBtn=wx.createUserInfoButton({type:'text',text:'微信一键登录',
        style:{left:W/2-70,top:H/2+65,width:140,height:42,lineHeight:42,
          backgroundColor:'#07c160',color:'#ffffff',textAlign:'center',fontSize:15,borderRadius:21}});
      userInfoBtn.onTap(res=>{
        console.log('[login] onTap:',JSON.stringify(res));
        if(res.errMsg.indexOf(':ok')>-1){
          // 新版优先 rawData，旧版 fallback 用 getUserInfo
          if(res.rawData){
            try{const u=JSON.parse(res.rawData);setNick(u.nickName||'微信用户',u.avatarUrl||'');showToast('欢迎 '+nickname)}catch(e){}
          }else if(res.userInfo){
            setNick(res.userInfo.nickName||'微信用户',res.userInfo.avatarUrl||'');showToast('欢迎 '+nickname);
          }else{
            wx.getUserInfo({success:r=>{const u=r.userInfo;setNick(u.nickName||'微信用户',u.avatarUrl||'');showToast('欢迎 '+nickname)},fail:()=>{showToast('登录失败，请重试')}});
          }
        }
        showLoginOverlay=false;hideWxLoginBtn()
      });
    }catch(e){console.log('[login] create failed:',e)}
  }
  if(userInfoBtn){try{userInfoBtn.show()}catch(e){}}
}
function hideWxLoginBtn(){if(userInfoBtn){try{userInfoBtn.hide()}catch(e){}userInfoBtn.destroy();userInfoBtn=null}}
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
  const numColors=Math.min(COLORS.length,3+Math.ceil(level/2)),screwsPerColor=Math.max(3,Math.round(level*1.2/3)*3),total=numColors*screwsPerColor;
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
  function dfs(removed,slotsArr,remaining,depth){if(Date.now()-startTime>3000)return false;if(remaining===0&&slotsArr.length===0)return true;const key=remaining+'|'+slotsArr.slice().sort().join(',');if(visited[key])return false;visited[key]=true;const candidates=[];for(const s of screws){if(removed[s.id])continue;if(!isBlocked(s.id,removed))candidates.push(s)}candidates.sort((a,b)=>{const inA=slotsArr.filter(c=>c===a.color.name).length,inB=slotsArr.filter(c=>c===b.color.name).length;return inB-inA});for(const screw of candidates){if(slotsArr.length>=MAX_SLOTS&&slotsArr.filter(c=>c===screw.color.name).length<2)continue;let ns=slotsArr.slice();ns.push(screw.color.name);const cnt={};for(const c of ns)cnt[c]=(cnt[c]||0)+1;for(const cn in cnt){if(cnt[cn]>=3){ns=ns.filter(c=>c!==cn);break}}removed[screw.id]=true;if(dfs(removed,ns,remaining-1,depth+1))return true;delete removed[screw.id]}return false}
  const ri={};let riC=0;for(const s of screws){if(s.removed)ri[s.id]=true;else riC++}const si=slots.filter(Boolean).map(s=>s.color.name);return dfs(ri,si,riC,0)
}
// ── 游戏逻辑 ──
let _clickLock=0;
function processClick(screw){if(processing||paused||!screw||screw.blocked||screw.removed)return;const now=Date.now();if(now-_clickLock<80)return;_clickLock=now;processing=true;history.push({screwId:screw.id,slots:slots.map(s=>s?{id:s.id,color:s.color}:null),score,combo});dyingScrews.push({id:screw.id,x:screw.x,y:screw.y,size:screw.size,color:screw.color,life:1});screw.removed=true;starMoves++;slots.push({id:screw.id,color:screw.color});const slotIdx=slots.length-1;slotAnims.push({idx:slotIdx,type:'popIn',startTime:Date.now(),duration:250,color:screw.color.hex});sfxClick();updateBlocked(screw.id);checkMatches()}
function checkMatches(){const count={};slots.forEach((s,i)=>{if(!s)return;const k=s.color.name;if(!count[k])count[k]=[];count[k].push(i)});let mi=null;for(const cn in count){if(count[cn].length>=MATCH_COUNT){mi=count[cn].slice(0,MATCH_COUNT);break}}if(mi){processing=true;if(comboTimer)clearTimeout(comboTimer);combo++;const bonus=combo>1?combo*5:0;score+=30+bonus;sfxMatch();const cx=BOARD_X+BOARD_W/2,cy=BOARD_Y+BOARD_H*0.55;spawnParticles(cx,cy,slots[mi[0]].color.hex);const now2=Date.now();mi.forEach(idx=>slotAnims.push({idx,type:'glow',startTime:now2,duration:200,color:slots[idx].color.hex}));if(combo>=2)spawnComboPop(cx,cy-20,combo>=7?'🔥超级连击!':combo>=4?'⚡连击x'+combo:'combo x'+combo);comboTimer=setTimeout(()=>{combo=0},COMBO_TIMEOUT);setTimeout(()=>{mi.sort((a,b)=>b-a).forEach(i=>slots.splice(i,1));slots=slots.filter(Boolean);processing=false;if(screws.every(s=>s.removed)){sfxWin();setTimeout(winLevel,350)}},130)}else{if(slots.filter(Boolean).length>=MAX_SLOTS){processing=true;sfxLose();boardShake=1;const remain=screws.filter(s=>!s.removed).length;losePct=Math.round((totalScrewCount-remain)/totalScrewCount*100);setTimeout(()=>{showSkinPicker=false;showCheckin=false;showShopOverlay=false;showLvlPicker=false;showTutorialOverlay=false;showShareOverlay=false;showLB=false;showLoginOverlay=false;showLoseOverlay=true;processing=false},200)}else{setTimeout(()=>{processing=false},100)}}setTimeout(()=>{try{wx.setStorageSync('u_lv',level);wx.setStorageSync('u_sc',score);wx.setStorageSync('u_co',coins);wx.setStorageSync('u_pr',props)}catch(e){}},50)}
function winLevel(){
  // 关闭所有其他弹窗
  showSkinPicker=false;showCheckin=false;showShopOverlay=false;
  showLvlPicker=false;showTutorialOverlay=false;showShareOverlay=false;
  showLB=false;showLoginOverlay=false;hideWxLoginBtn();
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
function restartLevel(){showSkinPicker=false;showCheckin=false;showShopOverlay=false;showLvlPicker=false;showTutorialOverlay=false;showShareOverlay=false;showLB=false;showLoginOverlay=false;showPrivacyText='';privacyCheckOn=false;hideWxLoginBtn();showLoseOverlay=false;showWinOverlay=false;generateLevel()}
// ── 道具 ──
function doUndo(){if(history.length===0)return false;showLoseOverlay=false;const last=history.pop();if(last.screwId!==null&&last.screwId!==undefined){const s=screws.find(x=>x.id===last.screwId);if(s){s.removed=false;s.blocked=false}const idx=slots.findIndex(sl=>sl&&sl.id===last.screwId);if(idx>=0)slots.splice(idx,1)}if(last.shuffleColors){for(const sc of last.shuffleColors){const s=screws.find(x=>x.id===sc.id);if(s)s.color=sc.color}}slots=last.slots.filter(Boolean);score=last.score;combo=last.combo;updateBlocked();return true}
function doBomb(){if(slots.filter(Boolean).length===0)return false;const last=slots.pop();const s=screws.find(x=>x.id===last.id);if(s){s.removed=false;s.blocked=false}sfxBomb();updateBlocked();return true}
function doPeek(){const targets=screws.filter(s=>!s.removed&&s.blocked);if(targets.length===0||props.peek<=0)return false;props.peek--;peekTargets=targets.map(t=>t.id);sfxPeek();if(peekTimer)clearTimeout(peekTimer);peekTimer=setTimeout(()=>{peekTargets=[]},3000);return true}
function doLightning(){const filled=slots.filter(Boolean);if(filled.length<2||props.lightning<=0)return false;props.lightning--;const groups={};filled.forEach(s=>{const k=s.color.name;if(!groups[k])groups[k]=[];groups[k].push(s)});let target=null;for(const k in groups){if(groups[k].length>=2){target=groups[k];break}}if(!target)return false;while(target.length>0&&slots.filter(Boolean).length>0){const idx=slots.findIndex(sl=>sl&&sl.color.name===target[0].color.name);if(idx>=0)slots.splice(idx,1);target.shift()}updateBlocked();return true}
function doShuffle(){const alive=screws.filter(s=>!s.removed);if(alive.length<2||props.shuffle<=0)return false;props.shuffle--;const colors=alive.map(s=>s.color);for(let i=colors.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[colors[i],colors[j]]=[colors[j],colors[i]]}history.push({screwId:null,slots:slots.map(s=>s?{id:s.id,color:s.color}:null),score,combo,shuffleColors:alive.map((s,i)=>({id:s.id,color:s.color}))});alive.forEach((s,i)=>{s.color=colors[i]});updateBlocked();return true}
function useProp(type){if(type==='undo'){if(props.undo>0&&doUndo()){props.undo--;showToast('已撤回')}}else if(type==='bomb'){if(props.bomb>0&&doBomb()){props.bomb--;showToast('炸弹!')}}else if(type==='peek'){doPeek()}else if(type==='lightning'){if(doLightning())showToast('闪电!')}else if(type==='shuffle'){if(doShuffle())showToast('已洗牌')}}
// ═══════════════════ Canvas 渲染 — 1:1 CSS 翻译 ═══════════════════
// ═══ 层叠布局：9:16板(自适应满宽20px边距) → 槽 → 道具 → 信息 ═══
const TOP_BAR_H = 195;
const PAD = 10; // 左右各10px
const BOARD_W = W - PAD*2; // 撑满宽
const BOARD_H_RAW = Math.min(Math.round(BOARD_W * 16 / 9), H - TOP_BAR_H - 130) - 30;
const BOARD_H = Math.round(BOARD_H_RAW * 0.80); // 上下各缩10%
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
// ── 星空粒子（初始化时生成，每帧复用） ──
const STAR_COUNT=80, stars=[];
(function(){
  const rng=seedRandom(42);
  for(let i=0;i<STAR_COUNT;i++){
    stars.push({x:rng()*W, y:rng()*H*0.9, r:0.4+rng()*1.2, a:0.3+rng()*0.5, twinkle:rng()*Math.PI*2});
  }
})();
function drawBoard(){
  // ═══ 第0层：深空背景 ═══
  const sk=getSkin();
  ctx.fillStyle=sk.bgBot;ctx.fillRect(0,0,W,H);
  // 径向光晕（中部偏上）
  const bloomX=W/2, bloomY=H*0.35, bloomR=Math.max(W,H)*0.7;
  const bloom=ctx.createRadialGradient(bloomX,bloomY,bloomR*0.1,bloomX,bloomY,bloomR);
  bloom.addColorStop(0,'rgba(80,100,180,0.10)');
  bloom.addColorStop(0.3,'rgba(50,60,140,0.06)');
  bloom.addColorStop(0.6,'rgba(20,25,80,0.03)');
  bloom.addColorStop(1,'transparent');
  ctx.fillStyle=bloom;ctx.fillRect(0,0,W,H);
  // 第二光晕（更柔和，底部）
  const bloom2=ctx.createRadialGradient(W*0.25,H*0.65,0,W*0.25,H*0.65,W*0.8);
  bloom2.addColorStop(0,'rgba(30,40,100,0.05)');
  bloom2.addColorStop(1,'transparent');
  ctx.fillStyle=bloom2;ctx.fillRect(0,0,W,H);
  // 星空粒子
  const t=Date.now()*0.0003;
  for(const s of stars){
    const a=s.a*(0.7+0.3*Math.sin(t+s.twinkle));
    ctx.fillStyle=`rgba(200,210,255,${a.toFixed(2)})`;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();
  }
  // 顶部渐变叠加（主题色融合）
  const tbg=ctx.createLinearGradient(0,0,0,H);
  tbg.addColorStop(0,sk.bgTop+'dd');tbg.addColorStop(0.5,'transparent');tbg.addColorStop(1,sk.bgBot+'88');
  ctx.fillStyle=tbg;ctx.fillRect(0,0,W,H);
  // ═══ 第1层：棋盘外阴影 + 底座 ═══
  const bx=BOARD_X+3,by=BOARD_Y,bw=BOARD_W-6,bh=BOARD_H;
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.50)';ctx.shadowBlur=48;ctx.shadowOffsetY=10;
  ctx.fillStyle='rgba(0,0,0,0.50)';ctx.beginPath();ctx.roundRect(BOARD_X,BOARD_Y,BOARD_W,BOARD_H,16);ctx.fill();
  ctx.restore();
  // 底座边框（两层，模拟厚度）
  ctx.fillStyle=sk.boardBorder;ctx.beginPath();ctx.roundRect(BOARD_X-3,BOARD_Y-3,BOARD_W+6,BOARD_H+6,18);ctx.fill();
  ctx.fillStyle=shadeColor(sk.boardBorder,18);ctx.beginPath();ctx.roundRect(BOARD_X-1,BOARD_Y-1,BOARD_W+2,BOARD_H+2,16);ctx.fill();
  // ═══ 第2层：木板主体 ═══
  const a175=175*Math.PI/180,dx175=Math.sin(a175),dy175=-Math.cos(a175);
  const wbg=ctx.createLinearGradient(bx,by,bx+dx175*bw,by+dy175*bh);
  wbg.addColorStop(0,sk.boardTop);wbg.addColorStop(0.12,shadeColor(sk.boardTop,-4));
  wbg.addColorStop(0.18,sk.boardMid);
  wbg.addColorStop(0.32,sk.boardTop);
  wbg.addColorStop(0.50,sk.boardMid);
  wbg.addColorStop(0.72,sk.boardBot);
  wbg.addColorStop(0.88,shadeColor(sk.boardBot,6));
  wbg.addColorStop(1,sk.boardBot);
  ctx.fillStyle=wbg;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,14);ctx.fill();
  // ═══ 第3层：木纹纹理（三层叠加，有机交错） ═══
  ctx.save();ctx.beginPath();ctx.roundRect(bx+6,by+6,bw-12,bh-12,8);ctx.clip();
  // L1: 细密横纹 (暖色)
  ctx.strokeStyle='rgba(120,80,40,0.04)';ctx.lineWidth=0.8;
  for(let y=by+6;y<by+bh-6;y+=4.5){
    const off=Math.tan(1.5*Math.PI/180)*(y-by);
    ctx.beginPath();ctx.moveTo(bx+off,y);ctx.lineTo(bx+off+bw+4,y);ctx.stroke();
  }
  // L2: 宽疏斜纹 (暗调)
  ctx.strokeStyle='rgba(0,0,0,0.035)';ctx.lineWidth=2.5;
  for(let x=bx-10;x<bx+bw+10;x+=36){
    ctx.beginPath();ctx.moveTo(x,by-4);ctx.lineTo(x-(bh*Math.tan(3.5*Math.PI/180)),by+bh+4);ctx.stroke();
  }
  // L3: 中密反斜纹 (亮调)
  ctx.strokeStyle='rgba(200,150,100,0.035)';ctx.lineWidth=1;
  for(let d=-bh;d<bw+bh;d+=48){
    ctx.beginPath();ctx.moveTo(bx+d,by);ctx.lineTo(bx+d+bh*Math.tan(3*Math.PI/180),by+bh);ctx.stroke();
  }
  ctx.restore();
  // ═══ 第4层：内阴影 + 顶部高光 ═══
  ctx.save();ctx.beginPath();ctx.roundRect(bx,by,bw,bh,14);ctx.clip();
  const ish=ctx.createLinearGradient(0,by,0,by+bh);
  ish.addColorStop(0,'rgba(0,0,0,0.18)');ish.addColorStop(0.08,'rgba(0,0,0,0.06)');
  ish.addColorStop(0.5,'rgba(0,0,0,0)');
  ish.addColorStop(0.88,'rgba(0,0,0,0.04)');ish.addColorStop(1,'rgba(0,0,0,0.12)');
  ctx.fillStyle=ish;ctx.fillRect(bx,by,bw,bh);
  // 顶部边缘光
  const edgeGlow=ctx.createLinearGradient(0,by,0,by+4);
  edgeGlow.addColorStop(0,'rgba(255,255,255,0.10)');edgeGlow.addColorStop(1,'transparent');
  ctx.fillStyle=edgeGlow;ctx.fillRect(bx+10,by+1,bw-20,4);
  ctx.restore();
  // ═══ 第5层：四角铆钉 ═══
  const studR=4, studPad=12;
  const corners=[[bx+studPad,by+studPad],[bx+bw-studPad,by+studPad],[bx+studPad,by+bh-studPad],[bx+bw-studPad,by+bh-studPad]];
  for(const[cx,cy]of corners){
    const sg=ctx.createRadialGradient(cx-0.5,cy-0.5,0,cx,cy,studR);
    sg.addColorStop(0,'rgba(255,220,160,0.55)');sg.addColorStop(0.4,'rgba(180,140,80,0.40)');
    sg.addColorStop(0.8,'rgba(80,50,20,0.30)');sg.addColorStop(1,'rgba(40,20,10,0.15)');
    ctx.fillStyle=sg;ctx.beginPath();ctx.arc(cx,cy,studR,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.25)';ctx.lineWidth=0.8;ctx.beginPath();ctx.arc(cx,cy,studR-0.3,0,Math.PI*2);ctx.stroke();
  }
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
  ctx.globalAlpha = isDying ? dyingLife : (s.blocked ? 0.4 : 1);
  // ═══ 1. 外阴影 box-shadow: rgba(0,0,0,0.25) 0 4px 12px ═══
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.25)';ctx.shadowBlur=12;ctx.shadowOffsetY=4;
  ctx.beginPath();ctx.arc(sx,sy+4,sr,0,Math.PI*2);
  ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fill();
  ctx.restore();
  // ═══ 2. 主体渐变 ═══
  const gx2=sx-sr*0.30,gy2=sy-sr*0.30;
  const gR2=sr*1.84;
  const g2=ctx.createRadialGradient(gx2,gy2,0,gx2,gy2,gR2);
  g2.addColorStop(0,s.color.light);g2.addColorStop(0.5,s.color.hex);g2.addColorStop(1,shadeColor(s.color.hex,-30));
  ctx.beginPath();ctx.arc(sx,sy,sr,0,Math.PI*2);ctx.fillStyle=g2;ctx.fill();
  // ═══ 3. 内高光 ═══
  const igY2=sy-sr,igR2=sr*0.22;
  const ig2=ctx.createLinearGradient(0,igY2,0,igY2+igR2);
  ig2.addColorStop(0,'rgba(255,255,255,0.35)');
  ig2.addColorStop(0.1,'rgba(255,255,255,0.28)');
  ig2.addColorStop(0.25,'rgba(255,255,255,0.10)');
  ig2.addColorStop(0.55,'rgba(255,255,255,0.02)');
  ig2.addColorStop(1,'rgba(255,255,255,0)');
  ctx.save();ctx.beginPath();ctx.arc(sx,sy,sr,0,Math.PI*2);ctx.clip();
  ctx.fillStyle=ig2;ctx.fillRect(sx-sr,igY2,sr*2,igR2);ctx.restore();
  // ═══ 4. ::before 左上镜面高光 ═══
  const bx3=sx-sr*0.34,by3=sy-sr*0.52,brx3=sr*0.30,bry3=sr*0.24;
  ctx.save();ctx.beginPath();ctx.arc(sx,sy,sr,0,Math.PI*2);ctx.clip();
  ctx.fillStyle='rgba(255,255,255,0.45)';
  try{ctx.beginPath();ctx.ellipse(bx3,by3,brx3,bry3,-0.262,0,Math.PI*2);ctx.fill()}catch(e){
    ctx.beginPath();ctx.arc(bx3,by3,brx3,0,Math.PI*2);ctx.fill()}
  ctx.restore();
  // ═══ 5. ::after 面孔 ═══
  drawFace(ctx, s.color.face, sx, sy, sr);
  ctx.globalAlpha=1;
}
function drawSlots(){
  const totalW = BOARD_W;
  const sx = BOARD_X;
  const sy = SLOT_BAR_Y; // 板下槽位
  const filled=slots.filter(Boolean).length;
  const warn=filled>=5; // 5/7 就开始警示
  const bgAlpha=0.6+(filled>=6?0.1:0);
  const sbg = ctx.createLinearGradient(0, sy, 0, sy + SLOT_ROW_H);
  if(filled>=6){sbg.addColorStop(0,'rgba(120,20,10,'+bgAlpha+')');sbg.addColorStop(1,'rgba(60,8,5,'+bgAlpha+')');}
  else if(filled>=5){sbg.addColorStop(0,'rgba(100,50,10,'+bgAlpha+')');sbg.addColorStop(1,'rgba(50,20,5,'+bgAlpha+')');}
  else{sbg.addColorStop(0,'rgba(70,55,35,'+bgAlpha+')');sbg.addColorStop(1,'rgba(40,30,18,'+bgAlpha+')');}
  ctx.fillStyle=sbg;
  ctx.beginPath(); ctx.roundRect(sx, sy, totalW, SLOT_ROW_H, 16); ctx.fill();
  // 边框
  ctx.strokeStyle=filled>=6?'rgba(255,40,40,0.7)':filled>=5?'rgba(255,140,30,0.6)':'rgba(180,150,120,0.18)';
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
      if (s.color.pattern) { drawPattern(ctx, s.color.pattern, dx, dy, dotR) }
      drawFace(ctx, s.color.face, dx, dy, dotR);
      ctx.restore(); // end popIn scale
    }
  }
}
function drawPropsBar(){
  const _s=ctx.save.bind(ctx),_r=ctx.restore.bind(ctx);
  const propY = PROPS_Y;
  const btnW=PROP_BTN, gap=PROP_GAP, list=[{id:'undo',icon:'↩',label:'撤回'},{id:'bomb',icon:'💣',label:'炸弹'},{id:'peek',icon:'👁',label:'透视'},{id:'lightning',icon:'⚡',label:'闪电'},{id:'shuffle',icon:'🔀',label:'洗牌'}];
  const padX=10, totalW=list.length*btnW+(list.length-1)*gap, startX=BOARD_X+(BOARD_W-totalW)/2;
  propButtons=list.map((p,i)=>({id:p.id, x:startX+i*(btnW+gap), y:propY, w:btnW, h:btnW+PROP_LABEL}));
  list.forEach((p,i)=>{
    const bx=startX+i*(btnW+gap);
    const count=props[p.id]||0, available=count>0;
    // 按钮背景（径向微光）
    const pbg=ctx.createRadialGradient(bx+btnW/2,propY+btnW*0.3,0,bx+btnW/2,propY+btnW/2,btnW*0.7);
    pbg.addColorStop(0,available?'rgba(140,150,180,0.12)':'rgba(100,110,130,0.04)');
    pbg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=pbg;ctx.beginPath();ctx.roundRect(bx,propY,btnW,btnW,12);ctx.fill();
    ctx.strokeStyle=available?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.03)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.roundRect(bx,propY,btnW,btnW,12);ctx.stroke();
    // 图标
    _s();ctx.font='bold 18px sans-serif';ctx.fillStyle=available?'#cbd5e1':'#475569';
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.icon, bx+btnW/2, propY+btnW/2);
    // 标签
    ctx.font='bold 10px sans-serif';ctx.fillStyle=available?'#64748b':'#3b3f4a';
    ctx.fillText(p.label, bx+btnW/2, propY+btnW+8);
    _r();
    // 数量徽章
    const badgeR=8;
    ctx.fillStyle=count===0?'rgba(255,255,255,0.06)':'#fbbf24';
    ctx.beginPath();ctx.arc(bx+btnW-badgeR+2, propY+badgeR-1, badgeR, 0, Math.PI*2);ctx.fill();
    if(count>0){ctx.strokeStyle='rgba(0,0,0,0.2)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(bx+btnW-badgeR+2, propY+badgeR-1, badgeR, 0, Math.PI*2);ctx.stroke();}
    _s();ctx.font='bold 9px sans-serif';ctx.fillStyle=count===0?'#555':'#0c0c1d';
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(count, bx+btnW-badgeR+2, propY+badgeR+1);_r();
  });
}
let topButtons=[]; // {id, x, y, w, h} for top-row buttons
let ckButton=null; // checkin button rect
let skinButtons=[]; // skin picker option rects
let shopBuyBB=[], shopCloseBB=null;
let lvlListBB=[], lvlCloseBB=null;
let tutSkipBB=null, tutNextBB=null;
let shareCloseBB=null, shareBtnBB=null;
let lbTabBB=[], lbCloseBB=null;
let loginCloseBB=null, loginBtnBB=null;
let winShareBB=null, winLbBB=null, winNextBB=null, winReplayBB=null;
let loseContinueBB=null, loseUndoBB=null, loseAdBB=null;
let loseRestartConfirm=false, loseRestartTimer=null;
// ── 激励视频广告 ──
let videoAd=null, adReady=false, AD_UNIT_ID=''; // 填入你的广告单元ID
function initAd(){
  if(!AD_UNIT_ID)return;
  try{
    videoAd=wx.createRewardedVideoAd({adUnitId:AD_UNIT_ID});
    videoAd.onLoad(()=>{adReady=true});
    videoAd.onError(()=>{adReady=false});
    videoAd.onClose(res=>{
      if(res&&res.isEnded){
        // 广告看完 → 复活：移除最后2个槽位 + 洗牌
        for(let i=0;i<Math.min(2,slots.filter(Boolean).length);i++)slots.pop();
        history.pop(); // 移除最后一步历史
        doShuffle(); // 免费洗牌不扣道具
        showLoseOverlay=false;
        showToast('📺 复活成功！');
      }
    });
  }catch(e){}
}
function drawUI(){
  const _s=ctx.save.bind(ctx),_r=ctx.restore.bind(ctx);
  // ═══ 顶栏 4行 (195px) ═══
  const r1y=56, r1h=22, r2y=82, r2h=30, r3y=118, r3h=26, r4y=150, r4h=30;
  const SAFE_R = W - 50;
  // ── 毛玻璃底条（三层叠加） ──
  // L1: 深色底
  ctx.fillStyle='rgba(8,10,28,0.70)';ctx.fillRect(0,0,W,TOP_BAR_H);
  // L2: 渐变过镀
  const tbg=ctx.createLinearGradient(0,0,0,TOP_BAR_H);
  tbg.addColorStop(0,'rgba(15,18,40,0.55)');
  tbg.addColorStop(0.45,'rgba(12,15,35,0.35)');
  tbg.addColorStop(1,'rgba(8,10,25,0.0)');
  ctx.fillStyle=tbg;ctx.fillRect(0,0,W,TOP_BAR_H);
  // L3: 顶边高光线
  const thl=ctx.createLinearGradient(0,0,0,3);
  thl.addColorStop(0,'rgba(255,255,255,0.06)');thl.addColorStop(1,'transparent');
  ctx.fillStyle=thl;ctx.fillRect(0,0,W,3);
  // 底边分割线
  ctx.strokeStyle='rgba(255,255,255,0.05)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,TOP_BAR_H);ctx.lineTo(W,TOP_BAR_H);ctx.stroke();
  topButtons=[];
  skinButtons=[];
  ckButton=null;
  // ── 行1: 关卡标签 ──
  const lvW=78, lvH=22, lvX=12, lvY=r1y+1;
  ctx.fillStyle='rgba(99,102,241,0.15)';ctx.beginPath();ctx.roundRect(lvX,lvY,lvW,lvH,11);ctx.fill();
  ctx.strokeStyle='rgba(99,102,241,0.25)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(lvX,lvY,lvW,lvH,11);ctx.stroke();
  ctx.font='bold 12px sans-serif';ctx.fillStyle='#a5b4fc';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('第'+level+'关 ▼',lvX+lvW/2,lvY+lvH/2);
  topButtons.push({id:'level',x:lvX,y:lvY,w:lvW,h:lvH});
  // ── 行2: ⭐分数 + 图标按钮组 ──
  _s();ctx.font='bold 15px sans-serif';ctx.textBaseline='middle';
  ctx.fillStyle='#fbbf24';ctx.textAlign='left';ctx.fillText('⭐ '+score, 12, r2y+r2h/2);_r();
  const btnS=30, btnGap=6;
  const iconList=[
    {e:bgmOn?'🎵':'🎶',id:'bgm',active:bgmOn},
    {e:'🎨',id:'skin',active:showSkinPicker},
    {e:'🏆',id:'leaderboard',active:showLB},
    {e:nickname?'✓':'👤',id:'user',active:!!nickname}
  ];
  const iconTotalW=iconList.length*btnS+(iconList.length-1)*btnGap;
  const iconStartX=SAFE_R-iconTotalW;
  iconList.forEach((ic,i)=>{
    const ix=iconStartX+i*(btnS+btnGap), iy=r2y;
    // 背景
    const ibg=ctx.createRadialGradient(ix+btnS/2,iy+btnS/3,0,ix+btnS/2,iy+btnS/2,btnS*0.7);
    ibg.addColorStop(0,ic.active?'rgba(120,130,180,0.18)':'rgba(100,110,150,0.08)');
    ibg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=ibg;ctx.beginPath();ctx.roundRect(ix,iy,btnS,btnS,10);ctx.fill();
    ctx.strokeStyle=ic.active?'rgba(255,255,255,0.10)':'rgba(255,255,255,0.04)';ctx.lineWidth=1;
    ctx.beginPath();ctx.roundRect(ix,iy,btnS,btnS,10);ctx.stroke();
    _s();ctx.font='17px sans-serif';ctx.fillStyle=ic.active?'#cbd5e1':'#64748b';
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(ic.e,ix+btnS/2,iy+btnS/2);_r();
    topButtons.push({id:ic.id,x:ix,y:iy,w:btnS,h:btnS});
  });
  // ── 行3: 快捷按钮 + 金币 ──
  const scoreW=72, coinsW=64;
  _s();ctx.font='bold 13px sans-serif';ctx.fillStyle='#fcd34d';ctx.textAlign='right';
  ctx.textBaseline='middle';ctx.fillText('🪙 '+coins, SAFE_R-4, r3y+13);_r();
  const midX=12, midW=(SAFE_R-6-coinsW-4)-midX;
  const btnH=24, btnGap2=8;
  const labels=[
    {t:'🛒 商店',id:'shop',cs:['#22d3ee','#0e7490']},
    {t:'📅 每日',id:'daily',cs:['#f87171','#dc2626']},
    {t:'🎁 签到',id:'checkin',cs:['#fbbf24','#d97706']}
  ];
  const eachW=Math.floor((midW-btnGap2*(labels.length-1))/labels.length);
  const today=getToday(), ckClaimed=ckData.lastDate===today;
  labels.forEach((lb,i)=>{
    const bx=midX+i*(eachW+btnGap2), by=r3y+1;
    let cs=lb.cs;
    if(lb.id==='checkin' && ckClaimed) cs=['#818cf8','#4f46e5'];
    // 阴影 + 渐变
    _s();ctx.shadowColor='rgba(0,0,0,0.25)';ctx.shadowBlur=6;ctx.shadowOffsetY=2;
    const bg=ctx.createLinearGradient(0,by,0,by+btnH);
    bg.addColorStop(0,cs[0]);bg.addColorStop(1,cs[1]);
    ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(bx,by,eachW,btnH,12);ctx.fill();_r();
    // 内高光
    _s();ctx.beginPath();ctx.roundRect(bx,by,eachW,btnH,12);ctx.clip();
    ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=1;
    ctx.beginPath();ctx.roundRect(bx+0.5,by+0.5,eachW-1,btnH-1,11.5);ctx.stroke();
    const hl=ctx.createLinearGradient(0,by,0,by+btnH*0.5);
    hl.addColorStop(0,'rgba(255,255,255,0.25)');hl.addColorStop(1,'transparent');
    ctx.fillStyle=hl;ctx.beginPath();ctx.roundRect(bx+1,by+1,eachW-2,btnH*0.45,11);ctx.fill();_r();
    _s();ctx.font='bold 12px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(lb.id==='checkin'&&ckClaimed?'✅ 已签':lb.t,bx+eachW/2,by+btnH/2);_r();
    topButtons.push({id:lb.id,x:bx,y:by,w:eachW,h:btnH});
    if(lb.id==='checkin') ckButton={id:'checkin',x:bx,y:by,w:eachW,h:btnH};
  });
  // ── 行4: 音效/暂停按钮 ──
  const pauseX=SAFE_R-btnS, soundX=pauseX-btnS-btnGap, btnY4=r4y;
  [{x:soundX,id:'sound',icon:soundOn?'🔊':'🔇',active:soundOn,clr:soundOn?'#94a3b8':'#ef4444',bg:soundOn?'rgba(255,255,255,0.06)':'rgba(255,80,80,0.10)'},
   {x:pauseX,id:'pause',icon:paused?'▶':'⏸',active:paused,clr:paused?'#fbbf24':'#94a3b8',bg:paused?'rgba(251,191,36,0.15)':'rgba(255,255,255,0.06)'}
  ].forEach(btn=>{
    ctx.fillStyle=btn.bg;ctx.beginPath();ctx.roundRect(btn.x,btnY4,btnS,btnS,10);ctx.fill();
    ctx.strokeStyle=btn.active?'rgba(255,255,255,0.14)':'rgba(255,255,255,0.06)';ctx.lineWidth=1;
    ctx.beginPath();ctx.roundRect(btn.x,btnY4,btnS,btnS,10);ctx.stroke();
    _s();ctx.font='18px sans-serif';ctx.fillStyle=btn.clr;
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(btn.icon,btn.x+btnS/2,btnY4+btnS/2);_r();
    topButtons.push({id:btn.id,x:btn.x,y:btnY4,w:btnS,h:btnS});
  });
  
  // 底部进度条
  const remain=screws.filter(s=>!s.removed).length;
  const done=totalScrewCount-remain, pct=totalScrewCount>0?done/totalScrewCount:0;
  const infoY=PROPS_Y+PROP_BTN+PROP_LABEL+6, barW=120,barH=6,barX=12,barY=infoY+2;
  // 背景
  ctx.fillStyle='rgba(255,255,255,0.06)';ctx.beginPath();ctx.roundRect(barX,barY,barW,barH,barH/2);ctx.fill();
  // 填充
  if(pct>0){
  const pbg=ctx.createLinearGradient(barX,0,barX+barW,0);
  pbg.addColorStop(0,'#22c55e');pbg.addColorStop(0.6,'#eab308');pbg.addColorStop(1,'#ef4444');
  ctx.fillStyle=pbg;ctx.beginPath();ctx.roundRect(barX,barY,barW*pct,barH,barH/2);ctx.fill();
  // 光点
  ctx.fillStyle='rgba(255,255,255,0.6)';ctx.beginPath();ctx.arc(barX+barW*pct,barY+barH/2,3,0,Math.PI*2);ctx.fill();
  }
  ctx.font='10px sans-serif';ctx.textAlign='left';ctx.fillStyle='#64748b';
  ctx.fillText(done+'/'+totalScrewCount,barX+barW+8,infoY+7);
  ctx.textAlign='right';
  if(combo>1){ctx.fillStyle='#fbbf24';ctx.fillText('连击 ×'+combo,W-12,infoY+7)}
  // Toast
  if(toastMsg){
    const tw=ctx.measureText(toastMsg).width+30;
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.beginPath();ctx.roundRect(W/2-tw/2,H/2-18,tw,36,18);ctx.fill();
    ctx.font='14px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(toastMsg,W/2,H/2);
  }
  // 暂停遮罩 + 面板
  if(paused){
    ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillRect(0,TOP_BAR_H,W,H-TOP_BAR_H);
    const ppw=Math.min(260,W*0.7), pph=170, ppx=(W-ppw)/2, ppy=H/2-pph/2-20;
    _s();ctx.shadowColor='rgba(0,0,0,0.5)';ctx.shadowBlur=28;ctx.shadowOffsetY=8;
    ctx.fillStyle='#1a2332';ctx.beginPath();ctx.roundRect(ppx,ppy,ppw,pph,16);ctx.fill();_r();
    ctx.strokeStyle='rgba(255,255,255,0.08)';ctx.lineWidth=1;
    ctx.beginPath();ctx.roundRect(ppx,ppy,ppw,pph,16);ctx.stroke();
    ctx.font='bold 20px sans-serif';ctx.fillStyle='#e2e8f0';ctx.textAlign='center';
    ctx.fillText('⏸ 游戏暂停',W/2, ppy+44);
    // 继续按钮
    const bW=ppw-40, bH=42, bX=ppx+20, bY=ppy+70;
    const bg=ctx.createLinearGradient(0,bY,0,bY+bH);
    bg.addColorStop(0,'#3b82f6');bg.addColorStop(1,'#2563eb');
    ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(bX,bY,bW,bH,bH/2);ctx.fill();
    ctx.font='bold 15px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('▶ 继续游戏',W/2, bY+bH/2);
    ctx.textBaseline='alphabetic';
    pauseBtnBB={x:bX,y:bY,w:bW,h:bH};
  }
}
function drawOverlays(){
  ctx.textBaseline='alphabetic'; // 重置基线，防止继承middle导致文字模糊
  // 共享按钮渲染 helper — emoji+文字分离，各自按实际字号测量居中
  const _s=ctx.save.bind(ctx),_r=ctx.restore.bind(ctx);
  const _drawBtn=(x,y,w,h,emoji,label,emojiClr,labelClr,bg)=>{
    _s();ctx.shadowColor='rgba(0,0,0,0.2)';ctx.shadowBlur=8;ctx.shadowOffsetY=2;
    ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(x,y,w,h,h/2);ctx.fill();_r();
    // 内高光
    _s();ctx.beginPath();ctx.roundRect(x,y,w,h,h/2);ctx.clip();
    const hl=ctx.createLinearGradient(0,y,0,y+h*0.45);
    hl.addColorStop(0,'rgba(255,255,255,0.12)');hl.addColorStop(1,'transparent');
    ctx.fillStyle=hl;ctx.fillRect(x+2,y+1,w-4,h*0.45);
    // 微边框
    ctx.strokeStyle='rgba(255,255,255,0.08)';ctx.lineWidth=1;
    ctx.beginPath();ctx.roundRect(x+0.5,y+0.5,w-1,h-1,(h-1)/2);ctx.stroke();_r();
    // 文字
    _s();ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='bold 20px sans-serif';
    const ew=ctx.measureText(emoji).width;
    ctx.font='bold 14px sans-serif';
    const lw=ctx.measureText(label).width;
    const gap=6, total=ew+gap+lw, sx=x+w/2-total/2;
    ctx.font='bold 20px sans-serif';ctx.fillStyle=emojiClr;
    ctx.fillText(emoji, sx+ew/2, y+h/2);
    ctx.font='bold 14px sans-serif';ctx.fillStyle=labelClr;
    ctx.fillText(label, sx+ew+gap+lw/2, y+h/2);
    _r();
  };
  const _btnPrimary=(x,y,w,h,emoji,label)=>_drawBtn(x,y,w,h,emoji,label,'#fff','#fff',
    (()=>{const g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'#6366f1');g.addColorStop(1,'#06b6d4');return g;})()
  );
  const _btnSecondary=(x,y,w,h,emoji,label,clr)=>{
    clr=clr||'#94a3b8';_drawBtn(x,y,w,h,emoji,label,clr,clr,'rgba(255,255,255,0.06)');
  };
  const _btnWarn=(x,y,w,h,emoji,label)=>_drawBtn(x,y,w,h,emoji,label,'#f87171','#f87171','rgba(239,68,68,0.25)');
  const _btnGold=(x,y,w,h,emoji,label)=>_drawBtn(x,y,w,h,emoji,label,'#fff','#fff',
    (()=>{const g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'#f59e0b');g.addColorStop(1,'#d97706');return g;})()
  );
  // ── 通用面板背景 ──
  const _drawPanel=(x,y,w,h,r=20)=>{
    // 遮罩
    ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillRect(0,0,W,H);
    // 阴影
    _s();ctx.shadowColor='rgba(0,0,0,0.5)';ctx.shadowBlur=36;ctx.shadowOffsetY=10;
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();_r();
    // 面板主体
    const pbg=ctx.createLinearGradient(0,y,0,y+h);
    pbg.addColorStop(0,'#1a2332');pbg.addColorStop(0.5,'#141d2a');pbg.addColorStop(1,'#0f1622');
    ctx.fillStyle=pbg;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();
    // 边框
    ctx.strokeStyle='rgba(255,255,255,0.08)';ctx.lineWidth=1;
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.stroke();
    // 顶部边缘光
    _s();ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.clip();
    const eg=ctx.createLinearGradient(0,y,0,y+3);
    eg.addColorStop(0,'rgba(255,255,255,0.06)');eg.addColorStop(1,'transparent');
    ctx.fillStyle=eg;ctx.fillRect(x+6,y+1,w-12,3);_r();
    return {x,y,w,h};
  };
  const _drawClose=(px,py)=>{
    _s();ctx.fillStyle='rgba(255,255,255,0.06)';ctx.beginPath();ctx.roundRect(px-12,py+6,24,24,12);ctx.fill();
    ctx.font='12px sans-serif';ctx.fillStyle='#64748b';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('✕',px,py+18);_r();
    return {x:px-12,y:py+6,w:24,h:24};
  };
  // ── 胜利/失败弹框优先(盖住所有其他弹窗) ──
  if(showWinOverlay){
    const cw=290,ch=310,cx=(W-cw)/2,cy=(H-ch)/2;
    _drawPanel(cx,cy,cw,ch);
    // 顶部庆祝图标
    _s();ctx.textAlign='center';ctx.textBaseline='alphabetic';
    ctx.font='44px sans-serif';ctx.fillText('🎉',W/2,cy+50);
    // 星级展示
    const stars='⭐'.repeat(winStars)+'☆'.repeat(3-winStars);
    ctx.font='30px sans-serif';ctx.fillText(stars,W/2,cy+86);
    ctx.font='11px sans-serif';ctx.fillStyle='#64748b';
    ctx.fillText('步效 '+winEfficiency+'%   ⭐⭐⭐≥85%  ⭐⭐≥70%',W/2,cy+106);
    // 分数
    ctx.font='bold 32px sans-serif';ctx.fillStyle='#fbbf24';ctx.fillText('⭐ '+score,W/2,cy+146);
    _r();
    // 按钮
    const bx=cx+30,bw=cw-60;
    _btnPrimary(bx,cy+164,bw,44,'▶','下一关');
    winNextBB={x:bx,y:cy+164,w:bw,h:44};
    const by2=cy+218,by3=by2+44;
    _btnSecondary(bx,by2,bw,38,'🔄','重玩');
    _btnSecondary(bx,by3,bw/2-4,34,'📤','分享');
    _btnSecondary(bx+bw/2+4,by3,bw/2-4,34,'🏆','排行');
    winReplayBB={x:bx,y:by2,w:bw,h:38};
    winShareBB={x:bx,y:by3,w:bw/2-4,h:34};
    winLbBB={x:bx+bw/2+4,y:by3,w:bw/2-4,h:34};
    return;
  }
  if(showLoseOverlay){
    const ch=AD_UNIT_ID?340:310;
    const cw=290,cx=(W-cw)/2,cy=(H-ch)/2;
    _drawPanel(cx,cy,cw,ch);
    _s();ctx.textAlign='center';ctx.textBaseline='alphabetic';
    ctx.font='42px sans-serif';ctx.fillText('😵',W/2,cy+48);
    ctx.font='bold 20px sans-serif';ctx.fillStyle='#ef4444';ctx.fillText('卡住了！',W/2,cy+80);
    ctx.font='12px sans-serif';ctx.fillStyle='#94a3b8';ctx.fillText('收集栏已满，换个顺序试试',W/2,cy+102);
    // 进度百分比
    ctx.font='bold 24px sans-serif';ctx.fillStyle='#fbbf24';ctx.fillText(losePct+'%',W/2,cy+134);
    ctx.font='12px sans-serif';ctx.fillStyle='#64748b';ctx.fillText('⭐ '+score+'  已完成 '+losePct+'%',W/2,cy+154);
    _r();
    const bx=cx+30,bw=cw-60;
    loseAdBB=null;loseUndoBB=null;loseContinueBB=null;
    let btnY=cy+174;
    if(AD_UNIT_ID){
      _btnGold(bx,btnY,bw,40,'📺','看广告继续');
      loseAdBB={x:bx,y:btnY,w:bw,h:40};btnY+=48;
    }
    const canUndo=history.length>0&&props.undo>0;
    _btnSecondary(bx,btnY,bw,36,'↩','撤回一步 ('+props.undo+')',canUndo?'#94a3b8':'#475569');
    loseUndoBB={x:bx,y:btnY,w:bw,h:36};btnY+=44;
    if(loseRestartConfirm){
      _btnWarn(bx,btnY,bw,36,'⚠️','再点确认重来');
    }else{
      _btnSecondary(bx,btnY,bw,36,'🔄','重新挑战');
    }
    loseContinueBB={x:bx,y:btnY,w:bw,h:36};
    return;
  }
  // 皮肤选择器
  if(showSkinPicker){
    const pw=200,ph=SKINS.length*34+44,px=(W-pw)/2,py=(H-ph)/2;
    _drawPanel(px,py,pw,ph,14);
    _s();ctx.font='bold 14px sans-serif';ctx.fillStyle='#e2e8f0';ctx.textAlign='center';ctx.fillText('🎨 选择主题',px+pw/2,py+24);_r();
    skinButtons=[];
    SKINS.forEach((sk,i)=>{
      const bx=px+14,by=py+36+i*34,bw=pw-28,bh=28;
      ctx.fillStyle=sk.id===activeSkin?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.04)';
      ctx.beginPath();ctx.roundRect(bx,by,bw,bh,10);ctx.fill();
      if(sk.id===activeSkin){ctx.strokeStyle='rgba(99,102,241,0.5)';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,10);ctx.stroke()}
      _s();ctx.font='13px sans-serif';ctx.fillStyle=sk.id===activeSkin?'#c7d2fe':'#94a3b8';ctx.textAlign='left';ctx.textBaseline='middle';
      ctx.fillText((sk.id===activeSkin?'● ':'  ')+sk.name,bx+10,by+bh/2);_r();
      // 颜色预览条
      ctx.fillStyle=sk.boardMid;ctx.beginPath();ctx.roundRect(bx+bw-36,by+4,28,bh-8,4);ctx.fill();
      skinButtons.push({id:sk.id,x:bx,y:by,w:bw,h:bh});
    });
    return;
  }
  // 签到弹窗
  if(showCheckin){
    const cw=290,ch=240,cx=(W-cw)/2,cy=(H-ch)/2;
    _drawPanel(cx,cy,cw,ch);
    _s();ctx.font='bold 16px sans-serif';ctx.fillStyle='#fbbf24';ctx.textAlign='center';ctx.fillText('🎁 每日签到',cx+cw/2,cy+28);_r();
    // 7天网格
    const gx=cx+16,gy=cy+44,gw=cw-32,gh=26,ggap=16,gs=(gw-ggap*6)/7;
    const today=getToday(),claimed=ckData.lastDate===today;
    for(let i=0;i<7;i++){
      const dx=gx+i*(gs+ggap), dy=gy;
      const rwd=CK_REWARDS[i];
      let bgClr='rgba(255,255,255,0.05)', txtClr='#64748b', txt='D'+(i+1);
      if(i<ckData.streak-1){bgClr='rgba(99,102,241,0.25)';txtClr='#a5b4fc';txt='✓'}
      else if(i===ckData.streak-1&&claimed){bgClr='rgba(99,102,241,0.35)';txtClr='#c7d2fe';txt='✓'}
      else if(i===ckData.streak-1&&!claimed){bgClr='rgba(251,191,36,0.35)';txtClr='#fbbf24';txt='📌'}
      ctx.fillStyle=bgClr;ctx.beginPath();ctx.roundRect(dx,dy,gs,gh,8);ctx.fill();
      if(i===ckData.streak-1&&!claimed){ctx.strokeStyle='#fbbf24';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(dx,dy,gs,gh,8);ctx.stroke()}
      _s();ctx.font='11px sans-serif';ctx.fillStyle=txtClr;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,dx+gs/2,dy+gh/2);
      ctx.font='9px sans-serif';ctx.fillText('+'+rwd.c,dx+gs/2,dy+gh+12);_r();
      const pps=[rwd.prop,...(rwd.props||[])].filter(Boolean);
      if(pps.length){_s();ctx.font='8px sans-serif';ctx.fillStyle=txtClr;ctx.fillText(pps.join('+'),dx+gs/2,dy+gh+22);_r()}
    }
    // 签到按钮
    const signBtnW=100,signBtnH=34,signBtnX=cx+(cw-signBtnW)/2,signBtnY=cy+152;
    if(!claimed){
      const sgb=ctx.createLinearGradient(0,signBtnY,0,signBtnY+signBtnH);
      sgb.addColorStop(0,'#6366f1');sgb.addColorStop(1,'#06b6d4');
      ctx.fillStyle=sgb;ctx.beginPath();ctx.roundRect(signBtnX,signBtnY,signBtnW,signBtnH,17);ctx.fill();
      _s();ctx.font='bold 14px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('✅ 签到领奖',signBtnX+signBtnW/2,signBtnY+signBtnH/2);_r();
    }else{
      ctx.fillStyle='rgba(99,102,241,0.3)';ctx.beginPath();ctx.roundRect(signBtnX,signBtnY,signBtnW,signBtnH,17);ctx.fill();
      _s();ctx.font='13px sans-serif';ctx.fillStyle='#818cf8';ctx.fillText('今日已签到',signBtnX+signBtnW/2,signBtnY+signBtnH/2+1);_r();
    }
    // 关闭
    ckButton=_drawClose(cx+cw-32,cy);
    if(!claimed)ckButton={id:'checkinSign',x:signBtnX,y:signBtnY,w:signBtnW,h:signBtnH};
    return;
  }
  // 商店弹窗
  if(showShopOverlay){
    const sw=280,sh=310,sx=(W-sw)/2,sy=(H-sh)/2;
    _drawPanel(sx,sy,sw,sh);
    _s();ctx.font='bold 18px sans-serif';ctx.fillStyle='#fbbf24';ctx.textAlign='center';ctx.fillText('🛒 道具商店',W/2,sy+30);
    ctx.font='12px sans-serif';ctx.fillStyle='#fcd34d';ctx.fillText('🪙 '+coins,W/2,sy+50);_r();
    SHOP_ITEMS.forEach((item,i)=>{
      const ix=sx+16,iy=sy+66+i*46,iw=sw-32,ih=40;
      ctx.fillStyle='rgba(255,255,255,0.04)';ctx.beginPath();ctx.roundRect(ix,iy,iw,ih,12);ctx.fill();
      _s();ctx.font='22px sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(item.icon,ix+10,iy+ih/2);
      ctx.font='bold 13px sans-serif';ctx.fillStyle='#e2e8f0';ctx.fillText(item.name+' ×'+item.qty,ix+42,iy+10);
      ctx.font='10px sans-serif';ctx.fillStyle='#64748b';ctx.fillText(item.desc,ix+42,iy+28);_r();
      const canBuy=coins>=item.price;
      const buyW=54,buyH=26,buyX=ix+iw-buyW-8,buyY=iy+7;
      ctx.fillStyle=canBuy?'rgba(251,191,36,0.15)':'rgba(255,255,255,0.04)';ctx.beginPath();ctx.roundRect(buyX,buyY,buyW,buyH,10);ctx.fill();
      if(canBuy){ctx.strokeStyle='rgba(251,191,36,0.25)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(buyX,buyY,buyW,buyH,10);ctx.stroke()}
      _s();ctx.font='bold 12px sans-serif';ctx.fillStyle=canBuy?'#fbbf24':'#64748b';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('🪙'+item.price,buyX+buyW/2,buyY+buyH/2);_r();
      if(canBuy)shopBuyBB.push({id:item.id,price:item.price,qty:item.qty,x:buyX,y:buyY,w:buyW,h:buyH});
    });
    shopCloseBB=_drawClose(sx+sw-32,sy);
    return;
  }
  // 选关弹窗
  if(showLvlPicker){
    const pw=220,ph=310,px=(W-pw)/2,py=(H-ph)/2;
    _drawPanel(px,py,pw,ph,14);
    _s();ctx.font='bold 15px sans-serif';ctx.fillStyle='#a5b4fc';ctx.textAlign='center';ctx.fillText('🎯 选择关卡',px+pw/2,py+26);_r();
    const cleared=getCleared(),maxLv=Math.max(level,10);
    lvlListBB=[];
    for(let i=1;i<=maxLv;i++){
      const unlocked=cleared.includes(i)||i<=level;
      const bx=px+14,by=py+34+(i-1)*24,bw=pw-28,bh=20;
      ctx.fillStyle=unlocked?(i===level?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.04)'):'rgba(255,255,255,0.02)';
      ctx.beginPath();ctx.roundRect(bx,by,bw,bh,10);ctx.fill();
      _s();ctx.font='12px sans-serif';ctx.fillStyle=unlocked?(i===level?'#c7d2fe':'#94a3b8'):'#475569';ctx.textAlign='left';ctx.textBaseline='middle';
      ctx.fillText('第 '+i+' 关'+(i===level?' 👈':''),bx+10,by+bh/2);_r();
      if(unlocked)lvlListBB.push({lv:i,x:bx,y:by,w:bw,h:bh});
    }
    lvlCloseBB=_drawClose(px+pw-32,py);
    return;
  }
  // 教程弹窗
  if(showTutorialOverlay){
    const tw=280,th=270,tx=(W-tw)/2,ty=(H-th)/2;
    _drawPanel(tx,ty,tw,th,20);
    const step=TUT_STEPS[tutIdx];
    _s();ctx.textAlign='center';ctx.textBaseline='alphabetic';
    ctx.font='44px sans-serif';ctx.fillText(step.icon,W/2,ty+56);
    ctx.font='bold 18px sans-serif';ctx.fillStyle='#fbbf24';ctx.fillText(step.title,W/2,ty+88);
    ctx.font='13px sans-serif';ctx.fillStyle='#94a3b8';
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
    _r();
    // buttons
    const skipW=70, skipH=34, skipX=tx+20, skipY=ty+210;
    ctx.fillStyle='rgba(255,255,255,0.06)';ctx.beginPath();ctx.roundRect(skipX,skipY,skipW,skipH,17);ctx.fill();
    _s();ctx.font='13px sans-serif';ctx.fillStyle='#94a3b8';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('跳过',skipX+skipW/2,skipY+skipH/2);_r();
    const nextW=100, nextH=34, nextX=tx+tw-nextW-20, nextY=ty+210;
    const ng=ctx.createLinearGradient(0,nextY,0,nextY+nextH);
    ng.addColorStop(0,'#fbbf24');ng.addColorStop(1,'#f59e0b');
    ctx.fillStyle=ng;ctx.beginPath();ctx.roundRect(nextX,nextY,nextW,nextH,17);ctx.fill();
    _s();ctx.font='bold 14px sans-serif';ctx.fillStyle='#1e1b4b';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(tutIdx===TUT_STEPS.length-1?'🎮 开始游戏':'下一步',nextX+nextW/2,nextY+nextH/2);_r();
    tutSkipBB={x:skipX,y:skipY,w:skipW,h:skipH};
    tutNextBB={x:nextX,y:nextY,w:nextW,h:nextH};
    return;
  }
  // 分享卡
  if(showShareOverlay){
    const sw=300,sh=240,sx=(W-sw)/2,sy=(H-sh)/2;
    _drawPanel(sx,sy,sw,sh,20);
    _s();ctx.textAlign='center';ctx.textBaseline='alphabetic';
    ctx.font='bold 20px sans-serif';ctx.fillStyle='#fbbf24';ctx.fillText('📤 分享战绩',W/2,sy+36);
    ctx.font='40px sans-serif';ctx.fillText('🎉',W/2,sy+76);
    ctx.font='bold 36px sans-serif';ctx.fillStyle='#fbbf24';ctx.fillText(score,W/2,sy+124);
    ctx.font='12px sans-serif';ctx.fillStyle='#94a3b8';ctx.fillText('第 '+level+' 关 · 🪙'+coins,W/2,sy+148);_r();
    // 分享按钮
    const sbtnW=200,sbtnH=36,sbtnX=W/2-sbtnW/2,sbtnY=sy+166;
    const sbtnG=ctx.createLinearGradient(0,sbtnY,0,sbtnY+sbtnH);
    sbtnG.addColorStop(0,'#22c55e');sbtnG.addColorStop(1,'#16a34a');
    ctx.fillStyle=sbtnG;ctx.beginPath();ctx.roundRect(sbtnX,sbtnY,sbtnW,sbtnH,18);ctx.fill();
    _s();ctx.font='bold 15px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('📤 分享给微信好友',W/2,sbtnY+sbtnH/2);_r();
    shareBtnBB={x:sbtnX,y:sbtnY,w:sbtnW,h:sbtnH};
    shareCloseBB=_drawClose(sx+sw-32,sy);
    return;
  }
  // 排行榜
  if(showLB){
    const lw=300,lh=370,lx=(W-lw)/2,ly=(H-lh)/2;
    _drawPanel(lx,ly,lw,lh,18);
    _s();ctx.font='bold 18px sans-serif';ctx.fillStyle='#fbbf24';ctx.textAlign='center';ctx.fillText('🏆 排行榜',W/2,ly+28);_r();
    // tabs
    ['all','today'].forEach((p,i)=>{
      const tx=lx+60+i*90,ty=ly+36,tw=80,th=24;
      ctx.fillStyle=p===lbPeriod?'rgba(99,102,241,0.2)':'rgba(255,255,255,0.04)';ctx.beginPath();ctx.roundRect(tx,ty,tw,th,12);ctx.fill();
      _s();ctx.font='11px sans-serif';ctx.fillStyle=p===lbPeriod?'#c7d2fe':'#64748b';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(p==='all'?'总榜':'今日',tx+tw/2,ty+th/2);_r();
    });
    lbTabBB=[{period:'all',x:lx+60,y:ly+36,w:80,h:24},{period:'today',x:lx+150,y:ly+36,w:80,h:24}];
    // list
    const filtered=lbPeriod==='today'?lbData.filter(e=>e.date===getToday()):lbData;
    const top=filtered.slice(0,10);
    if(top.length===0){
      _s();ctx.font='14px sans-serif';ctx.fillStyle='#64748b';ctx.textAlign='center';ctx.fillText('暂无数据',W/2,ly+180);_r();
    }else{
      top.forEach((r,i)=>{
        const rx=lx+16,ry=ly+72+i*26,rw=lw-32,rh=22;
        ctx.fillStyle=i%2===0?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.01)';ctx.beginPath();ctx.roundRect(rx,ry,rw,rh,10);ctx.fill();
        _s();ctx.font='bold 13px sans-serif';ctx.fillStyle=i===0?'#fbbf24':i===1?'#94a3b8':i===2?'#d97706':'#64748b';
        ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText((i+1)+'.',rx+6,ry+rh/2);
        ctx.fillStyle='#e2e8f0';ctx.fillText(r.nick,rx+30,ry+rh/2);
        ctx.fillStyle='#fbbf24';ctx.textAlign='right';ctx.fillText(r.score,rx+rw-8,ry+rh/2);_r();
      });
    }
    lbCloseBB=_drawClose(lx+lw-32,ly);
    return;
  }
  // 隐私协议全文（在登录弹窗之前渲染，优先级更高）
  if(showPrivacyText){
    const pw=300,ph=Math.min(H-30,520),px=(W-pw)/2,py=(H-ph)/2;
    _drawPanel(px,py,pw,ph,14);
    const title=showPrivacyText==='privacy'?'隐私政策':'用户服务协议';
    const text=showPrivacyText==='privacy'?PRIVACY_POLICY:USER_AGREEMENT;
    _s();ctx.font='bold 16px sans-serif';ctx.fillStyle='#fbbf24';ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText(title,W/2,py+28);_r();
    // 正文
    _s();
    ctx.font='11px sans-serif';ctx.fillStyle='#94a3b8';ctx.textAlign='left';ctx.textBaseline='alphabetic';
    const lines=text.split('\n');
    const startY=py+52, lineH=15, maxLines=Math.floor((ph-60)/lineH);
    for(let li=0;li<Math.min(lines.length,maxLines);li++){
      ctx.fillText(lines[li],px+18,startY+li*lineH);
    }
    _r();
    privacyTextCloseBB=_drawClose(px+pw-32,py);
    return;
  }
  // 登录/昵称
  if(showLoginOverlay){
    const mw=280,mh=240,mx=(W-mw)/2,my=(H-mh)/2;
    _drawPanel(mx,my,mw,mh,18);
    _s();ctx.font='bold 18px sans-serif';ctx.fillStyle='#c7d2fe';ctx.textAlign='center';ctx.fillText('👤 '+(nickname?nickname:'登录账号'),W/2,my+32);_r();
    if(nickname){
      if(avatarUrl){
        try{const img=wx.createImage();img.src=avatarUrl;img.onload=()=>{};_s();ctx.beginPath();ctx.arc(W/2,my+65,22,0,Math.PI*2);ctx.clip();ctx.drawImage(img,W/2-22,my+43,44,44);_r()}catch(e){}
      }
      _s();ctx.font='bold 18px sans-serif';ctx.fillStyle='#fbbf24';ctx.textAlign='center';ctx.fillText(nickname,W/2,my+100);_r();
      const logoutW=100,logoutH=34,logoutX=W/2-logoutW/2,logoutY=my+120;
      ctx.fillStyle='rgba(239,68,68,0.15)';ctx.beginPath();ctx.roundRect(logoutX,logoutY,logoutW,logoutH,17);ctx.fill();
      _s();ctx.font='13px sans-serif';ctx.fillStyle='#f87171';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('退出登录',W/2,logoutY+logoutH/2);_r();
      loginBtnBB={id:'logout',x:logoutX,y:logoutY,w:logoutW,h:logoutH};
    }else if(!privacyAgreed){
      // 隐私协议勾选
      const chY=my+60,chSize=16;
      const checkboxX=mx+30,checkboxY=chY;
      // 勾选框
      _s();ctx.textBaseline='middle';
      ctx.fillStyle=privacyCheckOn?'#6366f1':'rgba(255,255,255,0.15)';
      ctx.beginPath();ctx.roundRect(checkboxX,checkboxY,chSize,chSize,3);ctx.fill();
      if(privacyCheckOn){ctx.fillStyle='#fff';ctx.font='12px sans-serif';ctx.fillText('✓',checkboxX+3,checkboxY+chSize/2+1)}
      ctx.font='11px sans-serif';ctx.fillStyle='#94a3b8';
      const txtX=checkboxX+chSize+6;
      ctx.fillText('我已阅读并同意',txtX,checkboxY+chSize/2+1);
      const m1=ctx.measureText('我已阅读并同意');
      // 可点击链接
      ctx.fillStyle='#6366f1';
      ctx.fillText('《用户服务协议》',txtX+m1.width,checkboxY+chSize/2+1);
      const m2=ctx.measureText('《用户服务协议》');
      ctx.fillText('和',txtX+m1.width+m2.width,checkboxY+chSize/2+1);
      const m3=ctx.measureText('和');
      ctx.fillText('《隐私政策》',txtX+m1.width+m2.width+m3.width,checkboxY+chSize/2+1);
      _r();
      privacyCB={x:checkboxX,y:checkboxY,w:chSize,h:chSize};
      privacyUserBB={x:txtX+m1.width,y:checkboxY,w:m2.width,h:chSize};
      privacyPolicyBB={x:txtX+m1.width+m2.width+m3.width,y:checkboxY,w:ctx.measureText('《隐私政策》').width,h:chSize};
      // 确认按钮(勾选后才亮)
      const btnW=180,btnH=36,btnX=W/2-btnW/2,btnY=my+100;
      if(privacyCheckOn){
        const ng=ctx.createLinearGradient(0,btnY,0,btnY+btnH);
        ng.addColorStop(0,'#6366f1');ng.addColorStop(1,'#06b6d4');
        ctx.fillStyle=ng;ctx.beginPath();ctx.roundRect(btnX,btnY,btnW,btnH,18);ctx.fill();
        _s();ctx.font='bold 14px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('同意并登录',W/2,btnY+btnH/2);_r();
      }else{
        ctx.fillStyle='rgba(255,255,255,0.06)';ctx.beginPath();ctx.roundRect(btnX,btnY,btnW,btnH,18);ctx.fill();
        _s();ctx.font='bold 14px sans-serif';ctx.fillStyle='#475569';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('同意并登录',W/2,btnY+btnH/2);_r();
      }
      privacyAgreeBB={x:btnX,y:btnY,w:btnW,h:btnH};
    }else{
      _s();ctx.font='12px sans-serif';ctx.fillStyle='#94a3b8';ctx.textAlign='center';ctx.fillText('点击下方绿色按钮登录',W/2,my+65);
      ctx.font='11px sans-serif';ctx.fillStyle='#64748b';ctx.fillText('登录后同步排行榜数据',W/2,my+85);_r();
      // 绿色按钮由 showWxLoginBtn() 原生创建，不在此绘制
    }
    loginCloseBB=_drawClose(mx+mw-32,my);
    // 原生按钮在此创建（不在触控事件中，避免事件干扰）
    if(!nickname&&privacyAgreed){if(!userInfoBtn)showWxLoginBtn()}else{hideWxLoginBtn()}
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
    if(boardShake>0){ctx.save();ctx.translate(Math.sin(Date.now()*0.05)*boardShake*8,Math.cos(Date.now()*0.07)*boardShake*6)}
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
    if(boardShake>0)ctx.restore();
  }catch(e){err='render:'+(e.message||e)}
  if(err){ctx.fillStyle='#ef4444';ctx.fillRect(0,0,W,40);ctx.fillStyle='white';ctx.font='11px sans-serif';ctx.textAlign='left';ctx.fillText(err,10,25)}
}
// ── 触控 ──
let _lastTap=0, _loginDebounce=0;
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
    if(shareBtnBB&&tx>=shareBtnBB.x&&tx<=shareBtnBB.x+shareBtnBB.w&&ty>=shareBtnBB.y&&ty<=shareBtnBB.y+shareBtnBB.h){
      try{wx.shareAppMessage({title:'萌糖消了个消 - 第'+level+'关 ⭐'+score,imageUrl:''})}catch(e){}
      showShareOverlay=false;return;
    }
    showShareOverlay=false;return;
  }
  // ── 排行榜 ──
  if(showLB){
    if(lbCloseBB&&tx>=lbCloseBB.x&&tx<=lbCloseBB.x+lbCloseBB.w&&ty>=lbCloseBB.y&&ty<=lbCloseBB.y+lbCloseBB.h){showLB=false;if(_fromWinOverlay){_fromWinOverlay=false;showWinOverlay=true}return}
    for(const b of lbTabBB){if(tx>=b.x&&tx<=b.x+b.w&&ty>=b.y&&ty<=b.y+b.h){lbPeriod=b.period;showLB=true;return}}
    return;
  }
  // 隐私协议全文
  if(showPrivacyText){
    if(privacyTextCloseBB&&tx>=privacyTextCloseBB.x&&tx<=privacyTextCloseBB.x+privacyTextCloseBB.w&&ty>=privacyTextCloseBB.y&&ty<=privacyTextCloseBB.y+privacyTextCloseBB.h){showPrivacyText='';return}
    return;
  }
  if(showLoginOverlay){
    // 隐私协议UI
    if(!privacyAgreed){
      if(privacyCB&&tx>=privacyCB.x&&tx<=privacyCB.x+privacyCB.w&&ty>=privacyCB.y&&ty<=privacyCB.y+privacyCB.h){privacyCheckOn=!privacyCheckOn;return}
      if(privacyUserBB&&tx>=privacyUserBB.x&&tx<=privacyUserBB.x+privacyUserBB.w&&ty>=privacyUserBB.y&&ty<=privacyUserBB.y+privacyUserBB.h){showPrivacyText='user';return}
      if(privacyPolicyBB&&tx>=privacyPolicyBB.x&&tx<=privacyPolicyBB.x+privacyPolicyBB.w&&ty>=privacyPolicyBB.y&&ty<=privacyPolicyBB.y+privacyPolicyBB.h){showPrivacyText='privacy';return}
      if(privacyAgreeBB&&privacyCheckOn&&tx>=privacyAgreeBB.x&&tx<=privacyAgreeBB.x+privacyAgreeBB.w&&ty>=privacyAgreeBB.y&&ty<=privacyAgreeBB.y+privacyAgreeBB.h){privacyAgreed=true;try{wx.setStorageSync('privacy',1)}catch(e){};return}
    }
    if(loginCloseBB&&tx>=loginCloseBB.x&&tx<=loginCloseBB.x+loginCloseBB.w&&ty>=loginCloseBB.y&&ty<=loginCloseBB.y+loginCloseBB.h){showLoginOverlay=false;privacyCheckOn=false;hideWxLoginBtn();return}
    if(loginBtnBB&&tx>=loginBtnBB.x&&tx<=loginBtnBB.x+loginBtnBB.w&&ty>=loginBtnBB.y&&ty<=loginBtnBB.y+loginBtnBB.h){
      if(loginBtnBB.id==='logout'){logoutUser();showLoginOverlay=false;hideWxLoginBtn()}
      return;}
    return;
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
    if(winLbBB&&tx>=winLbBB.x&&tx<=winLbBB.x+winLbBB.w&&ty>=winLbBB.y&&ty<=winLbBB.y+winLbBB.h){showWinOverlay=false;_fromWinOverlay=true;loadLB();showLB=true;return}
    return; // 遮罩拦截其余点击
  }
  if(showLoseOverlay){
    if(loseAdBB&&tx>=loseAdBB.x&&tx<=loseAdBB.x+loseAdBB.w&&ty>=loseAdBB.y&&ty<=loseAdBB.y+loseAdBB.h){
      if(AD_UNIT_ID&&videoAd){
        try{videoAd.show().catch(()=>{videoAd.load().then(()=>videoAd.show())})}catch(e){}
      }else{showToast('广告单元未配置')}
      return;
    }
    if(loseContinueBB&&tx>=loseContinueBB.x&&tx<=loseContinueBB.x+loseContinueBB.w&&ty>=loseContinueBB.y&&ty<=loseContinueBB.y+loseContinueBB.h){
      if(loseRestartConfirm){showLoseOverlay=false;loseRestartConfirm=false;if(loseRestartTimer){clearTimeout(loseRestartTimer);loseRestartTimer=null}restartLevel();return}
      loseRestartConfirm=true;
      if(loseRestartTimer)clearTimeout(loseRestartTimer);
      loseRestartTimer=setTimeout(()=>{loseRestartConfirm=false},3000);
      return;
    }
    if(loseUndoBB&&tx>=loseUndoBB.x&&tx<=loseUndoBB.x+loseUndoBB.w&&ty>=loseUndoBB.y&&ty<=loseUndoBB.y+loseUndoBB.h){if(history.length>0&&props.undo>0){doUndo();props.undo--;showLoseOverlay=false;return}}
    loseRestartConfirm=false; // 点其他地方取消确认
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
    if(tb.id==='user'){const n=Date.now();if(n-_loginDebounce<400)return;_loginDebounce=n;showLoginOverlay=!showLoginOverlay;return}
  }}
  if(paused&&pauseBtnBB&&tx>=pauseBtnBB.x&&tx<=pauseBtnBB.x+pauseBtnBB.w&&ty>=pauseBtnBB.y&&ty<=pauseBtnBB.y+pauseBtnBB.h){paused=false;return}
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
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=0.06;p.life-=p.decay*1.5;if(p.life<=0)particles.splice(i,1)}
  for(let i=dyingScrews.length-1;i>=0;i--){dyingScrews[i].life-=0.10;if(dyingScrews[i].life<=0)dyingScrews.splice(i,1)}
  for(let i=comboPops.length-1;i>=0;i--){comboPops[i].life-=0.04;comboPops[i].y-=1.5;if(comboPops[i].life<=0)comboPops.splice(i,1)}
  for(let i=slotAnims.length-1;i>=0;i--){const a=slotAnims[i];if(Date.now()-a.startTime>a.duration)slotAnims.splice(i,1)}
  if(boardShake>0)boardShake-=0.1;
  render();requestAnimationFrame(loop)
}
// ── 启动 ──
try{console.log('[unscrew] W=',W,'H=',H,'board=',BOARD_W,'x',BOARD_H);loadGame();loadSkin();loadCheckin();loadNick();loadLB();try{tutDone=!!wx.getStorageSync('tut_done')}catch(e){}try{soundOn=wx.getStorageSync('sound')!=='0'}catch(e){}try{bgmOn=wx.getStorageSync('bgm')==='1'}catch(e){}initAd();generateLevel();requestAnimationFrame(loop);console.log('[unscrew] started');if(!tutDone)setTimeout(()=>{showTutorialOverlay=true;tutIdx=0},400)}catch(e){console.error('[unscrew] init error:',e.message,e.stack)}
