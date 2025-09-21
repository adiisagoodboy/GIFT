/* ============================
   CONFIG (edit only here)
============================ */
const TEST_MODE = false; // set true to unlock quickly for testing (30 sec)
const AUTH_USERNAME = "kunji";
const AUTH_PASSWORD = "bday";

// Exact unlock date & time (Asia/Kolkata) - edit these to the desired date/time
const UNLOCK_YEAR  = 2025;    // e.g. 2025
const UNLOCK_MONTH = 9;       // 1..12 (September = 9)
const UNLOCK_DATE  = 22;      // day of month
const UNLOCK_HOUR  = 0;       // 1-12 human friendly
const UNLOCK_MIN   = 0;
const UNLOCK_AMPM  = "AM";    // "AM" or "PM"

// Video settings
const VIDEO_MODE = "drive"; // "drive" or "youtube"
const YT_VIDEO_ID = "REPLACE_WITH_YOUTUBE_VIDEO_ID";
const DRIVE_FILE_ID = "1K4eSyBg9_yUMyxKIgUhBN0c8zx1GSXE2";

/* Performance tunables */
const PARTICLE_COUNT = 70;
const SPARKLE_COUNT = 18;
/* ============================ */

/* ---- utilities ---- */
function to24Hour(h12, ampm){
  let h = Number(h12) % 12;
  if (ampm === "PM") h += 12;
  return h;
}
function pad(n){ return String(n).padStart(2,'0'); }

/* ---- DOM refs ---- */
const canvas = document.getElementById('bgCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

const statusText = document.getElementById('statusText');
const opensText = document.getElementById('opensText');
const hintText = document.getElementById('hintText');
const door = document.getElementById('door');
const doorLabel = document.getElementById('doorLabel');
const loginBtn = document.getElementById('loginBtn');
const userInput = document.getElementById('userInput');
const passInput = document.getElementById('passInput');
const msgInfo = document.getElementById('msgInfo');
const msgSuccess = document.getElementById('msgSuccess');
const msgErr = document.getElementById('msgErr');
const videoWrap = document.getElementById('videoWrap');
const portalRing = document.getElementById('portalRing');

let unlocked = false;
let lastServerNow = null;

/* ---- time logic ---- */
async function fetchServerTime(){
  try{
    const r = await fetch('https://worldtimeapi.org/api/timezone/Asia/Kolkata',{cache:'no-store'});
    if(!r.ok) throw new Error('time api');
    const d = await r.json();
    lastServerNow = new Date(d.datetime);
    return lastServerNow;
  }catch(e){
    // fallback to local if API fails
    lastServerNow = new Date();
    return lastServerNow;
  }
}

/**
 * Build a concrete target Date object using the exact config (year,month,date,hour,minute,ampm)
 * Note: UNLOCK_MONTH is 1-based in the config but JS Date expects 0-based months.
 */
function buildTarget(){
  const hour24 = to24Hour(UNLOCK_HOUR, UNLOCK_AMPM);
  const target = new Date(
    UNLOCK_YEAR,
    UNLOCK_MONTH - 1,
    UNLOCK_DATE,
    hour24,
    UNLOCK_MIN,
    0,
    0
  );
  return target;
}

function msToCountdown(d){
  const s = Math.floor((d/1000)%60);
  const m = Math.floor((d/1000/60)%60);
  const h = Math.floor(d/1000/60/60);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

async function updateLoop(){
  if(TEST_MODE){
    const now = new Date();
    const target = new Date(now.getTime() + 30000);
    const diff = target - now;
    if(diff <= 0){ if(!unlocked) unlockGift(); if(statusText) statusText.textContent='Unlocked'; if(opensText) opensText.textContent='Test mode'; }
    else { if(statusText) statusText.textContent = msToCountdown(diff); if(opensText) opensText.textContent = `unlocking soon..wait period is coming to an end`; }
    setTimeout(updateLoop,1000);
    return;
  }

  const now = await fetchServerTime();
  const target = buildTarget();
  const diff = target - now;

  try {
    const opts = { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:true, timeZone: 'Asia/Kolkata' };
    if(opensText) opensText.textContent = `Unlocking at ${target.toLocaleString('en-IN', opts)} (Asia/Kolkata)`;
  } catch(e) {
    if(opensText) opensText.textContent = `Wait karo kunji , bas aur ${pad(UNLOCK_HOUR)}:${pad(UNLOCK_MIN)} ${UNLOCK_AMPM} (Asia/Kolkata)`;
  }

  if(diff <= 0){
    if(!unlocked) unlockGift();
    if(statusText) statusText.textContent = 'Unlocked';
    if(hintText) hintText.textContent = 'Type the magic words ✨';
  } else {
    unlocked = false;
    if(statusText) statusText.textContent = msToCountdown(diff);
  }

  setTimeout(updateLoop, 1000);
}

/* ---- messages ---- */
function clearMsgs(){ 
  if(msgInfo) msgInfo.style.display = 'none';
  if(msgSuccess) msgSuccess.style.display = 'none';
  if(msgErr) msgErr.style.display = 'none';
}
function showMsg(type, text, t=4200){
  clearMsgs();
  let el = null;
  if(type === 'info') el = msgInfo;
  else if(type === 'success') el = msgSuccess;
  else el = msgErr;
  if(!el){
    console.log(type, text);
    return;
  }
  el.textContent = text;
  el.style.display = 'block';
  el.classList.add('show');
  if(t>0) setTimeout(()=>{ el.classList.remove('show'); el.style.display='none'; }, t);
}

/* ---- login ---- */
if(loginBtn){
  loginBtn.addEventListener('click', async () => {
    await fetchServerTime();
    const u = userInput ? userInput.value.trim() : '';
    const p = passInput ? passInput.value : '';
    if(!u || !p){ showMsg('error','Dono bharo cutu 💕'); return; }
    if(u !== AUTH_USERNAME || p !== AUTH_PASSWORD){ showMsg('error','Try again bacha — galat password hai 🥺'); return; }
    const now = lastServerNow || new Date(); const target = buildTarget(); const diff = target - now;
    if(diff > 0){ showMsg('info', `Thoda ruko meri jaan — gift unlocks in ${msToCountdown(diff)} ⏳`); return; }
    showMsg('success','Welcome cutuuu — opening gift ✨',1200);
    setTimeout(onLoginSuccess,700);
  });
}

function onLoginSuccess(){
  try { 
    sessionStorage.setItem('portal_unlocked','1');
    sessionStorage.setItem('gift_unlocked','1');
  } catch(e) {}
  unlockGiftEffects();
  setTimeout(()=> {
    window.location.href = 'bday.html';
  }, 900);
}

/* ---- unlock effects ---- */
function unlockGift(){
  unlocked = true;
  if(door) door.style.transform = 'scale(0.96) rotate(3deg)';
  if(doorLabel) doorLabel.textContent = '🎁 Birthday gift is ready ✨';
  if(portalRing) portalRing.style.opacity = '0.18';
}
function unlockGiftEffects(){
  unlockGift();
  releaseHearts(20);
  burstConfetti();
  playChime();
}

/* ---- video ---- */
function showVideo(){
  if(!videoWrap) return;
  videoWrap.style.display = 'block';
  if(VIDEO_MODE === 'youtube'){
    if(!YT_VIDEO_ID || YT_VIDEO_ID.includes('REPLACE')) { videoWrap.innerHTML = `<div style="padding:14px;border-radius:10px;background:#fff">Set YT_VIDEO_ID</div>`; return; }
    const src = `https://www.youtube.com/embed/${YT_VIDEO_ID}?autoplay=1&mute=0&rel=0&modestbranding=1&playsinline=1`;
    videoWrap.innerHTML = `<iframe src="${src}" title="Birthday Video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  } else if(VIDEO_MODE === 'drive'){
    if(!DRIVE_FILE_ID || DRIVE_FILE_ID.includes('REPLACE')) { videoWrap.innerHTML = `<div style="padding:14px;border-radius:10px;background:#fff">Set DRIVE_FILE_ID</div>`; return; }
    const direct = `https://drive.google.com/uc?export=download&id=${DRIVE_FILE_ID}`;
    videoWrap.innerHTML = `<video controls autoplay playsinline><source src="${direct}" type="video/mp4"></video>`;
  } else videoWrap.innerHTML = `<div style="padding:14px;border-radius:10px;background:#fff">No video configured</div>`;
}

/* ---- celebratory visuals ---- */
function releaseHearts(n=12){
  for(let i=0;i<n;i++){
    const el = document.createElement('div');
    el.className = 'floating-heart';
    el.textContent = ['💖','💗','💕','🎈'][Math.floor(Math.random()*4)];
    el.style.left = (10 + Math.random()*80) + '%';
    el.style.fontSize = `${14 + Math.random()*18}px`;
    el.style.position = 'fixed';
    el.style.bottom = '-10px';
    el.style.pointerEvents = 'none';
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), 5200);
  }
}
function burstConfetti(){
  for(let i=0;i<40;i++){
    const el = document.createElement('div');
    el.className = 'confetti';
    el.style.left = Math.random()*100+'%';
    el.style.background = `hsl(${Math.random()*360},80%,60%)`;
    el.style.animationDuration = 2+Math.random()*3+'s';
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), 4000);
  }
}
function playChime(){
  try{
    const a = new Audio();
    a.src = 'data:audio/mp3;base64,//uQZAAAAAAAAAAAA';
    a.play().catch(()=>{});
  }catch(e){}
}

/* ---- confetti CSS injection ---- */
const confettiStyle = document.createElement('style');
confettiStyle.textContent = `
.confetti{position:fixed;top:0;width:8px;height:14px;opacity:0.9;animation:fall linear forwards;z-index:9999;}
@keyframes fall{to{transform:translateY(100vh) rotateZ(360deg);opacity:0;}}
`;
document.head.appendChild(confettiStyle);

/* ---- animated background (canvas) ---- */
let W=0,H=0;
function resize(){
  if(!canvas) return;
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize); resize();

class Particle {
  constructor(){ this.reset(); }
  reset(){ this.x = Math.random()*W; this.y = H + Math.random()*200; this.vx = (Math.random()-0.5)*0.25; this.vy = - (0.6 + Math.random()*1.1); this.size = 2 + Math.random()*10; this.alpha = 0.06 + Math.random()*0.22; this.hue = 320 + Math.random()*40; }
  step(dt){ this.x += this.vx*dt; this.y += this.vy*dt; this.alpha -= 0.00035*dt; if(this.y < -60 || this.alpha <= 0) this.reset(); }
  draw(){ if(!ctx) return; const g = ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.size); g.addColorStop(0, `hsla(${this.hue},86%,94%,${this.alpha})`); g.addColorStop(1, `hsla(${this.hue},86%,70%,0)`); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,Math.PI*2); ctx.fill(); }
}
class Twinkle {
  constructor(){ this.reset(); }
  reset(){ this.x = (W/2 - 120) + (Math.random()-0.5)*260; this.y = (H/2 - 40) + (Math.random()-0.5)*180; this.size = 1 + Math.random()*5; this.phase = Math.random()*Math.PI*2; this.hue = 320 + Math.random()*40; this.speed = 0.003 + Math.random()*0.01; }
  step(dt){ this.phase += this.speed * dt; }
  draw(){ if(!ctx) return; const a = 0.25 + Math.sin(this.phase)*0.36; ctx.fillStyle = `hsla(${this.hue},82%,90%,${a})`; ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,Math.PI*2); ctx.fill(); }
}

const particles = Array.from({length: Math.max(30, PARTICLE_COUNT)}, () => new Particle());
const twinkles = Array.from({length: Math.max(8, SPARKLE_COUNT)}, () => new Twinkle());

let last = performance.now();
function frame(now){
  if(!ctx) return;
  const dt = Math.min(60, now - last); last = now;
  ctx.clearRect(0,0,W,H);

  // subtle transparent background (removed the big blurred halo)
  ctx.fillStyle = 'rgba(255,245,249,0.06)';
  ctx.fillRect(0,0,W,H);

  particles.forEach(p => { p.step(dt); p.draw(); });
  twinkles.forEach(tw => { tw.step(dt); tw.draw(); });

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---- start everything ---- */
(function init(){
  const targetPreview = buildTarget();
  try {
    const opts = { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:true, timeZone: 'Asia/Kolkata' };
    if(opensText) opensText.textContent = `Opens at ${targetPreview.toLocaleString('en-IN', opts)} (Asia/Kolkata)`;
  } catch (e) {
    if(opensText) opensText.textContent = `Opens at ${pad(UNLOCK_HOUR)}:${pad(UNLOCK_MIN)} ${UNLOCK_AMPM} (Asia/Kolkata)`;
  }

  if(door) { door.style.transform = 'scale(.98)'; setTimeout(()=> door.style.transform = 'scale(1)', 200); }

  if(TEST_MODE) {
    showMsg('info','Test mode active: unlocking in ~30s',2500);
  }
  updateLoop();
})();

