// Simple hash-router
const routes = ["home","study","mock","prep","checklist"];
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

// Mock quiz
const QUESTIONS = [
  {
    q: "Which duty requires keeping a client’s financial info private?",
    opts: ["Disclosure","Confidentiality","Accounting","Obedience"],
    answer: 1,
    why: "Confidentiality protects the client’s private information."
  },
  {
    q: "Which listing gives the broker the most protection for commission?",
    opts: ["Open listing","Net listing","Exclusive agency","Exclusive right-to-sell"],
    answer: 3,
    why: "Exclusive right-to-sell pays the listing broker regardless of who procures the buyer."
  },
  {
    q: "A contract must include which element to be valid?",
    opts: ["Earnest money","Consideration","Witnesses","Notary"],
    answer: 1,
    why: "Consideration is required; the others are not necessarily required."
  }
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
  // show rationales
  quizDiv.innerHTML += `<div class="note"><h4>Why:</h4><ol>${
    QUESTIONS.map(q=>`<li>${q.why}</li>`).join("")
  }</ol></div>`;
};
renderQ();

// Checklist (localStorage)
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
taskForm.addEventListener("submit", e=>{
  e.preventDefault();
  const text = taskInput.value.trim();
  if(!text) return;
  const tasks = loadTasks(); tasks.push({text, done:false}); saveTasks(tasks);
  taskInput.value=""; paintTasks();
});
taskList.addEventListener("change", e=>{
  if(e.target.type==="checkbox"){
    const i = Number(e.target.dataset.i);
    const tasks = loadTasks(); tasks[i].done = e.target.checked; saveTasks(tasks); paintTasks();
  }
});
clearBtn.onclick = ()=>{ localStorage.removeItem(TASK_KEY); paintTasks(); }
paintTasks();
