/**
 * 마음 우체통 — 익명 사랑 고백 게시판
 * ------------------------------------------------------------
 * 로그인 없이, 이름 없이 마음을 남기는 곳입니다.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { 글목록 } from './lib/서버.js'
import { 흐른시간, 마음들 } from './lib/시각.js'
import { 하트눌렀나, 내글인가 } from './lib/나.js'
import { 마음딱지, 알림, 비었음 } from './components/공통.jsx'
import 글쓰기 from './components/글쓰기.jsx'
import 글상세 from './components/글상세.jsx'
import 설치안내 from './components/설치안내.jsx'

export default function App() {
  const [글들, 글들바꾸기] = useState([])
  const [다음, 다음바꾸기] = useState(null)
  const [전체, 전체바꾸기] = useState(0)

  const [정렬, 정렬바꾸기] = useState('new')
  const [태그, 태그바꾸기] = useState('')
  const [찾기칸, 찾기칸바꾸기] = useState('')
  const [찾기, 찾기바꾸기] = useState('')

  const [부르는중, 부르는중바꾸기] = useState(true)
  const [더부르는중, 더부르는중바꾸기] = useState(false)
  const [잘못, 잘못바꾸기] = useState('')

  const [쓰기열림, 쓰기열림바꾸기] = useState(false)
  const [열린글, 열린글바꾸기] = useState(null)
  const [소식, 소식바꾸기] = useState('')
  const [끝냄, 끝냄바꾸기] = useState(false)

  // 늦게 온 응답이 최신 목록을 덮어쓰지 않도록 순번을 매깁니다.
  const 세대 = useRef(0)

  const 불러오기 = useCallback(async () => {
    const 내차례 = ++세대.current
    부르는중바꾸기(true)
    잘못바꾸기('')
    try {
      const ㄱ = await 글목록({ 정렬, 태그, 찾기, 자리: 0 })
      if (내차례 !== 세대.current) return
      글들바꾸기(ㄱ.글들 || [])
      다음바꾸기(ㄱ.다음 ?? null)
      전체바꾸기(ㄱ.전체 || 0)
    } catch (ㅇ) {
      if (내차례 === 세대.current) 잘못바꾸기(ㅇ.message)
    } finally {
      if (내차례 === 세대.current) 부르는중바꾸기(false)
    }
  }, [정렬, 태그, 찾기])

  useEffect(() => {
    불러오기()
  }, [불러오기])

  // 검색은 타자를 멈춘 뒤에 보냅니다.
  useEffect(() => {
    const ㄱ = setTimeout(() => 찾기바꾸기(찾기칸.trim()), 350)
    return () => clearTimeout(ㄱ)
  }, [찾기칸])

  async function 더보기() {
    if (다음 === null || 더부르는중) return
    const 내차례 = 세대.current
    더부르는중바꾸기(true)
    try {
      const ㄱ = await 글목록({ 정렬, 태그, 찾기, 자리: 다음 })
      if (내차례 !== 세대.current) return
      글들바꾸기((이전) => {
        // 같은 글이 두 번 들어가지 않게 걸러 냅니다.
        const 있는것 = new Set(이전.map((ㄴ) => ㄴ.id))
        return [...이전, ...(ㄱ.글들 || []).filter((ㄴ) => !있는것.has(ㄴ.id))]
      })
      다음바꾸기(ㄱ.다음 ?? null)
    } catch (ㅇ) {
      잘못바꾸기(ㅇ.message)
    } finally {
      더부르는중바꾸기(false)
    }
  }

  function 글바뀜({ id, 하트, 댓글수 }) {
    글들바꾸기((이전) =>
      이전.map((ㄱ) =>
        ㄱ.id === id
          ? { ...ㄱ, 하트: 하트 ?? ㄱ.하트, 댓글수: 댓글수 ?? ㄱ.댓글수 }
          : ㄱ
      )
    )
  }

  /**
   * 종료하기
   * ------------------------------------------------------------
   * 앱으로 설치해서 쓰는 중이면 창이 그대로 닫힙니다.
   * 브라우저 탭에서는 규칙상 페이지가 스스로 탭을 닫을 수 없어서,
   * 대신 작별 화면을 보여 주고 멈춥니다.
   */
  function 종료하기() {
    if (!confirm('마음 우체통을 종료할까요?')) return
    끝냄바꾸기(true)
    try {
      window.close()
    } catch {
      /* 못 닫아도 아래 작별 화면이 뜹니다. */
    }
  }

  if (끝냄) {
    return (
      <div className="감싸기">
        <div className="작별">
          <div className="그림">💌</div>
          <h2>안녕히 가세요</h2>
          <p className="흐리게">
            남겨 주신 마음은 잘 보관해 둘게요.
            <br />
            창을 닫으셔도 됩니다.
          </p>
          <button
            className="단추 주"
            style={{ marginTop: 16 }}
            onClick={() => 끝냄바꾸기(false)}
            type="button"
          >
            다시 열기
          </button>
        </div>
      </div>
    )
  }

  function 글지워짐(id) {
    글들바꾸기((이전) => 이전.filter((ㄱ) => ㄱ.id !== id))
    전체바꾸기((이전) => Math.max(0, 이전 - 1))
    열린글바꾸기(null)
    소식바꾸기('글을 지웠습니다.')
    setTimeout(() => 소식바꾸기(''), 2600)
  }

  return (
    <div className="감싸기">
      <header className="머리">
        <button className="종료단추" onClick={종료하기} type="button">
          <span aria-hidden="true">✕</span> 종료
        </button>
        <h1>💌 마음 우체통</h1>
        <p className="풀이">
          이름 없이 남기는 마음. 지금까지 {전체}통의 편지가 도착했어요.
        </p>
      </header>

      {/* ── 고르는 줄 ── */}
      <div className="띠">
        <button
          className={'고르기' + (정렬 === 'new' ? ' 켬' : '')}
          onClick={() => 정렬바꾸기('new')}
          type="button"
        >
          최신순
        </button>
        <button
          className={'고르기' + (정렬 === 'hot' ? ' 켬' : '')}
          onClick={() => 정렬바꾸기('hot')}
          type="button"
        >
          공감순
        </button>
        <input
          className="입력 찾기칸"
          value={찾기칸}
          placeholder="🔍 내용·받는 사람 찾기"
          onChange={(e) => 찾기칸바꾸기(e.target.value)}
        />
      </div>

      <div className="고르기줄" style={{ marginBottom: 16 }}>
        <button
          className={'고르기' + (태그 === '' ? ' 켬' : '')}
          onClick={() => 태그바꾸기('')}
          type="button"
        >
          전체
        </button>
        {마음들.map((ㅁ) => (
          <button
            key={ㅁ.키}
            className={'고르기' + (태그 === ㅁ.키 ? ' 켬' : '')}
            onClick={() => 태그바꾸기(태그 === ㅁ.키 ? '' : ㅁ.키)}
            type="button"
          >
            {ㅁ.그림} {ㅁ.이름}
          </button>
        ))}
      </div>

      <설치안내 />

      <알림 종류="나쁨">{잘못}</알림>
      <알림 종류="좋음">{소식}</알림>

      {/* ── 목록 ── */}
      {부르는중 && 글들.length === 0 && (
        <p className="흐리게 가운데" style={{ padding: '40px 0' }}>
          마음을 불러오는 중…
        </p>
      )}

      {!부르는중 && 글들.length === 0 && !잘못 && (
        <비었음
          제목={찾기 || 태그 ? '찾는 마음이 없어요' : '아직 도착한 편지가 없어요'}
          풀이={찾기 || 태그 ? '다른 낱말로 찾아보세요.' : '첫 마음을 남겨 보세요.'}
        />
      )}

      {글들.map((ㄱ) => (
        <article
          key={ㄱ.id}
          className="종이 글카드"
          onClick={() => 열린글바꾸기(ㄱ.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && 열린글바꾸기(ㄱ.id)}
        >
          <div className="카드머리">
            <span className="별명">{ㄱ.별명}</span>
            {ㄱ.받는이 && <span className="받는이">→ {ㄱ.받는이}</span>}
            {내글인가(ㄱ.id) && (
              <span className="받는이" style={{ background: '#eae4ff', color: '#5f49a8' }}>
                내 글
              </span>
            )}
            <span className="때">{흐른시간(ㄱ.만든시각)}</span>
          </div>

          <p className="본문">
            {ㄱ.맛보기}
            {ㄱ.긴글 && <span className="더보기">… 더 보기</span>}
          </p>

          <div className="카드바닥">
            <마음딱지 태그={ㄱ.태그} 누르기={(ㅋ) => 태그바꾸기(태그 === ㅋ ? '' : ㅋ)} />
            <span className={하트눌렀나(ㄱ.id) ? '하트단추 눌림' : '하트단추'}>
              {하트눌렀나(ㄱ.id) ? '💗' : '🤍'} {ㄱ.하트 || 0}
            </span>
            <span>💬 {ㄱ.댓글수 || 0}</span>
          </div>
        </article>
      ))}

      {다음 !== null && (
        <button
          className="단추 가득"
          style={{ marginTop: 6 }}
          onClick={더보기}
          disabled={더부르는중}
          type="button"
        >
          {더부르는중 ? '불러오는 중…' : '더 보기'}
        </button>
      )}

      <footer className="바닥">
        누구인지 묻지 않는 곳이에요.
        <br />
        남을 아프게 하는 글은 신고해 주세요.
      </footer>

      <button className="쓰기단추" onClick={() => 쓰기열림바꾸기(true)} type="button">
        ✍️ 마음 남기기
      </button>

      {쓰기열림 && (
        <글쓰기
          닫기={() => 쓰기열림바꾸기(false)}
          다썼을때={() => {
            쓰기열림바꾸기(false)
            소식바꾸기('마음이 도착했습니다 💗')
            setTimeout(() => 소식바꾸기(''), 2600)
            정렬바꾸기('new')
            태그바꾸기('')
            찾기칸바꾸기('')
            찾기바꾸기('')
            불러오기()
          }}
        />
      )}

      {열린글 && (
        <글상세
          id={열린글}
          닫기={() => 열린글바꾸기(null)}
          바뀌었을때={글바뀜}
          지워졌을때={글지워짐}
        />
      )}
    </div>
  )
}
