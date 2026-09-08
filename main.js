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

function showToast(isSuccess=true, customMsg=null, actionUrl=null){
  if(!toast)return;
  const curLang=document.querySelector('.lang-btn.active')?.dataset.lang||'uz';
  const curT=(typeof T!=='undefined'&&T[curLang])||{};
  const iconEl=toast.querySelector('.toast-icon')||toast.querySelector('span:first-child');
  const textEl=toast.querySelector('.toast-text')||toast.querySelector('span:last-child');

  const oldAction = toast.querySelector('.toast-action-btn');
  if(oldAction) oldAction.remove();

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
      textEl.textContent=customMsg || curT['toast_err']||(typeof T!=='undefined'&&T.uz&&T.uz['toast_err'])||'Xatolik yuz berdi. Iltimos, qayta urinib koʻring yoki toʻgʻridan-toʻgʻri Telegram orqali yozing.';
    }
    if(actionUrl){
      const actBtn = document.createElement('a');
      actBtn.className = 'toast-action-btn';
      actBtn.href = actionUrl;
      actBtn.target = '_blank';
      actBtn.rel = 'noopener noreferrer';
      actBtn.setAttribute('aria-label', 'Telegram orqali toʻgʻridan-toʻgʻri yozish');
      actBtn.innerHTML = '<i class="fa-brands fa-telegram"></i> <span>Telegram</span>';
      toast.appendChild(actBtn);
    }
  }

  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.remove('show'), actionUrl ? 10000 : 4500);
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

    // Prepare direct Telegram fallback URL in case backend is protected by Vercel SSO or unavailable
    const tgPrefill = encodeURIComponent(
      `Assalomu alaykum!\n\n` +
      `Ism: ${name}\n` +
      `Aloqa: ${contact}\n` +
      `Xizmat: ${service}\n` +
      `Byudjet: ${budget}\n\n` +
      `Loyiha haqida:\n${msg}`
    );
    const fallbackTgUrl = `https://t.me/REDACTED?text=${tgPrefill}`;

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
        customErrorMsg = 'Vercel Deployment Protection (SSO) faol. Iltimos, Telegram orqali yuboring.';
        isOk = false;
      } else if (resp.status === 401 || resp.status === 403) {
        customErrorMsg = 'Ruxsat berilmagan (Vercel himoyasi faol). Iltimos, Telegram orqali yuboring.';
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
          customErrorMsg = 'Serverdan kutilmagan javob keldi (Vercel SSO yoki xavfsizlik sahifasi). Telegram orqali yuboring.';
          isOk = false;
        }
      } else {
        if (ct.includes('application/json')) {
          const errData = await resp.json().catch(() => null);
          customErrorMsg = errData?.error || 'Server xatosi yuz berdi.';
        } else if (ct.includes('text/html')) {
          customErrorMsg = 'Server javob bermadi (Vercel SSO yoki notoʻgʻri marshrut). Telegram orqali yuboring.';
        } else {
          customErrorMsg = `Xatolik yuz berdi (Status: ${resp.status}). Telegram orqali yuboring.`;
        }
        isOk = false;
      }
    } catch(err) {
      console.error('Telegram dispatch error:', err);
      if (err.name === 'AbortError') {
        customErrorMsg = 'Soʻrov vaqti tugadi (Timeout). Iltimos, qayta urinib koʻring yoki Telegram orqali yozing.';
      } else {
        customErrorMsg = 'Tarmoq xatosi yuz berdi. Iltimos, Telegram orqali toʻgʻridan-toʻgʻri yozing.';
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
        customErrorMsg = curT['toast_err'] || (typeof T !== 'undefined' && T.uz && T.uz['toast_err']) || 'Xatolik yuz berdi. Iltimos, qayta urinib koʻring yoki toʻgʻridan-toʻgʻri Telegram orqali yozing.';
      }
      showToast(false, customErrorMsg, fallbackTgUrl);
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
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'success-3d-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(10, 10, 15, 0.95)';
  overlay.style.backdropFilter = 'blur(10px)';
  overlay.style.zIndex = '999999';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.6s ease-out';
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
  textContainer.style.transform = 'translateX(-50%) translateY(30px)';
  textContainer.style.opacity = '0';
  textContainer.style.color = '#fff';
  textContainer.style.fontFamily = '"Space Grotesk", var(--sans), sans-serif';
  textContainer.style.textAlign = 'center';
  textContainer.style.transition = 'all 1s cubic-bezier(0.16, 1, 0.3, 1)';
  
  textContainer.innerHTML = `
    <div style="font-size: clamp(24px, 4vw, 36px); font-weight: 700; letter-spacing: 2px; text-transform: uppercase; background: linear-gradient(135deg, #fff 0%, #aaa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0px 4px 20px rgba(255,255,255,0.1);">
      ${messageText}
    </div>
    <div style="margin-top: 15px; font-size: clamp(14px, 2vw, 16px); color: #888; letter-spacing: 1px; font-weight: 300; display: flex; align-items: center; justify-content: center; gap: 8px;">
      <span style="display:inline-block; width: 8px; height: 8px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 10px #4ade80;"></span>
      <span>Tizim qabul qildi</span>
    </div>
  `;
  overlay.appendChild(textContainer);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
  });

  const ctx = canvas.getContext('2d', { alpha: false });
  let w, h, cx, cy;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    cx = w / 2;
    cy = h / 2 - 40;
  }
  window.addEventListener('resize', resize);
  resize();

  const numParticles = 300;
  const particles = [];
  
  for (let i = 0; i < numParticles; i++) {
    let tx, ty, tz;
    
    if (Math.random() < 0.35) {
      // Short leg of checkmark
      let t = Math.random();
      tx = -40 + t * 25;
      ty = -10 + t * 40;
    } else {
      // Long leg of checkmark
      let t = Math.random();
      tx = -15 + t * 75;
      ty = 30 - t * 70;
    }

    // Volume noise
    tx += (Math.random() - 0.5) * 15;
    ty += (Math.random() - 0.5) * 15;
    tz = (Math.random() - 0.5) * 15;

    let ix = (Math.random() - 0.5) * 3000;
    let iy = (Math.random() - 0.5) * 3000;
    let iz = (Math.random() - 0.5) * 3000 + 1000;

    particles.push({
      x: ix, y: iy, z: iz,
      ox: ix, oy: iy, oz: iz,
      tx: tx, ty: ty, tz: tz,
      baseColor: Math.random() > 0.4 ? '#4ade80' : '#10b981',
      size: Math.random() * 2 + 1,
      delay: Math.random() * 800,
      sx: 0, sy: 0, scale: 0, t: 0
    });
  }

  let startTime = Date.now();
  let animationFrameId;
  const fov = 400;

  function animate() {
    let now = Date.now();
    let elapsed = now - startTime;

    // Dark bg with motion blur effect
    ctx.fillStyle = 'rgba(10, 10, 15, 0.3)';
    ctx.fillRect(0, 0, w, h);

    if (elapsed > 1200) {
      textContainer.style.opacity = '1';
      textContainer.style.transform = 'translateX(-50%) translateY(0)';
    }

    // Sort by Z for painters algorithm
    particles.sort((a, b) => b.z - a.z);

    // Global rotation to rotate the entire checkmark in 3D space
    // Smoothly settle to a slight tilt
    let rotEase = Math.min(1, elapsed / 2500);
    let rotX = Math.sin(elapsed * 0.001) * 0.2 * (1 - rotEase);
    let rotY = elapsed * 0.002 * (1 - rotEase) + Math.sin(elapsed * 0.0005) * 0.3;

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.15)';
    ctx.lineWidth = 1.5;

    for (let i = 0; i < particles.length; i++) {
      let p = particles[i];

      // Morphing interpolation
      let t = Math.max(0, Math.min(1, (elapsed - p.delay) / 1500));
      t = 1 - Math.pow(1 - t, 3); // ease-out cubic
      p.t = t;

      p.x = p.ox + (p.tx - p.ox) * t;
      p.y = p.oy + (p.ty - p.oy) * t;
      p.z = p.oz + (p.tz - p.oz) * t;

      // Slight wobble to make it feel alive
      let wobbleX = Math.sin(elapsed * 0.002 + i) * 3 * t;
      let wobbleY = Math.cos(elapsed * 0.002 + i) * 3 * t;

      let rx = p.x + wobbleX;
      let ry = p.y + wobbleY;
      let rz = p.z;

      // Apply rotations
      let rpx = rx * Math.cos(rotY) - rz * Math.sin(rotY);
      let rpz = rx * Math.sin(rotY) + rz * Math.cos(rotY);
      
      let finalY = ry * Math.cos(rotX) - rpz * Math.sin(rotX);
      let finalZ = ry * Math.sin(rotX) + rpz * Math.cos(rotX);
      let finalX = rpx;

      finalZ += 250; // Distance from camera

      if (finalZ < 1) finalZ = 1;

      let scale = fov / finalZ;
      p.scale = scale;
      p.sx = finalX * scale + cx;
      p.sy = finalY * scale + cy;

      let alpha = Math.min(1, scale * 1.5);
      
      // Connection lines
      if (t > 0.8 && i < particles.length - 2 && i % 2 === 0) {
         let p2 = particles[i + 1];
         let d = Math.hypot(p.tx - p2.tx, p.ty - p2.ty, p.tz - p2.tz);
         if (d < 25) {
            ctx.moveTo(p.sx, p.sy);
            ctx.lineTo(p2.sx, p2.sy);
         }
      }

      if (alpha > 0.05) {
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, p.size * scale, 0, Math.PI * 2);
        if (t > 0.9) {
           ctx.fillStyle = p.baseColor;
           ctx.shadowBlur = 15;
           ctx.shadowColor = p.baseColor;
        } else {
           ctx.fillStyle = `rgba(107, 114, 128, ${alpha})`;
           ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0; // reset for next
      }
    }
    
    // Draw all connections in one stroke for performance
    ctx.stroke();

    animationFrameId = requestAnimationFrame(animate);
  }
  animate();

  setTimeout(() => {
    overlay.style.opacity = '0';
    setTimeout(() => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 600);
  }, 5000);
}
