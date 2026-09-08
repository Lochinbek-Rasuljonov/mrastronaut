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

/* ── SUCCESS 3D ROCKET LAUNCH ANIMATION (GROUND LIFTOFF) ── */

/* ── SUCCESS 3D ROCKET LAUNCH ANIMATION (FROM EARTH) ── */
function showSuccess3DAnimation(messageText) {
  if (typeof THREE === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = () => initRocketLaunchAnimation(messageText);
    document.head.appendChild(script);
  } else {
    initRocketLaunchAnimation(messageText);
  }
}

function initRocketLaunchAnimation(messageText) {
  const existing = document.getElementById('success-3d-overlay');
  if (existing) {
    if (typeof existing.__cleanup === 'function') existing.__cleanup();
    existing.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = 'success-3d-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
    backgroundColor: '#05050a', zIndex: '999999', display: 'flex',
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    opacity: '0', transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)', overflow: 'hidden'
  });

  const canvasContainer = document.createElement('div');
  Object.assign(canvasContainer.style, {
    position: 'absolute', top: '0', left: '0', width: '100%', height: '100%'
  });
  overlay.appendChild(canvasContainer);

  const textContainer = document.createElement('div');
  Object.assign(textContainer.style, {
    position: 'absolute', zIndex: '2', bottom: '12%', left: '50%',
    transform: 'translateX(-50%) translateY(40px)', opacity: '0',
    color: '#fff', fontFamily: '"Space Grotesk", var(--sans), sans-serif',
    textAlign: 'center', transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
    pointerEvents: 'none', width: 'min(90%, 650px)'
  });
  
  const curLang = document.querySelector('.lang-btn.active')?.dataset.lang || 'uz';
  const curT = (typeof T !== 'undefined' && T[curLang]) || {};
  const subText = curT['toast_success_sub'] || 'Buyurtma qabul qilindi';

  textContainer.innerHTML = `
    <div style="font-size: clamp(22px, 4vw, 34px); font-weight: 700; letter-spacing: 2px; text-transform: uppercase; background: linear-gradient(135deg, #ffffff 0%, #c084fc 50%, #38bdf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0px 8px 24px rgba(192,132,252,0.35);">
      ${messageText}
    </div>
    <div style="margin-top: 12px; font-size: clamp(12px, 1.6vw, 14.5px); color: #94a3b8; letter-spacing: 1.5px; font-weight: 400; display: inline-flex; align-items: center; justify-content: center; gap: 10px; background: rgba(255,255,255,0.04); padding: 8px 20px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(12px);">
      <span style="display:inline-block; width: 8px; height: 8px; background: #38bdf8; border-radius: 50%; box-shadow: 0 0 12px 3px #38bdf8; animation: rocketPulse 1.5s infinite;"></span>
      <span>${subText} · Yer sharidan start berildi 🚀</span>
    </div>
    <style>@keyframes rocketPulse { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.4); } }</style>
  `;
  overlay.appendChild(textContainer);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => overlay.style.opacity = '1');

  // THREE.JS SETUP
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05050a, 0.0012);
  
  const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 32);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  canvasContainer.appendChild(renderer.domElement);

  const textureLoader = new THREE.TextureLoader();

  // 1. NEON EARTH GLOBE (At the bottom of the screen)
  const earthGroup = new THREE.Group();
  earthGroup.position.set(0, -17, 0);

  const earthTexture = textureLoader.load('assets/neon-earth.png');
  earthTexture.generateMipmaps = true;
  earthTexture.minFilter = THREE.LinearMipmapLinearFilter;

  const earthGeo = new THREE.PlaneGeometry(24, 24);
  const earthMat = new THREE.MeshBasicMaterial({
    map: earthTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const earthMesh = new THREE.Mesh(earthGeo, earthMat);
  earthGroup.add(earthMesh);

  // Atmospheric cyan halo ring around Earth
  const earthHaloGeo = new THREE.RingGeometry(11.8, 14.5, 64);
  const earthHaloMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  const earthHalo = new THREE.Mesh(earthHaloGeo, earthHaloMat);
  earthGroup.add(earthHalo);

  scene.add(earthGroup);

  // 2. ROCKET GROUP (Launches from Earth)
  const rocketGroup = new THREE.Group();
  rocketGroup.position.set(0, -6.5, 3); // Positioned directly on Earth's top horizon
  rocketGroup.scale.set(0.65, 0.65, 0.65);
  
  const rocketTexture = textureLoader.load('assets/neon-rocket.png');
  rocketTexture.generateMipmaps = true;
  rocketTexture.minFilter = THREE.LinearMipmapLinearFilter;

  const rocketGeo = new THREE.PlaneGeometry(14, 14);
  const rocketMat = new THREE.MeshBasicMaterial({
    map: rocketTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const rocketMesh = new THREE.Mesh(rocketGeo, rocketMat);
  rocketGroup.add(rocketMesh);

  // Glowing Telemetry Rings (Purple and Cyan)
  const ringMat1 = new THREE.MeshBasicMaterial({
    color: 0xa855f7, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending
  });
  const ringGeo1 = new THREE.TorusGeometry(7.2, 0.07, 16, 80);
  const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
  ring1.rotation.x = Math.PI / 2.3;
  rocketGroup.add(ring1);

  const ringMat2 = new THREE.MeshBasicMaterial({
    color: 0x38bdf8, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending
  });
  const ringGeo2 = new THREE.TorusGeometry(8.8, 0.05, 16, 80);
  const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
  ring2.rotation.x = -Math.PI / 2.6;
  rocketGroup.add(ring2);

  scene.add(rocketGroup);

  // 3. THRUSTER EXHAUST PARTICLES (Blasting downwards onto Earth)
  const exhaustCount = 450;
  const exhaustGeo = new THREE.BufferGeometry();
  const exhaustPos = new Float32Array(exhaustCount * 3);
  const exhaustColors = new Float32Array(exhaustCount * 3);
  const exhaustVels = [];

  for (let i = 0; i < exhaustCount; i++) {
    exhaustPos[i * 3] = (Math.random() - 0.5) * 1.4;
    exhaustPos[i * 3 + 1] = -5.2 - Math.random() * 6;
    exhaustPos[i * 3 + 2] = (Math.random() - 0.5) * 1.4;

    const isCyan = Math.random() > 0.25;
    exhaustColors[i * 3] = isCyan ? 0.2 : 0.75;
    exhaustColors[i * 3 + 1] = isCyan ? 0.85 : 0.35;
    exhaustColors[i * 3 + 2] = 1.0;

    exhaustVels.push({
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(Math.random() * 1.3 + 0.8),
      vz: (Math.random() - 0.5) * 0.35,
      life: Math.random() * 35
    });
  }

  exhaustGeo.setAttribute('position', new THREE.BufferAttribute(exhaustPos, 3));
  exhaustGeo.setAttribute('color', new THREE.BufferAttribute(exhaustColors, 3));

  const exhaustMat = new THREE.PointsMaterial({
    size: 1.3,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const exhaustMesh = new THREE.Points(exhaustGeo, exhaustMat);
  rocketGroup.add(exhaustMesh);

  // 4. VERTICAL WARP SPEED STARFIELD
  const starsCount = 2200;
  const starsGeo = new THREE.BufferGeometry();
  const starsPos = new Float32Array(starsCount * 3);
  const starsColors = new Float32Array(starsCount * 3);

  for (let i = 0; i < starsCount * 3; i += 3) {
    starsPos[i] = (Math.random() - 0.5) * 170;
    starsPos[i + 1] = (Math.random() - 0.5) * 190;
    starsPos[i + 2] = (Math.random() - 0.5) * 200 - 30;

    const rnd = Math.random();
    starsColors[i] = rnd > 0.5 ? 0.8 : 0.4;
    starsColors[i + 1] = rnd > 0.5 ? 0.6 : 0.85;
    starsColors[i + 2] = 1.0;
  }

  starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
  starsGeo.setAttribute('color', new THREE.BufferAttribute(starsColors, 3));

  const starsMat = new THREE.PointsMaterial({
    size: 0.7,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const starsMesh = new THREE.Points(starsGeo, starsMat);
  scene.add(starsMesh);

  // INTERACTIVE TILT
  let mouseX = 0, mouseY = 0;
  let targetTiltX = 0, targetTiltY = 0;

  const onMouseMove = (e) => {
    mouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
    mouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    targetTiltY = mouseX * 0.25;
    targetTiltX = -mouseY * 0.18;
  };
  window.addEventListener('mousemove', onMouseMove);

  const onTouchMove = (e) => {
    if (e.touches.length > 0) {
      mouseX = (e.touches[0].clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      mouseY = (e.touches[0].clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      targetTiltY = mouseX * 0.25;
      targetTiltX = -mouseY * 0.18;
    }
  };
  window.addEventListener('touchmove', onTouchMove, { passive: true });

  const resize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', resize);

  // ANIMATION LOOP
  let startTime = Date.now();
  let animationFrameId;
  let isDestroyed = false;

  function animate() {
    if (isDestroyed) return;
    animationFrameId = requestAnimationFrame(animate);

    const elapsed = Date.now() - startTime;

    // 1. STARFIELD DOWNWARD WARP
    const starPositions = starsGeo.attributes.position.array;
    let warpSpeed = Math.min(3.2, 0.4 + (elapsed * 0.0006));
    if (elapsed > 4500) {
      warpSpeed += (elapsed - 4500) * 0.015;
    }

    for (let i = 1; i < starsCount * 3; i += 3) {
      starPositions[i] -= warpSpeed;
      if (starPositions[i] < -95) {
        starPositions[i] += 190;
      }
    }
    starsGeo.attributes.position.needsUpdate = true;

    // 2. EARTH ROTATION & RECEDING DYNAMICS
    earthMesh.rotation.z -= 0.0018;
    earthHalo.rotation.z += 0.001;

    // 3. ROCKET LIFTOFF FROM EARTH
    if (elapsed < 1800) {
      // Liftoff Phase: Rocket powers up from Earth's curve to center
      const t = Math.min(1, elapsed / 1800);
      const easeOut = 1 - Math.pow(1 - t, 3);
      
      // Rocket rises from -6.5 to +1.5
      rocketGroup.position.y = -6.5 + easeOut * 8.0;
      const curScale = 0.65 + easeOut * 0.45;
      rocketGroup.scale.set(curScale, curScale, curScale);

      // Earth gently descends as camera follows rocket into orbit
      earthGroup.position.y = -17 - (easeOut * 4.5);
    } else if (elapsed < 4500) {
      // Orbital Cruise Phase: Hover and display HUD
      const cruiseElapsed = elapsed - 1800;
      const hoverY = Math.sin(cruiseElapsed * 0.003) * 0.7;
      rocketGroup.position.y = 1.5 + hoverY;
      rocketGroup.scale.set(1.1, 1.1, 1.1);

      earthGroup.position.y = -21.5 + Math.sin(cruiseElapsed * 0.0015) * 0.3;

      textContainer.style.opacity = '1';
      textContainer.style.transform = 'translateX(-50%) translateY(0)';
    } else {
      // Hyperspace Escape Phase: Rocket accelerates out of screen
      const boostElapsed = elapsed - 4500;
      const boostY = Math.pow(boostElapsed * 0.02, 2.2);
      rocketGroup.position.y += boostY * 0.16;
      rocketGroup.scale.y += 0.022; // Warp elongation effect
      earthGroup.position.y -= boostY * 0.04;
    }

    // Aerodynamic tilt
    rocketGroup.rotation.y += (targetTiltY - rocketGroup.rotation.y) * 0.08;
    rocketGroup.rotation.x += (targetTiltX - rocketGroup.rotation.x) * 0.08;
    rocketGroup.rotation.z = -targetTiltY * 0.45 + Math.sin(elapsed * 0.004) * 0.025;

    // Telemetry rings
    ring1.rotation.z += 0.025;
    ring2.rotation.z -= 0.018;

    // 4. THRUSTER EXHAUST PARTICLES
    const exPos = exhaustGeo.attributes.position.array;
    for (let i = 0; i < exhaustCount; i++) {
      const idx = i * 3;
      const vel = exhaustVels[i];

      exPos[idx] += vel.vx;
      exPos[idx + 1] += vel.vy;
      exPos[idx + 2] += vel.vz;
      vel.life++;

      if (vel.life > 32 || exPos[idx + 1] < -20) {
        exPos[idx] = (Math.random() - 0.5) * 1.1;
        exPos[idx + 1] = -5.0;
        exPos[idx + 2] = (Math.random() - 0.5) * 1.1;
        vel.vy = -(Math.random() * 1.4 + 0.9);
        vel.life = 0;
      }
    }
    exhaustGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }
  animate();

  let cleanupTimer, fadeOutTimer;
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

    renderer.dispose();
    rocketGeo.dispose();
    rocketMat.dispose();
    if (rocketTexture) rocketTexture.dispose();
    earthGeo.dispose();
    earthMat.dispose();
    earthHaloGeo.dispose();
    earthHaloMat.dispose();
    if (earthTexture) earthTexture.dispose();
    ringGeo1.dispose();
    ringMat1.dispose();
    ringGeo2.dispose();
    ringMat2.dispose();
    exhaustGeo.dispose();
    exhaustMat.dispose();
    starsGeo.dispose();
    starsMat.dispose();
  }
  overlay.__cleanup = cleanup;

  fadeOutTimer = setTimeout(() => {
    overlay.style.opacity = '0';
    cleanupTimer = setTimeout(cleanup, 800);
  }, 5800);
}
