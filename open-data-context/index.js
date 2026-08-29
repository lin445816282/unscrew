// 开放数据域：好友排行榜
const sharedCanvas = wx.getSharedCanvas();
sharedCanvas.width = 280;
sharedCanvas.height = 336;
const ctx = sharedCanvas.getContext('2d');
// roundRect polyfill（开放数据域无主域 polyfill，需自带）
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

function getKV(list, key){
  if(!list) return '';
  for(let i=0;i<list.length;i++){ if(list[i].key===key) return list[i].value; }
  return '';
}

// 判断是否开发者工具（开放数据域好友关系数据在工具里不返回）
let _isDevtools = false;
try{ _isDevtools = (wx.getSystemInfoSync().platform === 'devtools'); }catch(e){}

function render(list){
  const W = sharedCanvas.width, H = sharedCanvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = 'rgba(15,22,34,0.96)';
  ctx.fillRect(0,0,W,H);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('👥 好友排行榜', W/2, 24);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(12, 40); ctx.lineTo(W-12, 40); ctx.stroke();
  if(!list || list.length===0){
    ctx.fillStyle = '#64748b';
    ctx.font = '13px sans-serif';
    if(_isDevtools){
      ctx.fillText('好友榜需真机体验版查看', W/2, H/2-10);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('开发者工具不返回好友关系数据', W/2, H/2+14);
    }else{
      ctx.fillText('暂无好友数据', W/2, H/2-10);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('通关后你的成绩会显示在这里', W/2, H/2+14);
    }
    return;
  }
  list.slice(0, 8).forEach((item, i)=>{
    const y = 58 + i * 34;
    const score = getKV(item.KVDataList, 'score') || '0';
    const title = getKV(item.KVDataList, 'title') || '';
    // 自己这一行金色高亮
    if(item._isMe){
      ctx.fillStyle = 'rgba(251,191,36,0.15)';
      ctx.fillRect(10, y-14, W-20, 30);
      ctx.strokeStyle = 'rgba(251,191,36,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(10, y-14, W-20, 30, 8); ctx.stroke();
    }else{
      ctx.fillStyle = i%2===0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)';
      ctx.fillRect(10, y-14, W-20, 30);
    }
    ctx.fillStyle = i===0?'#fbbf24':i===1?'#cbd5e1':i===2?'#d97706':'#64748b';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText((i+1)+'.', 16, y);
    if(item.avatarUrl){
      const img = wx.createImage();
      img.src = item.avatarUrl;
      img.onload = function(){ ctx.save(); ctx.beginPath(); ctx.arc(40, y, 12, 0, Math.PI*2); ctx.clip(); ctx.drawImage(img, 28, y-12, 24, 24); ctx.restore(); };
    }
    ctx.fillStyle = item._isMe ? '#fbbf24' : '#e2e8f0';
    ctx.font = '12px sans-serif';
    ctx.fillText(((item.nickname||'玩家').slice(0,7)) + (item._isMe?' (我)':''), 56, y-7);
    if(title){
      ctx.fillStyle = '#f59e0b';
      ctx.font = '9px sans-serif';
      ctx.fillText('🎖'+title.slice(0,8), 56, y+9);
    }
    ctx.fillStyle = item._isMe ? '#fbbf24' : '#fbbf24';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(score+'分', W-12, y);
  });
}

wx.onMessage(function(msg){
  if(msg && msg.type === 'showFriends'){
    const myNick = (msg && msg.nick) || '我';
    const myAvatar = (msg && msg.avatar) || '';
    wx.getFriendCloudStorage({
      keyList: ['score','level','title'],
      success: function(res){
        const friends = (res && res.data) || [];
        // ⭐ getFriendCloudStorage 不含自己 → 单独拉自己数据合并进榜
        wx.getUserCloudStorage({
          keyList: ['score','level','title'],
          success: function(me){
            const myKV = (me && me.KVDataList) || [];
            const myScore = parseInt(getKV(myKV,'score')||'0',10);
            const list = friends.slice();
            if(myScore > 0){
              list.push({ nickname: myNick, avatarUrl: myAvatar, KVDataList: myKV, _isMe: true });
            }
            list.sort(function(a,b){
              const sa = parseInt(getKV(a.KVDataList,'score')||'0',10);
              const sb = parseInt(getKV(b.KVDataList,'score')||'0',10);
              return sb - sa;
            });
            render(list);
          },
          fail: function(){ render(friends); }
        });
      },
      fail: function(){ render([]); }
    });
  }
});
