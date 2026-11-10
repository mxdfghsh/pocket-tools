(() => {
 if(document.getElementById("pocket-pet")) return;
 const BASE=new URL("pet/assets/",document.currentScript?.src||location.href).href;
 const root=document.createElement("aside"); root.id="pocket-pet";
 root.innerHTML=`<button class="pp-menu-toggle" aria-label="桌宠菜单">☰</button><img class="pp-sprite" src="${BASE}idle.png" alt="狐耳桌宠" draggable="false"><div class="pp-speech" hidden></div><nav class="pp-actions" hidden><button data-act="chat">聊天</button><button data-act="pet">摸摸</button><button data-act="sleep">睡觉</button><button data-act="show">唤醒</button></nav>`;
 document.body.appendChild(root);
 const img=root.querySelector(".pp-sprite"),bubble=root.querySelector(".pp-speech"),menu=root.querySelector(".pp-actions");
 const valid=["idle","happy","curious","shy","angry","sleep","surprised","sleepy"];
 let timer,sayTimer,idleTimer,down=null,moved=false,longPress=false,pressTimer,sleeping=false;
 function pose(p,back=0){p=valid.includes(p)?p:"idle";img.src=BASE+p+".png";img.dataset.pose=p;if(back)setTimeout(()=>{if(img.dataset.pose===p)pose("idle")},back)}
 function say(t){bubble.textContent=t;bubble.hidden=false;clearTimeout(sayTimer);sayTimer=setTimeout(()=>bubble.hidden=true,2600)}
 function goSleep(){sleeping=true;clearTimeout(timer);clearTimeout(idleTimer);pose("sleep");say("呼……睡一会儿～")}
 function wake(){if(!sleeping)return;sleeping=false;pose("idle");say("我回来啦！");schedule();resetIdle()}
 function resetIdle(){if(sleeping)return;clearTimeout(idleTimer);idleTimer=setTimeout(goSleep,90000)}
 function schedule(){clearTimeout(timer);if(sleeping)return;timer=setTimeout(()=>{if(sleeping)return;let a=[["curious","嗯？有人在看我吗？"],["shy","才、才没有害羞呢！"],["surprised","欸？怎么啦？"]][Math.floor(Math.random()*3)];pose(a[0],1900);say(a[1]);schedule()},22000+Math.random()*12000)}
 img.addEventListener("pointerdown",e=>{if(sleeping){wake();return}resetIdle();down={x:e.clientX,y:e.clientY,l:root.offsetLeft,t:root.offsetTop};moved=false;longPress=false;pressTimer=setTimeout(()=>{if(down&&!moved){longPress=true;pose("shy",2000);say("呀！突然摸我！")}},650);img.setPointerCapture(e.pointerId)});
 img.addEventListener("pointermove",e=>{if(!down)return;let x=e.clientX-down.x,y=e.clientY-down.y;if(Math.abs(x)+Math.abs(y)>7){moved=true;clearTimeout(pressTimer)}if(moved){root.style.left=Math.max(0,Math.min(innerWidth-root.offsetWidth,down.l+x))+"px";root.style.top=Math.max(0,Math.min(innerHeight-root.offsetHeight,down.t+y))+"px";root.style.right="auto";root.style.bottom="auto"}});
 img.addEventListener("pointerup",()=>{clearTimeout(pressTimer);if(down&&!moved&&!longPress){pose("happy",2400);say(["嘿嘿！","再摸摸嘛～","我很开心哦！"][Math.floor(Math.random()*3)]);schedule()}down=null;resetIdle()});
 img.addEventListener("pointercancel",()=>{clearTimeout(pressTimer);down=null;resetIdle()});
 root.querySelector(".pp-menu-toggle").onclick=()=>{menu.hidden=!menu.hidden;resetIdle()};
 menu.onclick=e=>{let a=e.target.dataset.act;if(!a)return;if(a==="chat"){pose("curious",2200);say("今天也要加油哦！")}if(a==="pet"){pose("happy",2400);say("最喜欢被摸摸了！")}if(a==="sleep"){goSleep()}if(a==="show"){wake()}if(a!=="sleep")resetIdle();menu.hidden=true};
 try{let s=JSON.parse(localStorage.getItem("pocket-pet-pos")||"null");if(s?.left&&s?.top){root.style.left=s.left;root.style.top=s.top;root.style.right="auto";root.style.bottom="auto"}addEventListener("beforeunload",()=>localStorage.setItem("pocket-pet-pos",JSON.stringify({left:root.style.left,top:root.style.top})))}catch(e){}
 schedule();resetIdle();
})();