/* Foxglove & Ember — own code. Motion values per Tòpas spec. */
(function(){
"use strict";
var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
var $ = function(s,c){return (c||document).querySelector(s)};
var $$ = function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};

/* ---------- live status, America/Los_Angeles ----------
   Grand Opening: Sat Nov 28 2026, 7:00-15:00 PT. No regular hours yet. */
function openState(){
  try{
    var parts = new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date());
    var o={}; parts.forEach(function(p){o[p.type]=p.value});
    var mins=(parseInt(o.hour,10)%24)*60+parseInt(o.minute,10);
    var isDay = +o.year===2026 && +o.month===11 && +o.day===28;
    var before = (+o.year<2026)||(+o.year===2026&&(+o.month<11||(+o.month===11&&+o.day<28)));
    return { open: isDay && mins>=420 && mins<900, before: before };
  }catch(e){ return {open:false,before:true}; }
}
function paintStatus(){
  var s=openState(), dot=$('[data-status-dot]'), txt=$('[data-status-text]');
  if(!dot||!txt) return;
  dot.classList.toggle('is-open',s.open);
  txt.textContent = s.open ? 'Open now — Grand Opening til 3 PM' : s.before ? 'Grand Opening Sat Nov 28 · 7 AM–3 PM' : 'Now open in Foxglove Hollow';
}
paintStatus(); setInterval(paintStatus,60000);

if(!window.gsap){ var i=$('[data-intro]'); if(i) i.style.display='none'; return; }
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ignoreMobileResize:true});

/* ---------- Lenis ---------- */
var lenis=null;
if(window.Lenis && !reduced){
  lenis=new Lenis({lerp:0.09,wheelMultiplier:0.95,touchMultiplier:1.4});
  lenis.on('scroll',ScrollTrigger.update);
  gsap.ticker.add(function(t){lenis.raf(t*1000)});
  gsap.ticker.lagSmoothing(0);
  document.addEventListener('click',function(e){
    var a=e.target.closest('a[href^="#"]'); if(!a) return;
    var id=a.getAttribute('href'); if(id.length<2) { if(id==='#top'){e.preventDefault();lenis.scrollTo(0,{duration:1.6});} return; }
    var t=document.querySelector(id); if(!t) return;
    e.preventDefault(); lenis.scrollTo(t,{duration:1.6});
  });
}

/* ---------- own char splitter (SplitText alternative) ---------- */
function splitChars(el){
  var text=el.textContent; el.textContent=''; el.setAttribute('aria-label',text);
  var frag=document.createDocumentFragment(), chars=[];
  text.split('').forEach(function(c){
    if(c===' '){ frag.appendChild(document.createTextNode(' ')); return; }
    var mask=document.createElement('span'); mask.className='split-mask'; mask.style.display='inline-block';
    var ch=document.createElement('span'); ch.className='split-ch'; ch.textContent=c;
    mask.appendChild(ch); frag.appendChild(mask); chars.push(ch);
  });
  el.appendChild(frag); return chars;
}
function splitWords(el){
  var words=[];
  (function walk(node){
    Array.prototype.slice.call(node.childNodes).forEach(function(n){
      if(n.nodeType===3){
        var f=document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function(part){
          if(!part) return;
          if(/^\s+$/.test(part)){ f.appendChild(document.createTextNode(' ')); }
          else { var s=document.createElement('span'); s.className='split-word'; s.textContent=part; f.appendChild(s); words.push(s); }
        });
        node.insertBefore(f,n); node.removeChild(n);
      } else if(n.nodeType===1) walk(n);
    });
  })(el);
  return words;
}

/* ---------- loader ---------- */
var intro=$('[data-intro]');
function heroIntro(){
  gsap.from('.s-hero__headline h1',{y:60,opacity:0,stagger:0.12,duration:1,ease:'expo.out',delay:0.1});
  gsap.from('.s-hero__headline p',{y:30,opacity:0,duration:0.9,ease:'expo.out',delay:0.35});
  gsap.from('.s-hero__theme',{y:-24,opacity:0,duration:0.8,ease:'expo.out',delay:0.25,clearProps:'opacity'});
  gsap.from('.s-hero__note, .s-hero__badge',{opacity:0,duration:1,ease:'expo.out',delay:0.5,clearProps:'opacity'});
  gsap.from('.topbar > *',{y:-60,opacity:0,stagger:0.08,duration:0.9,ease:'expo.out',delay:0.4,clearProps:'opacity'});
}
function runIntro(){
  if(!intro){ heroIntro(); return; }
  if(lenis) lenis.stop();
  var word=$('[data-intro-word]');
  var letters=word.textContent.split(''); word.textContent='';
  var spans=letters.map(function(c){var s=document.createElement('span');s.className='ch';s.textContent=c;word.appendChild(s);return s});
  var msgs=['Warming up the cottage…','Grinding the beans…','Foxglove Roast, promise…','Ember light, rising…'];
  var mi=0, msgEl=$('[data-intro-msg]');
  var msgTimer=setInterval(function(){ mi=(mi+1)%msgs.length; if(msgEl) msgEl.textContent=msgs[mi]; },650);
  var bar=$('[data-intro-bar]'), prog={v:0.04};
  var imgEls=$$('img'), total=Math.max(imgEls.length,1), done=0;
  function bump(){ done++; if(bar) gsap.to(prog,{v:Math.max(0.04,done/total),duration:0.3,onUpdate:function(){bar.style.transform='scaleX('+prog.v.toFixed(3)+')'}}); }
  imgEls.forEach(function(im){ if(im.complete) bump(); else { im.addEventListener('load',bump,{once:true}); im.addEventListener('error',bump,{once:true}); } });
  var start=Date.now(), finished=false;
  function finish(){
    if(finished) return; finished=true; clearInterval(msgTimer);
    if(bar) bar.style.transform='scaleX(1)';
    gsap.set(spans,{yPercent:-160,rotation:function(){return gsap.utils.random(-25,25)},opacity:1,transformOrigin:'50% 100%'});
    var tl=gsap.timeline({defaults:{ease:'expo.out'}});
    tl.to(spans,{yPercent:0,rotation:0,duration:0.9,stagger:0.07,ease:'bounce.out'})
      .add(function(){ intro.classList.add('is-done'); })
      .to({},{duration:0.8})
      .to('.intro__core',{scale:1.4,opacity:0,duration:0.6,ease:'power3.in'},'out')
      .to('.intro__panels span',{yPercent:-101,duration:1.1,stagger:0.07,ease:'expo.inOut'},'out')
      .set(intro,{display:'none'})
      .add(function(){ heroIntro(); if(lenis) lenis.start(); ScrollTrigger.refresh(); },'out+=0.5');
  }
  var iv=setInterval(function(){ if(done>=total || Date.now()-start>4000){ clearInterval(iv); setTimeout(finish,250); } },120);
  setTimeout(function(){ clearInterval(iv); finish(); },4000); /* hard failsafe */
}
if(reduced){ if(intro) intro.style.display='none'; heroIntro(); }
else if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',runIntro); else runIntro();

/* ---------- cursor + magnetic ---------- */
if(matchMedia('(pointer: fine) and (hover: hover)').matches && !reduced){
  var cursor=$('[data-cursor]'), label=$('[data-cursor-label]');
  if(cursor){
    document.documentElement.classList.add('has-cursor');
    var cx=gsap.quickTo(cursor,'x',{duration:0.35,ease:'power3'}), cy=gsap.quickTo(cursor,'y',{duration:0.35,ease:'power3'});
    gsap.set(cursor,{x:innerWidth/2,y:innerHeight/2});
    addEventListener('pointermove',function(e){ cursor.classList.add('is-on'); cx(e.clientX); cy(e.clientY); });
    document.addEventListener('pointerleave',function(){ cursor.classList.remove('is-on') });
    addEventListener('pointerdown',function(){ cursor.classList.add('is-down') });
    addEventListener('pointerup',function(){ cursor.classList.remove('is-down') });
    document.addEventListener('pointerover',function(e){
      var t=e.target.closest('a, button, [data-cursor-text]');
      cursor.classList.toggle('is-hover',!!t);
      if(label) label.textContent = t ? (t.dataset.cursorText||'Hello!') : '';
    });
  }
  $$('[data-magnetic]').forEach(function(el){
    var qx=gsap.quickTo(el,'x',{duration:0.5,ease:'power3'}), qy=gsap.quickTo(el,'y',{duration:0.5,ease:'power3'});
    el.addEventListener('pointermove',function(e){ var r=el.getBoundingClientRect(); qx((e.clientX-(r.left+r.width/2))*0.28); qy((e.clientY-(r.top+r.height/2))*0.32); });
    el.addEventListener('pointerleave',function(){ gsap.to(el,{x:0,y:0,duration:0.9,ease:'elastic.out(1, 0.4)'}); });
  });
}

/* ---------- split titles ---------- */
if(!reduced){
  $$('[data-split]').forEach(function(el){
    var chars=splitChars(el);
    gsap.from(chars,{yPercent:115,rotation:function(){return gsap.utils.random(-14,14)},duration:1.1,ease:'back.out(1.4)',stagger:{each:0.025,from:'start'},
      scrollTrigger:{trigger:el,start:'top 85%',once:true},
      onComplete:function(){ $$('.split-mask',el).forEach(function(m){m.style.overflow='visible'}); }});
  });
  /* jelly */
  $$('[data-jelly]').forEach(function(el){
    el.addEventListener('pointermove',function(e){
      var ch=e.target.closest('.split-ch'); if(!ch||gsap.isTweening(ch)) return;
      gsap.fromTo(ch,{y:0,scaleY:1},{y:'-0.22em',scaleY:1.12,duration:0.22,yoyo:true,repeat:1,ease:'power2.out',transformOrigin:'50% 100%',color:'#D71927',clearProps:'color'});
    });
  });
  /* words scrub */
  var wEl=$('[data-words]');
  if(wEl){ var words=splitWords(wEl);
    gsap.fromTo(words,{opacity:0.12},{opacity:1,stagger:0.08,ease:'none',scrollTrigger:{trigger:wEl,start:'top 78%',end:'bottom 50%',scrub:true}});
  }
  /* sign brush wipe */
  $$('[data-sign]').forEach(function(el){
    var wipe=document.createElement('span'); wipe.style.cssText='display:block;overflow:hidden';
    var inner=document.createElement('span'); inner.style.display='block';
    el.parentNode.insertBefore(wipe,el); wipe.appendChild(inner); inner.appendChild(el);
    gsap.timeline({scrollTrigger:{trigger:wipe,start:'top 85%',once:true}})
      .fromTo(wipe,{xPercent:-100},{xPercent:0,duration:1.6,ease:'power2.inOut'},0)
      .fromTo(inner,{xPercent:100},{xPercent:0,duration:1.6,ease:'power2.inOut'},0);
  });
  /* generic parallax */
  $$('[data-parallax]').forEach(function(el){
    var amt=parseFloat(el.dataset.parallax)||10;
    gsap.fromTo(el,{yPercent:-amt},{yPercent:amt,ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:true}});
  });
  gsap.from('[data-stamp]',{scale:0.82,rotate:-4,ease:'none',scrollTrigger:{trigger:'.s-def',start:'top bottom',end:'center center',scrub:true}});
}

/* ---------- hero scroll-out ---------- */
var hero=$('.s-hero');
if(hero && !reduced){
  gsap.to('.s-hero__headline, .s-hero__note, .s-hero__theme, .s-hero__badge',{opacity:0,y:-40,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'45% top',scrub:true}});
}

/* ---------- marquees (velocity boost) ---------- */
var loops=[];
function loop(row,dir,speed){
  var track=row.firstElementChild; if(!track) return;
  var kids=Array.prototype.slice.call(track.children), half=kids.length/2;
  var w=half>=1 ? kids[half].offsetLeft-kids[0].offsetLeft : track.scrollWidth/2;
  if(!w) return;
  gsap.set(track,{x:dir>0?0:-w});
  loops.push(gsap.to(track,{x:dir>0?-w:0,duration:w/speed,ease:'none',repeat:-1}));
}
if(!reduced){
  $$('[data-marquee]').forEach(function(m){ loop(m,Number(m.dataset.marquee),90); });
  $$('[data-names-row]').forEach(function(m){ loop(m,Number(m.dataset.namesRow),70); });
  if(loops.length){
    var boost=1;
    ScrollTrigger.create({onUpdate:function(s){ boost=1+Math.min(5,Math.abs(s.getVelocity())/300); }});
    gsap.ticker.add(function(){ boost+=(1-boost)*0.05; loops.forEach(function(l){ l.timeScale(boost); }); });
  }
}

/* ---------- build (pinned) ---------- */
var buildPin=$('[data-build-pin]');
if(buildPin){
  var steps=$$('.s-build__step'), bar=$('[data-build-bar]'), result=$('[data-build-result]'), twist=$('[data-build-twist]');
  var marks=[0.02,0.14,0.36,0.46,0.57,0.66];
  var layers=$$('[data-layer]');
  function show(el,on){ gsap.to(el,{autoAlpha:on?1:0,y:on?0:24,duration:0.5,overwrite:true}); }
  var rOn=false,tOn=false,stepsHidden=false,introOff=false;
  var stepsEl=$('.s-build__steps'), bIntro=$('.s-build__intro'), small=matchMedia('(max-width: 760px)');
  if(reduced){ layers.forEach(function(l){l.style.opacity=1}); if(result){result.style.opacity=1;result.style.visibility='visible'} }
  else ScrollTrigger.create({trigger:buildPin,start:'top top',end:function(){return '+='+innerHeight*4},pin:true,anticipatePin:1,scrub:true,
    onUpdate:function(s){
      var p=s.progress;
      if(bar) bar.style.transform='scaleX('+p+')';
      steps.forEach(function(li,i){ li.classList.toggle('is-active',p>=marks[i]&&p<marks[i+1]); li.classList.toggle('is-done',p>=marks[i+1]); });
      layers.forEach(function(l,i){
        var on = p>=marks[i] && p<0.70;
        gsap.to(l,{autoAlpha:on?1:0,scale:on?1:0.88,duration:0.4,overwrite:true});
      });
      var r=p>0.70&&p<0.82, t=p>0.88;
      if(r!==rOn) show(result,(rOn=r));
      if(t!==tOn) show(twist,(tOn=t));
      var off=small.matches&&p>0.015;
      if(off!==introOff) gsap.to(bIntro,{autoAlpha:(introOff=off)?0:1,duration:0.45,overwrite:true});
      var hide=p>0.80;
      if(hide!==stepsHidden) gsap.to(stepsEl,{autoAlpha:(stepsHidden=hide)?0:1,duration:0.3,overwrite:true});
    }});
}

/* ---------- gallery (pinned horizontal) ---------- */
var gPin=$('[data-gallery-pin]'), track=$('[data-gallery-track]');
if(gPin&&track&&!reduced){
  var dist=function(){ return Math.max(0,track.scrollWidth-innerWidth); };
  var tl=gsap.timeline({scrollTrigger:{trigger:gPin,start:'top top',end:function(){return '+='+dist()},pin:true,anticipatePin:1,scrub:true,invalidateOnRefresh:true}});
  tl.to(track,{x:function(){return -dist()},ease:'none'},0)
    .to('[data-gallery-giant]',{xPercent:-45,ease:'none'},0);
  $$('[data-card]',track).forEach(function(card){
    var img=$('[data-card-img]',card);
    gsap.fromTo(card,{rotate:6,scale:0.86},{rotate:0,scale:1,ease:'none',scrollTrigger:{trigger:card,containerAnimation:tl,start:'left right',end:'center center',scrub:true}});
    if(img) gsap.fromTo(img,{xPercent:-6},{xPercent:6,ease:'none',scrollTrigger:{trigger:card,containerAnimation:tl,start:'left right',end:'right left',scrub:true}});
    var title=$('.card__title',card);
    if(title) gsap.from(title,{yPercent:60,opacity:0,rotate:-6,ease:'back.out(2)',duration:0.9,scrollTrigger:{trigger:card,containerAnimation:tl,start:'left 70%',toggleActions:'play none none reverse'}});
  });
}

/* ---------- amigos duo wipe (pinned) ---------- */
var duo=$('[data-duo]');
if(duo&&!reduced){
  var illu=$('[data-duo-illu]',duo), illuImg=$('[data-duo-in]',duo), line=$('[data-duo-line]',duo), frame=$('.duo__frame',duo);
  gsap.timeline({scrollTrigger:{trigger:duo,start:'center center',end:function(){return '+='+innerHeight*1.2},pin:true,anticipatePin:1,scrub:true,invalidateOnRefresh:true}})
    .set(line,{opacity:1})
    .fromTo(illu,{xPercent:0},{xPercent:100,ease:'none'},0)
    .fromTo(illuImg,{xPercent:0},{xPercent:-100,ease:'none'},0)
    .fromTo(line,{x:0},{x:function(){return frame.offsetWidth},ease:'none'},0)
    .to(line,{opacity:0,duration:0.05});
  gsap.from('.s-amigos__how > span',{y:40,opacity:0,stagger:0.12,duration:0.8,ease:'back.out(2)',scrollTrigger:{trigger:'.s-amigos__how',start:'top 90%',once:true}});
}

/* ---------- hours ---------- */
if(!reduced){
  gsap.from('[data-hours-row]',{xPercent:-30,opacity:0,stagger:0.12,duration:1,ease:'expo.out',scrollTrigger:{trigger:'.hours',start:'top 85%',once:true}});
  gsap.fromTo('.s-hours__disc',{scale:0.5,rotate:-30},{scale:1,rotate:0,ease:'none',scrollTrigger:{trigger:'.s-hours',start:'top bottom',end:'center center',scrub:true}});
}

/* ---------- visit ---------- */
if(!reduced){
  gsap.from('.s-visit__pictos li, .s-visit__locs article',{y:30,opacity:0,stagger:0.06,duration:0.7,ease:'back.out(2)',scrollTrigger:{trigger:'.s-visit__grid',start:'top 90%',once:true}});
  gsap.fromTo('[data-visit-marquee]',{xPercent:0},{xPercent:-33.333,ease:'none',scrollTrigger:{trigger:'.s-visit',start:'top bottom',end:'bottom top',scrub:true}});
  var map=$('[data-map]');
  if(map&&matchMedia('(pointer: fine)').matches){
    var wrap=map.parentElement;
    var rx=gsap.quickTo(map,'rotationX',{duration:0.6,ease:'power3'}), ry=gsap.quickTo(map,'rotationY',{duration:0.6,ease:'power3'});
    wrap.addEventListener('pointermove',function(e){ var r=wrap.getBoundingClientRect(); ry(((e.clientX-r.left)/r.width-0.5)*9); rx(-((e.clientY-r.top)/r.height-0.5)*7); });
    wrap.addEventListener('pointerleave',function(){ rx(0); ry(0); });
  }
}

/* ---------- end ---------- */
var big=$('[data-end-big] span');
if(big){
  if(reduced){ /* static */ }
  else{
    var chars=splitChars(big);
    gsap.from(chars,{yPercent:120,rotation:function(){return gsap.utils.random(-30,30)},stagger:0.04,duration:1.2,ease:'elastic.out(1, 0.5)',scrollTrigger:{trigger:'.s-end',start:'top 55%',toggleActions:'play none none reverse'}});
    big.parentElement.addEventListener('pointermove',function(e){
      var hit=chars.filter(function(ch){ var r=ch.getBoundingClientRect(); return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom; })[0];
      if(hit&&!gsap.isTweening(hit)) gsap.fromTo(hit,{y:0},{y:-40,duration:0.25,yoyo:true,repeat:1,ease:'power2.out'});
    });
  }
}
addEventListener('load',function(){ ScrollTrigger.refresh(); });
})();
