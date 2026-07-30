(() => {
"use strict";
const data=window.TETRABIBLOS_V2;
const levelData=window.TETRABIBLOS_LEVELS;
const storageKey="tetrabiblosAnnaStorybookV4";
const state={level:"beginner",current:0,read:new Set(),tab:"storybook"};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
function load(){try{const p=JSON.parse(localStorage.getItem(storageKey)||"{}");if(levelData.profiles[p.level])state.level=p.level;if(Array.isArray(p.read))state.read=new Set(p.read)}catch(e){console.warn("學習紀錄無法讀取，已使用安全預設值。",e)}}
function save(){try{localStorage.setItem(storageKey,JSON.stringify({level:state.level,read:[...state.read]}))}catch(e){console.warn("學習紀錄暫時無法儲存。",e)}}
function profile(){return levelData.profiles[state.level]}
function lens(c){return levelData.chapterLenses[c.id]?.[state.level]}
function renderLevels(){
  const box=$("#levelGrid");
  box.innerHTML=Object.entries(levelData.profiles).map(([id,p])=>`<button class="level-card ${id===state.level?"active":""}" data-level="${id}" aria-pressed="${id===state.level}"><span class="level-icon">${p.icon}</span><div><div class="source-label">${id.toUpperCase()}</div><h3>${p.label}</h3><p>${p.subtitle}</p><small>${p.promise}</small></div></button>`).join("");
  $$('[data-level]').forEach(b=>b.onclick=()=>{state.level=b.dataset.level;state.tab=profile().defaults[0];save();renderLevels();renderReader()});
  const p=profile();
  $("#levelExplain").innerHTML=`<span class="level-icon">${p.icon}</span><div><strong>目前閱讀方式：${p.label}</strong><p>${p.promise}</p><div class="mode-spec"><span>提示：${p.cueLabel}</span><span>任務：${p.taskLabel}</span><span>原典：${p.sourceMode}</span></div></div>`;
}
function renderChapters(filter=""){
 const q=filter.trim().toLowerCase(),box=$("#chapterGrid");
 box.innerHTML=data.chapters.map((c,i)=>({c,i})).filter(x=>`${x.c.title} ${x.c.summary} ${x.c.cues.join(" ")}`.toLowerCase().includes(q)).map(({c,i})=>`<button class="chapter-card ${i===state.current?"active":""}" data-chapter="${i}"><span class="chapter-number">${i+1}</span><div class="source-label">${c.no} · ${c.reading}</div><h3>${c.title}</h3><p>${c.summary}</p><span class="status">${state.read.has(c.id)?"🔖 已加入書籤":"翻開本章 →"}</span></button>`).join("")||'<div class="anna-note">安納沒有找到相符內容。試著使用較短的關鍵字。</div>';
 $$('[data-chapter]').forEach(b=>b.onclick=()=>{state.current=Number(b.dataset.chapter);state.tab=profile().defaults[0];renderChapters($("#search").value);renderReader();$("#reader").scrollIntoView({behavior:"smooth"})});
 $("#readCount").textContent=state.read.size;
}
function visualCards(c){
 const l=lens(c);if(!l)return"";
 return `<section class="visual-map"><div class="visual-title"><span>${l.icon}</span><div><small>${profile().taskLabel}</small><h3>${l.title}</h3></div></div><div class="visual-grid">${l.cards.map(x=>`<article class="visual-card"><span class="visual-icon">${x[0]}</span><div><h4>${x[1]}</h4><p>${x[2]}</p></div></article>`).join("")}</div></section>`;
}
function guideHtml(c){
 const icons=["🧭","🪶","🌿","🔭"];
 return c.guide.map((x,i)=>`<section class="lesson-scene"><span class="scene-icon">${icons[i%icons.length]}</span><div><h4>${x.h}</h4><p>${x.p}</p></div></section>`).join("");
}
function storyHtml(c){
 const beginner=state.level==="beginner",advanced=state.level==="advanced";
 return `<div class="book-spread">
 <aside class="margin-notes"><div class="ribbon">${profile().cueLabel}</div><ul>${c.cues.map((x,i)=>`<li><span>${["✦","☾","✎","⌕","◇"][i%5]}</span>${x}</li>`).join("")}</ul><div class="tip">複習時先遮住正文，只看左側問題，試著把概念說回來。</div></aside>
 <article class="story-page">
   ${advanced?`<details class="story-collapsed"><summary>展開安納的故事入口</summary><p>${c.story}</p></details>`:`<section class="opening-scene"><div class="moon-window"><span>☾</span><i>✦</i><b>✧</b></div><div><span class="kicker">安納說故事</span><p>${c.story}</p></div></section>`}
   <div class="anna-whisper"><span class="mini-anna">安</span><p><strong>安納陪你讀</strong>${c.anna}</p></div>
   ${visualCards(c)}
   ${beginner?`<section class="memory-stars"><h3>先記住三顆星</h3>${c.quick.map((x,i)=>`<article><span>${["★","✦","✧"][i]}</span><p>${x}</p></article>`).join("")}</section>`:""}
   <section class="knowledge-chapter"><div class="chapter-divider"><span>❦</span><h3>完整知識筆記</h3><span>❦</span></div>${guideHtml(c)}</section>
   <section class="case-card"><span class="case-icon">🔭</span><div><h3>${c.case.title}</h3><p>${c.case.body}</p></div></section>
   <section class="misconception-section"><h3>碎裂的水晶球：常見誤解</h3>${c.misconceptions.map(x=>`<div class="misconception"><span>⚠</span><p>${x}</p></div>`).join("")}</section>
   <section class="treasure-box"><span class="treasure-icon">✦</span><div><h3>章末寶箱</h3><p>${c.summary}</p><ol>${c.takeaways.map(x=>`<li>${x}</li>`).join("")}</ol></div></section>
 </article></div>`;
}
function sourceHtml(c){
 const status=c.source.status==="verified";
 return `<section class="source-room"><header class="source-cover"><span class="scroll-icon">📜</span><div><small>資料來源與驗證</small><h3>${c.source.work}</h3><p>${c.source.book} · ${c.source.chapters} · ${c.source.pages}</p></div><span class="${status?"verified":"review"}">${status?"✓ 已驗證":"△ 待第二輪覆核"}</span></header>
 <div class="source-meta"><div><span>版本</span><strong>${c.source.edition}</strong></div><div><span>來源 ID</span><strong>${c.source.sourceId}</strong></div></div>
 <div class="mirror-intro"><span>🪞</span><p><strong>原典魔法鏡</strong>每張卡只處理一句英文、一句中文和一個翻譯決策。核心不是把兩塊文字並排，而是讓你看見證據如何支持教學。</p></div>
 <div class="sentence-stack">${c.excerpts.map((x,i)=>`<article class="sentence-card"><div class="sentence-no">${String(i+1).padStart(2,"0")}</div><div class="sentence-content"><div class="english-line"><span>ENGLISH</span><p>${esc(x.en)}</p></div><div class="translation-arrow">↓</div><div class="chinese-line"><span>繁體中文</span><p>${esc(x.zh)}</p></div><div class="anna-translation"><span>✎ 安納的翻譯說明</span><p>${esc(x.note)}</p></div></div></article>`).join("")}</div>
 <div class="evidence-legend"><span><i class="dot original"></i>英文原典</span><span><i class="dot translation"></i>本站翻譯</span><span><i class="dot guide"></i>教學說明</span></div></section>`;
}
function quizHtml(c){
 const levelLabels={beginner:"辨認概念與明顯誤解",modern:"比較古今語言與條件判斷",advanced:"檢查證據、譯法與推論邊界"};
 return `<section class="quest-board"><header><span>🗝️</span><div><small>${profile().taskLabel}</small><h3>安納的小小任務</h3><p>${levelLabels[state.level]}。不鎖章節，也不拿分數假裝理解。</p></div></header>${c.quiz.map((q,qi)=>`<article class="quest"><div class="quest-number">${qi+1}</div><div><strong>${q.q}</strong>${q.options.map((o,oi)=>`<button data-q="${qi}" data-a="${oi}">${o}</button>`).join("")}<div class="quiz-feedback" id="feedback-${qi}"></div></div></article>`).join("")}</section>`;
}
function renderReader(){
 const c=data.chapters[state.current],p=profile();
 const tabs=[["storybook","安納說故事"],["source","原典魔法鏡"],["quiz","小小任務"]];
 let body=state.tab==="source"?sourceHtml(c):state.tab==="quiz"?quizHtml(c):storyHtml(c);
 $("#readerBox").innerHTML=`<header class="reader-head"><div><div class="source-label">${c.source.book} · ${c.source.chapters}</div><h2>${c.no}｜${c.title}</h2><p>${p.icon} ${p.label} · ${c.reading}</p></div><button class="bookmark ${state.read.has(c.id)?"saved":""}" id="markRead">${state.read.has(c.id)?"🔖 已加入書籤":"♡ 加入書籤"}</button></header><div class="tabs" role="tablist">${tabs.map(t=>`<button class="tab ${state.tab===t[0]?"active":""}" data-tab="${t[0]}">${t[1]}</button>`).join("")}</div>${body}`;
 $("#markRead").onclick=()=>{state.read.has(c.id)?state.read.delete(c.id):state.read.add(c.id);save();renderChapters($("#search").value);renderReader()};
 $$('[data-tab]').forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;renderReader()});
 $$('[data-q]').forEach(b=>b.onclick=()=>{const qi=Number(b.dataset.q),ai=Number(b.dataset.a),q=c.quiz[qi];$$(`[data-q="${qi}"]`).forEach(x=>{x.disabled=true;if(Number(x.dataset.a)===q.answer)x.classList.add("correct")});if(ai!==q.answer)b.classList.add("wrong");$(`#feedback-${qi}`).innerHTML=`<span>${ai===q.answer?"✦ 答對了":"☾ 再看一次概念"}</span>${q.explain}`});
}
function bind(){$$('[data-go]').forEach(b=>b.onclick=()=>$("#"+b.dataset.go).scrollIntoView({behavior:"smooth"}));$("#search").oninput=e=>renderChapters(e.target.value)}
load();bind();renderLevels();renderChapters();renderReader();
})();