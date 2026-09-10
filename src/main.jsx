import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'

/** 화면이 통째로 죽지 않도록 감싸 둡니다. */
class 안전덮개 extends React.Component {
  constructor(ㄱ) {
    super(ㄱ)
    this.state = { 문제: null }
  }
  static getDerivedStateFromError(ㅇ) {
    return { 문제: ㅇ }
  }
  render() {
    if (!this.state.문제) return this.props.children
    return (
      <div className="감싸기">
        <div className="종이" style={{ marginTop: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>😢</div>
          <h2 style={{ margin: '10px 0 6px' }}>화면을 그리지 못했어요</h2>
          <p className="흐리게">잠시 뒤 다시 열어 주세요.</p>
          <button
            className="단추 주"
            style={{ marginTop: 12 }}
            onClick={() => location.reload()}
            type="button"
          >
            새로 열기
          </button>
        </div>
      </div>
    )
  }
}

/* 바탕화면 아이콘(웹앱)으로 설치할 수 있게 해 주는 일꾼을 등록합니다. */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* 등록에 실패해도 화면은 그대로 잘 돕니다. */
    })
  })
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <안전덮개>
      <App />
    </안전덮개>
  </React.StrictMode>
)
