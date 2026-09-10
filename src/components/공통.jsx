/** 여기저기서 쓰는 작은 조각들 */
import { useEffect } from 'react'
import { 마음찾기 } from '../lib/시각.js'

export function 마음딱지({ 태그, 누르기 }) {
  const ㅁ = 마음찾기(태그)
  return (
    <button
      className="딱지"
      onClick={(e) => {
        e.stopPropagation()
        누르기?.(태그)
      }}
      type="button"
    >
      <span>{ㅁ.그림}</span>
      {ㅁ.이름}
    </button>
  )
}

export function 알림({ 종류 = '정보', children }) {
  if (!children) return null
  return <div className={'알림 ' + 종류}>{children}</div>
}

export function 비었음({ 그림 = '💌', 제목, 풀이 }) {
  return (
    <div className="비었음">
      <div className="그림">{그림}</div>
      <div style={{ fontWeight: 700, color: '#3d2b33' }}>{제목}</div>
      {풀이 && <div style={{ marginTop: 4 }}>{풀이}</div>}
    </div>
  )
}

/** 아래에서 올라오는 창. 뒤쪽을 누르거나 ESC 로 닫힙니다. */
export function 덮개({ 제목, 닫기, children }) {
  useEffect(() => {
    const ㄱ = (e) => e.key === 'Escape' && 닫기()
    window.addEventListener('keydown', ㄱ)
    // 뒤쪽 화면이 같이 움직이지 않게 잠깐 멈춰 둡니다.
    const 원래 = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', ㄱ)
      document.body.style.overflow = 원래
    }
  }, [닫기])

  return (
    <div className="덮개" onClick={닫기}>
      <div className="덮개속" onClick={(e) => e.stopPropagation()}>
        <div className="덮개머리">
          <h2>{제목}</h2>
          <button className="닫기" onClick={닫기} aria-label="닫기" type="button">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
