/**
 * 뒤로가기 다루기
 * ------------------------------------------------------------
 * 글쓰기·글보기 창이 열려 있을 때 뒤로가기(브라우저 버튼, 폰의 뒤로 버튼,
 * 마우스 옆 버튼)를 누르면 —
 *   · 예전에는 사이트를 통째로 벗어났습니다.
 *   · 이제는 열린 창만 닫힙니다. 앱과 똑같이 동작합니다.
 *
 * 쓰는 법 : use뒤로가기(열렸나, 닫는함수)
 */
import { useEffect, useRef } from 'react'

export function use뒤로가기(열렸나, 닫기) {
  // 우리가 기록을 하나 밀어 넣었는지 기억해 둡니다.
  const 밀어넣음 = useRef(false)
  const 닫기함수 = useRef(닫기)
  닫기함수.current = 닫기

  useEffect(() => {
    if (!열렸나) return

    // 창이 열릴 때 기록을 하나 쌓아 둡니다.
    try {
      window.history.pushState({ 마음창: true }, '')
      밀어넣음.current = true
    } catch {
      // 기록을 못 쌓아도 창은 그대로 잘 열립니다.
      밀어넣음.current = false
    }

    const 뒤로눌림 = () => {
      // 브라우저가 이미 한 칸 되돌렸으니, 우리는 창만 닫으면 됩니다.
      밀어넣음.current = false
      닫기함수.current()
    }
    window.addEventListener('popstate', 뒤로눌림)

    return () => {
      window.removeEventListener('popstate', 뒤로눌림)
      // 화면 안의 닫기 단추로 닫은 경우에는, 쌓아 둔 기록을 되돌려 놓습니다.
      // (그래야 뒤로가기를 다시 눌렀을 때 한 번 헛도는 일이 없습니다)
      if (밀어넣음.current) {
        밀어넣음.current = false
        try {
          window.history.back()
        } catch {
          /* 되돌리지 못해도 화면은 정상입니다. */
        }
      }
    }
  }, [열렸나])
}
