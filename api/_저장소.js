/**
 * 저장소
 * ------------------------------------------------------------
 * 두 가지 방식을 같은 모양으로 감싸 둡니다.
 *
 *   ① Vercel 에 올렸을 때  : Upstash Redis (KV)
 *      - Vercel 대시보드에서 Storage 를 한 번 연결하면
 *        KV_REST_API_URL / KV_REST_API_TOKEN 이 자동으로 들어옵니다.
 *   ② 내 컴퓨터에서 돌릴 때 : 파일 한 개 (.data/저장소.json)
 *      - 아무 설정 없이 바로 돌려 볼 수 있습니다.
 *
 * 그래서 board.js 는 어디서 도는지 신경 쓰지 않아도 됩니다.
 */
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const 주소 =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || ''
const 열쇠 =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || ''

export const 레디스쓰는중 = Boolean(주소 && 열쇠)

/* ══════════════════════════════════════════════════════
   ① Upstash Redis (인터넷 저장소)
   ══════════════════════════════════════════════════════ */
async function 명령(...조각들) {
  const 답 = await fetch(주소, {
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + 열쇠,
      'content-type': 'application/json',
    },
    body: JSON.stringify(조각들.map(String)),
  })
  if (!답.ok) throw new Error('저장소 오류 (' + 답.status + ')')
  const 값 = await 답.json()
  if (값.error) throw new Error('저장소 오류 : ' + 값.error)
  return 값.result
}

async function 여러명령(줄들) {
  if (줄들.length === 0) return []
  const 답 = await fetch(주소.replace(/\/$/, '') + '/pipeline', {
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + 열쇠,
      'content-type': 'application/json',
    },
    body: JSON.stringify(줄들.map((ㅈ) => ㅈ.map(String))),
  })
  if (!답.ok) throw new Error('저장소 오류 (' + 답.status + ')')
  const 값들 = await 답.json()
  return 값들.map((ㄱ) => (ㄱ && ㄱ.error ? null : ㄱ?.result))
}

/* ══════════════════════════════════════════════════════
   ② 파일 저장소 (내 컴퓨터용)
   ══════════════════════════════════════════════════════ */
const 파일 = process.env.GOBAEK_DATA
  ? path.resolve(process.env.GOBAEK_DATA)
  : path.join(os.tmpdir(), 'gobaek-board', '저장소.json')

let 메모리 = null

function 파일읽기() {
  if (메모리) return 메모리
  try {
    메모리 = JSON.parse(fs.readFileSync(파일, 'utf-8'))
  } catch {
    메모리 = { 값: {}, 집합: {}, 순위: {}, 줄: {}, 만료: {} }
  }
  for (const ㅋ of ['값', '집합', '순위', '줄', '만료']) 메모리[ㅋ] ||= {}
  return 메모리
}

let 저장예약 = null
function 파일쓰기() {
  const ㄷ = 파일읽기()
  clearTimeout(저장예약)
  저장예약 = setTimeout(() => {
    try {
      fs.mkdirSync(path.dirname(파일), { recursive: true })
      fs.writeFileSync(파일, JSON.stringify(ㄷ), 'utf-8')
    } catch {
      /* 저장 못 해도 이번 요청은 그대로 처리합니다. */
    }
  }, 40)
}

function 만료치우기(키) {
  const ㄷ = 파일읽기()
  if (ㄷ.만료[키] && ㄷ.만료[키] < Date.now()) {
    delete ㄷ.값[키]
    delete ㄷ.만료[키]
  }
}

/* ══════════════════════════════════════════════════════
   공통 창구 — board.js 는 이것만 씁니다
   ══════════════════════════════════════════════════════ */

/** 값 하나를 넣습니다. 초를 주면 그만큼 지나 저절로 사라집니다. */
export async function 값넣기(키, 값, 초) {
  const 글 = typeof 값 === 'string' ? 값 : JSON.stringify(값)
  if (레디스쓰는중) {
    return 초 ? 명령('SET', 키, 글, 'EX', 초) : 명령('SET', 키, 글)
  }
  const ㄷ = 파일읽기()
  ㄷ.값[키] = 글
  if (초) ㄷ.만료[키] = Date.now() + 초 * 1000
  else delete ㄷ.만료[키]
  파일쓰기()
}

/** 값 하나를 읽습니다. (없으면 null) */
export async function 값읽기(키) {
  if (레디스쓰는중) {
    const ㄱ = await 명령('GET', 키)
    return ㄱ ?? null
  }
  만료치우기(키)
  return 파일읽기().값[키] ?? null
}

/** 여러 값을 한 번에 읽습니다. */
export async function 여러값읽기(키들) {
  if (키들.length === 0) return []
  if (레디스쓰는중) {
    const ㄱ = await 명령('MGET', ...키들)
    return Array.isArray(ㄱ) ? ㄱ : 키들.map(() => null)
  }
  return 키들.map((ㅋ) => {
    만료치우기(ㅋ)
    return 파일읽기().값[ㅋ] ?? null
  })
}

/** 값을 지웁니다. */
export async function 값지우기(...키들) {
  if (키들.length === 0) return
  if (레디스쓰는중) return 명령('DEL', ...키들)
  const ㄷ = 파일읽기()
  for (const ㅋ of 키들) {
    delete ㄷ.값[ㅋ]
    delete ㄷ.집합[ㅋ]
    delete ㄷ.순위[ㅋ]
    delete ㄷ.줄[ㅋ]
    delete ㄷ.만료[ㅋ]
  }
  파일쓰기()
}

/** 숫자를 하나 올리고, 올린 뒤 값을 돌려줍니다. */
export async function 숫자올리기(키, 만큼 = 1) {
  if (레디스쓰는중) return Number(await 명령('INCRBY', 키, 만큼))
  const ㄷ = 파일읽기()
  const 새것 = Number(ㄷ.값[키] || 0) + 만큼
  ㄷ.값[키] = String(새것)
  파일쓰기()
  return 새것
}

/**
 * 집합에 넣습니다.
 * @returns true = 처음 넣은 것 / false = 이미 있던 것
 * 하트·신고를 한 사람이 두 번 못 하게 막을 때 씁니다.
 */
export async function 집합에넣기(키, 값) {
  if (레디스쓰는중) return (await 명령('SADD', 키, 값)) === 1
  const ㄷ = 파일읽기()
  ㄷ.집합[키] ||= []
  if (ㄷ.집합[키].includes(값)) return false
  ㄷ.집합[키].push(값)
  파일쓰기()
  return true
}

/** 순위표에 넣습니다. (점수가 큰 것이 위로) */
export async function 순위넣기(키, 점수, 이름) {
  if (레디스쓰는중) return 명령('ZADD', 키, 점수, 이름)
  const ㄷ = 파일읽기()
  ㄷ.순위[키] ||= {}
  ㄷ.순위[키][이름] = 점수
  파일쓰기()
}

/** 순위표에서 뺍니다. */
export async function 순위빼기(키, 이름) {
  if (레디스쓰는중) return 명령('ZREM', 키, 이름)
  const ㄷ = 파일읽기()
  if (ㄷ.순위[키]) delete ㄷ.순위[키][이름]
  파일쓰기()
}

/** 순위표를 점수가 큰 것부터 읽습니다. */
export async function 순위읽기(키, 시작 = 0, 개수 = 20) {
  if (레디스쓰는중) {
    const ㄱ = await 명령('ZRANGE', 키, 시작, 시작 + 개수 - 1, 'REV')
    return Array.isArray(ㄱ) ? ㄱ : []
  }
  const 표 = 파일읽기().순위[키] || {}
  return Object.keys(표)
    .sort((ㄱ, ㄴ) => 표[ㄴ] - 표[ㄱ])
    .slice(시작, 시작 + 개수)
}

/** 순위표에 몇 개 있는지 셉니다. */
export async function 순위개수(키) {
  if (레디스쓰는중) return Number(await 명령('ZCARD', 키)) || 0
  return Object.keys(파일읽기().순위[키] || {}).length
}

/** 줄(댓글)에 하나 붙입니다. 붙인 뒤 길이를 돌려줍니다. */
export async function 줄에붙이기(키, 값) {
  const 글 = typeof 값 === 'string' ? 값 : JSON.stringify(값)
  if (레디스쓰는중) return Number(await 명령('RPUSH', 키, 글)) || 0
  const ㄷ = 파일읽기()
  ㄷ.줄[키] ||= []
  ㄷ.줄[키].push(글)
  파일쓰기()
  return ㄷ.줄[키].length
}

/** 줄 전체를 읽습니다. */
export async function 줄읽기(키, 최대 = 200) {
  if (레디스쓰는중) {
    const ㄱ = await 명령('LRANGE', 키, -최대, -1)
    return Array.isArray(ㄱ) ? ㄱ : []
  }
  return (파일읽기().줄[키] || []).slice(-최대)
}

export const 저장소이름 = 레디스쓰는중 ? 'Upstash Redis' : '파일(' + 파일 + ')'
