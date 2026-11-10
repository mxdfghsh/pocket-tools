(() => {
  if (document.getElementById("pocket-pet")) return;
  const BASE = "pet/assets/";
  const root = document.createElement("aside");
  root.id = "pocket-pet";
  root.innerHTML = `
    <button class="pp-menu-toggle" type="button" aria-label="打开桌宠菜单">☰</button>
    <img class="pp-sprite" src="${BASE}idle.png" alt="银白狐耳桌宠" draggable="false">
    <div class="pp-speech" hidden></div>
    <nav class="pp-actions" hidden>
      <button data-act="chat">聊天</button><button data-act="pet">摸摸</button>
      <button data-act="sleep">睡觉</button><button data-act="hide">隐藏</button>
    </nav>`;
  document.body.appendChild(root);
  const sprite=root.querySelector(".pp-sprite"), speech=root.querySelector(".pp-speech");
  const actions=root.querySelector(".pp-actions"), menuBtn=root.querySelector(".pp-menu-toggle");
  const poses={idle:"idle",happy:"happy",curious:"curious",shy:"shy",angry:"angry",sleep:"sleep",surprised:"surprised"};
  let idleTimer, speechTimer, down=null, moved=false;
  function pose(name, back=0){
    const file=poses[name]||"idle";
    sprite.src=BASE+file+".png"; sprite.dataset.pose=file;
    if(back) setTimeout(()=>{if(sprite.dataset.pose===file) pose("idle");},back);
  }
  function say(t){
    speech.textContent=t; speech.hidden=false;
    clearTimeout(speechTimer); speechTimer=setTimeout(()=>speech.hidden=true,2400);
  }
  function resetIdle(){
    clearTimeout(idleTimer);
    idleTimer=setTimeout(()=>{pose("sleep");say("呼……晚安。");},90000);
  }
  sprite.addEventListener("pointerdown",e=>{
    down={x:e.clientX,y:e.clientY,left:root.offsetLeft,top:root.offsetTop};
    moved=false; sprite.setPointerCapture(e.pointerId);
  });
  sprite.addEventListener("pointermove",e=>{
    if(!down)return;
    const dx=e.clientX-down.x,dy=e.clientY-down.y;
    if(Math.abs(dx)+Math.abs(dy)>7)moved=true;
    if(moved){
      root.style.left=Math.max(0,Math.min(innerWidth-root.offsetWidth,down.left+dx))+"px";
      root.style.top=Math.max(0,Math.min(innerHeight-root.offsetHeight,down.top+dy))+"px";
      root.style.right="auto";root.style.bottom="auto";
    }
  });
  sprite.addEventListener("pointerup",()=>{
    if(down&&!moved){pose("happy",2600);say("欸嘿！");resetIdle();}
    down=null;
  });
  sprite.addEventListener("pointercancel",()=>down=null);
  menuBtn.addEventListener("click",()=>actions.hidden=!actions.hidden);
  actions.addEventListener("click",e=>{
    const a=e.target.dataset.act;if(!a)return;
    if(a==="chat"){pose("curious",2500);say("今天也要加油哦！");}
    if(a==="pet"){pose("happy",2600);say("再摸摸嘛～");}
    if(a==="sleep"){pose("sleep");say("晚安～");}
    if(a==="hide"){root.hidden=true;}
    actions.hidden=true;resetIdle();
  });
  const saved=JSON.parse(localStorage.getItem("pocket-pet-pos")||"null");
  if(saved){root.style.left=saved.left;root.style.top=saved.top;root.style.right="auto";root.style.bottom="auto";}
  addEventListener("beforeunload",()=>localStorage.setItem("pocket-pet-pos",JSON.stringify({left:root.style.left,top:root.style.top})));
  resetIdle();
})();