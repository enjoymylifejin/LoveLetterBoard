/** 여기저기서 쓰는 작은 조각들 */
import { useEffect } from 'react'
import { 마음찾기 } from '../lib/시각.js'
import { use뒤로가기 } from '../lib/뒤로가기.js'

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

/**
 * 아래에서 올라오는 창.
 * ------------------------------------------------------------
 * 닫는 방법을 네 가지 두었습니다.
 *   ① 왼쪽 위 '← 뒤로' 단추
 *   ② 오른쪽 위 × 단추
 *   ③ 뒤쪽 어두운 곳 누르기 / ESC
 *   ④ 뒤로가기 (브라우저 단추, 폰의 뒤로 버튼)
 *
 * 머리 줄은 위에 붙어 따라다니고, 아이폰 시계·노치에 가리지 않도록
 * 안전 여백을 둡니다.
 */
export function 덮개({ 제목, 닫기, children }) {
  // 뒤로가기를 누르면 사이트를 벗어나지 않고 이 창만 닫히게 합니다.
  use뒤로가기(true, 닫기)

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
          <button className="뒤로" onClick={닫기} type="button">
            <span aria-hidden="true">←</span> 뒤로
          </button>
          <h2>{제목}</h2>
          <button className="닫기" onClick={닫기} aria-label="닫기" type="button">
            ×
          </button>
        </div>
        <div className="덮개내용">{children}</div>
      </div>
    </div>
  )
}
