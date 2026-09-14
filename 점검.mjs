/**
 * 서버 점검
 * ------------------------------------------------------------
 * 로컬서버를 띄운 뒤, 글쓰기부터 지우기까지 전부 실제로 해 봅니다.
 *
 *   실행 : node 점검.mjs           (먼저 node 로컬서버.mjs 를 켜 두세요)
 *   또는 : node 점검.mjs --직접     (서버를 알아서 띄웠다 끕니다)
 */
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

const 스스로 = process.argv.includes('--직접')
const 포트 = Number(process.env.PORT || (스스로 ? 5188 : 5180))
const 바탕 = 'http://localhost:' + 포트
const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms))
const 줄바꿈 = String.fromCharCode(10)

let 아이 = null
const 데이터 = path.join(os.tmpdir(), 'gobaek-점검-' + Date.now() + '.json')

if (스스로) {
  아이 = spawn(process.execPath, ['로컬서버.mjs'], {
    env: { ...process.env, PORT: String(포트), GOBAEK_DATA: 데이터 },
    stdio: 'ignore',
  })
  for (let i = 0; i < 60; i++) {
    try {
      const ㄱ = await fetch(바탕 + '/api/board?do=ping')
      if (ㄱ.ok) break
    } catch {}
    await 잠깐(250)
  }
}

let 통과 = 0
let 실패 = 0
const 문제들 = []

function 확인(제목, 조건, 설명 = '') {
  if (조건) {
    통과++
    console.log('  ✅ ' + 제목)
  } else {
    실패++
    문제들.push(제목 + (설명 ? ' — ' + 설명 : ''))
    console.log('  ❌ ' + 제목 + (설명 ? '  → ' + 설명 : ''))
  }
}

/** 서버를 부릅니다. */
async function 부르기(동작, { 검색 = {}, 몸 = null } = {}) {
  const 주소 = new URL(바탕 + '/api/board')
  주소.searchParams.set('do', 동작)
  for (const [ㅋ, ㅄ] of Object.entries(검색)) 주소.searchParams.set(ㅋ, String(ㅄ))
  const 설정 = { method: 몸 ? 'POST' : 'GET', headers: {} }
  if (몸) {
    설정.headers['content-type'] = 'application/json'
    설정.body = JSON.stringify(몸)
  }
  const 답 = await fetch(주소, 설정)
  let 값 = null
  try {
    값 = await 답.json()
  } catch {
    값 = null
  }
  return { 코드: 답.status, 값 }
}

const 손님갑 = 'aaaa' + Math.random().toString(36).slice(2, 12)
const 손님을 = 'bbbb' + Math.random().toString(36).slice(2, 12)

console.log(줄바꿈 + '마음 우체통 점검 : ' + 바탕 + 줄바꿈)

try {
  /* ── [1] 서버가 살아 있는가 ── */
  console.log('[1] 서버')
  {
    const ㄱ = await 부르기('ping')
    확인('서버가 답한다', ㄱ.코드 === 200 && ㄱ.값?.잘됨 === true, JSON.stringify(ㄱ.값))
    console.log('     저장소 : ' + (ㄱ.값?.저장소 || '?'))
  }

  /* ── [2] 글쓰기 ── */
  console.log(줄바꿈 + '[2] 글쓰기')
  let 글번호 = null
  {
    const ㄱ = await 부르기('write', {
      몸: {
        손님: 손님갑,
        내용: '오늘도 지나가며 인사만 했지만, 사실은 많이 좋아하고 있었어요. 언젠가 용기 내볼게요.',
        받는이: '3층 그분',
        태그: 'jjaksarang',
        비번: '1234',
      },
    })
    확인('글이 써진다', ㄱ.코드 === 200 && !!ㄱ.값?.id, JSON.stringify(ㄱ.값))
    확인('익명 별명이 붙는다', /#[0-9A-F]{4}$/.test(ㄱ.값?.별명 || ''), ㄱ.값?.별명)
    글번호 = ㄱ.값?.id
  }
  {
    const ㄱ = await 부르기('write', {
      몸: { 손님: 손님을, 내용: '짧', 받는이: '', 태그: 'seolem', 비번: '1111' },
    })
    확인('너무 짧은 글은 막힌다', ㄱ.코드 === 400, JSON.stringify(ㄱ.값))
  }
  {
    const ㄱ = await 부르기('write', {
      몸: { 손님: 손님을, 내용: '비밀번호가 없는 글입니다', 태그: 'seolem', 비번: 'abcd' },
    })
    확인('숫자 4자리가 아니면 막힌다', ㄱ.코드 === 400, JSON.stringify(ㄱ.값))
  }
  {
    // 같은 사람이 연달아 쓰면 막혀야 합니다.
    const ㄱ = await 부르기('write', {
      몸: { 손님: 손님갑, 내용: '연달아 쓰는 도배 글입니다', 태그: 'seolem', 비번: '1234' },
    })
    확인('도배가 막힌다', ㄱ.코드 === 429, JSON.stringify(ㄱ.값))
  }

  /* ── [3] 목록 ── */
  console.log(줄바꿈 + '[3] 목록')
  {
    const ㄱ = await 부르기('list')
    const 있나 = (ㄱ.값?.글들 || []).some((ㄴ) => ㄴ.id === 글번호)
    확인('방금 쓴 글이 목록에 바로 보인다', 있나, JSON.stringify(ㄱ.값?.글들?.length))
    const 첫 = (ㄱ.값?.글들 || []).find((ㄴ) => ㄴ.id === 글번호)
    확인('목록에 비밀번호가 새지 않는다', 첫 && !('비번' in 첫) && !('소금' in 첫), JSON.stringify(첫))
  }
  {
    const ㄱ = await 부르기('list', { 검색: { tag: 'jjaksarang' } })
    확인('마음 태그로 거를 수 있다', (ㄱ.값?.글들 || []).every((ㄴ) => ㄴ.태그 === 'jjaksarang'))
  }
  {
    const ㄱ = await 부르기('list', { 검색: { tag: 'gomawo' } })
    확인('다른 태그에는 안 나온다', !(ㄱ.값?.글들 || []).some((ㄴ) => ㄴ.id === 글번호))
  }
  {
    const ㄱ = await 부르기('list', { 검색: { q: '3층' } })
    확인('받는 사람으로 찾을 수 있다', (ㄱ.값?.글들 || []).some((ㄴ) => ㄴ.id === 글번호))
  }

  /* ── [4] 글 하나 보기 ── */
  console.log(줄바꿈 + '[4] 글 보기')
  {
    const ㄱ = await 부르기('post', { 검색: { id: 글번호 } })
    확인('글을 펼쳐 볼 수 있다', ㄱ.코드 === 200 && !!ㄱ.값?.글)
    확인(
      '비밀번호가 절대 안 나온다',
      ㄱ.값?.글 && !('비번' in ㄱ.값.글) && !('소금' in ㄱ.값.글),
      Object.keys(ㄱ.값?.글 || {}).join(',')
    )
  }
  {
    const ㄱ = await 부르기('post', { 검색: { id: 'zzzzzzzz' } })
    확인('없는 글은 404', ㄱ.코드 === 404)
  }

  /* ── [5] 하트 ── */
  console.log(줄바꿈 + '[5] 하트')
  {
    const ㄱ = await 부르기('heart', { 몸: { 손님: 손님을, id: 글번호 } })
    확인('하트가 눌린다', ㄱ.코드 === 200 && ㄱ.값?.하트 === 1, JSON.stringify(ㄱ.값))
  }
  {
    const ㄱ = await 부르기('heart', { 몸: { 손님: 손님을, id: 글번호 } })
    확인('같은 사람은 두 번 못 누른다', ㄱ.코드 === 409, JSON.stringify(ㄱ.값))
  }
  {
    const ㄱ = await 부르기('heart', { 몸: { 손님: 손님갑, id: 글번호 } })
    확인('다른 사람은 누를 수 있다', ㄱ.코드 === 200 && ㄱ.값?.하트 === 2, JSON.stringify(ㄱ.값))
  }

  /* ── [6] 응원 한마디 ── */
  console.log(줄바꿈 + '[6] 응원 한마디')
  {
    const ㄱ = await 부르기('comment', { 몸: { 손님: 손님을, id: 글번호, 내용: '응원할게요!' } })
    확인('댓글이 달린다', ㄱ.코드 === 200 && ㄱ.값?.댓글수 === 1, JSON.stringify(ㄱ.값))
    확인('댓글에도 익명 별명이 붙는다', /#[0-9A-F]{4}$/.test(ㄱ.값?.댓글?.별명 || ''))
  }
  {
    const ㄱ = await 부르기('comment', { 몸: { 손님: 손님을, id: 글번호, 내용: 'ㅇ' } })
    확인('너무 짧은 댓글은 막힌다', ㄱ.코드 === 400)
  }
  {
    const ㄱ = await 부르기('post', { 검색: { id: 글번호 } })
    확인('댓글이 글에 붙어 보인다', (ㄱ.값?.댓글들 || []).length === 1)
  }

  /* ── [7] 지우기 ── */
  console.log(줄바꿈 + '[7] 지우기')
  {
    const ㄱ = await 부르기('remove', { 몸: { id: 글번호, 비번: '9999' } })
    확인('틀린 숫자로는 못 지운다', ㄱ.코드 === 403, JSON.stringify(ㄱ.값))
  }
  {
    const ㄱ = await 부르기('remove', { 몸: { id: 글번호, 비번: '1234' } })
    확인('맞는 숫자로 지워진다', ㄱ.코드 === 200 && ㄱ.값?.지움 === true, JSON.stringify(ㄱ.값))
  }
  {
    const ㄱ = await 부르기('list')
    확인('지운 글은 목록에서 사라진다', !(ㄱ.값?.글들 || []).some((ㄴ) => ㄴ.id === 글번호))
  }
  {
    const ㄱ = await 부르기('post', { 검색: { id: 글번호 } })
    확인('지운 글은 열리지 않는다', ㄱ.코드 === 404)
  }

  /* ── [8] 신고로 가려지는가 ── */
  console.log(줄바꿈 + '[8] 신고')
  let 신고글 = null
  {
    const ㄱ = await 부르기('write', {
      몸: {
        손님: 'cccc' + Math.random().toString(36).slice(2, 12),
        내용: '신고 점검용으로 쓰는 글입니다.',
        태그: 'seolem',
        비번: '5555',
      },
    })
    신고글 = ㄱ.값?.id
    확인('신고 점검용 글을 썼다', !!신고글)
  }
  for (let i = 1; i <= 3; i++) {
    const ㄱ = await 부르기('report', {
      몸: { 손님: 'rep' + i + Math.random().toString(36).slice(2, 10), id: 신고글 },
    })
    if (i < 3) 확인(i + '번째 신고가 접수된다', ㄱ.코드 === 200 && !ㄱ.값?.숨김)
    else 확인('3번 쌓이면 가려진다', ㄱ.코드 === 200 && ㄱ.값?.숨김 === true, JSON.stringify(ㄱ.값))
  }
  {
    const ㄱ = await 부르기('list')
    확인('가려진 글은 목록에 안 보인다', !(ㄱ.값?.글들 || []).some((ㄴ) => ㄴ.id === 신고글))
  }
  {
    const ㄱ = await 부르기('report', { 몸: { 손님: 'rep1x', id: 신고글 } })
    확인('손님 번호가 짧으면 막힌다', ㄱ.코드 === 400)
  }

  /* ── [9] 이상한 값 ── */
  console.log(줄바꿈 + '[9] 이상한 값을 넣어도 안 죽는가')
  {
    const ㄱ = await 부르기('nonsense')
    확인('없는 기능은 404', ㄱ.코드 === 404)
  }
  {
    const ㄱ = await 부르기('write', { 몸: { 손님: 손님을, 내용: 'x'.repeat(5000), 비번: '2222' } })
    확인('아주 긴 글도 잘라서 받는다', ㄱ.코드 === 200 || ㄱ.코드 === 429, JSON.stringify(ㄱ.값))
  }
  {
    const ㄱ = await 부르기('list', { 검색: { from: '-99', sort: '이상한값' } })
    확인('이상한 검색값에도 목록이 나온다', ㄱ.코드 === 200 && Array.isArray(ㄱ.값?.글들))
  }

  /* ── [10] 관리자 ── */
  console.log(줄바꿈 + '[10] 관리자')
  let 열쇠 = null
  {
    const ㄱ = await 부르기('admin_in', { 몸: { 비번: '9999' } })
    확인('틀린 관리자 비번은 막힌다', ㄱ.코드 === 403, JSON.stringify(ㄱ.값))
  }
  {
    const ㄱ = await 부르기('admin_in', { 몸: { 비번: 관리자비번 } })
    확인('2580 으로 관리자에 들어간다', ㄱ.코드 === 200 && !!ㄱ.값?.열쇠, JSON.stringify(ㄱ.값))
    열쇠 = ㄱ.값?.열쇠
    확인('열쇠가 추측하기 어렵게 길다', (열쇠 || '').length >= 40, '길이 ' + (열쇠 || '').length)
  }
  {
    const ㄱ = await 부르기('admin_check', { 몸: { 열쇠 } })
    확인('관리자 열쇠가 확인된다', ㄱ.값?.관리자 === true, JSON.stringify(ㄱ.값))
  }
  {
    const ㄱ = await 부르기('admin_check', { 몸: { 열쇠: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' } })
    확인('가짜 열쇠는 안 통한다', ㄱ.값?.관리자 === false, JSON.stringify(ㄱ.값))
  }

  // 남이 쓴 글을 관리자가 지울 수 있어야 합니다.
  let 남의글 = null
  {
    const ㄱ = await 부르기('write', {
      몸: {
        손님: 'other' + Math.random().toString(36).slice(2, 12),
        내용: '관리자가 지울 남의 글입니다.',
        태그: 'seolem',
        비번: '7777',
      },
    })
    남의글 = ㄱ.값?.id
    확인('남의 글을 하나 썼다', !!남의글)
  }
  {
    const ㄱ = await 부르기('admin_remove', { 몸: { 열쇠: '', id: 남의글 } })
    확인('열쇠 없이는 못 지운다', ㄱ.코드 === 403, JSON.stringify(ㄱ.값))
  }
  {
    const ㄱ = await 부르기('admin_remove', { 몸: { 열쇠, id: 남의글 } })
    확인('관리자는 비번 없이 지운다', ㄱ.코드 === 200 && ㄱ.값?.지움, JSON.stringify(ㄱ.값))
  }
  {
    const ㄱ = await 부르기('list')
    확인('지운 글이 목록에서 빠진다', !(ㄱ.값?.글들 || []).some((ㄴ) => ㄴ.id === 남의글))
  }

  // 신고로 가려진 글을 관리자는 보고, 되살릴 수 있어야 합니다.
  let 가린글 = null
  {
    const ㄱ = await 부르기('write', {
      몸: {
        손님: 'hid' + Math.random().toString(36).slice(2, 12),
        내용: '신고로 가려질 글입니다.',
        태그: 'seolem',
        비번: '8888',
      },
    })
    가린글 = ㄱ.값?.id
    for (let i = 1; i <= 3; i++) {
      await 부르기('report', {
        몸: { 손님: 'hr' + i + Math.random().toString(36).slice(2, 10), id: 가린글 },
      })
    }
    const ㄴ = await 부르기('list')
    확인('가려진 글은 보통 목록에 없다', !(ㄴ.값?.글들 || []).some((ㄷ) => ㄷ.id === 가린글))
  }
  {
    const ㄱ = await 부르기('list', { 검색: { key: 열쇠 } })
    const 찾음 = (ㄱ.값?.글들 || []).find((ㄴ) => ㄴ.id === 가린글)
    확인('관리자 목록에는 가려진 글도 나온다', !!찾음, JSON.stringify(ㄱ.값?.글들?.length))
    확인('가려짐 표시와 신고 수가 함께 온다', 찾음?.숨김 === true && 찾음?.신고 >= 3, JSON.stringify(찾음))
  }
  {
    const ㄱ = await 부르기('post', { 검색: { id: 가린글 } })
    확인('가려진 글은 보통 열리지 않는다', ㄱ.코드 === 403, String(ㄱ.코드))
    const ㄴ = await 부르기('post', { 검색: { id: 가린글, key: 열쇠 } })
    확인('관리자는 가려진 글을 연다', ㄴ.코드 === 200 && !!ㄴ.값?.글, String(ㄴ.코드))
  }
  {
    const ㄱ = await 부르기('admin_show', { 몸: { 열쇠, id: 가린글 } })
    확인('관리자가 다시 보이게 한다', ㄱ.코드 === 200 && ㄱ.값?.보임, JSON.stringify(ㄱ.값))
    const ㄴ = await 부르기('list')
    확인('되살린 글이 목록에 돌아온다', (ㄴ.값?.글들 || []).some((ㄷ) => ㄷ.id === 가린글))
    await 부르기('admin_remove', { 몸: { 열쇠, id: 가린글 } })
  }
  {
    const ㄱ = await 부르기('admin_out', { 몸: { 열쇠 } })
    확인('관리자에서 나간다', ㄱ.코드 === 200)
    const ㄴ = await 부르기('admin_check', { 몸: { 열쇠 } })
    확인('나간 뒤 열쇠는 못 쓴다', ㄴ.값?.관리자 === false, JSON.stringify(ㄴ.값))
    const ㄷ = await 부르기('admin_remove', { 몸: { 열쇠, id: 'whatever' } })
    확인('나간 뒤에는 못 지운다', ㄷ.코드 === 403, String(ㄷ.코드))
  }

  /* ── [11] 본인 글 고치기 ── */
  console.log(줄바꿈 + '[11] 본인 글 고치기')
  let 고칠글 = null
  {
    const ㄱ = await 부르기('write', {
      몸: {
        손님: 'ed' + Math.random().toString(36).slice(2, 12),
        내용: '고치기 전 내용입니다.',
        받는이: '처음받는이',
        태그: 'seolem',
        비번: '3131',
      },
    })
    고칠글 = ㄱ.값?.id
    확인('고칠 글을 썼다', !!고칠글, JSON.stringify(ㄱ.값))
  }
  {
    const ㄱ = await 부르기('edit', {
      몸: { id: 고칠글, 비번: '0000', 내용: '몰래 고치기', 태그: 'seolem' },
    })
    확인('틀린 숫자로는 못 고친다', ㄱ.코드 === 403, JSON.stringify(ㄱ.값))
  }
  {
    const ㄱ = await 부르기('edit', {
      몸: { id: 고칠글, 비번: '3131', 내용: '짧', 태그: 'seolem' },
    })
    확인('너무 짧게는 못 고친다', ㄱ.코드 === 400, JSON.stringify(ㄱ.값))
  }
  {
    const ㄱ = await 부르기('edit', {
      몸: {
        id: 고칠글,
        비번: '3131',
        내용: '고친 뒤 내용입니다. 마음 태그와 받는 사람도 함께 바꿉니다.',
        받는이: '바뀐받는이',
        태그: 'yonggi',
      },
    })
    확인('맞는 숫자로 고쳐진다', ㄱ.코드 === 200 && ㄱ.값?.고침, JSON.stringify(ㄱ.값))
    확인('고친 내용이 반영된다', /고친 뒤 내용/.test(ㄱ.값?.글?.내용 || ''), ㄱ.값?.글?.내용)
    확인('받는 사람도 바뀐다', ㄱ.값?.글?.받는이 === '바뀐받는이', ㄱ.값?.글?.받는이)
    확인('마음 태그도 바뀐다', ㄱ.값?.글?.태그 === 'yonggi', ㄱ.값?.글?.태그)
    확인('고친시각이 찍힌다', !!ㄱ.값?.글?.고친시각)
    확인('고쳐도 비밀번호는 안 나온다', !('비번' in (ㄱ.값?.글 || {})) && !('소금' in (ㄱ.값?.글 || {})))
  }
  {
    const ㄱ = await 부르기('list', { 검색: { tag: 'yonggi' } })
    확인('바뀐 태그 목록에 나온다', (ㄱ.값?.글들 || []).some((ㄴ) => ㄴ.id === 고칠글))
    const ㄴ = await 부르기('list', { 검색: { tag: 'seolem' } })
    확인('예전 태그 목록에서는 빠진다', !(ㄴ.값?.글들 || []).some((ㄷ) => ㄷ.id === 고칠글))
  }
  {
    const 긴글 = '가'.repeat(1200)
    const ㄱ = await 부르기('edit', { 몸: { id: 고칠글, 비번: '3131', 내용: 긴글, 태그: 'yonggi' } })
    확인('1000자까지 받고 나머지는 자른다', (ㄱ.값?.글?.내용 || '').length === 1000,
         '길이 ' + (ㄱ.값?.글?.내용 || '').length)
  }

  /* ── [12] 휴지통 (관리자가 지워진 글까지 봄) ── */
  console.log(줄바꿈 + '[12] 휴지통')
  let 열쇠2 = null
  {
    const ㄱ = await 부르기('admin_in', { 몸: { 비번: 관리자비번 } })
    열쇠2 = ㄱ.값?.열쇠
    확인('관리자로 들어간다', !!열쇠2)
  }
  {
    const ㄱ = await 부르기('remove', { 몸: { id: 고칠글, 비번: '3131' } })
    확인('본인이 글을 지운다', ㄱ.코드 === 200 && ㄱ.값?.지움, JSON.stringify(ㄱ.값))
  }
  {
    const ㄱ = await 부르기('list')
    확인('지운 글은 보통 목록에 없다', !(ㄱ.값?.글들 || []).some((ㄴ) => ㄴ.id === 고칠글))
    const ㄴ = await 부르기('post', { 검색: { id: 고칠글 } })
    확인('지운 글은 보통 안 열린다', ㄴ.코드 === 404, String(ㄴ.코드))
  }
  {
    const ㄱ = await 부르기('list', { 검색: { key: 열쇠2, trash: '1' } })
    const 찾음 = (ㄱ.값?.글들 || []).find((ㄴ) => ㄴ.id === 고칠글)
    확인('관리자 휴지통에는 남아 있다', !!찾음, JSON.stringify(ㄱ.값?.글들?.length))
    확인('지움 표시와 지운 시각이 온다', 찾음?.지움 === true && !!찾음?.지운시각, JSON.stringify(찾음))
  }
  {
    const ㄱ = await 부르기('post', { 검색: { id: 고칠글, key: 열쇠2 } })
    확인('관리자는 지워진 글을 열어 본다', ㄱ.코드 === 200 && !!ㄱ.값?.글, String(ㄱ.코드))
  }
  {
    const ㄱ = await 부르기('list', { 검색: { trash: '1' } })
    확인('열쇠 없이 휴지통은 못 본다', !(ㄱ.값?.글들 || []).some((ㄴ) => ㄴ.id === 고칠글))
  }
  {
    const ㄱ = await 부르기('heart', { 몸: { 손님: 'zz' + Math.random().toString(36).slice(2, 12), id: 고칠글 } })
    확인('지워진 글에는 하트를 못 누른다', ㄱ.코드 === 404, String(ㄱ.코드))
    const ㄴ = await 부르기('comment', { 몸: { 손님: 'zz' + Math.random().toString(36).slice(2, 12), id: 고칠글, 내용: '안녕' } })
    확인('지워진 글에는 댓글을 못 단다', ㄴ.코드 === 404, String(ㄴ.코드))
    const ㄷ = await 부르기('edit', { 몸: { id: 고칠글, 비번: '3131', 내용: '되살리기 전에 고치기', 태그: 'yonggi' } })
    확인('지워진 글은 못 고친다', ㄷ.코드 === 404, String(ㄷ.코드))
  }
  {
    const ㄱ = await 부르기('admin_restore', { 몸: { 열쇠: 열쇠2, id: 고칠글 } })
    확인('관리자가 되살린다', ㄱ.코드 === 200 && ㄱ.값?.되살림, JSON.stringify(ㄱ.값))
    const ㄴ = await 부르기('list')
    확인('되살린 글이 목록에 돌아온다', (ㄴ.값?.글들 || []).some((ㄷ) => ㄷ.id === 고칠글))
    const ㄷ = await 부르기('post', { 검색: { id: 고칠글 } })
    확인('되살린 글이 다시 열린다', ㄷ.코드 === 200)
  }
  {
    await 부르기('remove', { 몸: { id: 고칠글, 비번: '3131' } })
    const ㄱ = await 부르기('admin_purge', { 몸: { 열쇠: 열쇠2, id: 고칠글 } })
    확인('관리자가 아주 지운다', ㄱ.코드 === 200 && ㄱ.값?.아주지움, JSON.stringify(ㄱ.값))
    const ㄴ = await 부르기('list', { 검색: { key: 열쇠2, trash: '1' } })
    확인('아주 지운 글은 휴지통에도 없다', !(ㄴ.값?.글들 || []).some((ㄷ) => ㄷ.id === 고칠글))
    const ㄷ = await 부르기('post', { 검색: { id: 고칠글, key: 열쇠2 } })
    확인('아주 지운 글은 관리자도 못 연다', ㄷ.코드 === 404, String(ㄷ.코드))
  }
  {
    const ㄱ = await 부르기('admin_restore', { 몸: { 열쇠: '', id: 'aaaa' } })
    확인('열쇠 없이는 못 되살린다', ㄱ.코드 === 403)
    const ㄴ = await 부르기('admin_purge', { 몸: { 열쇠: '', id: 'aaaa' } })
    확인('열쇠 없이는 못 아주지운다', ㄴ.코드 === 403)
  }
  await 부르기('admin_out', { 몸: { 열쇠: 열쇠2 } })
} catch (ㅇ) {
  확인('점검이 끝까지 돌았다', false, ㅇ.message)
}

if (아이) 아이.kill()
try {
  fs.rmSync(데이터, { force: true })
} catch {}

console.log(줄바꿈 + '─'.repeat(46))
console.log('  통과 ' + 통과 + ' / 실패 ' + 실패)
if (문제들.length > 0) {
  console.log(줄바꿈 + '  찾은 문제')
  문제들.forEach((ㅁ, i) => console.log('   ' + (i + 1) + '. ' + ㅁ))
}
console.log('─'.repeat(46) + 줄바꿈)
process.exit(실패 > 0 ? 1 : 0)
