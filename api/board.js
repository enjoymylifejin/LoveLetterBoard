/**
 * 마음 우체통 - 서버 (Vercel 서버리스 함수)
 * ------------------------------------------------------------
 * 익명 고백 게시판의 모든 요청을 이 파일 하나가 처리합니다.
 *
 *   /api/board?do=list      글 목록
 *   /api/board?do=post&id=  글 하나
 *   /api/board?do=write     글 쓰기      (POST)
 *   /api/board?do=heart     하트         (POST)
 *   /api/board?do=comment   응원 한마디  (POST)
 *   /api/board?do=report    신고         (POST)
 *   /api/board?do=remove    지우기       (POST)
 *
 * 저장은 _저장소.js 가 알아서 합니다.
 * (Vercel 에서는 Upstash Redis, 내 컴퓨터에서는 파일)
 */
import crypto from 'node:crypto'
import {
  값넣기, 값읽기, 여러값읽기, 값지우기,
  집합에넣기, 순위넣기, 순위빼기, 순위읽기, 순위개수,
  줄에붙이기, 줄읽기, 저장소이름,
} from './_저장소.js'

/* ── 설정값 ───────────────────────────────────────── */
const 내용최대 = 600
const 받는이최대 = 20
const 댓글최대 = 200
const 목록한번에 = 20
const 검색범위 = 300 // 검색할 때 훑어볼 최근 글 수
const 신고숨김 = 3 // 신고가 이만큼 쌓이면 자동으로 가려집니다
const 글쓰기간격 = 20 // 초. 같은 사람이 연달아 도배하지 못하게

const 마음들 = [
  { 키: 'seolem', 이름: '설렘', 그림: '💗' },
  { 키: 'jjaksarang', 이름: '짝사랑', 그림: '🌙' },
  { 키: 'gomawo', 이름: '고마움', 그림: '🌷' },
  { 키: 'mianhae', 이름: '미안함', 그림: '🌧️' },
  { 키: 'yonggi', 이름: '용기', 그림: '🔥' },
  { 키: 'geurium', 이름: '그리움', 그림: '🕊️' },
]
const 마음키들 = 마음들.map((ㅁ) => ㅁ.키)

/* 익명 별명에 쓰는 낱말들 */
const 꾸밈말 = [
  '조용한', '수줍은', '설레는', '따뜻한', '용감한', '서툰', '다정한', '망설이는',
  '반짝이는', '기다리는', '솔직한', '먼발치의', '한결같은', '어설픈', '포근한',
]
const 이름말 = [
  '민들레', '오후', '창가', '별빛', '우산', '골목', '편지', '노을', '바람',
  '유리병', '첫눈', '가로등', '나침반', '연필', '벤치', '파도', '구름',
]

/* ── 저장소 열쇠 이름 (영문·숫자만) ─────────────────── */
const 글키 = (id) => 'post:' + id
const 댓글키 = (id) => 'cmt:' + id
const 하트키 = (id) => 'heart:' + id
const 신고키 = (id) => 'report:' + id
const 최신표 = 'z:new'
const 인기표 = 'z:hot'
const 태그표 = (태그) => 'z:tag:' + 태그

/* ── 도우미 ───────────────────────────────────────── */
const 새번호 = () => Date.now().toString(36) + crypto.randomBytes(4).toString('hex')
const 아이디다듬기 = (값) => String(값 || '').replace(/[^a-z0-9]/gi, '').slice(0, 40)

/** 보이면 안 되는 글자를 걷어냅니다. */
function 다듬기(값, 최대) {
  return String(값 ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 최대)
}

/** 비밀번호는 그대로 두지 않고 흔적만 남깁니다. */
const 비번굳히기 = (비번, 소금) =>
  crypto.scryptSync(String(비번), 소금, 32).toString('hex')

/** 글마다 붙는 익명 별명을 만듭니다. */
function 별명만들기() {
  const ㄱ = 꾸밈말[crypto.randomInt(꾸밈말.length)]
  const ㄴ = 이름말[crypto.randomInt(이름말.length)]
  const ㄷ = crypto.randomBytes(2).toString('hex').toUpperCase()
  return ㄱ + ' ' + ㄴ + ' #' + ㄷ
}

/** 로그인이 아니라, 하트·신고를 두 번 못 하게 막는 용도의 값입니다. */
function 손님번호(몸) {
  const ㄱ = String(몸?.손님 || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 40)
  return ㄱ.length >= 8 ? ㄱ : null
}

/** 저장된 글을 꺼냅니다. */
async function 글꺼내기(id) {
  const 글 = await 값읽기(글키(id))
  if (!글) return null
  try {
    return typeof 글 === 'string' ? JSON.parse(글) : 글
  } catch {
    return null
  }
}

/** 목록에 보여 줄 만큼만 남깁니다. (비밀번호 같은 건 빼고) */
function 요약(글) {
  return {
    id: 글.id,
    별명: 글.별명,
    받는이: 글.받는이,
    태그: 글.태그,
    만든시각: 글.만든시각,
    하트: 글.하트 || 0,
    댓글수: 글.댓글수 || 0,
    맛보기: String(글.내용 || '').slice(0, 90),
    긴글: String(글.내용 || '').length > 90,
  }
}

/* ── 본체 ─────────────────────────────────────────── */
export default async function handler(요청, 답장) {
  답장.setHeader('cache-control', 'no-store')

  const 보내기 = (값, 코드 = 200) => 답장.status(코드).json(값)
  const 오류 = (글, 코드 = 400) => 보내기({ 오류: 글 }, 코드)

  const 동작 = String(요청.query?.do || '')
  let 몸 = 요청.body || {}
  if (typeof 몸 === 'string') {
    try {
      몸 = JSON.parse(몸)
    } catch {
      몸 = {}
    }
  }

  try {
    /* ── 서버가 살아 있는지 ── */
    if (동작 === 'ping') return 보내기({ 잘됨: true, 저장소: 저장소이름 })

    /* ── 마음 태그 목록 ── */
    if (동작 === 'tags') return 보내기({ 마음들 })

    /* ── 글 목록 ── */
    if (동작 === 'list') {
      const 정렬 = 요청.query?.sort === 'hot' ? 'hot' : 'new'
      const 태그 = String(요청.query?.tag || '')
      const 찾기 = 다듬기(요청.query?.q || '', 30).toLowerCase()
      const 자리 = Math.max(0, Number(요청.query?.from || 0) || 0)

      const 표 = 마음키들.includes(태그) ? 태그표(태그) : 정렬 === 'hot' ? 인기표 : 최신표

      // 검색할 때는 넓게 훑고, 아니면 필요한 만큼만 읽습니다.
      const 읽을시작 = 찾기 ? 0 : 자리
      const 읽을개수 = 찾기 ? 검색범위 : 목록한번에 + 1

      let 번호들 = await 순위읽기(표, 읽을시작, 읽을개수)
      // 태그를 고른 채 인기순을 누르면, 태그 안에서 다시 정렬합니다.
      const 다시정렬필요 = 마음키들.includes(태그) && 정렬 === 'hot'

      const 글들 = (await 여러값읽기(번호들.map(글키)))
        .map((ㄱ) => {
          try {
            return ㄱ ? (typeof ㄱ === 'string' ? JSON.parse(ㄱ) : ㄱ) : null
          } catch {
            return null
          }
        })
        .filter((ㄱ) => ㄱ && !ㄱ.숨김)

      let 결과 = 글들.map(요약)

      if (찾기) {
        결과 = 결과.filter(
          (ㄱ) =>
            ㄱ.맛보기.toLowerCase().includes(찾기) ||
            String(ㄱ.받는이 || '').toLowerCase().includes(찾기)
        )
      }
      if (다시정렬필요 || 찾기) {
        결과.sort((ㄱ, ㄴ) =>
          정렬 === 'hot'
            ? ㄴ.하트 - ㄱ.하트 || ㄴ.만든시각 - ㄱ.만든시각
            : ㄴ.만든시각 - ㄱ.만든시각
        )
      }

      const 자른것 = 찾기 ? 결과.slice(자리, 자리 + 목록한번에) : 결과.slice(0, 목록한번에)
      const 더있나 = 찾기 ? 자리 + 목록한번에 < 결과.length : 결과.length > 목록한번에

      return 보내기({
        글들: 자른것,
        다음: 더있나 ? 자리 + 목록한번에 : null,
        전체: await 순위개수(최신표),
      })
    }

    /* ── 글 하나 보기 ── */
    if (동작 === 'post') {
      const id = 아이디다듬기(요청.query?.id)
      if (!id) return 오류('어떤 글인지 알 수 없습니다.')

      const 글 = await 글꺼내기(id)
      if (!글) return 오류('이미 지워졌거나 없는 글입니다.', 404)
      if (글.숨김) return 오류('신고가 쌓여 가려진 글입니다.', 403)

      const 댓글들 = (await 줄읽기(댓글키(id), 200))
        .map((ㄱ) => {
          try {
            return typeof ㄱ === 'string' ? JSON.parse(ㄱ) : ㄱ
          } catch {
            return null
          }
        })
        .filter(Boolean)

      const { 비번, 소금, 신고, ...보여줄것 } = 글
      return 보내기({ 글: 보여줄것, 댓글들 })
    }

    /* 여기부터는 글을 바꾸는 기능이라 POST 로만 받습니다.
       (없는 기능이면 방식을 따지기 전에 없다고 알려 줍니다) */
    const 쓰는기능 = ['write', 'heart', 'comment', 'report', 'remove']
    if (!쓰는기능.includes(동작)) {
      return 오류('없는 기능입니다 : ' + (동작 || '(빈 값)'), 404)
    }
    if (요청.method !== 'POST') return 오류('POST 로 보내 주세요.', 405)

    /* ── 글 쓰기 ── */
    if (동작 === 'write') {
      const 손님 = 손님번호(몸)
      if (!손님) return 오류('브라우저 설정을 확인해 주세요.')

      const 내용 = 다듬기(몸.내용, 내용최대)
      if (내용.length < 5) return 오류('마음을 다섯 글자 이상 적어 주세요.')

      const 받는이 = 다듬기(몸.받는이, 받는이최대)
      const 태그 = 마음키들.includes(몸.태그) ? 몸.태그 : 마음키들[0]
      const 비번 = String(몸.비번 || '')
      if (!/^[0-9]{4}$/.test(비번)) return 오류('지울 때 쓸 숫자 4자리를 정해 주세요.')

      // 도배 막기 (저장소가 정한 시간이 지나면 저절로 풀립니다)
      if (await 값읽기('cool:' + 손님)) {
        return 오류('조금만 쉬었다 써 주세요.', 429)
      }

      const id = 새번호()
      const 소금 = crypto.randomBytes(8).toString('hex')
      const 글 = {
        id,
        별명: 별명만들기(),
        받는이,
        내용,
        태그,
        만든시각: Date.now(),
        하트: 0,
        댓글수: 0,
        신고: 0,
        숨김: false,
        소금,
        비번: 비번굳히기(비번, 소금),
      }

      await 값넣기(글키(id), 글)
      await 값넣기('cool:' + 손님, '1', 글쓰기간격)
      await 순위넣기(최신표, 글.만든시각, id)
      await 순위넣기(태그표(태그), 글.만든시각, id)
      // 인기표는 하트가 같을 때 새 글이 위로 오도록 아주 작은 값을 얹습니다.
      await 순위넣기(인기표, 글.만든시각 / 1e13, id)

      return 보내기({ id, 별명: 글.별명 })
    }

    /* ── 하트 누르기 (한 사람 한 번) ── */
    if (동작 === 'heart') {
      const 손님 = 손님번호(몸)
      const id = 아이디다듬기(몸.id)
      if (!손님 || !id) return 오류('잘못된 요청입니다.')

      const 글 = await 글꺼내기(id)
      if (!글) return 오류('없는 글입니다.', 404)

      const 처음 = await 집합에넣기(하트키(id), 손님)
      if (!처음) return 오류('이미 마음을 보냈어요.', 409)

      글.하트 = (글.하트 || 0) + 1
      await 값넣기(글키(id), 글)
      await 순위넣기(인기표, 글.하트 + 글.만든시각 / 1e13, id)

      return 보내기({ 하트: 글.하트 })
    }

    /* ── 응원 한마디 ── */
    if (동작 === 'comment') {
      const 손님 = 손님번호(몸)
      const id = 아이디다듬기(몸.id)
      const 내용 = 다듬기(몸.내용, 댓글최대)
      if (!손님 || !id) return 오류('잘못된 요청입니다.')
      if (내용.length < 2) return 오류('두 글자 이상 적어 주세요.')

      const 글 = await 글꺼내기(id)
      if (!글) return 오류('없는 글입니다.', 404)
      if (글.숨김) return 오류('가려진 글입니다.', 403)

      const 댓글 = { id: 새번호(), 별명: 별명만들기(), 내용, 만든시각: Date.now() }
      const 개수 = await 줄에붙이기(댓글키(id), 댓글)

      글.댓글수 = 개수
      await 값넣기(글키(id), 글)

      return 보내기({ 댓글, 댓글수: 개수 })
    }

    /* ── 신고 ── */
    if (동작 === 'report') {
      const 손님 = 손님번호(몸)
      const id = 아이디다듬기(몸.id)
      if (!손님 || !id) return 오류('잘못된 요청입니다.')

      const 글 = await 글꺼내기(id)
      if (!글) return 오류('없는 글입니다.', 404)

      const 처음 = await 집합에넣기(신고키(id), 손님)
      if (!처음) return 오류('이미 신고한 글입니다.', 409)

      글.신고 = (글.신고 || 0) + 1
      글.숨김 = 글.신고 >= 신고숨김
      await 값넣기(글키(id), 글)

      return 보내기({ 접수: true, 숨김: 글.숨김 })
    }

    /* ── 지우기 (쓸 때 정한 숫자 4자리) ── */
    if (동작 === 'remove') {
      const id = 아이디다듬기(몸.id)
      const 비번 = String(몸.비번 || '')
      if (!id || !/^[0-9]{4}$/.test(비번)) return 오류('숫자 4자리를 입력해 주세요.')

      const 글 = await 글꺼내기(id)
      if (!글) return 오류('이미 지워진 글입니다.', 404)

      const 넣은것 = Buffer.from(비번굳히기(비번, 글.소금), 'hex')
      const 저장된것 = Buffer.from(String(글.비번), 'hex')
      const 맞나 =
        넣은것.length === 저장된것.length && crypto.timingSafeEqual(넣은것, 저장된것)
      if (!맞나) return 오류('숫자가 맞지 않습니다.', 403)

      await 값지우기(글키(id), 댓글키(id), 하트키(id), 신고키(id))
      await 순위빼기(최신표, id)
      await 순위빼기(인기표, id)
      await 순위빼기(태그표(글.태그), id)

      return 보내기({ 지움: true })
    }

    return 오류('없는 기능입니다 : ' + (동작 || '(빈 값)'), 404)
  } catch (ㅇ) {
    return 오류(ㅇ?.message || '서버에 문제가 생겼습니다.', 500)
  }
}
