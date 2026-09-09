import { lessons, months } from './curriculum.js';
import { complete, review, dueLessons } from './progress.js';
const $ = s => document.querySelector(s);
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state = { language: 'ja', ja: {}, en: {} };
try {
  const saved = JSON.parse(localStorage.getItem('pharma-talk-v1'));
  if (saved && ['ja','en'].includes(saved.language)) {
    state.language = saved.language;
    for (const lang of ['ja','en']) for (const [id, r] of Object.entries(saved[lang] || {})) {
      if (lessons.some(l=>l.id===Number(id)) && Number.isFinite(r?.due) && Number.isFinite(r?.completedAt) && Number.isInteger(r.stage) && r.stage>=0 && r.stage<=3) state[lang][id]=r;
    }
  }
} catch { /* Start with an empty journal when storage is unavailable or invalid. */ }
let tab = 'today', selected = 1, month = 1, revealed = false, messages = [], busy = false, ai = false, chatVersion = 0, recognition;
const records = () => state[state.language];
const next = () => lessons.find(l => !records()[l.id]) || lessons[89];
const languageName = () => state.language === 'ja' ? '일본어' : '영어';
function save() { try { localStorage.setItem('pharma-talk-v1', JSON.stringify(state)); } catch { toast('브라우저 저장 공간을 사용할 수 없어 진도가 저장되지 않았습니다.'); } }
function toast(text) { $('#toast').textContent=text; $('#toast').style.display='block'; clearTimeout(toast.timer); toast.timer=setTimeout(()=>$('#toast').style.display='none',4500); }
function speak(text) {
  if (!('speechSynthesis' in window)) return toast('이 브라우저에서는 음성 듣기를 지원하지 않습니다.');
  speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang=state.language==='ja'?'ja-JP':'en-US';u.rate=.8;
  u.onerror=()=>toast('음성을 재생하지 못했습니다. 기기의 언어 음성을 확인해 주세요.');speechSynthesis.speak(u);
}
function title(kicker, heading, sub) { return `<div class="greeting"><div><span class="tag">${kicker}</span><h1>${heading}</h1><div class="muted">${sub}</div></div><span class="date-pill">하루 10분 · 90일의 변화</span></div>`; }
function go(to) { recognition?.abort(); tab=to;revealed=false;render(); }
function render() {
  const count=Object.keys(records()).length, due=dueLessons(lessons,records());
  $('#due-count').textContent=due.length||'';
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab || (tab==='lesson'&&b.dataset.tab==='today')));
  const l=lessons[selected-1];
  if(tab==='today') $('#content').innerHTML=title('A LITTLE EVERY DAY','약사님, 오늘도 반가워요 👋','한 문장씩 쌓아가는 자신감. 오늘도 함께 시작해 볼까요?')+`<div class="stats"><div class="stat"><span>완료한 학습</span><strong>${count}<small> / 90일</small></strong></div><div class="stat"><span>오늘의 복습</span><strong>${due.length}<small> 개 표현</small></strong></div><div class="stat"><span>전체 달성률</span><strong>${Math.round(count/90*100)}<small> %</small></strong></div></div><div class="columns"><div><div class="hero"><span class="tag">TODAY'S LESSON · DAY ${next().id.toString().padStart(2,'0')}</span><h2>${count===90?'90일 학습을 완주했어요!':next().ko}</h2><p>${months[next().month-1]}<br>${languageName()} 한 문장을 듣고, 말하고, 기억해 보세요.</p><button class="light" data-action="start">${count===90?'마지막 표현 다시 보기':'오늘의 학습 시작하기'}　↗</button><span class="decoration">✚</span></div><div class="card"><div class="section-top"><h3>기억이 오래가는 복습</h3><button class="split-link" data-action="review">복습하기 →</button></div><p class="muted">${due.length?`오늘 다시 만나볼 표현이 ${due.length}개 있어요.`:'배운 표현은 다음 날 복습 노트에 나타나요.'}<br>기억나면 3일, 7일, 이후 14일 간격으로 다시 연습해요.</p></div></div><div class="card"><span class="tag">YOUR LEARNING PATH</span><h2 style="margin-top:14px">3개월 뒤, 더 편안한 대화</h2><div class="bar"><i style="width:${count/90*100}%"></i></div><div class="muted">${count}일 완료 · ${90-count}일 남음</div><div class="steps">${months.map((m,i)=>`<div class="step"><b>${i+1}</b><span>${m}<small>${i*30+1}–${(i+1)*30}일 · ${lessons.filter(l=>l.month===i+1&&records()[l.id]).length}/30 완료</small></span></div>`).join('')}</div></div></div>`;
  if(tab==='course') $('#content').innerHTML=title('90 DAY JOURNEY','나의 90일 커리큘럼','하루 한 가지 대화 목표. 원하는 날짜를 먼저 학습해도 좋아요.')+`<div class="tabs">${months.map((m,i)=>`<button data-month="${i+1}" class="${month===i+1?'selected':''}">${i+1}개월차</button>`).join('')}</div><p class="month-note">${months[month-1]}</p><div class="course-grid">${lessons.filter(l=>l.month===month).map(l=>`<button class="lesson-button ${records()[l.id]?'done':''}" data-lesson="${l.id}"><small>DAY ${String(l.id).padStart(2,'0')} ${records()[l.id]?'✓ 완료':''}</small><strong>${l.ko}</strong></button>`).join('')}</div>`;
  if(tab==='lesson') $('#content').innerHTML=`<button class="back" data-action="home">← 학습 홈</button>`+title(`DAY ${String(l.id).padStart(2,'0')} · ${languageName()}`,l.ko,'① 듣기 → ② 세 번 따라 말하기 → ③ 뜻 확인하기')+`<div class="card"><div class="section-top"><span class="tag">오늘의 핵심 표현</span><span class="pill">${months[l.month-1]}</span></div><div class="phrase" lang="${state.language}">${escape(l[state.language])}</div><p class="translation">${l.ko}</p><div class="actions"><button class="secondary" data-action="listen">▷ 발음 듣기</button><button class="secondary" data-action="practice">☏ 이 주제로 회화 연습</button></div><div class="tip">10분 루틴 · 2분 듣기, 3분 따라 말하기, 3분 상황 연습, 2분 퀴즈.<br>직접 말해본 뒤 아래 퀴즈로 뜻을 확인해 보세요.</div></div><div class="card"><h3>오늘의 확인 퀴즈</h3><p class="muted">“${escape(l[state.language])}”의 뜻은 무엇일까요?</p><div class="quiz-options">${[l,lessons[(l.id+6)%90],lessons[(l.id+17)%90]].sort((a,b)=>(a.id*17%31)-(b.id*17%31)).map(o=>`<button data-answer="${o.id}">${o.ko}</button>`).join('')}</div><div class="feedback" id="quiz-feedback" role="status"></div><button class="primary" id="complete" data-action="complete" disabled>${records()[l.id]?'이미 완료한 학습':'학습 완료하기 ✓'}</button></div>`;
  if(tab==='review') {
    const r=due[0];
    $('#content').innerHTML=title('KEEP IT FRESH','복습 노트',`오늘 복습할 표현 ${due.length}개 · ${languageName()}`)+(r?`<div class="card review-card"><span class="tag">DAY ${r.id} · 뜻을 떠올려 보세요</span><p class="phrase" lang="${state.language}">${escape(r[state.language])}</p>${revealed?`<p class="translation">${r.ko}</p><div class="actions" style="justify-content:center"><button class="secondary" data-rating="again" data-id="${r.id}">다시 연습할래요</button><button class="primary" data-rating="good" data-id="${r.id}">기억나요 ✓</button></div>`:'<button class="primary" data-action="reveal">뜻 확인하기</button>'}</div>`:`<div class="card empty"><div class="symbol">✓</div><h2>오늘의 복습을 모두 마쳤어요</h2><p class="muted">학습한 표현은 다음 날부터 여기서 복습할 수 있어요.<br>지금 다시 보고 싶다면 커리큘럼에서 선택해 주세요.</p><button class="primary" data-action="course">커리큘럼 보기</button></div>`);
  }
  if(tab==='chat') renderChat();
}
function initialMessage() { return state.language==='ja'?'こんにちは。少し相談してもいいですか。\n안녕하세요. 잠깐 상담해도 될까요?':'Hello. Could I ask you a question?\n안녕하세요. 질문해도 될까요?'; }
function renderChat() {
  if(!messages.length) messages=[{role:'assistant',content:initialMessage()}];
  $('#content').innerHTML=title('PRACTICE TOGETHER','약국에서 만나는 작은 대화','약사님은 약사 역할, 대화 상대는 외국인 여행객 역할이에요.')+`<div class="card"><div class="section-top"><div><h3>${ai?'AI 여행객과 대화':'예시 대화 연습'}</h3><span class="muted">${ai?'AI 연결됨 · 입력한 대화가 AI 서비스로 전송됩니다.':'AI 미연결 · 정해진 예시 응답으로 연습합니다.'}</span></div><button class="secondary" data-action="reset-chat">새 대화</button></div><label class="muted">연습 주제 <select id="chat-topic">${lessons.map(l=>`<option value="${l.id}" ${selected===l.id?'selected':''}>${l.id}일 · ${l.ko}</option>`).join('')}</select></label><div class="chat-log" id="chat-log" role="log" aria-live="polite">${messages.map(m=>`<div class="bubble ${m.role==='user'?'user':''}">${escape(m.content)}</div>`).join('')}${busy?'<div class="bubble">답변을 준비하고 있어요…</div>':''}</div><form class="chat-form" id="chat-form"><input id="message" aria-label="대화 입력" maxlength="1000" placeholder="${languageName()}로 말을 건네 보세요" required ${busy?'disabled':''}><button type="button" class="secondary" data-action="mic" ${busy?'disabled':''}>🎙 말하기</button><button class="primary" type="submit" ${busy?'disabled':''}>보내기 ↑</button></form><div class="actions"><button class="split-link" data-action="hint">오늘의 표현 넣기</button><button class="split-link" data-action="reply-audio">▷ 상대방 답변 듣기</button></div><p class="muted" id="voice-status">마이크는 지원 브라우저의 HTTPS 또는 localhost에서 사용할 수 있습니다. 인식된 문장을 확인한 뒤 보내세요.</p><div class="tip">가상의 상황으로 연습해 주세요. 실제 환자의 개인정보를 입력하지 마세요.</div></div>`;
  $('#chat-log').scrollTop=$('#chat-log').scrollHeight;
  $('#chat-form').addEventListener('submit',sendChat);
  $('#chat-topic').addEventListener('change',e=>{selected=Number(e.target.value);resetChat();});
}
function resetChat(){chatVersion++;busy=false;messages=[];recognition?.abort();renderChat();}
function demoReply(text) {
  const l=lessons[selected-1], ja=state.language==='ja';
  const greeting=/hello|welcome|help|こんにちは|ようこそ|用件/i.test(text);
  return greeting?(ja?'ありがとうございます。薬について質問があります。\n감사합니다. 약에 대해 질문이 있어요.':'Thank you. I have a question about a medicine.\n감사합니다. 약에 대해 질문이 있어요.'):(ja?'すみません。もう少しゆっくり話していただけますか。':'Sorry. Could you speak a little more slowly?')+`\n예시 연습: “${l[state.language]}”를 천천히 말해 보세요. 자유로운 답변과 교정은 AI 연결 후 제공됩니다.`;
}
async function sendChat(e) {
  e.preventDefault();const text=$('#message').value.trim();if(!text||busy)return;
  messages.push({role:'user',content:text});busy=true;const version=chatVersion;renderChat();
  try {
    let reply;
    if(ai){const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({language:state.language,lessonId:selected,messages:messages.slice(-12)}),signal:AbortSignal.timeout(35000)});const data=await res.json();if(!res.ok)throw new Error(data.error||'AI 응답을 받지 못했습니다.');reply=data.reply;}
    else reply=demoReply(text);
    if(version!==chatVersion)return;messages.push({role:'assistant',content:reply});
  } catch(error) {if(version===chatVersion){messages.pop();toast(error.name==='TimeoutError'?'응답 시간이 초과되었습니다. 다시 보내 주세요.':error.message);}}
  finally {if(version===chatVersion){busy=false;if(tab==='chat'){renderChat();$('#message').focus();}}}
}
function mic(){const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SpeechRecognition)return toast('음성 인식을 지원하지 않는 브라우저입니다. 채팅으로 연습해 주세요.');recognition?.abort();recognition=new SpeechRecognition();recognition.lang=state.language==='ja'?'ja-JP':'en-US';recognition.interimResults=false;recognition.onresult=e=>{if($('#message'))$('#message').value=e.results[0][0].transcript;};recognition.onstart=()=>{if($('#voice-status'))$('#voice-status').textContent='듣고 있어요. 한 문장을 말해 주세요.';};recognition.onend=()=>{if($('#voice-status'))$('#voice-status').textContent='인식된 문장을 확인하고 보내기를 눌러 주세요.';};recognition.onerror=e=>toast(e.error==='not-allowed'?'마이크 권한을 허용하거나 채팅을 이용해 주세요.':'음성을 인식하지 못했습니다. 다시 시도해 주세요.');try{recognition.start();}catch{toast('마이크를 시작할 수 없습니다.');}}
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.tab)return go(b.dataset.tab);
  if(b.dataset.month){month=Number(b.dataset.month);return render();}
  if(b.dataset.lesson){selected=Number(b.dataset.lesson);return go('lesson');}
  if(b.dataset.answer){const correct=Number(b.dataset.answer)===selected;$('#quiz-feedback').textContent=correct?'정답이에요! 소리 내어 한 번 더 말하고 완료해 주세요.':'다시 생각해 보세요. 위의 우리말 뜻을 확인해도 좋아요.';if(correct)$('#complete').disabled=Boolean(records()[selected]);return;}
  if(b.dataset.rating){state[state.language]=review(records(),Number(b.dataset.id),b.dataset.rating==='good');save();revealed=false;return render();}
  switch(b.dataset.action){
    case 'start':selected=next().id;go('lesson');break;
    case 'home':go('today');break;
    case 'review':go('review');break;
    case 'course':go('course');break;
    case 'listen':speak(lessons[selected-1][state.language]);break;
    case 'practice':messages=[];chatVersion++;busy=false;go('chat');break;
    case 'complete':state[state.language]=complete(records(),selected);save();go('today');toast('학습 완료! 내일 복습 노트에서 다시 만나요.');break;
    case 'reveal':revealed=true;render();break;
    case 'reset-chat':resetChat();break;
    case 'hint':$('#message').value=lessons[selected-1][state.language];$('#message').focus();break;
    case 'reply-audio':speak(messages.findLast(m=>m.role==='assistant')?.content.split('\n')[0]||initialMessage().split('\n')[0]);break;
    case 'mic':mic();break;
  }
});
$('#language').value=state.language;
$('#language').addEventListener('change',e=>{state.language=e.target.value;messages=[];chatVersion++;busy=false;recognition?.abort();window.speechSynthesis?.cancel();save();render();});
render();
fetch('/api/config').then(r=>r.json()).then(c=>{ai=Boolean(c.ai);if(tab==='chat')renderChat();}).catch(()=>{});
