/**
 * '나'를 구분하는 값
 * ------------------------------------------------------------
 * 로그인이 아닙니다. 이름도, 이메일도 받지 않습니다.
 * 하트를 두 번 누르지 못하게 하고, 내가 쓴 글을 표시해 주는 용도로만
 * 이 브라우저에만 저장되는 무작위 번호를 하나 갖고 있습니다.
 * 지우고 싶으면 브라우저 기록만 지우면 사라집니다.
 */
const 손님키 = 'maeum-guest'
const 내글키 = 'maeum-mine'
const 하트키 = 'maeum-hearts'
const 관리자열쇠키 = 'maeum-admin'

function 무작위() {
  const ㄱ = new Uint8Array(16)
  crypto.getRandomValues(ㄱ)
  return Array.from(ㄱ, (ㄴ) => ㄴ.toString(16).padStart(2, '0')).join('')
}

export function 손님번호() {
  try {
    let ㄱ = localStorage.getItem(손님키)
    if (!ㄱ || ㄱ.length < 8) {
      ㄱ = 무작위()
      localStorage.setItem(손님키, ㄱ)
    }
    return ㄱ
  } catch {
    // 브라우저가 저장을 막아 두었으면 이번 방문에만 쓰는 번호를 씁니다.
    if (!globalThis.__손님) globalThis.__손님 = 무작위()
    return globalThis.__손님
  }
}

/* ── 내가 쓴 글 기억하기 ─────────────────────────── */
function 읽기(키) {
  try {
    const ㄱ = JSON.parse(localStorage.getItem(키) || '[]')
    return Array.isArray(ㄱ) ? ㄱ : []
  } catch {
    return []
  }
}
function 쓰기(키, 값) {
  try {
    localStorage.setItem(키, JSON.stringify(값.slice(-300)))
  } catch {
    /* 저장 못 해도 그냥 넘어갑니다. */
  }
}

export const 내글들 = () => 읽기(내글키)
export const 내글인가 = (id) => 읽기(내글키).includes(id)
export function 내글기억(id) {
  const ㄱ = 읽기(내글키)
  if (!ㄱ.includes(id)) 쓰기(내글키, [...ㄱ, id])
}
export function 내글잊기(id) {
  쓰기(내글키, 읽기(내글키).filter((ㄱ) => ㄱ !== id))
}

/* ── 관리자 열쇠 ────────────────────────────────────
   서버가 준 열쇠만 들고 있습니다. 비밀번호는 저장하지 않습니다. */
export function 관리자열쇠() {
  try {
    return localStorage.getItem(관리자열쇠키) || ''
  } catch {
    return globalThis.__관리자열쇠 || ''
  }
}
export function 관리자열쇠저장(열쇠) {
  try {
    localStorage.setItem(관리자열쇠키, 열쇠)
  } catch {
    globalThis.__관리자열쇠 = 열쇠
  }
}
export function 관리자열쇠지움() {
  try {
    localStorage.removeItem(관리자열쇠키)
  } catch {
    globalThis.__관리자열쇠 = ''
  }
}

/* ── 하트 누른 글 기억하기 (서버가 진짜 판단, 이건 화면 표시용) ── */
export const 하트눌렀나 = (id) => 읽기(하트키).includes(id)
export function 하트기억(id) {
  const ㄱ = 읽기(하트키)
  if (!ㄱ.includes(id)) 쓰기(하트키, [...ㄱ, id])
}
