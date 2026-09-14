/** 관리자 화면과 종료 버튼 제거를 실제 브라우저로 확인합니다. */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/* 관리자 비밀번호
   내 컴퓨터에서 점검할 때는 코드 기본값(2580)이 그대로 쓰입니다.
   운영 서버처럼 ADMIN_PW 를 따로 정해 둔 곳을 점검할 때는
   같은 값을 환경변수로 넘겨 주세요.
     예) ADMIN_PW=내비번 node 관리자점검.mjs */
const 관리자비번 = process.env.ADMIN_PW || '2580'

const 주소 = process.env.GOBAEK_URL || 'http://localhost:5180/'
const 포트 = 9884
const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms))
const 줄바꿈 = String.fromCharCode(10)
const 크롬 = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].find((p) => fs.existsSync(p))
const 프로필 = path.join(os.tmpdir(), 'gobaek-admin-' + Date.now())
const 아이 = spawn(
  크롬,
  ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--mute-audio',
   '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows',
   '--disable-renderer-backgrounding',
   '--remote-debugging-port=' + 포트, '--user-data-dir=' + 프로필, 'about:blank'],
  { stdio: 'ignore' }
)
for (let i = 0; i < 80; i++) {
  try { if ((await fetch(`http://127.0.0.1:${포트}/json/version`)).ok) break } catch {}
  await 잠깐(250)
}
const 탭들 = await (await fetch(`http://127.0.0.1:${포트}/json/list`)).json()
const ws = new WebSocket(탭들.find((t) => t.type === 'page').webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r))
let n = 0
const 대기 = new Map()
let 오류모음 = []
ws.addEventListener('message', (e) => {
  const v = JSON.parse(e.data)
  if (v.id && 대기.has(v.id)) { const { s, f } = 대기.get(v.id); 대기.delete(v.id); v.error ? f(new Error(v.error.message)) : s(v.result); return }
  if (v.method === 'Runtime.exceptionThrown') 오류모음.push(String(v.params.exceptionDetails.exception?.description || '').split(줄바꿈)[0])
})
const 보내기 = (m, p = {}) => { const id = ++n; ws.send(JSON.stringify({ id, method: m, params: p })); return new Promise((s, f) => 대기.set(id, { s, f })) }
await 보내기('Runtime.enable'); await 보내기('Page.enable')
const 실행 = async (g) => {
  const r = await 보내기('Runtime.evaluate', { expression: g, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(String(r.exceptionDetails.exception?.description || r.exceptionDetails.text).split(줄바꿈)[0])
  return r.result.value
}
const 글자들 = () => 실행('document.getElementById("root").innerText')
const 누르기 = (글) => 실행('(()=>{const b=[...document.querySelectorAll("button")].find(x=>x.textContent.includes(' + JSON.stringify(글) + '));if(!b)return"없음";if(b.disabled)return"잠김";b.click();return"ok"})()')
const 적기 = (고르개, 값) => 실행('(()=>{const el=document.querySelector(' + JSON.stringify(고르개) + ');if(!el)return"없음";const p=el.tagName==="TEXTAREA"?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,"value").set.call(el,' + JSON.stringify(값) + ');el.dispatchEvent(new Event("input",{bubbles:true}));return"ok"})()')
const 창안에서누르기 = (글) => 실행('(()=>{const 창=document.querySelector(".덮개속");if(!창)return"창없음";const b=[...창.querySelectorAll("button")].find(x=>x.textContent.trim()===' + JSON.stringify(글) + ');if(!b)return"없음";if(b.disabled)return"잠김";b.click();return"ok"})()')

let 통과 = 0, 실패 = 0
const 문제들 = []
const 확인 = (제목, 조건, 설명 = '') => {
  if (조건) { 통과++; console.log('  ✅ ' + 제목) }
  else { 실패++; 문제들.push(제목); console.log('  ❌ ' + 제목 + (설명 ? '  → ' + 설명 : '')) }
}

const 표시 = '관리점검' + Math.random().toString(36).slice(2, 6)

try {
  console.log(줄바꿈 + '관리자 화면 점검 : ' + 주소 + 줄바꿈)
  await 보내기('Page.navigate', { url: 주소 })
  await 잠깐(2500)

  console.log('[1] 종료 버튼이 없어졌는지')
  {
    const 글 = await 글자들()
    확인('메인에 종료 버튼이 없다', !글.includes('종료'), 글.slice(0, 150))
    const ㄱ = await 실행('!!document.querySelector(".종료단추")')
    확인('종료 단추 요소 자체가 없다', ㄱ === false)
    const ㄴ = await 실행('!!document.querySelector(".관리자단추")')
    확인('대신 관리자(열쇠) 단추가 있다', ㄴ === true)
  }

  console.log(줄바꿈 + '[2] 점검용 글 하나 남기기')
  await 누르기('마음 남기기')
  await 잠깐(700)
  await 적기('#내용칸', 표시 + ' 관리자가 지울 글입니다.')
  await 적기('#비번칸', '1111')
  await 잠깐(300)
  await 누르기('이 마음 남기기')
  await 잠깐(1800)
  {
    const 글 = await 글자들()
    확인('글이 목록에 올라왔다', 글.includes(표시), 글.slice(0, 150))
  }

  console.log(줄바꿈 + '[3] 관리자 들어가기')
  {
    const ㄱ = await 실행('document.querySelector(".관리자단추").click(); true')
    await 잠깐(800)
    const 글 = await 글자들()
    확인('관리자 창이 열린다', 글.includes('관리자 비밀번호'), 글.slice(0, 150))
  }
  {
    await 적기('#관리자비번칸', '0000')
    await 잠깐(300)
    await 창안에서누르기('들어가기')
    await 잠깐(2000)
    const 글 = await 글자들()
    확인('틀린 비번은 막힌다', /맞지 않/.test(글), 글.slice(0, 200))
  }
  {
    await 적기('#관리자비번칸', 관리자비번)
    await 잠깐(300)
    await 창안에서누르기('들어가기')
    await 잠깐(2200)
    const 글 = await 글자들()
    확인('맞는 비번으로 들어가진다', 글.includes('관리자 모드'), 글.slice(0, 220))
  }

  console.log(줄바꿈 + '[4] 관리자가 글 지우기')
  {
    const ㄱ = await 실행('document.querySelectorAll(".관리자칸").length')
    확인('카드마다 관리자 단추가 붙는다', ㄱ >= 1, '개수 ' + ㄱ)
  }
  {
    // confirm 을 자동으로 예 로 답하게 합니다.
    await 실행('window.confirm = () => true; true')
    const ㄱ = await 실행(
      '(()=>{const ㄱ=[...document.querySelectorAll("article")].find(x=>x.textContent.includes(' +
        JSON.stringify(표시) + '));if(!ㄱ)return"글없음";' +
        'const b=ㄱ.querySelector(".단추.지움");if(!b)return"단추없음";b.click();return"ok"})()'
    )
    await 잠깐(2000)
    const 글 = await 글자들()
    확인('관리자가 남의 글을 지운다', ㄱ === 'ok' && !글.includes(표시), ㄱ + ' / ' + 글.slice(0, 150))
  }

  console.log(줄바꿈 + '[5] 관리자에서 나가기')
  {
    await 누르기('나가기')
    await 잠깐(1800)
    const 글 = await 글자들()
    확인('관리자 모드가 꺼진다', !글.includes('관리자 모드'), 글.slice(0, 150))
    const ㄱ = await 실행('!!document.querySelector(".관리자단추")')
    확인('열쇠 단추가 다시 보인다', ㄱ === true)
  }
  {
    // 새로고침해도 관리자 상태가 남아 있지 않아야 합니다.
    await 보내기('Page.reload')
    await 잠깐(2500)
    const 글 = await 글자들()
    확인('새로고침해도 관리자로 안 남는다', !글.includes('관리자 모드'))
  }

  console.log(줄바꿈 + '[6] 오류')
  확인('브라우저 오류가 없다', 오류모음.length === 0, 오류모음.slice(0, 2).join(' / '))
} catch (ㅇ) {
  확인('점검이 끝까지 돌았다', false, ㅇ.message)
}

아이.kill()
try { fs.rmSync(프로필, { recursive: true, force: true }) } catch {}
console.log(줄바꿈 + '─'.repeat(44))
console.log('  통과 ' + 통과 + ' / 실패 ' + 실패)
if (문제들.length) console.log('  문제 : ' + 문제들.join(', '))
console.log('─'.repeat(44))
process.exit(실패 > 0 ? 1 : 0)
