// ---------- Router ----------
const routes = ["home","study","mock","prep","checklist","pro"];
const views = Object.fromEntries(routes.map(id => [id, document.getElementById(id)]));

function show(route){
  routes.forEach(r => views[r].classList.toggle("hidden", r !== route));
  window.scrollTo({top:0, behavior:"smooth"});
}
function handleRoute(){
  const route = (location.hash.replace("#","") || "home");
  show(routes.includes(route) ? route : "home");
}
window.addEventListener("hashchange", handleRoute);
document.querySelectorAll("[data-route]").forEach(a => a.addEventListener("click", e=>{
  const href = e.currentTarget.getAttribute("href");
  if(href?.startsWith("#")) e.preventDefault(), location.hash = href;
}));
document.getElementById("year").textContent = new Date().getFullYear();
handleRoute();

// ---------- Study Room: Pomodoro ----------
let duration = 25 * 60;       // seconds
let remaining = duration;
let ticking = null;

const timerText = document.getElementById("timerText");
const affirm = document.getElementById("affirm");

const AFFIRMS = [
  "You’ve got this. One small block at a time.",
  "Deep focus = fast progress.",
  "Future you is proud you started.",
  "Consistency beats intensity."
];

function fmt(sec){
  const m = Math.floor(sec/60).toString().padStart(2,"0");
  const s = Math.floor(sec%60).toString().padStart(2,"0");
  return `${m}:${s}`;
}
function paintTimer(){ timerText.textContent = fmt(remaining); }

function startTimer(){
  if(ticking) return;
  ticking = setInterval(()=>{
    remaining = Math.max(0, remaining - 1);
    paintTimer();
    if(remaining === 0){ clearInterval(ticking); ticking = null; alert("Focus block complete! Take a short break."); }
  }, 1000);
}
function pauseTimer(){ if(ticking){ clearInterval(ticking); ticking = null; } }
function resetTimer(){ pauseTimer(); remaining = duration; paintTimer(); }

document.querySelectorAll("[data-timer]").forEach(b=>{
  b.addEventListener("click", ()=>{
    duration = Number(b.dataset.timer) * 60;
    remaining = duration; paintTimer();
  });
});
document.getElementById("startTimer").onclick = startTimer;
document.getElementById("pauseTimer").onclick = pauseTimer;
document.getElementById("resetTimer").onclick = resetTimer;
setInterval(()=>{ affirm.textContent = AFFIRMS[Math.floor(Math.random()*AFFIRMS.length)]; }, 15000);

// ---------- Mock Exam: Tabs ----------
const tabBtns = document.querySelectorAll(".tab");
const tabViews = { flash: document.getElementById("flash"), quiz: document.getElementById("quizTab") };
tabBtns.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    tabBtns.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const k = btn.dataset.tab;
    Object.keys(tabViews).forEach(x=>tabViews[x].classList.toggle("hidden", x!==k));
  });
});

// ---------- Flashcards ----------
const CARDS = [
  {term:"Fiduciary Duties", def:"Obedience, Loyalty, Disclosure, Confidentiality, Accounting, Reasonable care."},
  {term:"Exclusive Right-to-Sell", def:"Listing where the broker is paid regardless of who procures the buyer."},
  {term:"Consideration", def:"Something of value exchanged; required for a valid contract."},
  {term:"Dual Agency", def:"Agent represents both buyer and seller; requires disclosure & consent."},
  {term:"Fixtures", def:"Personal property that has become real property by attachment/adaptation/intent."}
];
let cIdx = 0, flipped = false;
const flashTerm = document.getElementById("flashTerm");
const flashDef  = document.getElementById("flashDef");
function paintCard(){
  flashTerm.textContent = CARDS[cIdx].term;
  flashDef.textContent  = CARDS[cIdx].def;
  flashTerm.classList.toggle("hidden", flipped);
  flashDef.classList.toggle("hidden", !flipped);
}
document.getElementById("flipCard").onclick = ()=>{ flipped = !flipped; paintCard(); };
document.getElementById("prevCard").onclick = ()=>{ cIdx = (cIdx-1+CARDS.length)%CARDS.length; flipped=false; paintCard(); };
document.getElementById("nextCard").onclick = ()=>{ cIdx = (cIdx+1)%CARDS.length; flipped=false; paintCard(); };
paintCard();

// ---------- Mock Quiz (upgraded) ----------
const QUESTIONS = [
  { q: "Which duty protects a client’s private financial info?", opts:["Disclosure","Confidentiality","Accounting","Obedience"], answer:1, why:"Confidentiality means keeping the client’s private information private." },
  { q: "Which listing gives strongest commission protection to the broker?", opts:["Open","Net","Exclusive Agency","Exclusive Right-to-Sell"], answer:3, why:"Exclusive right-to-sell pays even if the seller finds the buyer." },
  { q: "A valid contract must include:", opts:["Earnest money","Consideration","Witnesses","Notary"], answer:1, why:"Consideration is required; others may not be." },
  { q: "Fixtures are typically transferred:", opts:["As personal property","With the real property","Only by separate bill of sale","Never"], answer:1, why:"Fixtures run with the real estate unless excluded." }
];
let idx = 0, selections = new Array(QUESTIONS.length).fill(null);

const quizDiv = document.getElementById("quiz");
const prevBtn = document.getElementById("prevQ");
const nextBtn = document.getElementById("nextQ");
const submitBtn = document.getElementById("submitQ");
const scoreP = document.getElementById("score");

function renderQ(){
  const item = QUESTIONS[idx];
  quizDiv.innerHTML = `
    <p><strong>Q${idx+1}.</strong> ${item.q}</p>
    ${item.opts.map((o,i)=>`
      <label class="row">
        <input type="radio" name="opt" value="${i}" ${selections[idx]===i?"checked":""}/>
        <span>${o}</span>
      </label>`).join("")}
    <p class="muted">Question ${idx+1} of ${QUESTIONS.length}</p>
  `;
  prevBtn.disabled = idx===0;
  nextBtn.disabled = idx===QUESTIONS.length-1;
}
quizDiv.addEventListener("change", e=>{
  if(e.target.name==="opt") selections[idx] = Number(e.target.value);
});
prevBtn.onclick = ()=>{ idx=Math.max(0,idx-1); renderQ(); }
nextBtn.onclick = ()=>{ idx=Math.min(QUESTIONS.length-1,idx+1); renderQ(); }
submitBtn.onclick = ()=>{
  let correct = 0;
  QUESTIONS.forEach((q,i)=>{ if(selections[i]===q.answer) correct++; });
  const pct = Math.round(100*correct/QUESTIONS.length);
  scoreP.textContent = `Score: ${correct}/${QUESTIONS.length} (${pct}%).`;
  quizDiv.innerHTML += `<div class="note"><h4>Why:</h4><ol>${
    QUESTIONS.map(q=>`<li>${q.why}</li>`).join("")
  }</ol></div>`;
};
renderQ();

// ---------- Checklist (localStorage) ----------
const TASK_KEY = "relab_tasks_v1";
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const clearBtn = document.getElementById("clearTasks");

function loadTasks(){ return JSON.parse(localStorage.getItem(TASK_KEY) || "[]"); }
function saveTasks(t){ localStorage.setItem(TASK_KEY, JSON.stringify(t)); }
function paintTasks(){
  const tasks = loadTasks();
  taskList.innerHTML = tasks.map((t,i)=>`
    <li>
      <input type="checkbox" ${t.done?"checked":""} data-i="${i}">
      <span ${t.done?'style="text-decoration:line-through; color:#768"':''}>${t.text}</span>
    </li>`).join("");
}
taskForm?.addEventListener("submit", e=>{
  e.preventDefault();
  const text = taskInput.value.trim();
  if(!text) return;
  const tasks = loadTasks(); tasks.push({text, done:false}); saveTasks(tasks);
  taskInput.value=""; paintTasks();
});
taskList?.addEventListener("change", e=>{
  if(e.target.type==="checkbox"){
    const i = Number(e.target.dataset.i);
    const tasks = loadTasks(); tasks[i].done = e.target.checked; saveTasks(tasks); paintTasks();
  }
});
clearBtn?.addEventListener("click", ()=>{ localStorage.removeItem(TASK_KEY); paintTasks(); });
paintTasks();
   
