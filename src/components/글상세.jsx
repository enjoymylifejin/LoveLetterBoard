/**
 * 글 하나 펼쳐 보기
 * 전체 내용, 응원 한마디, 하트, 신고, (내 글이면) 수정하기·지우기
 */
import { useEffect, useState } from 'react'
import { 글보기, 하트보내기, 댓글쓰기, 신고하기, 글지우기, 글고치기 } from '../lib/서버.js'
import { 하트눌렀나, 하트기억, 내글인가, 내글잊기 } from '../lib/나.js'
import { 흐른시간, 마음들 } from '../lib/시각.js'
import { 덮개, 마음딱지, 알림 } from './공통.jsx'

export default function 글상세({ id, 닫기, 바뀌었을때, 지워졌을때 }) {
  const [글, 글바꾸기] = useState(null)
  const [댓글들, 댓글들바꾸기] = useState([])
  const [부르는중, 부르는중바꾸기] = useState(true)
  const [잘못, 잘못바꾸기] = useState('')
  const [알림글, 알림글바꾸기] = useState('')

  const [하트함, 하트함바꾸기] = useState(() => 하트눌렀나(id))
  const [뛴다, 뛴다바꾸기] = useState(false)

  const [댓글, 댓글바꾸기] = useState('')
  const [댓글보내는중, 댓글보내는중바꾸기] = useState(false)

  const [고치기열림, 고치기열림바꾸기] = useState(false)
  const [고칠내용, 고칠내용바꾸기] = useState('')
  const [고칠받는이, 고칠받는이바꾸기] = useState('')
  const [고칠태그, 고칠태그바꾸기] = useState('')
  const [고칠비번, 고칠비번바꾸기] = useState('')
  const [고치는중, 고치는중바꾸기] = useState(false)

  const [지우기열림, 지우기열림바꾸기] = useState(false)
  const [지울비번, 지울비번바꾸기] = useState('')
  const [지우는중, 지우는중바꾸기] = useState(false)

  const 내가쓴글 = 내글인가(id)

  useEffect(() => {
    let 살아있음 = true
    ;(async () => {
      try {
        const ㄱ = await 글보기(id)
        if (!살아있음) return
        글바꾸기(ㄱ.글)
        댓글들바꾸기(ㄱ.댓글들 || [])
      } catch (ㅇ) {
        if (살아있음) 잘못바꾸기(ㅇ.message)
      } finally {
        if (살아있음) 부르는중바꾸기(false)
      }
    })()
    return () => {
      살아있음 = false
    }
  }, [id])

  async function 하트() {
    if (하트함) return
    하트함바꾸기(true)
    뛴다바꾸기(true)
    setTimeout(() => 뛴다바꾸기(false), 450)
    try {
      const ㄱ = await 하트보내기(id)
      하트기억(id)
      글바꾸기((이전) => (이전 ? { ...이전, 하트: ㄱ.하트 } : 이전))
      바뀌었을때?.({ id, 하트: ㄱ.하트 })
    } catch (ㅇ) {
      // 이미 누른 글이면 그대로 눌린 모습을 유지합니다.
      if (ㅇ.코드 !== 409) {
        하트함바꾸기(false)
        알림글바꾸기(ㅇ.message)
      } else {
        하트기억(id)
      }
    }
  }

  async function 댓글보내기() {
    const ㄱ = 댓글.trim()
    if (ㄱ.length < 2 || 댓글보내는중) return
    댓글보내는중바꾸기(true)
    알림글바꾸기('')
    try {
      const ㄴ = await 댓글쓰기(id, ㄱ)
      댓글들바꾸기((이전) => [...이전, ㄴ.댓글])
      댓글바꾸기('')
      글바꾸기((이전) => (이전 ? { ...이전, 댓글수: ㄴ.댓글수 } : 이전))
      바뀌었을때?.({ id, 댓글수: ㄴ.댓글수 })
    } catch (ㅇ) {
      알림글바꾸기(ㅇ.message)
    } finally {
      댓글보내는중바꾸기(false)
    }
  }

  async function 신고() {
    if (!confirm('이 글을 신고할까요?\n신고가 여러 번 쌓이면 자동으로 가려집니다.')) return
    try {
      const ㄱ = await 신고하기(id)
      알림글바꾸기(ㄱ.숨김 ? '신고가 접수되어 이 글은 가려졌습니다.' : '신고가 접수되었습니다.')
    } catch (ㅇ) {
      알림글바꾸기(ㅇ.message)
    }
  }

  function 고치기시작() {
    고칠내용바꾸기(글?.내용 || '')
    고칠받는이바꾸기(글?.받는이 || '')
    고칠태그바꾸기(글?.태그 || 마음들[0].키)
    고칠비번바꾸기('')
    알림글바꾸기('')
    고치기열림바꾸기(true)
    지우기열림바꾸기(false)
  }

  async function 고치기저장() {
    if (고칠내용.trim().length < 5 || !/^[0-9]{4}$/.test(고칠비번) || 고치는중) return
    고치는중바꾸기(true)
    알림글바꾸기('')
    try {
      const ㄱ = await 글고치기(id, {
        내용: 고칠내용,
        받는이: 고칠받는이,
        태그: 고칠태그,
        비번: 고칠비번,
      })
      글바꾸기(ㄱ.글)
      고치기열림바꾸기(false)
      알림글바꾸기('수정했습니다.')
      바뀌었을때?.({ id, 고침: true })
    } catch (ㅇ) {
      알림글바꾸기(ㅇ.message)
    } finally {
      고치는중바꾸기(false)
    }
  }

  async function 지우기() {
    if (!/^[0-9]{4}$/.test(지울비번)) return
    지우는중바꾸기(true)
    알림글바꾸기('')
    try {
      await 글지우기(id, 지울비번)
      내글잊기(id)
      지워졌을때?.(id)
    } catch (ㅇ) {
      알림글바꾸기(ㅇ.message)
      지우는중바꾸기(false)
    }
  }

  return (
    <덮개 제목="💌 마음 한 장" 닫기={닫기}>
      {부르는중 && <p className="흐리게 가운데">불러오는 중…</p>}
      <알림 종류="나쁨">{잘못}</알림>

      {글 && (
        <>
          <div className="카드머리">
            <span className="별명">{글.별명}</span>
            {글.받는이 && <span className="받는이">→ {글.받는이}</span>}
            <span className="때">
              {흐른시간(글.만든시각)}
              {글.고친시각 ? ' · 수정됨' : ''}
            </span>
          </div>

          <div style={{ marginBottom: 10 }}>
            <마음딱지 태그={글.태그} />
          </div>

          <p className="본문">{글.내용}</p>

          <div className="카드바닥">
            <button
              className={'하트단추' + (하트함 ? ' 눌림' : '')}
              onClick={하트}
              disabled={하트함}
              type="button"
            >
              <span className={뛴다 ? '뛰기' : ''}>{하트함 ? '💗' : '🤍'}</span>
              {글.하트 || 0}
            </button>
            <span>💬 {댓글들.length}</span>
            <button className="단추 글자만" style={{ marginLeft: 'auto' }} onClick={신고} type="button">
              신고
            </button>
          </div>

          {내가쓴글 && 고치기열림 && (
            <div className="종이" style={{ marginTop: 12, background: '#fffdfe' }}>
              <label className="라벨" style={{ marginTop: 0 }}>
                어떤 마음인가요?
              </label>
              <div className="고르기줄">
                {마음들.map((ㅁ) => (
                  <button
                    key={ㅁ.키}
                    type="button"
                    className={'고르기' + (고칠태그 === ㅁ.키 ? ' 켬' : '')}
                    onClick={() => 고칠태그바꾸기(ㅁ.키)}
                  >
                    {ㅁ.그림} {ㅁ.이름}
                  </button>
                ))}
              </div>

              <label className="라벨">누구에게 (선택)</label>
              <input
                className="입력"
                value={고칠받는이}
                maxLength={20}
                onChange={(e) => 고칠받는이바꾸기(e.target.value)}
              />

              <label className="라벨">하고 싶은 말</label>
              <textarea
                className="여러줄"
                value={고칠내용}
                maxLength={1000}
                onChange={(e) => 고칠내용바꾸기(e.target.value)}
              />
              <div className="글자수">
                {고칠내용.length} / 1000
              </div>

              <label className="라벨">쓸 때 정한 숫자 4자리</label>
              <input
                className="입력"
                value={고칠비번}
                inputMode="numeric"
                maxLength={4}
                autoComplete="off"
                onChange={(e) => 고칠비번바꾸기(e.target.value.replace(/[^0-9]/g, ''))}
              />

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  className="단추 주 작게"
                  onClick={고치기저장}
                  disabled={고칠내용.trim().length < 5 || !/^[0-9]{4}$/.test(고칠비번) || 고치는중}
                  type="button"
                >
                  {고치는중 ? '수정하는 중…' : '수정 저장'}
                </button>
                <button
                  className="단추 작게"
                  onClick={() => 고치기열림바꾸기(false)}
                  type="button"
                >
                  그만두기
                </button>
              </div>
            </div>
          )}

          {내가쓴글 && !고치기열림 && (
            <div style={{ marginTop: 12 }}>
              {!지우기열림 ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="단추 작게" onClick={고치기시작} type="button">
                    ✏️ 수정하기
                  </button>
                  <button className="단추 작게" onClick={() => 지우기열림바꾸기(true)} type="button">
                    🗑 지우기
                  </button>
                </div>
              ) : (
                <div className="종이" style={{ marginBottom: 0, background: '#fffdfe' }}>
                  <label className="라벨" style={{ marginTop: 0 }}>
                    쓸 때 정한 숫자 4자리
                  </label>
                  <input
                    className="입력"
                    value={지울비번}
                    inputMode="numeric"
                    maxLength={4}
                    autoComplete="off"
                    onChange={(e) => 지울비번바꾸기(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button
                      className="단추 주 작게"
                      onClick={지우기}
                      disabled={!/^[0-9]{4}$/.test(지울비번) || 지우는중}
                      type="button"
                    >
                      {지우는중 ? '지우는 중…' : '정말 지우기'}
                    </button>
                    <button
                      className="단추 작게"
                      onClick={() => {
                        지우기열림바꾸기(false)
                        지울비번바꾸기('')
                      }}
                      type="button"
                    >
                      그만두기
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <알림 종류="정보">{알림글}</알림>

          {/* ── 응원 한마디 ── */}
          <h3 style={{ fontSize: 15, marginTop: 22, marginBottom: 6 }}>
            응원 한마디 {댓글들.length > 0 && `(${댓글들.length})`}
          </h3>

          {댓글들.length === 0 && (
            <p className="흐리게" style={{ marginTop: 0 }}>
              아직 아무도 말을 걸지 않았어요. 첫 마디를 남겨 주세요.
            </p>
          )}

          {댓글들.map((ㄷ) => (
            <div className="댓글" key={ㄷ.id}>
              <div className="카드머리" style={{ marginBottom: 0 }}>
                <span className="별명">{ㄷ.별명}</span>
                <span className="때">{흐른시간(ㄷ.만든시각)}</span>
              </div>
              <p className="속">{ㄷ.내용}</p>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <input
              className="입력"
              value={댓글}
              maxLength={200}
              placeholder="따뜻한 한마디를 남겨 주세요"
              onChange={(e) => 댓글바꾸기(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && 댓글보내기()}
            />
            <button
              className="단추 주"
              onClick={댓글보내기}
              disabled={댓글.trim().length < 2 || 댓글보내는중}
              type="button"
            >
              남기기
            </button>
          </div>
        </>
      )}
    </덮개>
  )
}
