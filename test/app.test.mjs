import test from 'node:test';
import assert from 'node:assert/strict';
import { lessons, cards } from '../public/curriculum.js';
import { complete, review, dueLessons, DAY, completeLesson, restoreState } from '../public/progress.js';
import { createApp } from '../server.mjs';
test('90 situation lessons each have six bilingual expressions and six coherent turns', () => {
  assert.equal(lessons.length, 90);
  assert.equal(cards.length, 540);
  assert.equal(new Set(lessons.map(l => l.title)).size, 90);
  assert.equal(new Set(cards.map(p => p.id)).size, 540);
  for (const month of [1, 2, 3]) assert.equal(lessons.filter(l => l.month === month).length, 30);
  for (const lesson of lessons) {
    assert.equal(lesson.phrases.length, 6);
    assert.equal(new Set(lesson.phrases.map(p => p.ko)).size, 6);
    assert.deepEqual(lesson.dialogue, lesson.phrases.map(p => p.id));
    assert.ok(lesson.goal && lesson.mission && lesson.learnerRole && lesson.partnerRole);
    lesson.phrases.forEach((p, index) => {
      assert.equal(p.lessonId, lesson.id);
      assert.equal(p.role, index % 2 ? 'partner' : 'learner');
      for (const field of ['ko', 'en', 'ja', 'enReading', 'jaReading']) {
        assert.equal(typeof p[field], 'string');
        assert.ok(p[field].trim());
        assert.doesNotMatch(p[field], /undefined|\{x\}/);
      }
      assert.match(p.jaReading, /[가-힣]/);
      assert.match(p.enReading, /[가-힣]/);
      assert.doesNotMatch(p.en, /Is there the /);
    });
  }
});
test('completing a situation queues all six expressions and reviews remain independent', () => {
  let journal = completeLesson({ completed: {}, reviews: {} }, lessons[0], 0);
  assert.equal(Object.keys(journal.completed).length, 1);
  assert.equal(dueLessons(cards, journal.reviews, DAY).length, 6);
  journal.reviews = review(journal.reviews, '1-1', true, DAY);
  assert.equal(dueLessons(cards, journal.reviews, DAY).length, 5);
  assert.equal(journal.reviews['1-1'].due, 4 * DAY);
  journal.reviews = review(journal.reviews, '1-2', false, DAY);
  assert.equal(journal.reviews['1-2'].due, 2 * DAY);
  assert.equal(journal.reviews['1-1'].due, 4 * DAY);
  assert.deepEqual(completeLesson(journal, lessons[0], DAY), journal);
});
test('new course preserves language separation and rejects old or corrupt progress', () => {
  const empty = restoreState(null, lessons, cards);
  assert.deepEqual(restoreState({ language: 'en', ja: { 1: { completedAt: 0 } } }, lessons, cards), empty);
  const saved = structuredClone(empty);
  saved.language = 'en';
  saved.ja = completeLesson(saved.ja, lessons[0], 0);
  saved.en.reviews['1-1'] = { completedAt: 0, due: 'invalid', stage: 0 };
  const restored = restoreState(saved, lessons, cards);
  assert.equal(restored.language, 'en');
  assert.equal(Object.keys(restored.ja.reviews).length, 6);
  assert.equal(Object.keys(restored.en.reviews).length, 0);
  assert.equal(Object.keys(restored.en.completed).length, 0);
});
test('review schedule, retry and duplicate completion preserve progress',()=>{let r=complete({},1,0);assert.equal(dueLessons(lessons,r,DAY-1).length,0);assert.equal(dueLessons(lessons,r,DAY).length,1);assert.deepEqual(complete(r,1,DAY),r);r=review(r,1,true,DAY);assert.equal(r[1].due,4*DAY);r=review(r,1,true,4*DAY);assert.equal(r[1].due,11*DAY);r=review(r,1,false,11*DAY);assert.equal(r[1].due,12*DAY);assert.equal(r[1].stage,0);assert.deepEqual(review({},1,true),{});});
async function withServer(options,fn){const server=createApp(options);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));try{await fn(`http://127.0.0.1:${server.address().port}`);}finally{await new Promise(resolve=>server.close(resolve));}}
test('static allowlist hides server and secrets; demo is explicit',()=>withServer({apiKey:''},async base=>{assert.equal((await fetch(base)).status,200);assert.deepEqual(await(await fetch(base+'/api/config')).json(),{ai:false});for(const p of ['/.env','/server.mjs','/.git/config'])assert.equal((await fetch(base+p)).status,404);assert.equal((await fetch(base+'/api/chat',{method:'POST'})).status,503);}));
test('AI validation, server-side key, context and response extraction',()=>withServer({apiKey:'test-key',fetchImpl:async(url,init)=>{assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(init.headers.Authorization,'Bearer test-key');const body=JSON.parse(init.body);assert.equal(body.store,false);assert.equal(body.input[0].content,'Hello');assert.match(body.instructions,/English/);assert.match(body.instructions,/기차역/);assert.match(body.instructions,/현지인/);assert.match(body.instructions,/Hangul/);return {ok:true,json:async()=>({output:[{type:'reasoning'},{content:[{type:'output_text',text:'Hello!'}]}]})};}},async base=>{const send=data=>fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});assert.equal((await send({})).status,400);assert.equal((await send(null)).status,400);assert.equal((await send({language:'en',lessonId:1,messages:[{role:'system',content:'bad'}]})).status,400);const r=await send({language:'en',lessonId:1,messages:[{role:'user',content:'Hello'}]});assert.equal(r.status,200);assert.deepEqual(await r.json(),{reply:'Hello!'});}));
