/**
 * 서버와 이야기하는 창구
 * ------------------------------------------------------------
 * 모든 요청은 /api/board 하나로 갑니다. (Vercel 서버리스 함수)
 */
import { 손님번호 } from './나.js'

const 기본주소 = '/api/board'

async function 부르기(동작, { 검색 = {}, 몸 = null } = {}) {
  const 주소 = new URL(기본주소, location.origin)
  주소.searchParams.set('do', 동작)
  for (const [ㅋ, ㅄ] of Object.entries(검색)) {
    if (ㅄ !== undefined && ㅄ !== null && ㅄ !== '') 주소.searchParams.set(ㅋ, String(ㅄ))
  }

  const 설정 = { method: 몸 ? 'POST' : 'GET', headers: {} }
  if (몸) {
    설정.headers['content-type'] = 'application/json'
    설정.body = JSON.stringify({ ...몸, 손님: 손님번호() })
  }

  let 답
  try {
    답 = await fetch(주소.toString(), 설정)
  } catch {
    throw new Error('인터넷 연결을 확인해 주세요.')
  }

  let 값 = null
  try {
    값 = await 답.json()
  } catch {
    throw new Error('서버가 이상한 답을 보냈습니다. (' + 답.status + ')')
  }

  if (!답.ok || 값?.오류) {
    const ㅇ = new Error(값?.오류 || '문제가 생겼습니다. (' + 답.status + ')')
    ㅇ.코드 = 답.status
    throw ㅇ
  }
  return 값
}

export const 서버확인 = () => 부르기('ping')
export const 마음목록 = () => 부르기('tags')

export const 글목록 = ({ 정렬 = 'new', 태그 = '', 찾기 = '', 자리 = 0 } = {}) =>
  부르기('list', { 검색: { sort: 정렬, tag: 태그, q: 찾기, from: 자리 } })

export const 글보기 = (id) => 부르기('post', { 검색: { id } })

export const 글쓰기 = ({ 내용, 받는이, 태그, 비번 }) =>
  부르기('write', { 몸: { 내용, 받는이, 태그, 비번 } })

export const 하트보내기 = (id) => 부르기('heart', { 몸: { id } })
export const 댓글쓰기 = (id, 내용) => 부르기('comment', { 몸: { id, 내용 } })
export const 신고하기 = (id) => 부르기('report', { 몸: { id } })
export const 글지우기 = (id, 비번) => 부르기('remove', { 몸: { id, 비번 } })
