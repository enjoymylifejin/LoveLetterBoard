/**
 * 화면 점검
 * ------------------------------------------------------------
 * 진짜 크롬을 띄워서 글을 쓰고, 하트를 누르고, 댓글을 달고, 지워 봅니다.
 * 설치(바탕화면 아이콘) 준비물도 함께 확인합니다.
 *
 *   실행 : node 화면점검.mjs      (먼저 node 로컬서버.mjs 를 켜 두세요)
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const 주소 = process.env.GOBAEK_URL || 'http://localhost:5180/'
const 포트 = 9881
const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms))
const 줄바꿈 = String.fromCharCode(10)

const 크롬 = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find((ㅍ) => fs.existsSync(ㅍ))
if (!크롬) {
  console.error('크롬이나 엣지를 찾지 못했습니다.')
  process.exit(1)
}

const 프로필 = path.join(os.tmpdir(), 'gobaek-화면-' + Date.now())
const 아이 = spawn(
  크롬,
  [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
    '--disable-extensions', '--mute-audio',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--remote-debugging-port=' + 포트,
    '--user-data-dir=' + 프로필,
    'about:blank',
  ],
  { stdio: 'ignore' }
)

for (let i = 0; i < 80; i++) {
  try {
    if ((await fetch(`http://127.0.0.1:${포트}/json/version`)).ok) break
  } catch {}
  await 잠깐(250)
}
const 탭들 = await (await fetch(`http://127.0.0.1:${포트}/json/list`)).json()
const ws = new WebSocket(탭들.find((ㅌ) => ㅌ.type === 'page').webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r))

let 번호 = 0
const 대기 = new Map()
let 오류모음 = []

ws.addEventListener('message', (ㅇ) => {
  const 값 = JSON.parse(ㅇ.data)
  if (값.id && 대기.has(값.id)) {
    const { 성공, 실패 } = 대기.get(값.id)
    대기.delete(값.id)
    값.error ? 실패(new Error(값.error.message)) : 성공(값.result)
    return
  }
  if (값.method === 'Runtime.exceptionThrown') {
    const ㄷ = 값.params.exceptionDetails
    오류모음.push(String(ㄷ.exception?.description || ㄷ.text).split(줄바꿈)[0])
  }
  if (값.method === 'Runtime.consoleAPICalled' && 값.params.type === 'error') {
    const 글 = (값.params.args || []).map((ㄱ) => String(ㄱ.value ?? ㄱ.description ?? '')).join(' ')
    if (글 && !/DevTools|sw\.js|ServiceWorker/i.test(글)) 오류모음.push(글.slice(0, 150))
  }
})

const 보내기 = (방법, 인자 = {}) => {
  const id = ++번호
  ws.send(JSON.stringify({ id, method: 방법, params: 인자 }))
  return new Promise((성공, 실패) => 대기.set(id, { 성공, 실패 }))
}
await 보내기('Runtime.enable')
await 보내기('Page.enable')

const 실행 = async (글) => {
  const ㄱ = await 보내기('Runtime.evaluate', {
    expression: 글, returnByValue: true, awaitPromise: true,
  })
  if (ㄱ.exceptionDetails) {
    throw new Error(
      String(ㄱ.exceptionDetails.exception?.description || ㄱ.exceptionDetails.text).split(줄바꿈)[0]
    )
  }
  return ㄱ.result.value
}
const 글자들 = () => 실행('document.getElementById("root").innerText')
const 누르기 = (글, 몇 = 0) =>
  실행(
    '(()=>{const m=[...document.querySelectorAll("button")].filter(x=>x.textContent.includes(' +
      JSON.stringify(글) + '));const b=m[' + 몇 + '];' +
      'if(!b)return"없음";if(b.disabled)return"잠김";b.click();return"ok"})()'
  )
/** 리액트가 알아채도록 입력칸에 글자를 넣습니다. */
const 적기 = (고르개, 값) =>
  실행(
    '(()=>{const el=document.querySelector(' + JSON.stringify(고르개) + ');if(!el)return"없음";' +
      'const p=el.tagName==="TEXTAREA"?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype;' +
      'Object.getOwnPropertyDescriptor(p,"value").set.call(el,' + JSON.stringify(값) + ');' +
      'el.dispatchEvent(new Event("input",{bubbles:true}));return"ok"})()'
  )

/** 열려 있는 창(덮개) 안의 단추만 누릅니다. */
const 창안에서누르기 = (글) =>
  실행(
    '(()=>{const 창=document.querySelector(".덮개속");if(!창)return"창없음";' +
      'const b=[...창.querySelectorAll("button")].find(x=>x.textContent.trim()===' +
      JSON.stringify(글) + ');' +
      'if(!b)return"없음";if(b.disabled)return"잠김";b.click();return"ok"})()'
  )

/** 하트 단추만 콕 집어 누릅니다. (설렘 태그의 💗 와 헷갈리지 않게) */
const 하트누르기 = () =>
  실행(
    '(()=>{const 창=document.querySelector(".덮개속")||document;' +
      'const b=창.querySelector(".하트단추");if(!b)return"없음";' +
      'if(b.disabled)return"잠김";b.click();return"ok"})()'
  )

let 통과 = 0, 실패 = 0
const 문제들 = []
function 확인(제목, 조건, 설명 = '') {
  if (조건) { 통과++; console.log('  ✅ ' + 제목) }
  else { 실패++; 문제들.push(제목 + (설명 ? ' — ' + 설명 : '')); console.log('  ❌ ' + 제목 + (설명 ? '  → ' + 설명 : '')) }
}

const 표시 = '점검' + Math.random().toString(36).slice(2, 7)

try {
  console.log(줄바꿈 + '마음 우체통 화면 점검 : ' + 주소 + 줄바꿈)

  /* ── [1] 첫 화면 ── */
  console.log('[1] 첫 화면')
  await 보내기('Page.navigate', { url: 주소 })
  await 잠깐(2500)
  {
    const 글 = await 글자들()
    확인('제목이 보인다', 글.includes('마음 우체통'), 글.slice(0, 80))
    확인('마음 남기기 단추가 있다', 글.includes('마음 남기기'))
    확인('마음 태그가 보인다', 글.includes('설렘') && 글.includes('짝사랑'))
    확인('화면이 깨지지 않았다', !/undefined|NaN|\[object/.test(글))
  }

  /* ── [2] 설치(바탕화면 아이콘) 준비물 ── */
  console.log(줄바꿈 + '[2] 바탕화면 아이콘 준비물')
  {
    const ㄱ = await 실행(
      '(async()=>{const r=await fetch("./manifest.webmanifest");const j=await r.json();' +
        'return {ok:r.ok,이름:j.name,모양:j.display,시작:j.start_url,아이콘수:(j.icons||[]).length,' +
        '마스크:(j.icons||[]).filter(i=>String(i.purpose).includes("maskable")).length}})()'
    )
    확인('manifest 파일이 열린다', ㄱ?.ok === true, JSON.stringify(ㄱ))
    확인('앱처럼 열리게 되어 있다', ㄱ?.모양 === 'standalone', ㄱ?.모양)
    확인('아이콘이 4개 들어 있다', ㄱ?.아이콘수 === 4, String(ㄱ?.아이콘수))
    확인('둥글게 잘려도 되는 아이콘이 있다', ㄱ?.마스크 >= 2, String(ㄱ?.마스크))
  }
  {
    const ㄱ = await 실행(
      '(async()=>{const 것들=["./icons/icon-192.png","./icons/icon-512.png",' +
        '"./icons/maskable-512.png","./icons/apple-touch-icon.png","./sw.js"];' +
        'const 답=[];for(const ㅇ of 것들){try{const r=await fetch(ㅇ);답.push(r.ok)}catch{답.push(false)}}' +
        'return 답})()'
    )
    확인('아이콘·서비스워커 파일이 모두 있다', Array.isArray(ㄱ) && ㄱ.every(Boolean), JSON.stringify(ㄱ))
  }
  {
    const ㄱ = await 실행('!!document.querySelector(\'link[rel="apple-touch-icon"]\')')
    확인('아이폰용 아이콘 표시가 있다', ㄱ === true)
  }
  {
    // 서비스워커는 실제로 등록되어야 설치가 됩니다.
    await 잠깐(1500)
    const ㄱ = await 실행(
      '(async()=>{if(!navigator.serviceWorker)return"없음";' +
        'const r=await navigator.serviceWorker.getRegistrations();return r.length})()'
    )
    확인('서비스워커가 등록된다', ㄱ >= 1, String(ㄱ))
  }
  {
    // /api 응답을 담아 두면 새 글이 안 보이게 됩니다. 절대 담으면 안 됩니다.
    const ㄱ = await 실행('fetch("./sw.js").then(r=>r.text())')
    확인(
      '서비스워커가 글 요청은 담아 두지 않는다',
      /startsWith\('\/api\/'\)|startsWith\("\/api\/"\)/.test(ㄱ),
      'sw.js 에 /api 제외 규칙이 없습니다'
    )
  }

  /* ── [3] 글쓰기 ── */
  console.log(줄바꿈 + '[3] 글 남기기')
  await 누르기('마음 남기기')
  await 잠깐(700)
  {
    const 글 = await 글자들()
    확인('글쓰기 창이 열린다', 글.includes('하고 싶은 말'))
  }
  {
    // 글쓴이 이름을 받는 칸이 아예 없어야 진짜 익명입니다.
    const ㄱ = await 실행(
      '(()=>{const 창=document.querySelector(".덮개속");if(!창)return null;' +
        'return [...창.querySelectorAll("input,textarea")].map(e=>' +
        '(e.id||"")+"|"+(e.placeholder||""))})()'
    )
    const 이름칸 = (ㄱ || []).filter((ㄴ) => /닉네임|글쓴이|작성자/.test(ㄴ))
    확인('글쓴이 이름을 받는 칸이 없다', 이름칸.length === 0, JSON.stringify(ㄱ))
  }
  {
    const ㄱ = await 누르기('이 마음 남기기')
    확인('내용 없이는 못 보낸다', ㄱ === '잠김', ㄱ)
  }
  {
    const 글 = await 글자들()
    확인('1000자까지 쓸 수 있다고 알려 준다', /\/ 1000/.test(글), 글.slice(0, 200))
    const ㄱ = await 실행('document.querySelector("#내용칸").maxLength')
    확인('입력칸도 1000자까지 받는다', ㄱ === 1000, String(ㄱ))
  }
  await 적기('#내용칸', 표시 + ' 오래 마음에 담아 두었던 이야기를 여기에 남깁니다.')
  await 적기('#받는이칸', '창가 그분')
  await 잠깐(300)
  {
    const ㄱ = await 누르기('이 마음 남기기')
    확인('숫자 4자리 없이는 못 보낸다', ㄱ === '잠김', ㄱ)
  }
  await 적기('#비번칸', '4321')
  await 잠깐(300)
  {
    const ㄱ = await 누르기('이 마음 남기기')
    확인('다 채우면 보낼 수 있다', ㄱ === 'ok', ㄱ)
  }
  await 잠깐(1800)
  {
    const 글 = await 글자들()
    확인('쓴 글이 목록에 바로 뜬다', 글.includes(표시), 글.slice(0, 200))
    확인('내 글이라고 표시된다', 글.includes('내 글'))
    확인('익명 별명이 붙는다', /#[0-9A-F]{4}/.test(글))
    확인('받는 사람이 보인다', 글.includes('창가 그분'))
  }

  /* ── [4] 글 펼쳐 보고 하트·댓글 ── */
  console.log(줄바꿈 + '[4] 하트와 응원 한마디')
  await 실행(
    '(()=>{const ㄱ=[...document.querySelectorAll("article")].find(x=>x.textContent.includes(' +
      JSON.stringify(표시) + '));if(ㄱ)ㄱ.click();return!!ㄱ})()'
  )
  await 잠깐(1200)
  {
    const 글 = await 글자들()
    확인('글이 펼쳐진다', 글.includes('응원 한마디'))
  }
  {
    const ㄱ = await 하트누르기()
    await 잠깐(1200)
    const 글 = await 글자들()
    확인('하트가 눌린다', ㄱ === 'ok' && 글.includes('💗 1'), 글.slice(0, 160))
  }
  {
    const ㄱ = await 하트누르기()
    확인('같은 사람은 하트를 두 번 못 누른다', ㄱ === '잠김', ㄱ)
  }
  await 적기('.덮개속 input[placeholder*="따뜻한"]', '응원합니다! 꼭 잘 되길 바라요.')
  await 잠깐(300)
  {
    const ㄴ = await 창안에서누르기('남기기')
    await 잠깐(1500)
    const 글 = await 글자들()
    확인('댓글이 달린다', 글.includes('응원합니다'), ㄴ + ' / ' + 글.slice(-200))
  }

  /* ── [4-2] 뒤로가기 ── */
  console.log(줄바꿈 + '[4-2] 뒤로가기')
  {
    // 창 안에 '← 뒤로' 단추가 보이는지
    const ㄱ = await 실행(
      '(()=>{const 창=document.querySelector(".덮개속");if(!창)return null;' +
        'const b=창.querySelector(".뒤로");if(!b)return null;' +
        'const r=b.getBoundingClientRect();' +
        'return {글:b.textContent.trim(),위:Math.round(r.top),높이:Math.round(r.height)}})()'
    )
    확인('창 안에 뒤로 단추가 있다', !!ㄱ, JSON.stringify(ㄱ))
    확인('손가락으로 누를 만큼 크다', (ㄱ?.높이 || 0) >= 40, '높이 ' + ㄱ?.높이 + 'px')
  }
  {
    // 닫기(×) 단추가 화면 위쪽에 잘려 있지 않은지 (아이폰 시계에 가리는 문제)
    const ㄱ = await 실행(
      '(()=>{const 창=document.querySelector(".덮개속");if(!창)return null;' +
        'const b=창.querySelector(".닫기");if(!b)return null;' +
        'const r=b.getBoundingClientRect();' +
        'return {위:Math.round(r.top),오른쪽:Math.round(r.right),' +
        '창너비:Math.round(window.innerWidth),보임:r.top>=0&&r.bottom<=window.innerHeight}})()'
    )
    확인('닫기 단추가 화면 안에 온전히 보인다', ㄱ?.보임 === true, JSON.stringify(ㄱ))
    확인('닫기 단추가 화면 위로 잘리지 않았다', (ㄱ?.위 ?? -1) >= 0, '위쪽 ' + ㄱ?.위 + 'px')
  }
  {
    // 머리줄이 내용과 함께 굴러가 사라지지 않는지 (고정되어 있어야 함)
    await 실행('document.querySelector(".덮개내용").scrollTop = 9999')
    await 잠깐(400)
    const ㄱ = await 실행(
      '(()=>{const b=document.querySelector(".덮개속 .닫기");if(!b)return null;' +
        'const r=b.getBoundingClientRect();return r.top>=0&&r.height>0})()'
    )
    확인('아래로 굴려도 닫기 단추가 그대로 보인다', ㄱ === true, String(ㄱ))
    await 실행('document.querySelector(".덮개내용").scrollTop = 0')
    await 잠깐(300)
  }
  {
    // 브라우저 뒤로가기를 눌러도 사이트를 벗어나지 않고 창만 닫혀야 합니다.
    const 전주소 = await 실행('location.pathname')
    await 실행('history.back()')
    await 잠깐(900)
    const ㄱ = await 실행('!!document.querySelector(".덮개속")')
    const 후주소 = await 실행('location.pathname')
    const 글 = await 글자들()
    확인('뒤로가기를 누르면 창이 닫힌다', ㄱ === false, '창이 아직 열려 있습니다')
    확인('뒤로가기로 사이트를 벗어나지 않는다', 후주소 === 전주소 && 글.includes('마음 우체통'), 후주소)
  }
  {
    // 다시 열어서 다음 검사를 이어 갑니다.
    await 실행(
      '(()=>{const ㄱ=[...document.querySelectorAll("article")].find(x=>x.textContent.includes(' +
        JSON.stringify(표시) + '));if(ㄱ)ㄱ.click();return!!ㄱ})()'
    )
    await 잠깐(1200)
    const 글 = await 글자들()
    확인('글을 다시 열 수 있다', 글.includes('응원 한마디'), 글.slice(0, 120))
  }

  /* ── [4-3] 내가 쓴 글 고치기 ── */
  console.log(줄바꿈 + '[4-3] 내가 쓴 글 고치기')
  {
    const ㄱ = await 창안에서누르기('✏️ 고치기')
    await 잠깐(700)
    확인('고치기 칸이 열린다', ㄱ === 'ok', ㄱ)
    const 글 = await 글자들()
    확인('고치기 칸에도 1000자 안내가 있다', /\/ 1000/.test(글), 글.slice(-300))
  }
  {
    // 내용을 바꾸고 저장합니다.
    const ㄱ = await 실행(
      '(()=>{const 창=document.querySelector(".덮개속");if(!창)return"창없음";' +
        'const t=창.querySelector("textarea");if(!t)return"칸없음";' +
        'const s=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,"value").set;' +
        's.call(t,' + JSON.stringify(표시 + ' 고쳐서 바뀐 내용입니다.') + ');' +
        't.dispatchEvent(new Event("input",{bubbles:true}));return"ok"})()'
    )
    확인('고칠 내용을 적을 수 있다', ㄱ === 'ok', ㄱ)
  }
  {
    const ㄱ = await 실행(
      '(()=>{const 창=document.querySelector(".덮개속");' +
        'const 칸들=[...창.querySelectorAll("input[inputmode=numeric]")];' +
        'const el=칸들[칸들.length-1];if(!el)return"칸없음";' +
        'const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value").set;' +
        's.call(el,"0000");el.dispatchEvent(new Event("input",{bubbles:true}));return"ok"})()'
    )
    await 잠깐(300)
    await 창안에서누르기('고친 내용 저장')
    await 잠깐(1600)
    const 글 = await 글자들()
    확인('틀린 숫자로는 못 고친다', /맞지 않/.test(글), 글.slice(-250))
  }
  {
    const ㄱ = await 실행(
      '(()=>{const 창=document.querySelector(".덮개속");' +
        'const 칸들=[...창.querySelectorAll("input[inputmode=numeric]")];' +
        'const el=칸들[칸들.length-1];if(!el)return"칸없음";' +
        'const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value").set;' +
        's.call(el,"4321");el.dispatchEvent(new Event("input",{bubbles:true}));return"ok"})()'
    )
    await 잠깐(300)
    await 창안에서누르기('고친 내용 저장')
    await 잠깐(1800)
    const 글 = await 글자들()
    확인('맞는 숫자로 고쳐진다', 글.includes('고쳐서 바뀐 내용'), 글.slice(0, 300))
    확인('고침 표시가 붙는다', /· 고침/.test(글), 글.slice(0, 200))
  }

  /* ── [5] 지우기 ── */
  console.log(줄바꿈 + '[5] 내가 쓴 글 지우기')
  {
    const ㄱ = await 창안에서누르기('🗑 지우기')
    await 잠깐(500)
    확인('지우기 칸이 열린다', ㄱ === 'ok', ㄱ)
  }
  await 적기('.덮개속 input[inputmode="numeric"]', '0000')
  await 잠깐(300)
  await 창안에서누르기('정말 지우기')
  await 잠깐(1400)
  {
    const 글 = await 글자들()
    확인('틀린 숫자로는 안 지워진다', /맞지 않/.test(글), 글.slice(-200))
  }
  await 적기('.덮개속 input[inputmode="numeric"]', '4321')
  await 잠깐(300)
  await 창안에서누르기('정말 지우기')
  await 잠깐(1600)
  {
    const 글 = await 글자들()
    확인('맞는 숫자로 지워진다', !글.includes(표시), 글.slice(0, 200))
  }

  /* ── [6] 오류 ── */
  console.log(줄바꿈 + '[6] 오류')
  확인('브라우저 오류가 없다', 오류모음.length === 0, 오류모음.slice(0, 3).join(' / '))
} catch (ㅇ) {
  확인('점검이 끝까지 돌았다', false, ㅇ.message)
}

아이.kill()
try { fs.rmSync(프로필, { recursive: true, force: true }) } catch {}

console.log(줄바꿈 + '─'.repeat(46))
console.log('  통과 ' + 통과 + ' / 실패 ' + 실패)
if (문제들.length > 0) {
  console.log(줄바꿈 + '  찾은 문제')
  문제들.forEach((ㅁ, i) => console.log('   ' + (i + 1) + '. ' + ㅁ))
}
console.log('─'.repeat(46) + 줄바꿈)
process.exit(실패 > 0 ? 1 : 0)
