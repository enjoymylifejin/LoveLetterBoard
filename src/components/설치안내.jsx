/**
 * 바탕화면에 아이콘 넣기 (웹앱 설치)
 * ------------------------------------------------------------
 * · 안드로이드·크롬·엣지 : 브라우저가 알려 주면 '설치' 단추를 눌러 바로 설치
 * · 아이폰(사파리)       : 자동 설치가 없어서 방법을 그림으로 안내
 * · 이미 설치했거나 앱으로 열었으면 아무것도 보여 주지 않습니다.
 */
import { useEffect, useState } from 'react'

const 숨김키 = 'maeum-install-hide'

/** 지금 설치된 앱으로 열고 있는지 */
function 앱으로열림() {
  try {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    )
  } catch {
    return false
  }
}

function 아이폰인가() {
  const ㄱ = navigator.userAgent || ''
  const 애플기기 = /iPad|iPhone|iPod/.test(ㄱ)
  // 아이패드는 맥인 척하기 때문에 손가락 터치가 되는지로 한 번 더 봅니다.
  const 새아이패드 = /Macintosh/.test(ㄱ) && navigator.maxTouchPoints > 1
  return 애플기기 || 새아이패드
}

export default function 설치안내() {
  const [설치신호, 설치신호바꾸기] = useState(null)
  const [아이폰안내, 아이폰안내바꾸기] = useState(false)
  const [숨김, 숨김바꾸기] = useState(() => {
    try {
      return localStorage.getItem(숨김키) === '1'
    } catch {
      return false
    }
  })
  const [끝남, 끝남바꾸기] = useState(false)

  useEffect(() => {
    const 붙잡기 = (일) => {
      // 브라우저가 알아서 띄우는 안내는 막고, 우리가 원할 때 띄웁니다.
      일.preventDefault()
      설치신호바꾸기(일)
    }
    const 설치됨 = () => {
      끝남바꾸기(true)
      설치신호바꾸기(null)
    }
    window.addEventListener('beforeinstallprompt', 붙잡기)
    window.addEventListener('appinstalled', 설치됨)
    return () => {
      window.removeEventListener('beforeinstallprompt', 붙잡기)
      window.removeEventListener('appinstalled', 설치됨)
    }
  }, [])

  function 감추기() {
    숨김바꾸기(true)
    try {
      localStorage.setItem(숨김키, '1')
    } catch {
      /* 저장 못 해도 이번엔 감춰집니다. */
    }
  }

  async function 설치하기() {
    if (!설치신호) return
    설치신호.prompt()
    try {
      await 설치신호.userChoice
    } catch {
      /* 사용자가 그냥 닫아도 괜찮습니다. */
    }
    설치신호바꾸기(null)
  }

  if (앱으로열림() || 숨김) return null

  if (끝남) {
    return (
      <div className="알림 좋음">
        바탕화면에 <b>마음 우체통</b> 아이콘이 생겼어요 💌
      </div>
    )
  }

  const 아이폰 = 아이폰인가()

  // 안드로이드·PC 인데 브라우저가 아직 설치 신호를 주지 않았으면 조용히 기다립니다.
  if (!설치신호 && !아이폰) return null

  return (
    <div
      className="종이"
      style={{
        background: 'linear-gradient(135deg, #fff0f6, #ffe6ef)',
        borderColor: '#ffd0e0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 32, lineHeight: 1 }}>💌</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800 }}>바탕화면에 아이콘 넣기</div>
          <div className="흐리게">
            앱처럼 한 번에 열려요. 주소를 외울 필요가 없습니다.
          </div>
        </div>
        <button className="닫기" onClick={감추기} aria-label="이 안내 그만 보기" type="button">
          ×
        </button>
      </div>

      {!아이폰 ? (
        <button
          className="단추 주 가득"
          style={{ marginTop: 12 }}
          onClick={설치하기}
          type="button"
        >
          ⬇️ 지금 설치하기
        </button>
      ) : !아이폰안내 ? (
        <button
          className="단추 주 가득"
          style={{ marginTop: 12 }}
          onClick={() => 아이폰안내바꾸기(true)}
          type="button"
        >
          📱 아이폰에서 넣는 방법 보기
        </button>
      ) : (
        <div style={{ marginTop: 12 }}>
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
            <li>
              화면 아래 <b>공유 단추</b> (□에서 ↑ 화살표) 를 누릅니다.
            </li>
            <li>
              목록을 아래로 내려 <b>홈 화면에 추가</b> 를 누릅니다.
            </li>
            <li>
              오른쪽 위 <b>추가</b> 를 누르면 끝입니다.
            </li>
          </ol>
          <p className="흐리게" style={{ marginTop: 8, marginBottom: 0 }}>
            사파리(Safari)에서만 됩니다. 크롬으로 보고 있다면 사파리로 열어 주세요.
          </p>
        </div>
      )}
    </div>
  )
}
