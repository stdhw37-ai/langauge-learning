import { lessons, months, cards } from './curriculum.js';
import { completeLesson, review, dueLessons, restoreState, STORAGE_KEY } from './progress.js';

const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cardById = new Map(cards.map(p => [p.id, p]));
let state = restoreState(null, lessons, cards);
let hasLegacyProgress = false;
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  state = restoreState(raw ? JSON.parse(raw) : null, lessons, cards);
  hasLegacyProgress = !raw && Boolean(localStorage.getItem('pharma-talk-v1'));
} catch { /* Invalid or unavailable storage starts a fresh course. */ }
let tab = 'today';
let selected = 1;
let month = 1;
let lessonPane = 'expressions';
let revealed = false;
let messages = [];
let busy = false;
let ai = false;
let chatVersion = 0;
let recognition;
const solved = new Set();
const journal = () => state[state.language];
const currentLesson = () => lessons[selected - 1];
const next = () => lessons.find(l => !journal().completed[l.id]) || lessons.at(-1);
const languageName = () => state.language === 'ja' ? '일본어' : '영어';
const due = () => dueLessons(cards, journal().reviews);
const quizKey = id => `${state.language}:${id}`;

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { toast('브라우저 저장 공간을 사용할 수 없어 진도가 저장되지 않았습니다.'); }
}
function toast(text) {
  $('#toast').textContent = text;
  $('#toast').style.display = 'block';
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $('#toast').style.display = 'none', 5000);
}
function speak(text, language = state.language) {
  if (!('speechSynthesis' in window)) return toast('이 브라우저에서는 음성 듣기를 지원하지 않습니다.');
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === 'ja' ? 'ja-JP' : 'en-US';
  utterance.rate = .8;
  utterance.onerror = event => {
    if (!['interrupted', 'canceled'].includes(event.error)) toast('음성을 재생하지 못했습니다. 기기의 언어 음성을 확인해 주세요.');
  };
  speechSynthesis.speak(utterance);
}
function title(kicker, heading, sub) {
  return `<div class="greeting"><div><span class="tag">${kicker}</span><h1>${escape(heading)}</h1><div class="muted">${escape(sub)}</div></div><span class="date-pill">하루 20분 · 한 상황을 끝까지</span></div>`;
}
function go(to) {
  recognition?.abort();
  tab = to;
  revealed = false;
  render();
}
function openLesson(id) {
  selected = id;
  lessonPane = 'expressions';
  go('lesson');
}
function bilingual(phrase, { showMeaning = true, showReading = true } = {}) {
  return `${showMeaning ? `<p class="meaning">${escape(phrase.ko)}</p>` : ''}<div class="bilingual-grid">${['ja', 'en'].map(lang => `
    <div class="language-block ${lang === state.language ? 'focus-language' : ''}">
      <div class="section-top"><span class="tag">${lang === 'ja' ? '日本語 · 일본어' : 'ENGLISH · 영어'}</span>
      <button class="audio-button" data-speak="${phrase.id}" data-lang="${lang}" aria-label="${escape(phrase.ko)} ${lang === 'ja' ? '일본어' : '영어'} 발음 듣기">▷ 듣기</button></div>
      <p class="phrase" lang="${lang}">${escape(phrase[lang])}</p>
      ${showReading ? `<p class="reading"><span>한글 발음</span> ${escape(phrase[`${lang}Reading`])}</p>` : ''}
    </div>`).join('')}</div>`;
}
function render() {
  const count = Object.keys(journal().completed).length;
  const dueCount = due().length;
  $('#due-count').textContent = dueCount || '';
  document.querySelectorAll('nav button').forEach(button => button.classList.toggle('active', button.dataset.tab === tab || (tab === 'lesson' && button.dataset.tab === 'today')));
  if (tab === 'today') renderHome(count, dueCount);
  if (tab === 'course') renderCourse();
  if (tab === 'lesson') renderLesson();
  if (tab === 'review') renderReview();
  if (tab === 'chat') renderChat();
}
function renderHome(count, dueCount) {
  const lesson = next();
  $('#content').innerHTML = title('A SITUATION A DAY', '약사님, 오늘은 어떤 대화를 해볼까요?', '길을 묻는 순간부터 약국 상담까지. 한 상황에 필요한 표현을 함께 배워요.') + `
    <div class="stats"><div class="stat"><span>완료한 상황 학습 · ${languageName()}</span><strong>${count}<small> / 90일</small></strong></div>
    <div class="stat"><span>오늘 복습할 표현</span><strong>${dueCount}<small> 개</small></strong></div>
    <div class="stat"><span>학습한 표현</span><strong>${Object.keys(journal().reviews).length}<small> / 540개</small></strong></div></div>
    <div class="columns"><div><div class="hero"><span class="tag">TODAY'S SITUATION · DAY ${String(lesson.id).padStart(2, '0')}</span>
    <h2>${count === 90 ? '90일 상황 학습을 완주했어요!' : escape(lesson.title)}</h2><p>${escape(lesson.goal)}<br>표현 6개 · 예시 대화 6턴 · 확인 퀴즈 6개</p>
    <button class="light" data-action="start">${count === 90 ? '마지막 상황 다시 보기' : '오늘의 상황 학습하기'}　↗</button><span class="decoration">✚</span></div>
    <div class="card"><div class="section-top"><h3>일본어와 영어를 나란히</h3><span class="pill">한글 발음 포함</span></div><p class="muted">모든 표현에서 두 언어와 한국어 뜻을 함께 볼 수 있어요. 상단에서는 퀴즈와 역할 대화에 사용할 언어를 선택하세요.</p></div>
    <div class="card"><div class="section-top"><h3>어려웠던 표현만 다시</h3><button class="split-link" data-action="review">복습하기 →</button></div><p class="muted">${dueCount ? `오늘 다시 만나볼 표현이 ${dueCount}개 있어요.` : '상황 학습을 완료하면 표현 6개가 각각 복습 노트에 담겨요.'}<br>다음 날 첫 복습, 이후 기억나면 3일·7일·14일 간격으로 만나요.</p></div></div>
    <div class="card"><span class="tag">YOUR LEARNING PATH</span><h2 style="margin-top:14px">30가지 상황, 3단계 연습</h2><p class="muted">매일 다른 상황을 배우고, 다음 달에는 장소와 물품을 바꿔 응용해요.</p><div class="bar"><i style="width:${count / 90 * 100}%"></i></div>
    <div class="muted">${count}일 완료 · ${90 - count}일 남음</div><div class="steps">${months.map((name, i) => `<div class="step"><b>${i + 1}</b><span>${name}<small>${i * 30 + 1}–${(i + 1) * 30}일 · ${lessons.filter(l => l.month === i + 1 && journal().completed[l.id]).length}/30 완료</small></span></div>`).join('')}</div></div></div>`;
}
function renderCourse() {
  $('#content').innerHTML = title('90 DAY JOURNEY', '나의 상황별 커리큘럼', '매일 표현 6개와 예시 대화로 연습합니다. 일본어·영어·한글 발음을 함께 제공해요.') + `
    <div class="tabs">${months.map((name, i) => `<button data-month="${i + 1}" class="${month === i + 1 ? 'selected' : ''}">${i + 1}개월차</button>`).join('')}</div>
    <p class="month-note">${months[month - 1]} · ${['표현과 발음을 보며 천천히 대화해 보세요.', '익숙한 상황에 새로운 장소·물품을 넣어 말해 보세요.', '상대 역할까지 바꾸어 대본 없이 말해 보세요.'][month - 1]}</p>
    <div class="course-grid">${lessons.filter(l => l.month === month).map(l => `<button class="lesson-button ${journal().completed[l.id] ? 'done' : ''}" data-lesson="${l.id}"><small>DAY ${String(l.id).padStart(2, '0')} · 6개 표현 ${journal().completed[l.id] ? '✓ 완료' : ''}</small><strong>${escape(l.title)}</strong></button>`).join('')}</div>`;
}
function renderLesson() {
  const lesson = currentLesson();
  const passed = lesson.phrases.filter(p => solved.has(quizKey(p.id))).length;
  $('#content').innerHTML = `<button class="back" data-action="home">← 학습 홈</button>` + title(`DAY ${String(lesson.id).padStart(2, '0')} · SITUATION LESSON`, lesson.title, lesson.goal) + `
    <div class="lesson-overview"><span>⏱ 약 20분</span><span>표현 ${lesson.phrases.length}개</span><span>일본어 + 영어 + 한글 발음</span></div>
    <div class="tabs lesson-tabs" aria-label="학습 단계">${[['expressions', '① 필수 표현'], ['dialogue', '② 예시 대화'], ['quiz', `③ 확인 퀴즈 (${passed}/6)`]].map(([key, label]) => `<button data-pane="${key}" class="${lessonPane === key ? 'selected' : ''}" aria-pressed="${lessonPane === key}">${label}</button>`).join('')}</div>
    ${lessonPane === 'expressions' ? renderExpressions(lesson) : lessonPane === 'dialogue' ? renderDialogue(lesson) : renderQuiz(lesson)}
  `;
}
function renderExpressions(lesson) {
  return `<p class="muted">8분 · 각 표현을 듣고 두 번씩 따라 말해 보세요. 한글 발음은 소리를 익히는 보조 표기이므로 실제 음성도 함께 들어 주세요.</p>
    ${lesson.phrases.map((p, i) => `<article class="card expression-card"><div class="section-top"><span class="tag">EXPRESSION ${i + 1} / 6</span><span class="pill">${escape(p.speaker)} 표현</span></div>${bilingual(p)}</article>`).join('')}
    <div class="actions"><button class="primary" data-pane="dialogue">예시 대화로 이어서 연습하기 →</button></div>`;
}
function renderDialogue(lesson) {
  return `<div class="tip"><strong>7분 · ${escape(lesson.learnerRole)} ↔ ${escape(lesson.partnerRole)}</strong><br>${escape(lesson.mission)}<br>${['처음에는 한글 발음을 보며 말해도 좋아요.', '한글 발음을 가리고 익숙한 표현을 바꿔 말해 보세요.', '예시 대화를 한 번 읽은 뒤 보지 않고 상황을 끝까지 이어가 보세요.'][lesson.month - 1]}</div>
    <div class="dialogue-list">${lesson.dialogue.map((id, i) => { const p = cardById.get(id); return `<article class="card dialogue-turn ${p.role}"><div class="section-top"><span class="tag">${i + 1}. ${escape(p.speaker)}</span><span class="muted">${p.role === 'learner' ? '내 역할' : '상대 역할'}</span></div>${bilingual(p)}</article>`; }).join('')}</div>
    <div class="actions"><button class="secondary" data-action="practice">☏ 이 상황으로 역할 대화하기</button><button class="primary" data-pane="quiz">확인 퀴즈 풀기 →</button></div>`;
}
function renderQuiz(lesson) {
  const allPassed = lesson.phrases.every(p => solved.has(quizKey(p.id)));
  return `<p class="muted">5분 · ${languageName()} 표현 6개의 뜻을 모두 확인하면 오늘의 학습이 완료됩니다. 상단에서 퀴즈 언어를 바꿀 수 있어요.</p>
    ${lesson.phrases.map((p, i) => {
      const passed = solved.has(quizKey(p.id));
      const options = [p, lesson.phrases[(i + 2) % 6], lesson.phrases[(i + 4) % 6]].sort((a, b) => a.id.localeCompare(b.id));
      return `<section class="card quiz-card" id="quiz-${p.id}"><span class="tag">QUESTION ${i + 1} / 6</span><p class="phrase" lang="${state.language}">${escape(p[state.language])}</p><button class="audio-button" data-speak="${p.id}" data-lang="${state.language}">▷ 문제 듣기</button>
      <div class="quiz-options">${options.map(o => `<button data-quiz="${p.id}" data-answer="${o.id}" ${passed ? 'disabled' : ''}>${escape(o.ko)}</button>`).join('')}</div>
      <div class="feedback" id="feedback-${p.id}" role="status">${passed ? '✓ 정답을 확인했어요.' : ''}</div></section>`;
    }).join('')}
    <div class="card"><p id="quiz-progress">${lesson.phrases.filter(p => solved.has(quizKey(p.id))).length}/6개 확인 완료</p><button class="primary" id="complete" data-action="complete" ${!allPassed || journal().completed[lesson.id] ? 'disabled' : ''}>${journal().completed[lesson.id] ? '이미 완료한 상황 학습' : '오늘의 상황 학습 완료 ✓'}</button></div>`;
}
function renderReview() {
  const items = due();
  const p = items[0];
  $('#content').innerHTML = title('KEEP IT FRESH', '표현별 복습 노트', `오늘 복습할 표현 ${items.length}개 · ${languageName()} 진도`) + (p ? `
    <div class="card review-card"><span class="tag">DAY ${p.lessonId} · ${escape(lessons[p.lessonId - 1].situation)}</span><p class="muted">이 표현을 어떤 뜻으로 사용하는지 떠올려 보세요.</p>
    ${bilingual(p, { showMeaning: revealed, showReading: revealed })}
    ${revealed ? `<div class="actions" style="justify-content:center"><button class="secondary" data-rating="again" data-id="${p.id}">이 표현은 다시 연습할래요</button><button class="primary" data-rating="good" data-id="${p.id}">이 표현은 기억나요 ✓</button></div>` : '<button class="primary" data-action="reveal">뜻과 한글 발음 확인하기</button>'}</div>` : `
    <div class="card empty"><div class="symbol">✓</div><h2>오늘 복습할 표현이 없어요</h2><p class="muted">한 상황을 완료하면 표현 6개가 다음 날부터 나타나요.<br>어려운 표현은 다음 날, 기억나는 표현은 더 긴 간격으로 복습해요.</p><button class="primary" data-action="course">커리큘럼 보기</button></div>`);
}
function renderChat() {
  const lesson = currentLesson();
  $('#content').innerHTML = title('PRACTICE TOGETHER', '상황별 역할 대화', `${lesson.title} · 나는 ${lesson.learnerRole}, 상대는 ${lesson.partnerRole}`) + `
    <div class="card"><div class="section-top"><div><h3>${ai ? 'AI 상대와 대화' : '예시 대본으로 대화 연습'}</h3><span class="muted">${ai ? 'AI 연결됨 · 입력한 대화가 AI 서비스로 전송됩니다.' : 'AI 미연결 · 내가 보내면 대본의 다음 상대 표현을 보여줘요.'}</span></div><button class="secondary" data-action="reset-chat">새 대화</button></div>
    <label class="muted">연습 상황 <select id="chat-topic">${lessons.map(l => `<option value="${l.id}" ${selected === l.id ? 'selected' : ''}>${l.id}일 · ${escape(l.title)}</option>`).join('')}</select></label>
    <div class="chat-log" id="chat-log" role="log" aria-live="polite">${messages.length ? messages.map(m => `<div class="bubble ${m.role === 'user' ? 'user' : ''}">${escape(m.content)}</div>`).join('') : `<div class="chat-intro">${escape(lesson.mission)}<br><br>먼저 ${languageName()}로 말을 걸어 보세요.<br>막히면 아래 ‘다음 표현 넣기’를 눌러 주세요.</div>`}${busy ? '<div class="bubble">답변을 준비하고 있어요…</div>' : ''}</div>
    <form class="chat-form" id="chat-form"><input id="message" aria-label="대화 입력" maxlength="1000" placeholder="${languageName()}로 말을 건네 보세요" required ${busy ? 'disabled' : ''}><button type="button" class="secondary" data-action="mic" ${busy ? 'disabled' : ''}>🎙 말하기</button><button class="primary" type="submit" ${busy ? 'disabled' : ''}>보내기 ↑</button></form>
    <div class="actions"><button class="split-link" data-action="hint" ${busy ? 'disabled' : ''}>다음 표현 넣기</button><button class="split-link" data-action="reply-audio" ${!messages.some(m => m.role === 'assistant') || busy ? 'disabled' : ''}>▷ 상대방 답변 듣기</button><button class="split-link" data-action="back-dialogue">두 언어 표현·발음 보기</button></div>
    <p class="muted" id="voice-status">마이크는 지원 브라우저의 HTTPS 또는 localhost에서 사용할 수 있습니다. 인식된 문장을 확인한 뒤 보내세요.</p><div class="tip">가상의 상황으로 연습해 주세요. 실제 환자의 개인정보를 입력하지 마세요.</div></div>`;
  $('#chat-log').scrollTop = $('#chat-log').scrollHeight;
  $('#chat-form').addEventListener('submit', sendChat);
  $('#chat-topic').addEventListener('change', event => { selected = Number(event.target.value); resetChat(); });
}
function resetChat() {
  chatVersion++;
  busy = false;
  messages = [];
  recognition?.abort();
  renderChat();
}
function demoReply() {
  const partners = currentLesson().phrases.filter(p => p.role === 'partner');
  const index = messages.filter(m => m.role === 'user').length - 1;
  if (index >= partners.length) return '예시 대화 6턴을 모두 연습했어요. 새 대화로 다시 연습하거나 다른 상황을 골라 주세요. 자유로운 응답과 표현 교정은 AI 연결 후 제공됩니다.';
  const p = partners[index];
  return `${p[state.language]}\n\n한국어 뜻: ${p.ko}\n일본어: ${p.ja}\n한글 발음: ${p.jaReading}\n영어: ${p.en}\n한글 발음: ${p.enReading}`;
}
async function sendChat(event) {
  event.preventDefault();
  const text = $('#message').value.trim();
  if (!text || busy) return;
  messages.push({ role: 'user', content: text });
  busy = true;
  const version = chatVersion;
  let failed = false;
  renderChat();
  try {
    let reply;
    if (ai) {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: state.language, lessonId: selected, messages: messages.slice(-12) }), signal: AbortSignal.timeout(35000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI 응답을 받지 못했습니다.');
      reply = data.reply;
    } else reply = demoReply();
    if (version !== chatVersion) return;
    messages.push({ role: 'assistant', content: reply });
  } catch (error) {
    if (version === chatVersion) {
      messages.pop();
      failed = true;
      toast(error.name === 'TimeoutError' ? '응답 시간이 초과되었습니다. 다시 보내 주세요.' : error.message);
    }
  } finally {
    if (version === chatVersion) {
      busy = false;
      if (tab === 'chat') {
        renderChat();
        if (failed) $('#message').value = text;
        $('#message').focus();
      }
    }
  }
}
function mic() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return toast('음성 인식을 지원하지 않는 브라우저입니다. 채팅으로 연습해 주세요.');
  recognition?.abort();
  recognition = new SpeechRecognition();
  recognition.lang = state.language === 'ja' ? 'ja-JP' : 'en-US';
  recognition.interimResults = false;
  recognition.onresult = event => { if ($('#message')) $('#message').value = event.results[0][0].transcript; };
  recognition.onstart = () => { if ($('#voice-status')) $('#voice-status').textContent = '듣고 있어요. 이번 차례의 표현을 말해 주세요.'; };
  recognition.onend = () => { if ($('#voice-status')) $('#voice-status').textContent = '인식된 문장을 확인하고 보내기를 눌러 주세요.'; };
  recognition.onerror = event => {
    if (event.error !== 'aborted') toast(event.error === 'not-allowed' ? '마이크 권한을 허용하거나 채팅을 이용해 주세요.' : '음성을 인식하지 못했습니다. 다시 시도해 주세요.');
  };
  try { recognition.start(); } catch { toast('마이크를 시작할 수 없습니다.'); }
}
function answerQuiz(button) {
  const id = button.dataset.quiz;
  if (button.dataset.answer !== id) {
    $(`#feedback-${id}`).textContent = '다시 생각해 보세요. 필수 표현에서 뜻을 확인해도 좋아요.';
    return;
  }
  solved.add(quizKey(id));
  $(`#feedback-${id}`).textContent = '✓ 정답이에요! 이 표현을 소리 내어 말해 보세요.';
  document.querySelectorAll(`[data-quiz="${id}"]`).forEach(b => b.disabled = true);
  const passed = currentLesson().phrases.filter(p => solved.has(quizKey(p.id))).length;
  $('#quiz-progress').textContent = `${passed}/6개 확인 완료`;
  $('[data-pane="quiz"]').textContent = `③ 확인 퀴즈 (${passed}/6)`;
  $('#complete').disabled = passed !== 6 || Boolean(journal().completed[selected]);
}
document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.tab) return go(button.dataset.tab);
  if (button.dataset.month) { month = Number(button.dataset.month); return render(); }
  if (button.dataset.lesson) return openLesson(Number(button.dataset.lesson));
  if (button.dataset.pane) { lessonPane = button.dataset.pane; return renderLesson(); }
  if (button.dataset.speak) return speak(cardById.get(button.dataset.speak)[button.dataset.lang], button.dataset.lang);
  if (button.dataset.quiz) return answerQuiz(button);
  if (button.dataset.rating) {
    journal().reviews = review(journal().reviews, button.dataset.id, button.dataset.rating === 'good');
    save(); revealed = false; return render();
  }
  switch (button.dataset.action) {
    case 'start': openLesson(next().id); break;
    case 'home': go('today'); break;
    case 'review': go('review'); break;
    case 'course': go('course'); break;
    case 'practice': messages = []; chatVersion++; busy = false; go('chat'); break;
    case 'complete':
      if (!currentLesson().phrases.every(p => solved.has(quizKey(p.id)))) break;
      state[state.language] = completeLesson(journal(), currentLesson());
      save(); go('today'); toast('상황 학습 완료! 표현 6개를 내일부터 복습해요.'); break;
    case 'reveal': revealed = true; render(); break;
    case 'reset-chat': resetChat(); break;
    case 'hint': {
      const learnerPhrases = currentLesson().phrases.filter(p => p.role === 'learner');
      const index = messages.filter(m => m.role === 'user').length;
      $('#message').value = learnerPhrases[Math.min(index, learnerPhrases.length - 1)][state.language];
      $('#message').focus(); break;
    }
    case 'back-dialogue': lessonPane = 'dialogue'; go('lesson'); break;
    case 'reply-audio': {
      const reply = messages.findLast(m => m.role === 'assistant');
      if (reply) speak(reply.content.split('\n')[0]);
      break;
    }
    case 'mic': mic(); break;
  }
});
$('#language').value = state.language;
$('#language').addEventListener('change', event => {
  state.language = event.target.value;
  messages = []; chatVersion++; busy = false;
  recognition?.abort(); window.speechSynthesis?.cancel();
  save(); render();
});
render();
if (hasLegacyProgress) toast('상황별 과정이 새로 시작됩니다. 이전 한 문장 과정 기록은 따로 보관됩니다.');
fetch('/api/config').then(response => response.json()).then(config => { ai = Boolean(config.ai); if (tab === 'chat') renderChat(); }).catch(() => {});
