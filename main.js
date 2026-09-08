'use strict';
(function(){

/* ── HEADER (STATIC UNIFIED BACKGROUND) ───────────────── */
const header=document.getElementById('header');

/* ── ACTIVE NAV LINK (MAGNETIC SPRING PILL) ─────────────── */
const sections=document.querySelectorAll('section[id],main[id]');
const navLinks=document.querySelectorAll('.nav-link');
const navPill=document.querySelector('.nav-pill');
const indicator=document.querySelector('.nav-indicator');

let isHoveringNav=false;

function moveIndicatorTo(targetLink){
  if(!indicator||!targetLink)return;
  indicator.style.width=targetLink.offsetWidth+'px';
  indicator.style.transform=`translateX(${targetLink.offsetLeft}px)`;
  indicator.style.opacity='1';
}

function updateActiveNav(){
  if(isHoveringNav)return;
  const active=document.querySelector('.nav-link.active')||navLinks[0];
  if(active){
    moveIndicatorTo(active);
  }
}

window.addEventListener('resize',updateActiveNav);

const sectionNavMap = {
  'hero': '#hero',
  'services': '#services',
  'process': '#services',
  'why-us': '#why-us',
  'urgency': '#why-us',
  'faq': '#why-us',
  'contact': '#contact'
};

function setActiveNav(targetHref){
  if(!targetHref)return;
  const rawId = targetHref.replace(/^#/, '');
  const mappedHref = sectionNavMap[rawId] || (document.querySelector(`.nav-link[href="#${rawId}"]`) ? `#${rawId}` : null);
  if(!mappedHref) return; // Retain current active link if target does not map to a nav item

  const targetLink = document.querySelector(`.nav-link[href="${mappedHref}"]`);
  if(!targetLink) return;

  navLinks.forEach(a=>{
    a.classList.toggle('active', a === targetLink);
  });
  const mobileNavLinks=document.querySelectorAll('.mobile-link');
  mobileNavLinks.forEach(a=>{
    a.classList.toggle('active', a.getAttribute('href') === mappedHref);
  });
  if(!isHoveringNav){
    requestAnimationFrame(updateActiveNav);
  }
}

if(navPill){
  navLinks.forEach(link=>{
    link.addEventListener('mouseenter',()=>{
      isHoveringNav=true;
      moveIndicatorTo(link);
    });
  });

  navPill.addEventListener('mouseleave',()=>{
    isHoveringNav=false;
    updateActiveNav();
  });
}

function onScrollSpy(){
  if(isHoveringNav)return;
  const totalH=document.documentElement.scrollHeight;
  const y=window.scrollY;
  let targetHref='#hero';
  if(y<60){
    targetHref='#hero';
  }else if(y+window.innerHeight>=totalH-50){
    targetHref='#contact';
  }else{
    const scrollPos=y+140;
    for(const s of sections){
      const top=s.offsetTop;
      const bot=top+s.offsetHeight;
      if(scrollPos>=top&&scrollPos<bot){
        targetHref=sectionNavMap[s.id]||('#'+s.id);
        break;
      }
    }
  }
  setActiveNav(targetHref);
}

let scrollTicking=false;
window.addEventListener('scroll',()=>{
  if(!scrollTicking){
    scrollTicking=true;
    requestAnimationFrame(()=>{
      onScrollSpy();
      scrollTicking=false;
    });
  }
},{passive:true});

// Initialize on load
setTimeout(()=>{
  onScrollSpy();
  updateActiveNav();
},60);
window.addEventListener('load',()=>{
  onScrollSpy();
  updateActiveNav();
});

/* ── SMOOTH SCROLL & ANCHOR NAVIGATION ─────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const href=a.getAttribute('href');
    if(!href||href==='#')return;
    const targetEl=document.querySelector(href);
    if(targetEl){
      e.preventDefault();
      const rawId=href.replace(/^#/, '');
      const mapped=sectionNavMap[rawId]||href;
      setActiveNav(mapped);
      targetEl.scrollIntoView({behavior:'smooth'});
    }
  });
});

/* ── MOBILE MENU ───────────────────────────────────────── */
const burger=document.querySelector('.burger');
const menu=document.getElementById('mobile-menu');
const overlay=document.getElementById('overlay');
function openMenu(){
  burger.setAttribute('aria-expanded','true');
  burger.setAttribute('aria-label','Close menu');
  menu.removeAttribute('hidden');
  overlay.classList.add('active');
  document.body.classList.add('menu-open');
  const fl=menu.querySelector('a');
  if(fl)fl.focus();
}
function closeMenu(){
  burger.setAttribute('aria-expanded','false');
  burger.setAttribute('aria-label','Open menu');
  menu.setAttribute('hidden','');
  overlay.classList.remove('active');
  document.body.classList.remove('menu-open');
  burger.focus();
}
burger&&burger.addEventListener('click',()=>burger.getAttribute('aria-expanded')==='true'?closeMenu():openMenu());
overlay&&overlay.addEventListener('click',closeMenu);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&burger&&burger.getAttribute('aria-expanded')==='true')closeMenu();});
menu&&menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
window.matchMedia('(min-width:769px)').addEventListener('change',e=>{if(e.matches&&burger&&burger.getAttribute('aria-expanded')==='true')closeMenu();});

/* ── COUNT-UP STATS ────────────────────────────────────── */
function easeOutCubic(t){return 1-Math.pow(1-t,3);}
function countUp(el,target,suffix,decimals,duration){
  const start=performance.now();
  (function tick(now){
    const p=Math.min((now-start)/duration,1);
    el.textContent=(easeOutCubic(p)*target).toFixed(decimals)+suffix;
    if(p<1)requestAnimationFrame(tick);
    else el.textContent=target.toFixed(decimals)+suffix;
  })(start);
}
const statEls=document.querySelectorAll('.stat-num');
if(window.IntersectionObserver&&statEls.length){
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(!e.isIntersecting)return;
      const el=e.target;
      const i=+el.dataset.i||0;
      setTimeout(()=>countUp(el,+el.dataset.target,el.dataset.suffix||'',+el.dataset.decimals||0,1500+i*80),480+i*90);
      obs.unobserve(el);
    });
  },{threshold:.25});
  statEls.forEach((el,i)=>{
    el.dataset.i=i;
    el.textContent=(0).toFixed(+el.dataset.decimals||0)+(el.dataset.suffix||'');
    obs.observe(el);
  });
}

/* ── SCROLL REVEAL ─────────────────────────────────────── */
const revealEls=document.querySelectorAll('.svc-card,.port-card,.test-card,.faq-item,.proc-step,.promise');
if(window.IntersectionObserver){
  const revObs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.style.animationPlayState='running';
        revObs.unobserve(e.target);
      }
    });
  },{threshold:.12});
  revealEls.forEach(el=>{
    el.style.animationPlayState='paused';
    revObs.observe(el);
  });
}

/* ── CONTACT FORM ──────────────────────────────────────── */
const form=document.getElementById('contactForm');
const toast=document.getElementById('toast');
const btn=document.getElementById('submitBtn');

let toastTimer=null;

function showToast(isSuccess=true, customMsg=null){
  if(!toast)return;
  const curLang=document.querySelector('.lang-btn.active')?.dataset.lang||'uz';
  const curT=(typeof T!=='undefined'&&T[curLang])||{};
  const iconEl=toast.querySelector('.toast-icon')||toast.querySelector('span:first-child');
  const textEl=toast.querySelector('.toast-text')||toast.querySelector('span:last-child');

  if(isSuccess){
    const msg = curT['toast_msg']||(typeof T!=='undefined'&&T.uz&&T.uz['toast_msg'])||'Xabaringiz muvaffaqiyatli yuborildi! Tez orada bogʻlanamiz.';
    if(typeof showSuccess3DAnimation === 'function'){
      showSuccess3DAnimation(msg);
      return;
    }
    toast.classList.remove('is-error');
    if(iconEl)iconEl.innerHTML='<i class="fa-solid fa-circle-check"></i>';
    if(textEl){
      textEl.dataset.key='toast_msg';
      textEl.textContent=msg;
    }
  }else{
    toast.classList.add('is-error');
    if(iconEl)iconEl.innerHTML='<i class="fa-solid fa-circle-exclamation"></i>';
    if(textEl){
      textEl.dataset.key='toast_err';
      textEl.textContent=customMsg || curT['toast_err']||(typeof T!=='undefined'&&T.uz&&T.uz['toast_err'])||'Xatolik yuz berdi. Iltimos, qayta urinib koʻring.';
    }
  }

  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.remove('show'), 4500);
}
window.showToast = showToast;
function validate(){
  let ok=true;
  ['f-name','f-contact','f-service','f-budget','f-msg'].forEach(id=>{
    const inp=document.getElementById(id);
    if(!inp) return;
    const field=inp.closest('.field');
    const val = inp.value.trim();
    let isValid = val !== '';
    if (id === 'f-service') {
      const ddSel = document.querySelector('#service-dropdown .dropdown-selected');
      const curLang = document.querySelector('.lang-btn.active')?.dataset.lang || 'uz';
      const placeholderText = ddSel ? ((typeof T !== 'undefined' && T[curLang] && T[curLang]['f_sel']) || 'Xizmat turini tanlang...') : '';
      const invalidPlaceholders = [
        placeholderText.toLowerCase(),
        'tanlanmadi',
        'xizmat turini tanlang...',
        'хизмат турини танланг...',
        'выберите услугу...',
        'select a service...'
      ];
      if (!val || invalidPlaceholders.includes(val.toLowerCase())) {
        isValid = false;
      }
    }
    if (id === 'f-msg' && val.length < 20) {
      isValid = false;
    }
    if(!isValid){
      field.classList.add('has-error');
      ok=false;
    } else {
      field.classList.remove('has-error');
    }
  });
  return ok;
}
if(form){
  ['f-name','f-contact','f-budget','f-msg'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input',function(){
      const val = this.value.trim();
      let valid = val !== '';
      if(id === 'f-msg') valid = val.length >= 20;
      if(valid) this.closest('.field').classList.remove('has-error');
    });
    el.addEventListener('blur',function(){
      const val = this.value.trim();
      let valid = val !== '';
      if(id === 'f-msg') valid = val.length >= 20;
      if(!valid) this.closest('.field').classList.add('has-error');
    });
  });

  const ddContainer = document.getElementById('service-dropdown');
  if (ddContainer) {
    ddContainer.addEventListener('focusout', function(e) {
      setTimeout(() => {
        if (!ddContainer.contains(document.activeElement)) {
          const hid = document.getElementById('f-service');
          const val = (hid?.value || '').trim();
          const curLang = document.querySelector('.lang-btn.active')?.dataset.lang || 'uz';
          const placeholder = (typeof T !== 'undefined' && T[curLang] && T[curLang]['f_sel']) || 'Xizmat turini tanlang...';
          const isInvalid = !val || val === 'Tanlanmadi' || val.toLowerCase() === placeholder.toLowerCase();
          if (isInvalid) {
            ddContainer.closest('.field')?.classList.add('has-error');
          }
        }
      }, 50);
    });
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if(!validate()) return;
    btn.disabled = true;
    const curLang = document.querySelector('.lang-btn.active')?.dataset.lang || 'uz';
    const curT = (typeof T !== 'undefined' && T[curLang]) || {};
    const btnSpan = btn.querySelector('span');
    if (btnSpan) {
      btnSpan.dataset.key = 'f_sending';
      btnSpan.textContent = curT['f_sending'] || (typeof T !== 'undefined' && T.uz && T.uz['f_sending']) || 'Yuborilmoqda...';
    }
    
    const name = document.getElementById('f-name').value.trim();
    const contact = document.getElementById('f-contact').value.trim();
    const service = document.getElementById('f-service').value.trim() || 'Tanlanmadi';
    const budget = (document.getElementById('f-budget')?.value || '').trim();
    const msg = document.getElementById('f-msg').value.trim();

    let isOk = false;
    let customErrorMsg = '';

    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 15000) : null;
      const resp = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact, service, budget, message: msg }),
        signal: controller ? controller.signal : undefined
      });
      if (timeoutId) clearTimeout(timeoutId);

      const ct = resp.headers.get('content-type') || '';

      if (resp.redirected) {
        customErrorMsg = 'Tarmoq xatosi yoki ruxsat yoʻq. Iltimos, keyinroq urinib koʻring.';
        isOk = false;
      } else if (resp.status === 401 || resp.status === 403) {
        customErrorMsg = 'Ruxsat berilmagan. Iltimos, keyinroq urinib koʻring.';
        isOk = false;
      } else if (resp.ok) {
        if (ct.includes('application/json')) {
          const data = await resp.json().catch(() => null);
          if (data && data.success) {
            isOk = true;
          } else {
            isOk = false;
            customErrorMsg = data?.error || 'Serverda kutilmagan xatolik yuz berdi.';
          }
        } else {
          customErrorMsg = 'Serverdan kutilmagan javob keldi. Iltimos, keyinroq urinib koʻring.';
          isOk = false;
        }
      } else {
        if (ct.includes('application/json')) {
          const errData = await resp.json().catch(() => null);
          customErrorMsg = errData?.error || 'Server xatosi yuz berdi.';
        } else if (ct.includes('text/html')) {
          customErrorMsg = 'Server vaqtincha javob bermadi. Iltimos, keyinroq urinib koʻring.';
        } else {
          customErrorMsg = `Xatolik yuz berdi (Status: ${resp.status}). Iltimos, keyinroq urinib koring.`;
        }
        isOk = false;
      }
    } catch(err) {
      console.error('Fetch error:', err);
      if (err.name === 'AbortError') {
        customErrorMsg = 'Soʻrov vaqti tugadi (Timeout). Iltimos, qayta urinib koʻring.';
      } else {
        customErrorMsg = 'Tarmoq xatosi yuz berdi. Iltimos, keyinroq urinib koring.';
      }
      isOk = false;
    }
    
    btn.disabled = false;
    const finishLang = document.querySelector('.lang-btn.active')?.dataset.lang || 'uz';
    const finishT = (typeof T !== 'undefined' && T[finishLang]) || {};
    if (btnSpan) {
      btnSpan.dataset.key = 'f_submit';
      btnSpan.textContent = finishT['f_submit'] || (typeof T !== 'undefined' && T.uz && T.uz['f_submit']) || 'Xabar yuborish →';
    }
    
    if (isOk) {
      form.reset();
      document.querySelectorAll('.field.has-error').forEach(f => f.classList.remove('has-error'));
      const selectedDd = document.querySelector('.dropdown-selected');
      if (selectedDd) {
        selectedDd.dataset.key = 'f_sel';
        selectedDd.classList.remove('has-val');
        selectedDd.setAttribute('aria-expanded', 'false');
        selectedDd.textContent = finishT['f_sel'] || (typeof T !== 'undefined' && T.uz && T.uz['f_sel']) || 'Xizmat turini tanlang...';
      }
      const hiddenService = document.getElementById('f-service');
      if (hiddenService) {
        hiddenService.value = '';
      }
      showToast(true);
    } else {
      if (!customErrorMsg) {
        customErrorMsg = curT['toast_err'] || (typeof T !== 'undefined' && T.uz && T.uz['toast_err']) || 'Xatolik yuz berdi. Iltimos, qayta urinib koʻring.';
      }
      showToast(false, customErrorMsg);
    }
  });
}

/* ── CARD TILT ─────────────────────────────────────────── */
document.querySelectorAll('.svc-card,.why-card').forEach(card=>{
  card.addEventListener('mousemove',e=>{
    const r=card.getBoundingClientRect();
    const x=((e.clientX-r.left)/r.width-.5)*10;
    const y=((e.clientY-r.top)/r.height-.5)*-10;
    card.style.transform=`translateY(-4px) rotateX(${y}deg) rotateY(${x}deg)`;
    card.style.transition='none';
  });
  card.addEventListener('mouseleave',()=>{
    card.style.transform='';
    card.style.transition='';
  });
});

/* ── BACKGROUND VIDEO SMOOTH PLAYBACK ───────────────────── */
const bgVideo = document.querySelector('.bg-video');
if (bgVideo) {
  const ensurePlay = () => {
    if (bgVideo.paused) {
      const p = bgVideo.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {});
      }
    }
  };
  ensurePlay();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) ensurePlay();
  });
  window.addEventListener('focus', ensurePlay);
  document.addEventListener('touchstart', ensurePlay, { once: true, passive: true });
}

})();

/* ── CUSTOM DROPDOWN ───────────────────────────────────── */
const dd = document.getElementById('service-dropdown');
if (dd) {
  const selected = dd.querySelector('.dropdown-selected');
  const opts = dd.querySelectorAll('.dropdown-opt');
  const hiddenInput = document.getElementById('f-service');
  const label = document.querySelector('label[for="f-service"]');

  function openDropdown() {
    dd.classList.add('open');
    selected.setAttribute('aria-expanded', 'true');
  }

  function closeDropdown() {
    dd.classList.remove('open');
    selected.setAttribute('aria-expanded', 'false');
  }

  function toggleDropdown() {
    if (dd.classList.contains('open')) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  function selectOption(opt) {
    selected.dataset.key = opt.dataset.key;
    selected.textContent = opt.textContent;
    selected.classList.add('has-val');
    hiddenInput.value = opt.textContent; // Using textContent so it sends natural text to TG
    closeDropdown();
    selected.closest('.field').classList.remove('has-error');
    selected.focus();
  }

  selected.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  selected.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!dd.classList.contains('open')) {
        openDropdown();
        opts[0]?.focus();
      } else {
        closeDropdown();
      }
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  if (label) {
    label.addEventListener('click', (e) => {
      e.preventDefault();
      selected.focus();
      toggleDropdown();
    });
  }

  opts.forEach((opt, idx) => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      selectOption(opt);
    });

    opt.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        selectOption(opt);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = opts[idx + 1] || opts[0];
        next.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = opts[idx - 1] || opts[opts.length - 1];
        prev.focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeDropdown();
        selected.focus();
      }
    });
  });

  document.addEventListener('click', () => {
    closeDropdown();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dd.classList.contains('open')) {
      closeDropdown();
    }
  });
}

/* ── SUCCESS 3D ANIMATION ──────────────────────────────── */
function showSuccess3DAnimation(messageText) {
  const existing = document.getElementById('success-3d-overlay');
  if (existing) {
    if (typeof existing.__cleanup === 'function') {
      existing.__cleanup();
    }
    existing.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = 'success-3d-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = '#05050a'; // Solid dark for best composite
  overlay.style.zIndex = '999999';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.8s ease-out';
  overlay.style.overflow = 'hidden';
  
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  overlay.appendChild(canvas);

  const textContainer = document.createElement('div');
  textContainer.style.position = 'absolute';
  textContainer.style.zIndex = '2';
  textContainer.style.bottom = '20%';
  textContainer.style.left = '50%';
  textContainer.style.transform = 'translateX(-50%) translateY(40px)';
  textContainer.style.opacity = '0';
  textContainer.style.color = '#fff';
  textContainer.style.fontFamily = '"Space Grotesk", var(--sans), sans-serif';
  textContainer.style.textAlign = 'center';
  textContainer.style.transition = 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
  
  const curLang = document.querySelector('.lang-btn.active')?.dataset.lang || 'uz';
  const curT = (typeof T !== 'undefined' && T[curLang]) || {};
  const subText = curT['toast_success_sub'] || 'Buyurtma qabul qilindi';

  textContainer.innerHTML = `
    <div style="font-size: clamp(28px, 5vw, 42px); font-weight: 700; letter-spacing: 3px; text-transform: uppercase; background: linear-gradient(135deg, #fff 0%, #4ade80 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0px 10px 30px rgba(74,222,128,0.2);">
      ${messageText}
    </div>
    <div style="margin-top: 15px; font-size: clamp(14px, 2vw, 16px); color: #a0a0a0; letter-spacing: 2px; font-weight: 300; display: flex; align-items: center; justify-content: center; gap: 10px;">
      <span style="display:inline-block; width: 6px; height: 6px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 12px 2px #4ade80; animation: pulse3d 2s infinite;"></span>
      <span>${subText}</span>
    </div>
    <style>
      @keyframes pulse3d { 0% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.5); } 100% { opacity: 0.5; transform: scale(1); } }
    </style>
  `;
  overlay.appendChild(textContainer);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
  });

  const ctx = canvas.getContext('2d', { alpha: false });
  let w, h, cx, cy;
  let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let isInit = true;

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    cx = w / 2;
    cy = h / 2 - 40;
    if (isInit) {
      mouse.x = cx;
      mouse.y = cy;
      mouse.targetX = cx;
      mouse.targetY = cy;
      isInit = false;
    }
  }
  window.addEventListener('resize', resize);
  resize();

  function onMouseMove(e) {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
  }
  window.addEventListener('mousemove', onMouseMove);
  
  function onTouchMove(e) {
    if(e.touches.length > 0) {
      mouse.targetX = e.touches[0].clientX;
      mouse.targetY = e.touches[0].clientY;
    }
  }
  window.addEventListener('touchmove', onTouchMove, { passive: true });

  // Galaxy Particles
  const particles = [];
  const particleCount = 2500;
  const arms = 5;
  const armSpread = 0.6;
  const colors = ['#4ade80', '#14b8a6', '#2dd4bf', '#ffffff', '#0f766e'];

  for (let i = 0; i < particleCount; i++) {
    const r = Math.random() * 450;
    const armAngle = (Math.floor(Math.random() * arms) * (Math.PI * 2)) / arms;
    const offset = (Math.random() - 0.5) * armSpread * r;
    const angle = armAngle + (r * 0.015) + offset / 100;

    particles.push({
      r: r,
      angle: angle,
      size: Math.random() * 1.5 + 0.5,
      speed: (Math.random() * 0.005 + 0.001) * (500 / (r + 50)),
      color: colors[Math.floor(Math.random() * colors.length)],
      baseY: (Math.random() - 0.5) * (1500 / (r + 10)),
      phase: Math.random() * Math.PI * 2
    });
  }

  // Core glow particle
  const coreParticles = [];
  for (let i = 0; i < 50; i++) {
    coreParticles.push({
      x: (Math.random() - 0.5) * 40,
      y: (Math.random() - 0.5) * 40,
      z: (Math.random() - 0.5) * 40,
      size: Math.random() * 3 + 1,
      color: '#4ade80',
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      speedZ: (Math.random() - 0.5) * 0.5
    });
  }

  let startTime = Date.now();
  let animationFrameId;
  const fov = 700;
  let isDestroyed = false;

  function animate() {
    if (isDestroyed) return;
    let now = Date.now();
    let elapsed = now - startTime;

    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Trail effect
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(5, 5, 10, 0.18)';
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'lighter';

    if (elapsed > 1000) {
      textContainer.style.opacity = '1';
      textContainer.style.transform = 'translateX(-50%) translateY(0)';
    }

    // Dynamic rotation based on mouse and time
    let rotX = (mouse.y - cy) * 0.0015 + Math.PI / 3;
    let rotY = elapsed * 0.0003 + (mouse.x - cx) * 0.0015;

    // Draw Core Particles
    for (let i = 0; i < coreParticles.length; i++) {
      const p = coreParticles[i];
      p.x += p.speedX; p.y += p.speedY; p.z += p.speedZ;
      // bound core
      if(p.x > 30 || p.x < -30) p.speedX *= -1;
      if(p.y > 30 || p.y < -30) p.speedY *= -1;
      if(p.z > 30 || p.z < -30) p.speedZ *= -1;

      let y1 = p.y * Math.cos(rotX) - p.z * Math.sin(rotX);
      let z1 = p.y * Math.sin(rotX) + p.z * Math.cos(rotX);
      let x1 = p.x * Math.cos(rotY) - z1 * Math.sin(rotY);
      z1 = p.x * Math.sin(rotY) + z1 * Math.cos(rotY);

      let zOffset = z1 + 600;
      if (zOffset < 1) zOffset = 1;
      let scale = fov / zOffset;
      let sx = x1 * scale + cx;
      let sy = y1 * scale + cy;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size * scale * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Galaxy Particles
    for (let i = 0; i < particleCount; i++) {
      const p = particles[i];
      p.angle += p.speed;
      
      let py = p.baseY + Math.sin(elapsed * 0.002 + p.phase) * 15;
      const px = Math.cos(p.angle) * p.r;
      const pz = Math.sin(p.angle) * p.r;

      let y1 = py * Math.cos(rotX) - pz * Math.sin(rotX);
      let z1 = py * Math.sin(rotX) + pz * Math.cos(rotX);
      let x1 = px * Math.cos(rotY) - z1 * Math.sin(rotY);
      z1 = px * Math.sin(rotY) + z1 * Math.cos(rotY);

      let zOffset = z1 + 600;
      if (zOffset < 1) zOffset = 1;

      let scale = fov / zOffset;
      let sx = x1 * scale + cx;
      let sy = y1 * scale + cy;

      const alpha = Math.min(1, Math.max(0, (1200 - zOffset) / 1000));
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha * (p.r < 100 ? 0.8 : 0.5);
      
      ctx.beginPath();
      ctx.arc(sx, sy, p.size * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    animationFrameId = requestAnimationFrame(animate);
  }
  animate();

  let cleanupTimer;
  let fadeOutTimer;

  function cleanup() {
    if (isDestroyed) return;
    isDestroyed = true;
    cancelAnimationFrame(animationFrameId);
    clearTimeout(cleanupTimer);
    clearTimeout(fadeOutTimer);
    window.removeEventListener('resize', resize);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('touchmove', onTouchMove);
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  overlay.__cleanup = cleanup;

  fadeOutTimer = setTimeout(() => {
    overlay.style.opacity = '0';
    cleanupTimer = setTimeout(() => {
      cleanup();
    }, 800);
  }, 6000);
}


