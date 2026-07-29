// ═══════════════════════════════════════════
// 萌糖消了个消 — 微信小游戏 Canvas 版
// 视觉 1:1 复刻 ct256.cn/unscrew
// ═══════════════════════════════════════════
const FX = false; // 全局特效开关
const COMBO_FX = true; // 连击弹窗独立开关
// 🔧 细粒度特效开关（用户可调）
let EFX = { particles: false, shake: false, flash: false, glow: false, combo: true };
let efxMenuOpen = false, efxButtons = [];
function efxOn(k){return EFX[k]} // 统一特效开关查询
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
  { name:'红', hex:'#ff3b30', light:'#fca5a5', face:'angry',  pattern:'dots' },
  { name:'蓝', hex:'#007aff', light:'#6cb6ff', face:'cool',   pattern:'vstripes' },
  { name:'橙', hex:'#ff9500', light:'#ffc04d', face:'wow',    pattern:'concentric' },
  { name:'绿', hex:'#34c759', light:'#84d89a', face:'silly',  pattern:'checker' },
  { name:'黄', hex:'#ffcc00', light:'#ffe566', face:'chill',  pattern:'hstripes' },
  { name:'粉', hex:'#ec4899', light:'#f9a8d4', face:'kiss',   pattern:'waves' },
  { name:'青', hex:'#06b6d4', light:'#67e8f9', face:'wink',   pattern:'zigzag' },
  { name:'金', hex:'#f59e0b', light:'#fde68a', face:'star',   pattern:'diamond' }
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
  } else if (face === 'angry') {
    // 🔥 愤怒：斜眉 + 大眼珠 + 白高光
    ctx.fillStyle = '#1a1a1a';
    [sx-eX, sx+eX].forEach(ex => {
      ctx.beginPath(); ctx.arc(ex, eY, eR*0.95, 0, Math.PI*2); ctx.fill();
    });
    ctx.fillStyle = '#fff';
    [sx-eX, sx+eX].forEach(ex => {
      ctx.beginPath(); ctx.arc(ex-sr*0.03, eY-sr*0.04, hR, 0, Math.PI*2); ctx.fill();
    });
    // 斜眉毛
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = sr*0.06;
    [sx-eX, sx+eX].forEach((ex, i) => {
      const dir = i===0 ? -1 : 1;
      ctx.beginPath(); ctx.moveTo(ex-sr*0.15, eY-sr*0.18); ctx.lineTo(ex+sr*0.15*dir, eY-sr*0.24); ctx.stroke();
    });
  } else if (face === 'kiss') {
    // 💕 甜心：bling大眼+长睫毛+腮红+心形嘟嘴+飘心
    // ── 眼睛：大瞳孔+双层高光 ──
    ctx.fillStyle = '#1a1a1a';
    [sx-eX, sx+eX].forEach(ex => {
      ctx.beginPath(); ctx.arc(ex, eY, eR*0.92, 0, Math.PI*2); ctx.fill();
    });
    // 主高光
    ctx.fillStyle = '#fff';
    [sx-eX, sx+eX].forEach(ex => {
      ctx.beginPath(); ctx.arc(ex-sr*0.04, eY-sr*0.05, hR*1.2, 0, Math.PI*2); ctx.fill();
    });
    // 次星芒高光
    [sx-eX+sr*0.06, sx+eX+sr*0.06].forEach(ex => {
      ctx.beginPath(); ctx.arc(ex, eY+sr*0.04, hR*0.5, 0, Math.PI*2); ctx.fill();
    });
    // ── 长睫毛 ──
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = sr*0.035; ctx.lineCap = 'round';
    [sx-eX, sx+eX].forEach(ex => {
      ctx.beginPath(); ctx.moveTo(ex-sr*0.08, eY-sr*0.14); ctx.lineTo(ex-sr*0.05, eY-sr*0.18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ex+sr*0.02, eY-sr*0.16); ctx.lineTo(ex+sr*0.06, eY-sr*0.2); ctx.stroke();
    });
    // ── 腮红 ──
    ctx.fillStyle = 'rgba(249,168,212,0.5)';
    [sx-eX*1.5, sx+eX*1.5].forEach(ex => {
      ctx.beginPath(); ctx.ellipse(ex, eY+sr*0.12, sr*0.1, sr*0.06, 0, 0, Math.PI*2); ctx.fill();
    });
    // ── 飘心 ──
    ctx.fillStyle = '#f472b6';
    const hx=sx, hy=eY-sr*0.35, hs=sr*0.06;
    ctx.beginPath(); ctx.moveTo(hx, hy+hs);
    ctx.bezierCurveTo(hx-hs*1.4, hy-hs*0.2, hx-hs*0.5, hy-hs*1.5, hx, hy-hs*0.6);
    ctx.bezierCurveTo(hx+hs*0.5, hy-hs*1.5, hx+hs*1.4, hy-hs*0.2, hx, hy+hs);
    ctx.fill();
  } else if (face === 'wink') {
    // 😉 眨眼：左眼闭(弧线)+右眼大瞳孔+白高光
    ctx.fillStyle = '#1a1a1a'; ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = sr*0.05;
    // 左眼闭合
    ctx.beginPath(); ctx.arc(sx-eX, eY, eR*0.35, Math.PI, 0); ctx.stroke();
    // 右眼大瞳孔
    ctx.beginPath(); ctx.arc(sx+eX, eY, eR*0.9, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(sx+eX-sr*0.04, eY-sr*0.04, hR, 0, Math.PI*2); ctx.fill();
  } else if (face === 'star') {
    // ⭐ 星星眼：五角星瞳孔+白高光
    ctx.fillStyle = '#1a1a1a';
    [sx-eX, sx+eX].forEach(ex => {
      const ss = eR*0.55;
      ctx.beginPath();
      for(let i=0;i<5;i++){
        const a=-Math.PI/2+i*Math.PI*2/5;
        const x=ex+Math.cos(a)*ss, y=eY+Math.sin(a)*ss;
        if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.closePath();ctx.fill();
    });
    ctx.fillStyle = '#fff';
    [sx-eX, sx+eX].forEach(ex => {
      ctx.beginPath(); ctx.arc(ex-sr*0.02, eY-sr*0.03, hR*0.7, 0, Math.PI*2); ctx.fill();
    });
  }
  // 嘴角 — web border-bottom: 3px (bunny=2px), wow=全边框3px
  if (face === 'bunny') {
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = sr*0.04;
    ctx.beginPath(); ctx.ellipse(sx, fcy+fry*0.65, frx*0.55, fry*0.06, 0, Math.PI*1.15, Math.PI*1.85); ctx.stroke();
  } else if (face === 'wow') {
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = sr*0.06;
    ctx.beginPath(); ctx.ellipse(sx, fcy, frx, fry, 0, 0, Math.PI*2); ctx.stroke();
  } else if (face === 'angry') {
    // 倒弧 = 生气撇嘴
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = sr*0.064;
    ctx.beginPath(); ctx.ellipse(sx, fcy+fry*0.8, frx*0.55, fry*0.06, 0, Math.PI*0.15, Math.PI*0.85); ctx.stroke();
  } else if (face === 'kiss') {
    // 💕 心形嘟嘴
    const mx=sx, my=fcy+fry*0.55, ms=sr*0.09;
    ctx.fillStyle = '#e11d48';
    ctx.beginPath(); ctx.moveTo(mx, my+ms);
    ctx.bezierCurveTo(mx-ms*1.3, my-ms*0.1, mx-ms*0.4, my-ms*1.2, mx, my-ms*0.3);
    ctx.bezierCurveTo(mx+ms*0.4, my-ms*1.2, mx+ms*1.3, my-ms*0.1, mx, my+ms);
    ctx.fill();
  } else if (face === 'wink') {
    // 单边歪嘴笑
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = sr*0.064;
    ctx.beginPath(); ctx.ellipse(sx+sr*0.04, fcy+fry*0.65, frx*0.5, fry*0.08, 0, Math.PI*1.2, Math.PI*1.8); ctx.stroke();
  } else if (face === 'star') {
    // 大开口笑
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = sr*0.064;
    ctx.beginPath(); ctx.ellipse(sx, fcy+fry*0.65, frx*0.55, fry*0.10, 0, Math.PI*1.1, Math.PI*1.9); ctx.stroke();
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
  } else if (pattern === 'zigzag') {
    ctx.strokeStyle = `rgba(0,0,0,${alpha*1.1})`; ctx.lineWidth = sr*0.03;
    for(let y=sy-sr;y<=sy+sr;y+=sr*0.3){
      ctx.beginPath();
      for(let x=sx-sr;x<=sx+sr;x+=sr*0.15){
        const zy=y+Math.sin((x-sx)/sr*4)*sr*0.06;
        if(x===sx-sr)ctx.moveTo(x,zy);else ctx.lineTo(x,zy);
      }
      ctx.stroke();
    }
  } else if (pattern === 'diamond') {
    ctx.fillStyle = `rgba(0,0,0,${alpha*1.1})`;
    const ds=sr*0.4;
    for(let dy=-sr;dy<sr;dy+=ds*0.9){
      for(let dx=-sr;dx<sr;dx+=ds*0.9){
        ctx.beginPath();ctx.moveTo(sx+dx,sy+dy-ds*0.2);ctx.lineTo(sx+dx+ds*0.15,sy+dy);
        ctx.lineTo(sx+dx,sy+dy+ds*0.2);ctx.lineTo(sx+dx-ds*0.15,sy+dy);ctx.fill();
      }
    }
  }
  ctx.restore();
}
const MAX_SLOTS=7, MATCH_COUNT=3, COMBO_TIMEOUT=1500;
// ── 状态 ──
let screws=[], slots=[], score=0, level=1, combo=0;
let history=[], processing=false, paused=false, pauseBtnBB=null;
let comboTimer=null, totalScrewCount=0, starMoves=0, winStars=0, winEfficiency=0, dailyBonus=0;
let props={undo:5,bomb:3,peek:3,lightning:3,shuffle:3};
let coins=30, particles=[], dyingScrews=[], comboPops=[], slotAnims=[];
let toastMsg='', toastTimer=null, showWinOverlay=false, showLoseOverlay=false, losePct=0;
let peekTargets=[], peekTimer=null, propButtons=[], boardShake=0, screenFlash=0;
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
const PROP_NAMES={undo:'撤回',bomb:'炸弹',peek:'透视',lightning:'闪电',shuffle:'洗牌'};
const CK_REWARDS=[{d:1,c:10},{d:2,c:15,prop:'undo'},{d:3,c:20},{d:4,c:25,prop:'bomb'},{d:5,c:30},{d:6,c:40,prop:'peek'},{d:7,c:50,props:['lightning','shuffle']}];
let ckData={streak:0,lastDate:''}, showCheckin=false;
// ── 背景音乐 ──
let bgmOn=false, bgmInterval=null, bgmNoteIdx=0;
// ── 存档（本地 + 云端）──
function saveGame(){
  try{wx.setStorageSync('u_lv',level);wx.setStorageSync('u_sc',score);wx.setStorageSync('u_co',coins);wx.setStorageSync('u_pr',props)}catch(e){}
  // 云端存档（仅登录用户）
  if(!nickname)return;
  try{
    wx.login({success:function(res){
      wx.request({url:'https://www.ct256.cn/neunav/api/unscrew/save',method:'POST',
        data:{code:res.code,nick:nickname,score:score,level:level,stars:0,efficiency:0},
        success:function(){console.log('[unscrew] cloud save ok')},
        fail:function(){}
      })
    }})
  }catch(e){}
}
function loadGame(){
  try{level=Math.min(wx.getStorageSync('u_lv')||1,500);score=wx.getStorageSync('u_sc')||0;coins=wx.getStorageSync('u_co')||30;const p=wx.getStorageSync('u_pr');if(p){for(const k in p){if(p[k]<0)p[k]=0}props=p}}catch(e){}
  // 云端加载
  try{
    wx.login({success:function(res){
      wx.request({url:'https://www.ct256.cn/neunav/api/unscrew/load?code='+res.code,method:'GET',
        success:function(rsp){
          if(rsp.data&&rsp.data.ok&&rsp.data.data){
            var d=rsp.data.data;
            if(d.level>level){level=d.level;wx.setStorageSync('u_lv',level)}
            if(d.score>score){score=d.score;wx.setStorageSync('u_sc',score)}
            // 用云端 level 重建已通关列表，不然选关面板只有第1关
            var cl=getCleared(),needRebuild=true;
            for(var ci=1;ci<=d.level;ci++){if(cl.indexOf(ci)<0){needRebuild=true;break}else{needRebuild=false}}
            if(needRebuild){var nc=[];for(var ci=1;ci<=d.level;ci++)nc.push(ci);wx.setStorageSync('cleared',JSON.stringify(nc))}
            // 云端关卡高于当前，重新生成
            if(d.level>1){generateLevel()}
            console.log('[unscrew] cloud load lv='+d.level+' sc='+d.score)
          }
        },fail:function(){}
      })
    }})
  }catch(e){}
}
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
  const propNames=[rwd.prop,...(rwd.props||[])].filter(Boolean).map(p=>PROP_NAMES[p]||p);
  showToast('🎉 签到第'+ckData.streak+'天! +'+rwd.c+'🪙'+(propNames.length?' +'+propNames.join('+'):''));
  saveGame();
}
// ── 商店 ──
const SHOP_ITEMS=[{id:'undo',icon:'↩️',name:'撤回',desc:'撤回一步',price:10,qty:5},{id:'bomb',icon:'💣',name:'炸弹',desc:'清空收集槽',price:10,qty:3},{id:'peek',icon:'👁️',name:'透视',desc:'高亮可点糖果3秒',price:10,qty:3},{id:'lightning',icon:'⚡',name:'闪电',desc:'消除槽内最多颜色×2',price:15,qty:3},{id:'shuffle',icon:'🔀',name:'洗牌',desc:'随机重排棋盘颜色',price:20,qty:3}];
let showShopOverlay=false;
function buyItem(id,price,qty){if(coins<price){showToast('金币不足');return}coins-=price;props[id]+=qty;saveGame();showToast('购买成功! +'+qty+' '+id)}
// ── 每日挑战 ──
let dailyMode=false, isDailyLevel=false;
function seedRandom(s){var a=s;return function(){var t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function getDailySeed(){var d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate()}
let _origRandom=Math.random;
function isDailyDone(){try{var d=wx.getStorageSync('daily_done');return d===getDailySeed().toString()}catch(e){return false}}
function markDailyDone(){try{wx.setStorageSync('daily_done',getDailySeed().toString())}catch(e){}}
function startDailyChallenge(){
  if(isDailyDone()){showToast('今日已挑战');return}
  dailyMode=true;isDailyLevel=true;Math.random=seedRandom(getDailySeed());generateLevel();randomHats();Math.random=_origRandom;dailyMode=false;showToast('🔥 每日挑战!')
}
// 🔧 每日挑战帽子（随机给螺丝戴同色帽子）
let screwHats = {};
// 帽子款式（中央美院毕业设计 😎）
const HAT_STYLES = ['beret','cap','wizard','crown','tophat','bunny','bow','beanie','visor','flower'];
function randomHats(){
  screwHats={};
  if(!isDailyLevel)return;
  const alive=screws.filter(s=>!s.removed);
  if(alive.length<3)return;
  // 打乱顺序，避免只给底层戴帽子（被盖住看不见）
  for(let i=alive.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[alive[i],alive[j]]=[alive[j],alive[i]]}
  // 70%以上戴帽子
  const hatCount=Math.max(Math.floor(alive.length*0.72),3);
  const maxHats=Math.max(1,Math.min(10,Math.ceil(level/10)));
  for(let i=0;i<hatCount&&i<alive.length;i++){
    screwHats[alive[i].id]=HAT_STYLES[Math.floor(Math.random()*maxHats)];
  }
}
function drawHat(ctx,hx,hy,hr,style,color){
  ctx.save();
  const r=hr*0.52,d=color.hex,l=color.light,s='#2d1b0e',w='#fff';
  ctx.translate(hx,hy-r*0.15);
  switch(style){
    case 'beret': // 🎨 法式贝雷帽
      ctx.fillStyle=d;ctx.beginPath();ctx.ellipse(0,-r*0.15,r*0.75,r*0.35,0,Math.PI,0);ctx.fill();
      ctx.fillStyle=l;ctx.beginPath();ctx.ellipse(0,-r*0.2,r*0.6,r*0.5,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=d;ctx.beginPath();ctx.arc(0,-r*0.75,r*0.1,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=s;ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(0,-r*0.75);ctx.lineTo(0,-r*0.9);ctx.stroke();
      break;
    case 'cap': // 🎨 潮牌棒球帽
      ctx.fillStyle=s;ctx.beginPath();ctx.ellipse(0,-r*0.75,r*0.22,r*0.1,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=d;ctx.beginPath();ctx.arc(0,-r*0.05,r*0.58,Math.PI*1.05,Math.PI*1.95);ctx.fill();
      ctx.fillStyle=l;ctx.fillRect(-r*0.12,-r*0.78,r*0.24,r*0.45);
      ctx.fillStyle=d;ctx.beginPath();ctx.ellipse(0,-r*0.82,r*0.2,r*0.08,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=s;ctx.fillRect(-r*0.68,-r*0.02,r*1.36,r*0.08);
      break;
    case 'wizard': // 🎨 魔法师帽
      ctx.fillStyle=d;ctx.beginPath();ctx.moveTo(-r*0.55,r*0.15);ctx.lineTo(r*0.55,r*0.15);ctx.lineTo(r*0.05,-r*1.1);ctx.quadraticCurveTo(0,-r*1.25,-r*0.05,-r*1.1);ctx.closePath();ctx.fill();
      ctx.fillStyle=l;ctx.fillRect(-r*0.6,r*0.05,r*1.2,r*0.15);
      ctx.fillStyle='gold';ctx.beginPath();ctx.arc(0,-r*0.6,r*0.12,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=w;ctx.beginPath();ctx.moveTo(0,-r*0.68);ctx.lineTo(-r*0.06,-r*0.55);ctx.lineTo(r*0.06,-r*0.55);ctx.closePath();ctx.fill();
      break;
    case 'crown': // 🎨 宝石皇冠
      ctx.fillStyle='gold';ctx.beginPath();ctx.moveTo(-r*0.65,r*0.1);
      ctx.lineTo(-r*0.55,-r*0.45);ctx.lineTo(-r*0.3,-r*0.1);ctx.lineTo(-r*0.1,-r*0.55);
      ctx.lineTo(0,-r*0.2);ctx.lineTo(r*0.1,-r*0.55);
      ctx.lineTo(r*0.3,-r*0.1);ctx.lineTo(r*0.55,-r*0.45);
      ctx.lineTo(r*0.65,r*0.1);ctx.closePath();ctx.fill();
      ctx.fillStyle='#ff4444';ctx.beginPath();ctx.arc(-r*0.1,-r*0.5,r*0.08,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(0,-r*0.15,r*0.08,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(r*0.1,-r*0.5,r*0.08,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='gold';ctx.fillRect(-r*0.65,r*0.02,r*1.3,r*0.14);
      break;
    case 'tophat': // 🎨 魔术礼帽
      ctx.fillStyle=s;ctx.fillRect(-r*0.6,r*0.0,r*1.2,r*0.08);
      ctx.fillStyle=d;ctx.fillRect(-r*0.32,-r*0.75,r*0.64,r*0.75);
      ctx.fillStyle=l;ctx.fillRect(-r*0.32,-r*0.35,r*0.64,r*0.1);
      ctx.fillStyle=d;ctx.beginPath();ctx.ellipse(0,-r*0.75,r*0.35,r*0.1,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=w+'88';ctx.beginPath();ctx.arc(0,-r*0.45,r*0.2,0,Math.PI*2);ctx.fill();
      break;
    case 'bunny': // 🎨 兔耳发箍
      ctx.fillStyle=w;ctx.beginPath();ctx.ellipse(-r*0.22,-r*0.65,r*0.14,r*0.55,0.15,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(r*0.22,-r*0.65,r*0.14,r*0.55,-0.15,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffb3c6';ctx.beginPath();ctx.ellipse(-r*0.22,-r*0.45,r*0.07,r*0.28,0.15,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(r*0.22,-r*0.45,r*0.07,r*0.28,-0.15,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=s;ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,-r*0.05,r*0.28,Math.PI*0.7,Math.PI*0.3);ctx.stroke();
      break;
    case 'bow': // 🎨 蝴蝶结
      ctx.fillStyle=d;ctx.beginPath();ctx.ellipse(-r*0.38,-r*0.25,r*0.35,r*0.22,-0.25,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(r*0.38,-r*0.25,r*0.35,r*0.22,0.25,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=l;ctx.beginPath();ctx.arc(0,-r*0.18,r*0.14,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=d;ctx.beginPath();ctx.moveTo(-r*0.1,r*0.0);ctx.quadraticCurveTo(-r*0.15,r*0.2,-r*0.05,r*0.25);ctx.lineTo(r*0.05,r*0.25);ctx.quadraticCurveTo(r*0.15,r*0.2,r*0.1,r*0.0);ctx.closePath();ctx.fill();
      break;
    case 'beanie': // 🎨 针织毛线帽
      ctx.fillStyle=d;ctx.beginPath();ctx.arc(0,-r*0.05,r*0.6,Math.PI,0);ctx.fill();
      ctx.fillStyle=l;ctx.fillRect(-r*0.45,-r*0.55,r*0.9,r*0.35);
      ctx.fillStyle=d;ctx.beginPath();ctx.arc(0,-r*0.95,r*0.18,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=l;ctx.lineWidth=0.8;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-r*0.4+i*r*0.2,-r*0.4);ctx.lineTo(-r*0.4+i*r*0.2,-r*0.05);ctx.stroke()}
      ctx.fillStyle=l;ctx.fillRect(-r*0.55,-r*0.05,r*1.1,r*0.08);
      break;
    case 'visor': // 🎨 运动遮阳帽
      ctx.fillStyle=d;ctx.beginPath();ctx.arc(0,-r*0.05,r*0.5,Math.PI*1.05,Math.PI*1.95);ctx.fill();
      ctx.fillStyle=s;ctx.fillRect(-r*0.72,-r*0.08,r*1.44,r*0.07);
      ctx.fillStyle=d;ctx.beginPath();ctx.arc(0,-r*0.05,r*0.5,Math.PI*1.05,Math.PI*1.95);ctx.fill();
      ctx.fillStyle=l;ctx.fillRect(-r*0.04,-r*0.35,r*0.08,r*0.28);
      ctx.fillStyle=s;ctx.fillRect(-r*0.72,-r*0.08,r*1.44,r*0.06);
      break;
    case 'flower': // 🎨 雏菊花
      var cx=0,cy=-r*0.35,pr=r*0.16,cr=r*0.14;ctx.fillStyle=w;
      for(let i=0;i<8;i++){var a=i*Math.PI/4;ctx.beginPath();ctx.ellipse(cx+Math.cos(a)*r*0.32,cy+Math.sin(a)*r*0.32,pr*0.8,pr*1.3,a,0,Math.PI*2);ctx.fill()}
      ctx.fillStyle='#fbbf24';ctx.beginPath();ctx.arc(cx,cy,cr,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#f59e0b';ctx.beginPath();ctx.arc(cx,cy,cr*0.5,0,Math.PI*2);ctx.fill();
      break;
  }
  ctx.restore();
}
// ── 选关 ──
let showLvlPicker=false, lvlPickerScroll=0, lvlPickerTouchOk=false, lvlPickerStartY=0, lvlPickerMoved=0, showSfxPicker=false, sfxPickerScroll=0;
let lvlListRect=null, lvlRowH=26;
function getCleared(){try{return JSON.parse(wx.getStorageSync('cleared')||'[]')}catch(e){return[]}}
function markCleared(lv){var c=getCleared();if(c.indexOf(lv)<0){c.push(lv);wx.setStorageSync('cleared',JSON.stringify(c))}}
// ── 教程 ──
const TUT_STEPS=[{icon:'🍬',title:'点击萌糖',desc:'点击彩色萌糖把它摘下来，萌糖会自动飞入下方收集槽'},{icon:'✨',title:'凑齐3个消除',desc:'收集槽里凑齐3个同色萌糖自动消除，获得30分！'},{icon:'🔥',title:'连击加分',desc:'连续消除触发连击，每次连击额外加分。3连击以上有大奖！'},{icon:'💣',title:'道具助阵',desc:'卡住了用道具：撤回/炸弹/透视/闪电/洗牌，商店购买更划算'}];
let tutIdx=0, tutDone=false, showTutorialOverlay=false;
function nextTutorial(){tutIdx++;if(tutIdx>=TUT_STEPS.length){showTutorialOverlay=false;tutDone=true;try{wx.setStorageSync('tut_done','1')}catch(e){};showLoginOverlay=true}}
function skipTutorial(){showTutorialOverlay=false;tutDone=true;try{wx.setStorageSync('tut_done','1')}catch(e){};showLoginOverlay=true}
// ── 分享卡 ──
let showShareOverlay=false;
function generateShareCard(){showShareOverlay=true;showToast('📤 用微信分享给好友')}
// ── 排行榜 ──
let showLB=false, lbData=[], lbPeriod='all', _fromWinOverlay=false;
function loadLB(){
  function _mergeLocal(){
    try{
      var locals=JSON.parse(wx.getStorageSync('lb_local')||'[]');
      if(locals.length>0){
        locals.forEach(function(l){lbData.push(l)});
        lbData.sort(function(a,b){return b.score-a.score});
      }
    }catch(e){}
  }
  wx.request({url:'https://www.ct256.cn/api/unscrew/leaderboard',method:'GET',
    success:function(rsp){if(rsp.data&&rsp.data.ok){lbData=rsp.data.list.map(function(i){
      var dt=i.created_at?i.created_at.slice(0,10):'';var parts=dt.split('-');var normDate=parts[0]+'-'+(+parts[1])+'-'+(+parts[2]);
      return{nick:i.nick,score:i.score,level:i.level,date:normDate};
    })};lbData.sort(function(a,b){return b.score-a.score});_mergeLocal()},
    fail:function(){try{lbData=JSON.parse(wx.getStorageSync('lb')||'[]')}catch(e){lbData=[]};_mergeLocal()}
  })
}
function submitLB(){
  const nick=nickname||'萌糖玩家';
  const entry={nick:nick,score:score,level:level,stars:winStars,efficiency:winEfficiency,date:getToday()};
  // 本地兜底：同用户只存最高分记录
  try{
    var local=JSON.parse(wx.getStorageSync('lb_local')||'[]');
    var existIdx=-1;
    for(var i=0;i<local.length;i++){
      if(local[i].nick===nick){existIdx=i;break}
    }
    if(existIdx>=0){
      // 已有记录，只有分数更高才替换
      if(score>local[existIdx].score || (score===local[existIdx].score && level>local[existIdx].level)){
        local[existIdx]=entry;
        wx.setStorageSync('lb_local',JSON.stringify(local));
      }
    }else{
      local.push(entry);
      wx.setStorageSync('lb_local',JSON.stringify(local));
    }
  }catch(e){}
  wx.login({success:function(res){if(!res.code)return;
    wx.request({url:'https://www.ct256.cn/api/unscrew/submit',method:'POST',
      data:{code:res.code,nick:nick,score:score,level:level,stars:winStars,efficiency:winEfficiency},
      success:function(rsp){if(rsp.data&&rsp.data.ok){console.log('LB submitted')}loadLB()},
      fail:function(){loadLB()}
    })
  },fail:function(){loadLB()}})
}
// ── 隐私协议 ──
let privacyCheckOn=false, privacyCB=null, privacyUserBB=null, privacyPolicyBB=null, privacyTextCloseBB=null;
const PRIVACY_POLICY=`隐私政策

更新日期：2026年7月16日

萌糖消了个消（以下简称"本游戏"）尊重并保护用户隐私。

一、信息收集
本游戏通过微信官方接口获取您的微信标识（OpenID）、昵称和头像，用于游戏内排行榜展示。不会收集您的真实姓名、手机号、身份证号、地理位置等个人敏感信息。

二、信息使用
您的昵称、头像及游戏数据（分数、关卡进度）仅用于：
1. 游戏内排行榜展示与排名
2. 个性化游戏体验
您的信息不会用于任何其他目的，也不会共享、转让或公开披露给任何第三方。

三、信息存储
您的本地游戏数据（关卡进度、道具数量等）存储在您的本地设备上。排行榜分数数据通过安全加密传输存储在我们的服务器上，仅用于排行榜功能。

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
let nickname='', avatarUrl='', showLoginOverlay=false, userInfoBtn=null, privacyAgreed=false, showPrivacyText='', loginInProgress=false;
var loginBtnY=0;
function loadNick(){try{nickname=wx.getStorageSync('nick')||'';avatarUrl=wx.getStorageSync('avatar')||''}catch(e){}}
function setNick(n,a){nickname=n;avatarUrl=a||'';try{wx.setStorageSync('nick',n);if(a)wx.setStorageSync('avatar',a)}catch(e){}}
function logoutUser(){nickname='';avatarUrl='';setNick('','');level=1;score=0;coins=30;props={undo:1,bomb:0,peek:0,lightning:0,shuffle:0};try{wx.removeStorageSync('u_lv');wx.removeStorageSync('u_sc');wx.removeStorageSync('u_co');wx.removeStorageSync('u_pr');wx.removeStorageSync('checkin');wx.removeStorageSync('daily_done');wx.removeStorageSync('cleared')}catch(e){};loginInProgress=false;showLvlPicker=false;showSkinPicker=false;showCheckin=false;showShopOverlay=false;showSfxPicker=false;showTutorialOverlay=false;showShareOverlay=false;showLB=false;showWinOverlay=false;showLoseOverlay=false;showPrivacyText='';saveGame();showToast('已退出，数据已重置')}
// ═══════ 登录按钮：每次勾选时全新创建，用完就毁，不hide/show ═══════
function showWxLoginBtn(){} // 占位，已废弃
function hideWxLoginBtn(){if(userInfoBtn){try{userInfoBtn.hide()}catch(e){}}}
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
let _sortedCache=[],_sortDirty=true;
function spawnParticles(cx,cy,hex,count){if(!efxOn('particles')||particles.length>150)return;const n=Math.min(count||20,160-particles.length);for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=1.5+Math.random()*5;particles.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s-3,life:1,decay:0.025+Math.random()*0.04,size:3+Math.random()*5,color:hex})}}
function spawnComboPop(cx,cy,txt,bonusVal,tier){
  if(!efxOn('combo'))return;
  // tier: 0=combo, 1=连击, 2=超级连击
  const colors=[{fill:'#fbbf24',glow:'#f59e0b',size:20},
    {fill:'#f97316',glow:'#ea580c',size:25},
    {fill:'#ef4444',glow:'#dc2626',size:36}];
  const t=colors[tier]||colors[0];
  comboPops.push({x:cx,y:cy,text:txt,bonus:bonusVal,life:0,eLife:3.6,size:t.size,color:t,shake:(tier>=2)?2:(tier>=1)?1:0});
  // 金色粒子雨（减量防卡顿）
  if(tier>=1){
    spawnParticles(cx,cy-10,'#fbbf24',6);
    spawnParticles(cx,cy-10,'#fff',3);
  }
  // 音效+震动
  if(tier>=2){
    screenFlash=Math.min(screenFlash+0.25,0.4);
    boardShake=Math.max(boardShake,1.8);
    playTone(1047,0.25,'sine',0.4);
    setTimeout(()=>playTone(1319,0.2,'sine',0.4),80);
    setTimeout(()=>playTone(1568,0.18,'sine',0.35),160);
  }else if(tier>=1){
    boardShake=Math.max(boardShake,1.0);
    playTone(784,0.2,'sine',0.3);
    setTimeout(()=>playTone(988,0.15,'sine',0.25),80);
  }
}
// ── 遮挡 ──
const SPATIAL_CELL=10; // 空间哈希网格大小（100/10=10×10）
function updateBlocked(removedId){
  const CLICK_DEPTH=2;
  function buildGrid(arr){
    const grid=Array(SPATIAL_CELL*SPATIAL_CELL);
    for(const s of arr){
      if(s.removed)continue;
      const minCX=Math.max(0,Math.floor((s.x-s.size/2)/SPATIAL_CELL));
      const maxCX=Math.min(SPATIAL_CELL-1,Math.floor((s.x+s.size/2)/SPATIAL_CELL));
      const minCY=Math.max(0,Math.floor((s.y-s.size/2)/SPATIAL_CELL));
      const maxCY=Math.min(SPATIAL_CELL-1,Math.floor((s.y+s.size/2)/SPATIAL_CELL));
      for(let cx=minCX;cx<=maxCX;cx++){
        for(let cy=minCY;cy<=maxCY;cy++){
          const idx=cy*SPATIAL_CELL+cx;
          if(!grid[idx])grid[idx]=[];
          grid[idx].push(s);
        }
      }
    }
    return grid;
  }
  function calcBlockedScrew(screw,grid){
    let tc=0;const myA=Math.PI*(screw.size/2)**2;
    let depth=0;
    const cx=Math.floor(screw.x/SPATIAL_CELL),cy=Math.floor(screw.y/SPATIAL_CELL);
    const seen=new Set();
    for(let dx=-1;dx<=1;dx++){
      for(let dy=-1;dy<=1;dy++){
        const nx=cx+dx,ny=cy+dy;
        if(nx<0||nx>=SPATIAL_CELL||ny<0||ny>=SPATIAL_CELL)continue;
        const cell=grid[ny*SPATIAL_CELL+nx];
        if(!cell)continue;
        for(const o of cell){
          if(o.id===screw.id||o.removed||o.layer<=screw.layer||seen.has(o.id))continue;
          seen.add(o.id);
          const d=dist(screw,o);
          if(d<screw.size/2+o.size/2){tc+=circleOverlap(screw.size/2,o.size/2,d);depth++}
        }
      }
    }
    screw.blockedPct=Math.min(1,tc/myA);
    screw.blocked=depth>CLICK_DEPTH;
    screw.blockedDepth=depth;
  }
  if(removedId!==undefined){
    const rs=screws.find(s=>s.id===removedId);if(!rs)return;
    const rr=rs.size/2;
    // 增量：仅重算被移除螺丝影响的螺丝
    const affected=[];
    for(const s of screws){if(!s.removed&&dist(s,rs)<rr+s.size/2)affected.push(s)}
    if(affected.length===0)return;
    const fullGrid=buildGrid(screws);
    for(const s of affected)calcBlockedScrew(s,fullGrid);
    return;
  }
  // 全量重建
  for(const s of screws){s.blocked=false;s.blockedPct=0;s.blockedDepth=0}
  const grid=buildGrid(screws);
  for(const s of screws){if(s.removed)continue;calcBlockedScrew(s,grid)}
  _sortDirty=true;
}
// ── 关卡生成 ──
// 🔧 修复2+4：全局timer追踪，restart时全部清理
let _timers = [];
function _setTimer(fn, ms) { const t = setTimeout(() => { fn(); const i = _timers.indexOf(t); if (i >= 0) _timers.splice(i, 1); }, ms); _timers.push(t); return t; }
function clearAllTimers() { _timers.forEach(t => clearTimeout(t)); _timers = []; bgmInterval && clearInterval(bgmInterval); bgmInterval = null; peekTimer && clearTimeout(peekTimer); peekTimer = null; comboTimer && clearTimeout(comboTimer); comboTimer = null; loseRestartTimer && clearTimeout(loseRestartTimer); loseRestartTimer = null; }
function generateLevel(){
  // 🔧 修复2：清除上一局所有残留定时器
  clearAllTimers();
  screws=[];slots=[];history=[];combo=0;processing=false;starMoves=0;if(comboTimer){clearTimeout(comboTimer);comboTimer=null}particles=[];dyingScrews=[];comboPops=[];slotAnims=[];
  const numColors=Math.min(COLORS.length,3+Math.ceil(level/10));
  // ⚡ 每色螺丝上限48（总≤480），层数≤18 ⚡
  const rawSPC=Math.round(level*1.2/3)*3;
  const screwsPerColor=Math.max(3,Math.min(rawSPC,48));
  const total=Math.min(numColors*screwsPerColor,480);
  const levelColors=COLORS.slice(0,numColors),screwList=[];
  for(let c=0;c<numColors;c++)for(let i=0;i<screwsPerColor;i++)screwList.push({color:levelColors[c]});
  for(let i=screwList.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[screwList[i],screwList[j]]=[screwList[j],screwList[i]]}
  const numLayers=Math.min(18,Math.max(3,Math.floor(total/7))),mid=(numLayers-1)/2,sigma=numLayers/3;
  const weights=[];let totalWeight=0;for(let li=0;li<numLayers;li++){const w=Math.exp(-(((li-mid)/sigma)**2));weights.push(w);totalWeight+=w}
  let idx=0;
  for(let li=0;li<numLayers&&idx<total;li++){
    const count=li===numLayers-1?total-idx:Math.round(total*weights[li]/totalWeight),used={};
    for(let b=0;b<count&&idx<total;b++){let x,y,key,attempts=0;do{x=4+Math.random()*92;y=4+Math.random()*92;key=Math.round(x/5)+'_'+Math.round(y/5);attempts++}while(used[key]&&attempts<30);used[key]=1;
      screws.push({id:idx,x,y,size:Math.max(12,22-Math.floor(level/3)*2),layer:li,color:screwList[idx].color,removed:false,blocked:false,blockedPct:0,blockedDepth:0,removing:false});idx++}
  }
  screws.sort((a,b)=>b.layer-a.layer);screws.forEach((s,i)=>s.id=i);
  updateBlocked();
  for(let rr=0;rr<10;rr++){let changed=false;for(const lc of levelColors){if(screws.some(s=>!s.removed&&!s.blocked&&s.color.name===lc.name))continue;const t=screws.find(s=>!s.removed&&s.blocked&&s.color.name===lc.name);if(t){t.blocked=false;t.blockedDepth=0;changed=true}}if(!changed)break;updateBlocked()}
  totalScrewCount=total;console.log('[unscrew] level',level,'screws',total,'colors',numColors);
}
// ── 求解器 ──
function isSolvable(){
  const N=screws.length, CLICK_DEPTH=2, coveredBy={};
  for(const s of screws){if(s.removed)continue;coveredBy[s.id]=[]}
  for(const s of screws){if(s.removed)continue;const r=s.size/2;for(const o of screws){if(o.removed||o.id===s.id||o.layer<=s.layer)continue;const d=dist(s,o);if(d<r+o.size/2){coveredBy[s.id].push({id:o.id})}}}
  function isBlocked(sid,removed){const cb=coveredBy[sid];if(!cb||cb.length===0)return false;let depth=0;for(const c of cb)if(!removed[c.id])depth++;return depth>CLICK_DEPTH}
  const visited={},startTime=Date.now();
  function dfs(removed,slotsArr,remaining,depth){if(Date.now()-startTime>3000)return false;if(remaining===0&&slotsArr.length===0)return true;const key=remaining+'|'+slotsArr.slice().sort().join(',');if(visited[key])return false;visited[key]=true;const candidates=[];for(const s of screws){if(removed[s.id])continue;if(!isBlocked(s.id,removed))candidates.push(s)}candidates.sort((a,b)=>{const inA=slotsArr.filter(c=>c===a.color.name).length,inB=slotsArr.filter(c=>c===b.color.name).length;return inB-inA});for(const screw of candidates){if(slotsArr.length>=MAX_SLOTS&&slotsArr.filter(c=>c===screw.color.name).length<2)continue;let ns=slotsArr.slice();ns.push(screw.color.name);const cnt={};for(const c of ns)cnt[c]=(cnt[c]||0)+1;for(const cn in cnt){if(cnt[cn]>=3){ns=ns.filter(c=>c!==cn);break}}removed[screw.id]=true;if(dfs(removed,ns,remaining-1,depth+1))return true;delete removed[screw.id]}return false}
  const ri={};let riC=0;for(const s of screws){if(s.removed)ri[s.id]=true;else riC++}const si=slots.filter(Boolean).map(s=>s.color.name);return dfs(ri,si,riC,0)
}
// ── 游戏逻辑 ──
let _clickLock=0;
function processClick(screw){if(processing||paused||!screw||screw.blocked||screw.removed)return;const now=Date.now();if(now-_clickLock<80)return;_clickLock=now;processing=true;history.push({screwId:screw.id,slots:slots.map(s=>s?{id:s.id,color:s.color}:null),score,combo});if(history.length>25)history.shift();screw.removed=true;starMoves++;slots.push({id:screw.id,color:screw.color});
  // 🔄 同色聚合：按颜色首次出现顺序稳定分组
  const newId=screw.id;
  const firstSeen={},order=[];
  slots.forEach(sl=>{const n=sl.color.name;if(!(n in firstSeen)){firstSeen[n]=order.length;order.push(n)}});
  slots.sort((a,b)=>firstSeen[a.color.name]-firstSeen[b.color.name]);
  const slotIdx=slots.findIndex(sl=>sl.id===newId);
  slotAnims.push({idx:slotIdx,type:'popIn',startTime:Date.now(),duration:250,color:screw.color.hex});
  sfxClick();updateBlocked(screw.id);checkMatches()}
function checkMatches(){const count={};slots.forEach((s,i)=>{if(!s)return;const k=s.color.name;if(!count[k])count[k]=[];count[k].push(i)});let mi=null;for(const cn in count){if(count[cn].length>=MATCH_COUNT){mi=count[cn].slice(0,MATCH_COUNT);break}}if(mi){processing=true;if(comboTimer)clearTimeout(comboTimer);combo++;const bonus=combo>1?combo*5:0;score+=30+bonus;sfxMatch();boardShake=Math.max(boardShake,0.5);const cx=BOARD_X+BOARD_W/2,cy=BOARD_Y+BOARD_H*0.55;spawnParticles(cx,cy,slots[mi[0]].color.hex,20);spawnParticles(cx,cy,slots[mi[0]].color.light||slots[mi[0]].color.hex,10);screenFlash=Math.min(screenFlash+0.2,0.4);const now2=Date.now();mi.forEach(idx=>slotAnims.push({idx,type:'glow',startTime:now2,duration:200,color:slots[idx].color.hex}));if(combo>=2){const tier=combo>=7?2:combo>=4?1:0;const txt=combo>=7?'🔥超级连击!':combo>=4?'⚡连击x'+combo:'combo x'+combo;spawnComboPop(cx,cy-20,txt,30+bonus,tier)};comboTimer=setTimeout(()=>{combo=0},COMBO_TIMEOUT);setTimeout(()=>{mi.sort((a,b)=>b-a).forEach(i=>slots.splice(i,1));slots=slots.filter(Boolean);processing=false;if(screws.every(s=>s.removed)){sfxWin();setTimeout(winLevel,350)}},130)}else{if(slots.filter(Boolean).length>=MAX_SLOTS){processing=true;sfxLose();boardShake=1;const remain=screws.filter(s=>!s.removed).length;losePct=Math.round((totalScrewCount-remain)/totalScrewCount*100);setTimeout(()=>{showSkinPicker=false;showCheckin=false;showShopOverlay=false;showSfxPicker=false;showLvlPicker=false;showTutorialOverlay=false;showShareOverlay=false;showLB=false;showLoginOverlay=false;showLoseOverlay=true;processing=false},200)}else{setTimeout(()=>{processing=false},100)}}setTimeout(()=>{try{wx.setStorageSync('u_lv',level);wx.setStorageSync('u_sc',score);wx.setStorageSync('u_co',coins);wx.setStorageSync('u_pr',props)}catch(e){}},50)}
function winLevel(){
  // 🔧 修复4：过关清理残留
  clearAllTimers();
  // 关闭所有其他弹窗
  showSkinPicker=false;showCheckin=false;showShopOverlay=false;
  showLvlPicker=false;showSfxPicker=false;showTutorialOverlay=false;showShareOverlay=false;
  showLB=false;showLoginOverlay=false;hideWxLoginBtn();
  // ⭐ 双维评级
  const efficiency=starMoves>0?Math.min(totalScrewCount/starMoves,1):1;
  const baseScore=totalScrewCount*10;
  const scoreRate=score>0?Math.min(score/baseScore/1.5,1):0;
  const combined=efficiency*0.6+scoreRate*0.4;
  winStars=combined>=0.85?3:combined>=0.70?2:1;
  winEfficiency=Math.round(efficiency*100);
  const clearedLv=level;
  score+=level*50;coins+=10+level*2+(isDailyLevel?50:0);
  dailyBonus=isDailyLevel?50:0;
  markCleared(clearedLv);
  if(isDailyLevel){markDailyDone();isDailyLevel=false;showToast('🔥 每日挑战通关! +50🪙')}
  submitLB();
  saveGame();
  showWinOverlay=true;
}
function restartLevel(){const wasDaily=isDailyLevel;showSkinPicker=false;showCheckin=false;showShopOverlay=false;showSfxPicker=false;showLvlPicker=false;showTutorialOverlay=false;showShareOverlay=false;showLB=false;showLoginOverlay=false;showPrivacyText='';privacyCheckOn=false;hideWxLoginBtn();showLoseOverlay=false;showWinOverlay=false;isDailyLevel=false;screwHats={};dailyBonus=0;generateLevel();if(wasDaily){isDailyLevel=true;randomHats()}}
// ── 道具 ──
function doUndo(){if(history.length===0)return false;showLoseOverlay=false;const last=history.pop();if(last.screwId!==null&&last.screwId!==undefined){const s=screws.find(x=>x.id===last.screwId);if(s){s.removed=false;s.blocked=false;s.blockedDepth=0}const idx=slots.findIndex(sl=>sl&&sl.id===last.screwId);if(idx>=0)slots.splice(idx,1)}if(last.shuffleColors){for(const sc of last.shuffleColors){const s=screws.find(x=>x.id===sc.id);if(s)s.color=sc.color}}slots=last.slots.filter(Boolean);score=last.score;combo=last.combo;updateBlocked();return true}
function doBomb(){if(slots.filter(Boolean).length===0)return false;const last=slots.pop();const s=screws.find(x=>x.id===last.id);if(s){s.removed=false;s.blocked=false;s.blockedDepth=0;spawnParticles(s.x,s.y,s.color.hex,18);spawnParticles(s.x,s.y,'#ffffff',6);screenFlash=Math.min(screenFlash+0.3,0.5);boardShake=Math.max(boardShake,2)}sfxBomb();playTone(220,0.4,'sine',0.5);setTimeout(()=>playTone(165,0.5,'sine',0.4),80);updateBlocked();return true}
function doPeek(){const targets=screws.filter(s=>!s.removed&&s.blocked);if(targets.length===0||props.peek<=0)return false;props.peek--;peekTargets=targets.map(t=>t.id);sfxPeek();if(peekTimer)clearTimeout(peekTimer);peekTimer=setTimeout(()=>{peekTargets=[]},3000);return true}
function doLightning(){const filled=slots.filter(Boolean);if(filled.length<2||props.lightning<=0)return false;props.lightning--;const groups={};filled.forEach(s=>{const k=s.color.name;if(!groups[k])groups[k]=[];groups[k].push(s)});let target=null;for(const k in groups){if(groups[k].length>=2){target=groups[k];break}}if(!target)return false;while(target.length>0&&slots.filter(Boolean).length>0){const idx=slots.findIndex(sl=>sl&&sl.color.name===target[0].color.name);if(idx>=0)slots.splice(idx,1);target.shift()}updateBlocked();return true}
function doShuffle(){const alive=screws.filter(s=>!s.removed);if(alive.length<2||props.shuffle<=0)return false;props.shuffle--;const colors=alive.map(s=>s.color);for(let i=colors.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[colors[i],colors[j]]=[colors[j],colors[i]]}history.push({screwId:null,slots:slots.map(s=>s?{id:s.id,color:s.color}:null),score,combo,shuffleColors:alive.map((s,i)=>({id:s.id,color:s.color}))});if(history.length>25)history.shift();alive.forEach((s,i)=>{s.color=colors[i]});updateBlocked();return true}
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
// ── 底板缓存（静态背景+木纹+铆钉，仅皮肤切换时重绘）──
let boardCacheCanvas=null, boardCacheSkin='', boardCacheW=0, boardCacheH=0, boardCacheFail=false;
function ensureBoardCache(sk){
  if(boardCacheFail)return null;
  if(boardCacheCanvas&&boardCacheSkin===sk.id&&boardCacheW===W&&boardCacheH===H)return boardCacheCanvas;
  try{
  const c=typeof wx!=='undefined'&&wx.createOffscreenCanvas?wx.createOffscreenCanvas({type:'2d',width:W,height:H}):(()=>{const el=document.createElement('canvas');el.width=W;el.height=H;return el})();
  const ctx2=c.getContext('2d');
  // 背景+光晕
  ctx2.fillStyle=sk.bgBot;ctx2.fillRect(0,0,W,H);
  const bloomX=W/2,bloomY=H*0.35,bloomR=Math.max(W,H)*0.7;
  const bloom=ctx2.createRadialGradient(bloomX,bloomY,bloomR*0.1,bloomX,bloomY,bloomR);
  bloom.addColorStop(0,'rgba(80,100,180,0.10)');bloom.addColorStop(0.3,'rgba(50,60,140,0.06)');
  bloom.addColorStop(0.6,'rgba(20,25,80,0.03)');bloom.addColorStop(1,'transparent');
  ctx2.fillStyle=bloom;ctx2.fillRect(0,0,W,H);
  const bloom2=ctx2.createRadialGradient(W*0.25,H*0.65,0,W*0.25,H*0.65,W*0.8);
  bloom2.addColorStop(0,'rgba(30,40,100,0.05)');bloom2.addColorStop(1,'transparent');
  ctx2.fillStyle=bloom2;ctx2.fillRect(0,0,W,H);
  // 顶部渐变
  const tbg=ctx2.createLinearGradient(0,0,0,H);
  tbg.addColorStop(0,sk.bgTop+'dd');tbg.addColorStop(0.5,'transparent');tbg.addColorStop(1,sk.bgBot+'88');
  ctx2.fillStyle=tbg;ctx2.fillRect(0,0,W,H);
  // 棋盘阴影+底座+木纹+铆钉（静态底板核心）
  const bx=BOARD_X+3,by=BOARD_Y,bw=BOARD_W-6,bh=BOARD_H;
  ctx2.save();
  ctx2.shadowColor='rgba(0,0,0,0.50)';ctx2.shadowBlur=48;ctx2.shadowOffsetY=10;
  ctx2.fillStyle='rgba(0,0,0,0.50)';ctx2.beginPath();ctx2.roundRect(BOARD_X,BOARD_Y,BOARD_W,BOARD_H,16);ctx2.fill();
  ctx2.restore();
  ctx2.fillStyle=sk.boardBorder;ctx2.beginPath();ctx2.roundRect(BOARD_X-3,BOARD_Y-3,BOARD_W+6,BOARD_H+6,18);ctx2.fill();
  ctx2.fillStyle=shadeColor(sk.boardBorder,18);ctx2.beginPath();ctx2.roundRect(BOARD_X-1,BOARD_Y-1,BOARD_W+2,BOARD_H+2,16);ctx2.fill();
  const a175=175*Math.PI/180,dx175=Math.sin(a175),dy175=-Math.cos(a175);
  const wbg=ctx2.createLinearGradient(bx,by,bx+dx175*bw,by+dy175*bh);
  wbg.addColorStop(0,sk.boardTop);wbg.addColorStop(0.12,shadeColor(sk.boardTop,-4));
  wbg.addColorStop(0.18,sk.boardMid);wbg.addColorStop(0.32,sk.boardTop);
  wbg.addColorStop(0.50,sk.boardMid);wbg.addColorStop(0.72,sk.boardBot);
  wbg.addColorStop(0.88,shadeColor(sk.boardBot,6));wbg.addColorStop(1,sk.boardBot);
  ctx2.fillStyle=wbg;ctx2.beginPath();ctx2.roundRect(bx,by,bw,bh,14);ctx2.fill();
  // 木纹纹理
  ctx2.save();ctx2.beginPath();ctx2.roundRect(bx+6,by+6,bw-12,bh-12,8);ctx2.clip();
  ctx2.strokeStyle='rgba(120,80,40,0.04)';ctx2.lineWidth=0.8;
  for(let y=by+6;y<by+bh-6;y+=4.5){const off=Math.tan(1.5*Math.PI/180)*(y-by);ctx2.beginPath();ctx2.moveTo(bx+off,y);ctx2.lineTo(bx+off+bw+4,y);ctx2.stroke()}
  ctx2.strokeStyle='rgba(0,0,0,0.035)';ctx2.lineWidth=2.5;
  for(let x=bx-10;x<bx+bw+10;x+=36){ctx2.beginPath();ctx2.moveTo(x,by-4);ctx2.lineTo(x-(bh*Math.tan(3.5*Math.PI/180)),by+bh+4);ctx2.stroke()}
  ctx2.strokeStyle='rgba(200,150,100,0.035)';ctx2.lineWidth=1;
  for(let d=-bh;d<bw+bh;d+=48){ctx2.beginPath();ctx2.moveTo(bx+d,by);ctx2.lineTo(bx+d+bh*Math.tan(3*Math.PI/180),by+bh);ctx2.stroke()}
  ctx2.restore();
  // 内阴影+高光
  ctx2.save();ctx2.beginPath();ctx2.roundRect(bx,by,bw,bh,14);ctx2.clip();
  const ish=ctx2.createLinearGradient(0,by,0,by+bh);
  ish.addColorStop(0,'rgba(0,0,0,0.18)');ish.addColorStop(0.08,'rgba(0,0,0,0.06)');
  ish.addColorStop(0.5,'rgba(0,0,0,0)');ish.addColorStop(0.88,'rgba(0,0,0,0.04)');ish.addColorStop(1,'rgba(0,0,0,0.12)');
  ctx2.fillStyle=ish;ctx2.fillRect(bx,by,bw,bh);
  const edgeGlow=ctx2.createLinearGradient(0,by,0,by+4);
  edgeGlow.addColorStop(0,'rgba(255,255,255,0.10)');edgeGlow.addColorStop(1,'transparent');
  ctx2.fillStyle=edgeGlow;ctx2.fillRect(bx+10,by+1,bw-20,4);
  ctx2.restore();
  // 四角铆钉
  const studR=4,studPad=12;
  const corners=[[bx+studPad,by+studPad],[bx+bw-studPad,by+studPad],[bx+studPad,by+bh-studPad],[bx+bw-studPad,by+bh-studPad]];
  for(const[cx,cy]of corners){
    const sg=ctx2.createRadialGradient(cx-0.5,cy-0.5,0,cx,cy,studR);
    sg.addColorStop(0,'rgba(255,220,160,0.55)');sg.addColorStop(0.4,'rgba(180,140,80,0.40)');
    sg.addColorStop(0.8,'rgba(80,50,20,0.30)');sg.addColorStop(1,'rgba(40,20,10,0.15)');
    ctx2.fillStyle=sg;ctx2.beginPath();ctx2.arc(cx,cy,studR,0,Math.PI*2);ctx2.fill();
    ctx2.strokeStyle='rgba(0,0,0,0.25)';ctx2.lineWidth=0.8;ctx2.beginPath();ctx2.arc(cx,cy,studR-0.3,0,Math.PI*2);ctx2.stroke();
  }
  boardCacheCanvas=c;boardCacheSkin=sk.id;boardCacheW=W;boardCacheH=H;
  return c;
  }catch(e){boardCacheFail=true;boardCacheCanvas=null;return null;}
}
// ── 仅星星动画（每帧便宜）──
function drawStars(){
  const t=Date.now()*0.0003;
  for(const s of stars){
    const a=s.a*(0.7+0.3*Math.sin(t+s.twinkle));
    ctx.fillStyle=`rgba(200,210,255,${a.toFixed(2)})`;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();
  }
}
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
  // 底板阴影保留(仅生成一次到缓存)
  const _drawBoardShadows = true;
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
  if(s.removed||s.blockedDepth>=3)return;
  const sx=mapX(s.x),sy=mapY(s.y),sr=mapR(s.size);
  ctx.globalAlpha = s.blockedDepth === 0 ? 1.0 : s.blockedDepth === 1 ? 0.85 : 0.65;
  // 🔧 阴影已去，仅顶层暗色垫底
  if(s.blockedDepth===0){
    ctx.fillStyle='rgba(0,0,0,0.18)';ctx.beginPath();ctx.arc(sx,sy+2,sr*0.95,0,Math.PI*2);ctx.fill();
  }
  // 主体 — 纯色圆
  ctx.fillStyle=s.color.hex;ctx.beginPath();ctx.arc(sx,sy,sr,0,Math.PI*2);ctx.fill();
  // 高光 — 仅顶层
  if(s.blockedDepth===0){
    ctx.fillStyle='rgba(255,255,255,0.22)';ctx.beginPath();ctx.arc(sx-sr*0.25,sy-sr*0.30,sr*0.35,0,Math.PI*2);ctx.fill();
  }
  drawFace(ctx, s.color.face, sx, sy, sr);
  // 🔧 每日挑战帽子
  if(screwHats[s.id]){drawHat(ctx,sx,sy-sr*0.58,sr,screwHats[s.id],s.color)}
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
      if(efxOn('glow')&&glowAlpha>0){
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
      // 🔧 性能：阴影改半透明圆垫底，省 shadowBlur
      ctx.fillStyle='rgba(0,0,0,0.18)';ctx.beginPath();ctx.arc(dx,dy+dotR*0.15,dotR*1.05,0,Math.PI*2);ctx.fill();
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
      drawFace(ctx, s.color.face, dx, dy, dotR);
      if(screwHats[s.id]){drawHat(ctx,dx,dy-dotR*0.58,dotR,screwHats[s.id],s.color)}
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
let _sfxListBB=[], _sfxCloseBB=null;
let tutSkipBB=null, tutNextBB=null;
let shareCloseBB=null, shareBtnBB=null;
let lbTabBB=[], lbCloseBB=null;
let loginCloseBB=null, loginBtnBB=null, loginWxBB=null;
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
    {t:isDailyDone()?'已挑战':'📅 每日',id:'daily',cs:isDailyDone()?['#9ca3af','#6b7280']:['#f87171','#dc2626']},
    {t:'签到',id:'checkin',cs:['#fbbf24','#d97706']}
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
    ctx.fillText(lb.id==='checkin'&&ckClaimed?'已签':lb.t,bx+eachW/2,by+btnH/2);_r();
    topButtons.push({id:lb.id,x:bx,y:by,w:eachW,h:btnH});
    if(lb.id==='checkin') ckButton={id:'checkin',x:bx,y:by,w:eachW,h:btnH};
  });
  // ── 行4: 音效/暂停按钮 ──
  const pauseX=SAFE_R-btnS, soundX=pauseX-btnS-btnGap, sfxX=soundX-btnS-btnGap, efxX=sfxX-btnS-btnGap, btnY4=r4y;
  // 🔧 特效按钮
  ctx.fillStyle=efxOn('particles')?'rgba(251,191,36,0.15)':'rgba(255,255,255,0.06)';ctx.beginPath();ctx.roundRect(efxX,btnY4,btnS,btnS,10);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.08)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(efxX,btnY4,btnS,btnS,10);ctx.stroke();
  ctx.font='14px sans-serif';ctx.fillStyle=efxOn('particles')?'#fbbf24':'#94a3b8';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('✨',efxX+btnS/2,btnY4+btnS/2);
  topButtons.push({id:'efxToggle',x:efxX,y:btnY4,w:btnS,h:btnS});
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
  // 🔉 音效选择按钮（静音时隐藏）
  let sfxSelBB=null;
  if(soundOn){
    const sfxBY=btnY4;
    ctx.fillStyle='rgba(99,102,241,0.12)';ctx.beginPath();ctx.roundRect(sfxX,sfxBY,btnS,btnS,10);ctx.fill();
    ctx.strokeStyle='rgba(99,102,241,0.20)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(sfxX,sfxBY,btnS,btnS,10);ctx.stroke();
    _s();ctx.font='14px sans-serif';ctx.fillStyle='#818cf8';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('🔉',sfxX+btnS/2,sfxBY+btnS/2);_r();
    _s();ctx.font='8px sans-serif';ctx.fillStyle='#6366f1';ctx.textAlign='center';ctx.textBaseline='top';
    ctx.fillText(CLICK_SFX[clickSfxIdx].name,sfxX+btnS/2,sfxBY+btnS+2);_r();
    sfxSelBB={x:sfxX,y:sfxBY,w:btnS,h:btnS};
    topButtons.push({id:'sfxsel',x:sfxX,y:sfxBY,w:btnS,h:btnS});
  }
  
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
    const cw=290,ch=330,cx=(W-cw)/2,cy=(H-ch)/2;
    _drawPanel(cx,cy,cw,ch);
    // 顶部庆祝图标
    _s();ctx.textAlign='center';ctx.textBaseline='alphabetic';
    ctx.font='44px sans-serif';ctx.fillText('🎉',W/2,cy+50);
    // 星级展示
    const stars='⭐'.repeat(winStars)+'☆'.repeat(3-winStars);
    ctx.font='30px sans-serif';ctx.fillText(stars,W/2,cy+86);
    ctx.font='11px sans-serif';ctx.fillStyle='#64748b';
    ctx.fillText('步效 '+winEfficiency+'%   ⭐⭐⭐≥85%  ⭐⭐≥70%',W/2,cy+106);
    // 🔥 每日挑战加成（分数上方，不被按钮遮挡）
    if(dailyBonus>0){ctx.font='bold 18px sans-serif';ctx.fillStyle='#f87171';ctx.fillText('🔥 每日挑战 +'+dailyBonus+'🪙',W/2,cy+128);}
    // 分数
    ctx.font='bold 32px sans-serif';ctx.fillStyle='#fbbf24';ctx.fillText('⭐ '+score,W/2,cy+158);
    _r();
    // 按钮
    const bx=cx+30,bw=cw-60;
    _btnPrimary(bx,cy+178,bw,44,'▶','下一关');
    winNextBB={x:bx,y:cy+178,w:bw,h:44};
    const by2=cy+232,by3=by2+44;
    _btnSecondary(bx,by2,bw,38,'🔄','重玩');
    _btnSecondary(bx,by3,bw/2-4,34,'📤','分享');
    _btnSecondary(bx+bw/2+4,by3,bw/2-4,34,'🏆','排行');
    winReplayBB={x:bx,y:by2,w:bw,h:38};
    winShareBB={x:bx,y:by3,w:bw/2-4,h:34};
    winLbBB={x:bx+bw/2+4,y:by3,w:bw/2-4,h:34};
    return;
  }
  if(showLoseOverlay){
    const ch=AD_UNIT_ID?300:270;
    const cw=290,cx=(W-cw)/2,cy=(H-ch)/2;
    _drawPanel(cx,cy,cw,ch);
    _s();ctx.textAlign='center';ctx.textBaseline='alphabetic';
    ctx.font='29px sans-serif';ctx.fillText('😵',W/2,cy+42);
    ctx.font='bold 14px sans-serif';ctx.fillStyle='#ef4444';ctx.fillText('卡住了！',W/2,cy+68);
    ctx.font='10px sans-serif';ctx.fillStyle='#94a3b8';ctx.fillText('收集栏已满，换个顺序试试',W/2,cy+86);
    // 进度百分比
    ctx.font='bold 17px sans-serif';ctx.fillStyle='#fbbf24';ctx.fillText(losePct+'%',W/2,cy+112);
    ctx.font='10px sans-serif';ctx.fillStyle='#64748b';ctx.fillText('⭐ '+score+'  已完成 '+losePct+'%',W/2,cy+130);
    _r();
    const bx=cx+30,bw=cw-60;
    loseAdBB=null;loseUndoBB=null;loseContinueBB=null;
    let btnY=cy+160;
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
      ctx.font='9px sans-serif';ctx.fillText('+'+rwd.c+'🪙',dx+gs/2,dy+gh+12);_r();
      const pps=[rwd.prop,...(rwd.props||[])].filter(Boolean);
      if(pps.length){_s();ctx.font='8px sans-serif';ctx.fillStyle=txtClr;ctx.fillText('+'+pps.map(p=>PROP_NAMES[p]||p).join(','),dx+gs/2,dy+gh+22);_r()}
    }
    // 签到按钮
    const signBtnW=160,signBtnH=40,signBtnX=cx+(cw-signBtnW)/2,signBtnY=cy+158;
    if(!claimed){
      const sgb=ctx.createLinearGradient(0,signBtnY,0,signBtnY+signBtnH);
      sgb.addColorStop(0,'#f59e0b');sgb.addColorStop(1,'#d97706');
      ctx.fillStyle=sgb;ctx.beginPath();ctx.roundRect(signBtnX,signBtnY,signBtnW,signBtnH,signBtnH/2);ctx.fill();
      ctx.shadowColor='rgba(245,158,11,0.4)';ctx.shadowBlur=12;ctx.shadowOffsetY=0;
      ctx.fillStyle=sgb;ctx.beginPath();ctx.roundRect(signBtnX,signBtnY,signBtnW,signBtnH,signBtnH/2);ctx.fill();
      ctx.shadowColor='transparent';ctx.shadowBlur=0;
      _s();ctx.font='bold 16px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🎁 签到领奖',signBtnX+signBtnW/2,signBtnY+signBtnH/2);_r();
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
    const cleared=getCleared(),maxLv=500;
    const ROW_H=24, GAP=2;
    const listY=py+38, listH=ph-50, listW=pw-30;
    lvlListRect={x:px+13,y:listY,w:listW,h:listH};
    lvlRowH=ROW_H+GAP;
    const totalH=maxLv*lvlRowH;
    const maxScroll=Math.max(0,totalH-listH);
    lvlPickerScroll=Math.max(0,Math.min(lvlPickerScroll,maxScroll));
    // Clip
    ctx.save();
    ctx.beginPath();ctx.rect(lvlListRect.x,lvlListRect.y,lvlListRect.w,lvlListRect.h);ctx.clip();
    lvlListBB=[];
    const firstVis=Math.floor(lvlPickerScroll/lvlRowH);
    const lastVis=Math.min(maxLv,firstVis+Math.ceil(listH/lvlRowH)+1);
    for(let pos=firstVis;pos<lastVis;pos++){
      const i=maxLv-pos; // pos=0→500, pos=499→1 (倒序)
      if(i<1||i>maxLv)continue;
      const unlocked=cleared.includes(i)||i<=level;
      const bx=lvlListRect.x,by=listY+pos*lvlRowH-lvlPickerScroll+1;
      if(by+ROW_H<listY||by>listY+listH)continue;
      ctx.fillStyle=unlocked?(i===level?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.04)'):'rgba(255,255,255,0.02)';
      ctx.beginPath();ctx.roundRect(bx,by,listW,ROW_H,10);ctx.fill();
      _s();ctx.font='12px sans-serif';ctx.fillStyle=unlocked?(i===level?'#c7d2fe':'#94a3b8'):'#475569';ctx.textAlign='left';ctx.textBaseline='middle';
      ctx.fillText('第 '+i+' 关'+(i===level?' 👈':''),bx+8,by+ROW_H/2);_r();
      if(unlocked)lvlListBB.push({lv:i,x:bx,y:by,w:listW,h:ROW_H});
    }
    ctx.restore();
    // Scrollbar
    if(maxScroll>0){
      const sbW=3,sbH=listH,sbX=px+pw-8,sbY=listY;
      ctx.fillStyle='rgba(255,255,255,0.08)';
      ctx.beginPath();ctx.roundRect(sbX,sbY,sbW,sbH,2);ctx.fill();
      const thumbH=Math.max(20,sbH*(listH/totalH));
      const thumbY=sbY+(sbH-thumbH)*(lvlPickerScroll/maxScroll);
      ctx.fillStyle='rgba(255,255,255,0.25)';
      ctx.beginPath();ctx.roundRect(sbX,thumbY,sbW,thumbH,2);ctx.fill();
    }
    lvlCloseBB=_drawClose(px+pw-32,py);
    return;
  }
  // 🔉 音效选择弹窗
  if(showSfxPicker){
    const pw=180,ph=260,px=(W-pw)/2,py=(H-ph)/2;
    _drawPanel(px,py,pw,ph,14);
    _s();ctx.font='bold 14px sans-serif';ctx.fillStyle='#818cf8';ctx.textAlign='center';ctx.fillText('🔉 点击音效',px+pw/2,py+24);_r();
    const ROW_H=30,GAP=4,listY=py+36,listH=ph-50,listW=pw-24;
    const sfxListBB=[];
    for(let i=0;i<CLICK_SFX.length;i++){
      const by=listY+i*(ROW_H+GAP);
      if(by+ROW_H<listY||by>listY+listH)continue;
      const isActive=i===clickSfxIdx;
      const bx=px+10;
      ctx.fillStyle=isActive?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.04)';
      ctx.beginPath();ctx.roundRect(bx,by,listW,ROW_H,10);ctx.fill();
      _s();ctx.font='13px sans-serif';ctx.fillStyle=isActive?'#c7d2fe':'#94a3b8';ctx.textAlign='left';ctx.textBaseline='middle';
      ctx.fillText('🔊 '+CLICK_SFX[i].name+(isActive?' ✓':''),bx+10,by+ROW_H/2);_r();
      sfxListBB.push({idx:i,x:bx,y:by,w:listW,h:ROW_H});
    }
    const sfxCloseBB=_drawClose(px+pw-32,py);
    // 注册全局点击（在 drawOverlays 返回后处理）
    _sfxListBB=sfxListBB; _sfxCloseBB=sfxCloseBB;
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
        ctx.fillStyle='#e2e8f0';ctx.fillText(r.nick.slice(0,6),rx+30,ry+rh/2);
        ctx.font='10px sans-serif';ctx.fillStyle='#94a3b8';ctx.textAlign='right';ctx.fillText('第'+r.level+'关',rx+rw-60,ry+rh/2);
        ctx.font='bold 13px sans-serif';ctx.fillStyle='#fbbf24';ctx.fillText(r.score,rx+rw-8,ry+rh/2);_r();
      });
    }
    lbCloseBB=_drawClose(lx+lw-32,ly);
    return;
  }
  // 隐私协议全文（在登录弹窗之前渲染，优先级更高）
  if(showPrivacyText){
    const pw=Math.min(W-20,320),ph=Math.min(H-40,480),px=(W-pw)/2,py=(H-ph)/2;
    _drawPanel(px,py,pw,ph,14);
    const title=showPrivacyText==='privacy'?'隐私政策':'用户服务协议';
    const text=showPrivacyText==='privacy'?PRIVACY_POLICY:USER_AGREEMENT;
    _s();ctx.font='bold 16px sans-serif';ctx.fillStyle='#fbbf24';ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText(title,W/2,py+28);_r();
    // 正文（自动换行）
    _s();
    ctx.font='11px sans-serif';ctx.fillStyle='#94a3b8';ctx.textAlign='left';ctx.textBaseline='alphabetic';
    var maxW=pw-36, lineH=16, startY=py+52, maxY=py+ph-14;
    var curY=startY;
    var lines=text.replace(/\r/g,'').split('\n');
    for(var i=0;i<lines.length;i++){
      var raw=lines[i],line=raw.replace(/^#+\s*/,'');
      if(!line){curY+=lineH;continue;}
      var buf='';
      for(var j=0;j<line.length;j++){
        var test=buf+line[j];
        if(ctx.measureText(test).width>maxW&&buf.length>0){
          if(curY<=maxY)ctx.fillText(buf,px+18,curY);
          curY+=lineH;buf=line[j];
        }else{buf=test}
      }
      if(buf&&curY<=maxY)ctx.fillText(buf,px+18,curY);
      curY+=lineH;
    }
    _r();
    privacyTextCloseBB=_drawClose(px+pw-32,py);
    return;
  }
  // 登录
  if(showLoginOverlay){
    var nick=!!nickname;
    var mw=300,mh=nick?220:440,mx=(W-mw)/2,my=(H-mh)/2;
    _drawPanel(mx,my,mw,mh,18);
    // 标题栏
    _s();ctx.font='bold 18px sans-serif';ctx.fillStyle='#c7d2fe';ctx.textAlign='center';
    ctx.fillText(nickname?'👤 '+nickname:'📋 用户协议与隐私政策',W/2,my+32);_r();
    if(nickname){
      if(avatarUrl){
        try{const img=wx.createImage();img.src=avatarUrl;img.onload=()=>{};_s();ctx.beginPath();ctx.arc(W/2,my+65,22,0,Math.PI*2);ctx.clip();ctx.drawImage(img,W/2-22,my+43,44,44);_r()}catch(e){}
      }
      _s();ctx.font='bold 18px sans-serif';ctx.fillStyle='#fbbf24';ctx.textAlign='center';ctx.fillText(nickname,W/2,my+100);_r();
      var logoutW=100,logoutH=34,logoutX=W/2-logoutW/2,logoutY=my+120;
      ctx.fillStyle='rgba(239,68,68,0.15)';ctx.beginPath();ctx.roundRect(logoutX,logoutY,logoutW,logoutH,17);ctx.fill();
      _s();ctx.font='13px sans-serif';ctx.fillStyle='#f87171';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('退出登录',W/2,logoutY+logoutH/2);_r();
      loginBtnBB={id:'logout',x:logoutX,y:logoutY,w:logoutW,h:logoutH};
    }else{
      // ═══ 始终显示协议 ═══
      var gray='#94a3b8',blue='#6366f1';
      // ── 协议说明 ──
      _s();ctx.font='11px sans-serif';ctx.fillStyle=gray;ctx.textAlign='center';
      ctx.fillText('欢迎使用萌糖消了个消！',W/2,my+50);
      ctx.fillText('为保障您的权益，请仔细阅读并充分理解以下协议内容。',W/2,my+64);
      ctx.fillText('如您不同意，将无法使用本游戏服务。',W/2,my+78);_r();
      // ── 协议卡片 ──
      var cardX=mx+16,cardW=mw-32,card1Y=my+90,cardH=80,card2Y=card1Y+cardH+8;
      var drawOneCard=function(cx,cy,cw,ch,ico,ttl,sub,desc,ac){
        if(!ac)return;
        ctx.fillStyle='rgba(255,255,255,0.04)';ctx.beginPath();ctx.roundRect(cx,cy,cw,ch,12);ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,0.06)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(cx,cy,cw,ch,12);ctx.stroke();
        var r=parseInt(ac.slice(1,3),16),g=parseInt(ac.slice(3,5),16),b=parseInt(ac.slice(5,7),16);
        ctx.fillStyle='rgba('+r+','+g+','+b+',0.2)';ctx.fillRect(cx+2,cy+2,3,ch-4);
        _s();ctx.font='bold 13px sans-serif';ctx.fillStyle='#e2e8f0';ctx.textAlign='left';ctx.textBaseline='top';
        ctx.fillText(ico+' '+ttl,cx+14,cy+10);_r();
        _s();ctx.font='10px sans-serif';ctx.fillStyle='#64748b';ctx.textAlign='left';ctx.textBaseline='top';
        ctx.fillText(sub,cx+14,cy+28);_r();
        _s();ctx.font='10px sans-serif';ctx.fillStyle='#94a3b8';ctx.textAlign='left';ctx.textBaseline='top';
        var mw2=cw-28,ss=desc;while(ss&&ctx.measureText(ss).width>mw2)ss=ss.slice(0,-1);
        ctx.fillText(ss||desc,cx+14,cy+44);_r();
        _s();ctx.font='12px sans-serif';ctx.fillStyle=ac;ctx.textAlign='right';ctx.textBaseline='middle';
        ctx.fillText('›',cx+cw-14,cy+ch/2);_r();
      };
      drawOneCard(cardX,card1Y,cardW,cardH,'📜','隐私政策','更新日期：2026年7月16日','本游戏尊重并保护用户隐私','#3b82f6');
      drawOneCard(cardX,card2Y,cardW,cardH,'📄','用户服务协议','更新日期：2026年7月16日','欢迎使用萌糖消了个消','#10b981');
      privacyPolicyBB={x:cardX,y:card1Y,w:cardW,h:cardH};
      privacyUserBB={x:cardX,y:card2Y,w:cardW,h:cardH};
      // ── 勾选框 ──
      var chSize=16,chY=card2Y+cardH+14,cbX=mx+24,cbCY=chY+chSize/2;
      _s();ctx.font='11px sans-serif';ctx.textBaseline='middle';ctx.textAlign='left';
      ctx.fillStyle=privacyCheckOn?blue:'rgba(255,255,255,0.12)';
      ctx.beginPath();ctx.roundRect(cbX,chY,chSize,chSize,3);ctx.fill();
      if(privacyCheckOn){ctx.font='12px sans-serif';ctx.fillStyle='#fff';ctx.fillText('✓',cbX+2.5,cbCY+1);ctx.font='11px sans-serif'}
      ctx.fillStyle=gray;ctx.fillText('我已阅读并同意上述全部协议',cbX+chSize+8,cbCY);_r();
      privacyCB={x:cbX,y:chY,w:chSize+ctx.measureText('我已阅读并同意上述全部协议').width+8,h:chSize};
      // ── 勾选后直接出现登录按钮 ──
      if(privacyCheckOn||privacyAgreed){
        loginBtnY=chY+chSize+12;
        _s();ctx.font='11px sans-serif';ctx.fillStyle='#94a3b8';ctx.textAlign='center';ctx.fillText('登录后同步云端数据',W/2,loginBtnY-2);_r();
      }
      // 🔧 游客模式按钮
      var guestW=180,guestH=34,guestX=W/2-guestW/2,guestY=(privacyCheckOn||privacyAgreed)?loginBtnY+56:chY+chSize+20;
      ctx.fillStyle='rgba(255,255,255,0.06)';ctx.beginPath();ctx.roundRect(guestX,guestY,guestW,guestH,17);ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(guestX,guestY,guestW,guestH,17);ctx.stroke();
      _s();ctx.font='12px sans-serif';ctx.fillStyle='#64748b';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('跳过登录，随便玩玩',guestX+guestW/2,guestY+guestH/2);_r();
      loginBtnBB={id:'guest',x:guestX,y:guestY,w:guestW,h:guestH};
    }
    loginCloseBB=_drawClose(mx+mw-32,my);
    // 创建原生微信授权按钮，拿真实昵称头像
    if(!nickname&&privacyAgreed){
      // 每次创全新原生按钮，不用hide/show（防onTap失灵）
      if(userInfoBtn){try{userInfoBtn.destroy()}catch(e){console.log('[login] destroy err:',e)};userInfoBtn=null}
      var targetY=loginBtnY||(H/2+65);
      console.log('[login] creating native btn at y='+targetY+' loginInProgress='+loginInProgress);
      try{
        userInfoBtn=wx.createUserInfoButton({type:'text',text:'微信一键登录',
          style:{left:W/2-70,top:targetY,width:140,height:42,lineHeight:42,
            backgroundColor:'#07c160',color:'#ffffff',textAlign:'center',fontSize:15,borderRadius:21}});
        userInfoBtn.onTap(function(res){
          console.log('[login] ⚡ ONTAP:',JSON.stringify(res||{}).slice(0,300));
          if(loginInProgress){return;}
          loginInProgress=true;
          var ok=res&&res.errMsg&&res.errMsg.indexOf(':ok')>-1;
          if(ok){
            if(res.rawData){
              try{var u=JSON.parse(res.rawData);setNick(u.nickName||'微信用户',u.avatarUrl||'');showToast('欢迎 '+nickname)}catch(e){}
            }else if(res.userInfo){
              setNick(res.userInfo.nickName||'微信用户',res.userInfo.avatarUrl||'');showToast('欢迎 '+nickname);
            }else{
              // 无用户信息，尝试wx.getUserInfo
              console.log('[login] no userInfo, trying wx.getUserInfo');
              wx.getUserInfo({success:function(r){var u=r.userInfo;if(u){setNick(u.nickName||'微信用户',u.avatarUrl||'')}},fail:function(e){console.log('[login] getUserInfo fail:',e.errMsg)}});
            }
            loadGame();showLoginOverlay=false;
          }else{
            showToast('授权取消，请重试');
          }
          try{userInfoBtn.destroy()}catch(e){};userInfoBtn=null;
          loginInProgress=false;
        });
      }catch(e){console.log('[login] create err:',e)}
    }
    return;
  }
  // 🔧 特效菜单
  if(efxMenuOpen){
    const mX=W-160,mY=60,mW=148,rowH=32,nItems=7;
    ctx.fillStyle='rgba(15,18,35,0.95)';ctx.beginPath();ctx.roundRect(mX,mY,mW,rowH*nItems+16,10);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(mX,mY,mW,rowH*nItems+16,10);ctx.stroke();
    efxButtons=[];
    const items=[
      {key:'all',label:'⚡ 全部开启/关闭'},
      {key:'particles',label:'✨ 粒子'},
      {key:'shake',label:'💥 震动'},
      {key:'flash',label:'💫 闪光'},
      {key:'glow',label:'🔆 光晕'},
      {key:'combo',label:'🔥 连击'},
    ];
    ctx.font='11px sans-serif';ctx.textAlign='left';
    items.forEach((it,i)=>{
      const y=mY+12+i*rowH,on=it.key==='all'?Object.values(EFX).some(v=>v):EFX[it.key];
      ctx.fillStyle=on?'#f59e0b':'rgba(255,255,255,0.5)';
      const label=it.key==='all'?'⚡ '+(Object.values(EFX).every(v=>v)?'全部关闭':'全部开启'):it.label;
      ctx.fillText((on?'● ':'○ ')+label,mX+12,y+10);
      efxButtons.push({key:it.key,x:mX,y:y,w:mW,h:rowH});
    });
    ctx.textAlign='start';
  }
}
function drawParticles(){
  if(!efxOn('particles'))return;
  if(particles.length===0)return;
  for(const p of particles){ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1
}
function drawComboPops(){
  if(!efxOn('combo'))return;
  if(comboPops.length===0)return;
  for(const c of comboPops){
    // ease-out bounce: life 0→1 快速放大，1→eLife 缓慢回落
    const prog=Math.min(c.life/c.eLife,1);
    const bounce=prog<0.3?prog/0.3:(1-Math.pow(1-(prog-0.3)/0.7,3))*0.15+0.85;
    const scale=bounce*(1.1+0.15*Math.sin(prog*Math.PI));
    const alpha=prog<0.1?prog/0.1:prog>0.85?(1-prog)/0.15:1;
    ctx.save();ctx.globalAlpha=alpha;
    ctx.translate(c.x,c.y);ctx.scale(scale,scale);
    // ── 外层柔光 ──
    const glowGrad=ctx.createRadialGradient(0,0,0,0,0,c.size*1.2);
    glowGrad.addColorStop(0,c.color.glow+'cc');
    glowGrad.addColorStop(0.5,c.color.glow+'44');
    glowGrad.addColorStop(1,'transparent');
    ctx.fillStyle=glowGrad;
    ctx.beginPath();ctx.arc(0,0,c.size*1.2,0,Math.PI*2);ctx.fill();
    // ── 文字渐变 ──
    const txtGrad=ctx.createLinearGradient(0,-c.size*0.5,0,c.size*0.5);
    txtGrad.addColorStop(0,'#ffffff');
    txtGrad.addColorStop(0.3,c.color.fill);
    txtGrad.addColorStop(0.7,c.color.fill);
    txtGrad.addColorStop(1,c.color.glow);
    ctx.font='bold '+c.size+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    // 底部阴影
    ctx.shadowColor='rgba(0,0,0,0.5)';ctx.shadowBlur=c.size*0.2;ctx.shadowOffsetY=c.size*0.06;
    ctx.fillStyle=txtGrad;ctx.fillText(c.text,0,0);
    // 顶部高光描边
    ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    ctx.strokeStyle='rgba(255,255,255,0.35)';ctx.lineWidth=c.size*0.06;
    ctx.strokeText(c.text,-c.size*0.01,-c.size*0.01);
    // ── 加分数字 ──
    if(c.bonus>0){
      const bs=c.size*0.42;
      ctx.font='bold '+bs+'px sans-serif';
      const bGrad=ctx.createLinearGradient(0,-bs*0.5,0,bs*0.5);
      bGrad.addColorStop(0,'#fff');
      bGrad.addColorStop(1,'#fbbf24');
      ctx.fillStyle=bGrad;
      ctx.shadowColor='rgba(0,0,0,0.4)';ctx.shadowBlur=bs*0.3;
      ctx.fillText('+'+c.bonus,0,c.size*0.7);
    }
    ctx.restore();
  }
}
// ── 主渲染 ──
function render(){
  // 🔧 修复1：每帧清除画布，防止叠加累积
  ctx.clearRect(0, 0, W, H);
  let err='';function safe(n,f){if(err)return;try{f()}catch(e){err=n+':'+(e.message||e)}}
  try{
    if(boardShake>0){ctx.save();ctx.translate(Math.sin(Date.now()*0.05)*boardShake*2*0.8,Math.cos(Date.now()*0.07)*boardShake*1*0.8)}
    // ⚡ 底板缓存：仅皮肤切换时重建（省去每帧渐变+木纹+铆钉）
    const sk=getSkin();
    const bc=ensureBoardCache(sk);
    if(bc){ctx.drawImage(bc,0,0)}else{safe('bg',()=>drawBoard())}
    // 星星动画
    if(bc)drawStars();
    // ── 1) 黑洞 ── [已关闭]
    // safe('holes',()=>{
    //   for(const s of screws){
    //     if(!s.removed)continue;
    //     ... 黑洞已关闭 ...
    //   }
    // });
    // ── 2) 活螺丝（按层排序，底层先→顶层后盖）──
    if(_sortDirty){_sortedCache=[...screws].filter(s=>!s.removed).sort((a,b)=>a.layer-b.layer||a.id-b.id);_sortDirty=false}
    safe('screws',()=>{for(const s of _sortedCache){drawOneScrew(s,false,1)}});
    if(efxOn('particles')){safe('peek',()=>{for(const id of peekTargets){const s=screws.find(x=>x.id===id);if(s){const sx=s.x/100*(BOARD_W-8)+BOARD_X+4,sy=s.y/100*(BOARD_H-8)+BOARD_Y+4,sr=s.size*Math.min(BOARD_W,BOARD_H)/100/2;ctx.save();ctx.strokeStyle=s.color.hex;ctx.lineWidth=3;ctx.globalAlpha=0.5+Math.sin(Date.now()*0.005)*0.3;ctx.beginPath();ctx.arc(sx,sy,sr+3,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;ctx.restore()}}})}
    if(efxOn('particles'))safe('particles',()=>drawParticles());
    safe('slots',()=>drawSlots());
    safe('props',()=>drawPropsBar());
    safe('ui',()=>drawUI());
    safe('overlays',()=>drawOverlays());
    if(efxOn('combo'))safe('comboPop',()=>drawComboPops());
    if(boardShake>0)ctx.restore();
    if(efxOn('flash')&&screenFlash>0){ctx.save();ctx.fillStyle=`rgba(255,255,255,${screenFlash})`;ctx.fillRect(0,0,W,H);ctx.restore()}
  }catch(e){err='render:'+(e.message||e)}
  if(err){ctx.fillStyle='#ef4444';ctx.fillRect(0,0,W,40);ctx.fillStyle='white';ctx.font='11px sans-serif';ctx.textAlign='left';ctx.fillText(err,10,25)}
}
// ── 触控 ──
let _lastTap=0, _loginDebounce=0;
function handleTouch(tx,ty){
  // DEBUG: 看触摸有没有进来
  var _dbgOverlays=[];
  if(showWinOverlay)_dbgOverlays.push('win');
  if(showLoseOverlay)_dbgOverlays.push('lose');
  if(showLoginOverlay)_dbgOverlays.push('login');
  if(showLB)_dbgOverlays.push('lb');
  if(showTutorialOverlay)_dbgOverlays.push('tutorial');
  if(showSkinPicker)_dbgOverlays.push('skin');
  if(showShopOverlay)_dbgOverlays.push('shop');
  if(showLvlPicker)_dbgOverlays.push('lvl');
  if(showCheckin)_dbgOverlays.push('checkin');
  if(showPrivacyText)_dbgOverlays.push('privacyText');
  if(showSfxPicker)_dbgOverlays.push('sfx');
  if(showShareOverlay)_dbgOverlays.push('share');
  console.log('[touch] tx='+tx+' ty='+ty+' overlays=['+_dbgOverlays.join(',')+'] nickname='+nickname+' loginInProgress='+loginInProgress+' showLoginOverlay='+showLoginOverlay);
  // 🔧 特效菜单打开时拦截所有点击，不穿透到螺丝
  if(efxMenuOpen){
    for(const b of efxButtons){
      if(tx>=b.x&&tx<=b.x+b.w&&ty>=b.y&&ty<=b.y+b.h){
        if(b.key==='all'){const on=!Object.values(EFX).every(v=>v===true);EFX.particles=EFX.shake=EFX.flash=EFX.glow=EFX.combo=on}
        else EFX[b.key]=!EFX[b.key];
      }
    }
    efxMenuOpen=false;return;
  }
  // ── 商店弹窗 ──
  if(showShopOverlay){
    if(shopCloseBB&&tx>=shopCloseBB.x&&tx<=shopCloseBB.x+shopCloseBB.w&&ty>=shopCloseBB.y&&ty<=shopCloseBB.y+shopCloseBB.h){showShopOverlay=false;return}
    for(const b of shopBuyBB){if(tx>=b.x&&tx<=b.x+b.w&&ty>=b.y&&ty<=b.y+b.h){buyItem(b.id,b.price,b.qty);return}}
    showShopOverlay=false;return;
  }
  // ── 音效选择弹窗 ──
  if(showSfxPicker){
    if(_sfxCloseBB&&tx>=_sfxCloseBB.x&&tx<=_sfxCloseBB.x+_sfxCloseBB.w&&ty>=_sfxCloseBB.y&&ty<=_sfxCloseBB.y+_sfxCloseBB.h){showSfxPicker=false;return}
    for(const b of _sfxListBB){if(tx>=b.x&&tx<=b.x+b.w&&ty>=b.y&&ty<=b.y+b.h){clickSfxIdx=b.idx;try{wx.setStorageSync('sfx_idx',clickSfxIdx)}catch(e){};sfxClick();showSfxPicker=false;return}}
    showSfxPicker=false;return;
  }
  // ── 选关弹窗（关闭按钮+空白区点关） ──
  if(showLvlPicker){
    if(lvlCloseBB&&tx>=lvlCloseBB.x&&tx<=lvlCloseBB.x+lvlCloseBB.w&&ty>=lvlCloseBB.y&&ty<=lvlCloseBB.y+lvlCloseBB.h){showLvlPicker=false;return}
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
    // 隐私协议UI — 勾选即同意
    if(!nickname){
      if(privacyCB&&tx>=privacyCB.x&&tx<=privacyCB.x+privacyCB.w&&ty>=privacyCB.y&&ty<=privacyCB.y+privacyCB.h){privacyCheckOn=!privacyCheckOn;privacyAgreed=privacyCheckOn;console.log('[login] checkbox: privacyAgreed='+privacyAgreed);return}
      if(privacyUserBB&&tx>=privacyUserBB.x&&tx<=privacyUserBB.x+privacyUserBB.w&&ty>=privacyUserBB.y&&ty<=privacyUserBB.y+privacyUserBB.h){showPrivacyText='user';return}
      if(privacyPolicyBB&&tx>=privacyPolicyBB.x&&tx<=privacyPolicyBB.x+privacyPolicyBB.w&&ty>=privacyPolicyBB.y&&ty<=privacyPolicyBB.y+privacyPolicyBB.h){showPrivacyText='privacy';return}
    }
    if(loginCloseBB&&tx>=loginCloseBB.x&&tx<=loginCloseBB.x+loginCloseBB.w&&ty>=loginCloseBB.y&&ty<=loginCloseBB.y+loginCloseBB.h){showLoginOverlay=false;privacyCheckOn=false;privacyAgreed=false;hideWxLoginBtn();return}
    if(loginBtnBB&&tx>=loginBtnBB.x&&tx<=loginBtnBB.x+loginBtnBB.w&&ty>=loginBtnBB.y&&ty<=loginBtnBB.y+loginBtnBB.h){
      if(loginBtnBB.id==='logout'){logoutUser();showLoginOverlay=false;hideWxLoginBtn();return}
      if(loginBtnBB.id==='guest'){showLoginOverlay=false;privacyCheckOn=false;privacyAgreed=false;console.log('[unscrew] guest mode');return}
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
    if(winNextBB&&tx>=winNextBB.x&&tx<=winNextBB.x+winNextBB.w&&ty>=winNextBB.y&&ty<=winNextBB.y+winNextBB.h){level=Math.min(level+1,500);saveGame();showWinOverlay=false;generateLevel();return}
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
    if(tb.id==='sfxsel'){showSfxPicker=true;sfxPickerScroll=0;return}
    if(tb.id==='pause'){paused=!paused;return}
    if(tb.id==='skin'){showSkinPicker=!showSkinPicker;return}
    if(tb.id==='bgm'){toggleBgm();return}
    if(tb.id==='level'){showLvlPicker=!showLvlPicker;lvlPickerScroll=Math.max(0,(500-level)*lvlRowH-60);return}
    if(tb.id==='shop'){showShopOverlay=!showShopOverlay;shopBuyBB=[];return}
    if(tb.id==='efxToggle'){efxMenuOpen=!efxMenuOpen;return}
    if(tb.id==='daily'){if(isDailyDone()){showToast('今日已挑战');return}else{startDailyChallenge();return}}
    if(tb.id==='leaderboard'){loadLB();showLB=!showLB;return}
    if(tb.id==='user'){const n=Date.now();if(n-_loginDebounce<400){console.log('[login] user btn debounced');return};_loginDebounce=n;showLoginOverlay=!showLoginOverlay;console.log('[login] user btn: showLoginOverlay='+showLoginOverlay+' nickname='+nickname+' userInfoBtn='+!!userInfoBtn);if(showLoginOverlay){showLvlPicker=false;showSkinPicker=false;showCheckin=false;showShopOverlay=false;showSfxPicker=false;showTutorialOverlay=false;showShareOverlay=false;showLB=false;showPrivacyText='';privacyAgreed=false;privacyCheckOn=false;loginInProgress=false;hideWxLoginBtn()}return}
  }}
  if(paused&&pauseBtnBB&&tx>=pauseBtnBB.x&&tx<=pauseBtnBB.x+pauseBtnBB.w&&ty>=pauseBtnBB.y&&ty<=pauseBtnBB.y+pauseBtnBB.h){paused=false;return}
  if(processing||paused)return;
  for(const pb of propButtons){if(tx>=pb.x&&tx<=pb.x+pb.w&&ty>=pb.y&&ty<=pb.y+pb.h){useProp(pb.id);return}}
  const sorted=[...screws].sort((a,b)=>b.layer-a.layer||b.id-a.id);
  for(const s of sorted){if(s.removed||s.blocked)continue;const sx=s.x/100*(BOARD_W-8)+BOARD_X+4,sy=s.y/100*(BOARD_H-8)+BOARD_Y+4,sr=s.size*Math.min(BOARD_W,BOARD_H)/100/2;if(Math.hypot(tx-sx,ty-sy)<sr*0.95){processClick(s);return}}
}
// ── 触控：选关列表独立处理 ──
function _inLvlList(tx,ty){return lvlListRect&&tx>=lvlListRect.x&&tx<=lvlListRect.x+lvlListRect.w&&ty>=lvlListRect.y&&ty<=lvlListRect.y+lvlListRect.h}
wx.onTouchStart(e=>{
  _lastTap=Date.now();
  if(showLvlPicker&&_inLvlList(e.touches[0].clientX,e.touches[0].clientY)){
    lvlPickerTouchOk=true; lvlPickerStartY=e.touches[0].clientY; lvlPickerMoved=0;
    return;
  }
  lvlPickerTouchOk=false;
});
wx.onTouchMove(e=>{
  if(showLvlPicker&&lvlPickerTouchOk){
    const t=e.touches[0]; if(!t)return;
    const dy=t.clientY-(lastTouchY||t.clientY);
    lvlPickerScroll-=dy; lvlPickerMoved+=Math.abs(dy);
    lastTouchY=t.clientY;
    return;
  }
});
wx.onTouchEnd(e=>{
  lastTouchY=null;
  if(showLvlPicker&&lvlPickerTouchOk){
    if(lvlPickerMoved<8){
      // 点击选关：倒序列表，pos=0对应500关
      const pos=Math.floor((lvlPickerStartY-lvlListRect.y+lvlPickerScroll)/lvlRowH);
      const idx=500-pos;
      const cleared=getCleared();
      if(idx>=1&&idx<=500&&(cleared.includes(idx)||idx<=level)){
        level=idx; score=0; showLvlPicker=false; generateLevel();
      }else{showLvlPicker=false}
    }
    lvlPickerTouchOk=false;
    return;
  }
  handleTouch(e.changedTouches[0].clientX,e.changedTouches[0].clientY);
});
let lastTouchY=null;
try{canvas.addEventListener('click',e=>{if(Date.now()-_lastTap<100)return;handleTouch(e.clientX,e.clientY)});console.log('[unscrew] mouse fallback added')}catch(e){}
// ── 音效 ──
let audioCtx=null,soundOn=true,clickSfxIdx=0;
try{audioCtx=wx.createWebAudioContext()}catch(e){}
if(!audioCtx)try{audioCtx=wx.createInnerAudioContext()}catch(e){}
function playTone(f,d,t,v){if(!soundOn||!audioCtx)return;try{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=t;o.frequency.value=f;g.gain.setValueAtTime(v,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+d);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+d)}catch(e){}}
// 🎵 点击音效预设
const CLICK_SFX=[
  {name:'默认',fn(){playTone(800,0.08,'sine',0.25)}},
  {name:'清脆',fn(){playTone(1200,0.06,'sine',0.18)}},
  {name:'水滴',fn(){playTone(1600,0.10,'sine',0.12);setTimeout(()=>playTone(800,0.12,'sine',0.08),40)}},
  {name:'木质',fn(){playTone(400,0.08,'triangle',0.15)}},
  {name:'弹珠',fn(){playTone(900,0.06,'sine',0.18);setTimeout(()=>playTone(600,0.05,'sine',0.08),30)}},
  {name:'金属',fn(){playTone(600,0.05,'square',0.10)}},
];
function sfxClick(){CLICK_SFX[clickSfxIdx].fn()}
function sfxMatch(){[523,659,784].forEach((f,i)=>setTimeout(()=>playTone(f,0.18,'sine',0.22),i*70))}
function sfxWin(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>playTone(f,0.35,'triangle',0.25),i*100))}
function sfxLose(){[300,250,200].forEach((f,i)=>setTimeout(()=>playTone(f,0.25,'sawtooth',0.15),i*150))}
function sfxBomb(){playTone(200,0.35,'sawtooth',0.30);playTone(60,0.4,'sawtooth',0.22)}
function sfxUndo(){playTone(200,0.2,'sine',0.22);playTone(600,0.22,'sine',0.18)}
function sfxPeek(){playTone(400,0.25,'sine',0.15);playTone(1600,0.3,'sine',0.10)}
// ── 游戏循环 ──
function loop(){
  if(efxOn('particles')){
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=0.06;p.life-=p.decay*1.5;if(p.life<=0)particles.splice(i,1)}
    if(particles.length > 80) particles.splice(0, particles.length - 80);
    for(let i=slotAnims.length-1;i>=0;i--){const a=slotAnims[i];if(Date.now()-a.startTime>a.duration)slotAnims.splice(i,1)}
  }
  if(efxOn('combo')){
    for(let i=comboPops.length-1;i>=0;i--){const c=comboPops[i];c.life+=0.045;c.y-=2;if(c.life>=c.eLife||comboPops.length>4)comboPops.splice(i,1)}
  }
  if(efxOn('shake')){if(boardShake>0)boardShake-=0.1}else{boardShake=0}
  if(efxOn('flash')){if(screenFlash>0)screenFlash-=0.07}else{screenFlash=0}
  render();requestAnimationFrame(loop)
}
// ── Math.imul polyfill（极少数旧引擎缺失）──
if(!Math.imul)Math.imul=function(a,b){var ah=(a>>>16)&0xffff,al=a&0xffff,bh=(b>>>16)&0xffff,bl=b&0xffff;return((al*bl)+(((ah*bl+al*bh)<<16)>>>0)|0)};
// ── 启动 ──
(function init(){
try{console.log('[unscrew] W=',W,'H=',H,'board=',BOARD_W,'x',BOARD_H)}catch(e){}
try{loadGame()}catch(e){console.warn('[unscrew] loadGame failed:',e.message)}
try{loadSkin()}catch(e){console.warn('[unscrew] loadSkin failed:',e.message)}
try{loadCheckin()}catch(e){console.warn('[unscrew] loadCheckin failed:',e.message)}
try{loadNick()}catch(e){console.warn('[unscrew] loadNick failed:',e.message)}
try{tutDone=!!wx.getStorageSync('tut_done')}catch(e){}
try{soundOn=wx.getStorageSync('sound')!=='0'}catch(e){}
try{clickSfxIdx=parseInt(wx.getStorageSync('sfx_idx'))||0}catch(e){}
try{bgmOn=wx.getStorageSync('bgm')==='1'}catch(e){}
try{initAd()}catch(e){console.warn('[unscrew] initAd failed:',e.message)}
try{generateLevel()}catch(e){console.error('[unscrew] generateLevel failed:',e.message);ctx.fillStyle='#ef4444';ctx.fillRect(0,0,W,60);ctx.fillStyle='#fff';ctx.font='13px sans-serif';ctx.fillText('关卡生成失败: '+e.message,10,25);ctx.fillText('请检查数据后重试',10,45);return}
// 注册隐私授权处理（微信新规要求）
try{wx.onNeedPrivacyAuthorization(function(resolve){console.log('[privacy] onNeedPrivacyAuthorization');resolve({buttonId:'agree',event:'agree'})})}catch(e){console.log('[privacy] register err:',e)}
requestAnimationFrame(loop);
console.log('[unscrew] started');
if(!tutDone){setTimeout(function(){showTutorialOverlay=true;tutIdx=0},400)}
else{setTimeout(function(){showLoginOverlay=true},400)}
})()
