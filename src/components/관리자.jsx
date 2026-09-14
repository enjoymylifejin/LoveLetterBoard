/**
 * 관리자 들어가기
 * ------------------------------------------------------------
 * 비밀번호를 서버에 보내 확인받고, 서버가 준 열쇠를 받아 둡니다.
 * 비밀번호 자체는 화면 어디에도 저장하지 않습니다.
 */
import { useState } from 'react'
import { 관리자들어가기 } from '../lib/서버.js'
import { 덮개, 알림 } from './공통.jsx'

export default function 관리자({ 닫기, 들어갔을때 }) {
  const [비번, 비번바꾸기] = useState('')
  const [보내는중, 보내는중바꾸기] = useState(false)
  const [잘못, 잘못바꾸기] = useState('')

  async function 들어가기() {
    if (!비번 || 보내는중) return
    잘못바꾸기('')
    보내는중바꾸기(true)
    try {
      const ㄱ = await 관리자들어가기(비번)
      들어갔을때(ㄱ.열쇠)
    } catch (ㅇ) {
      잘못바꾸기(ㅇ.message)
      비번바꾸기('')
      보내는중바꾸기(false)
    }
  }

  return (
    <덮개 제목="🔑 관리자" 닫기={닫기}>
      <p className="흐리게" style={{ marginTop: 4 }}>
        관리자로 들어가면 어떤 글이든 지울 수 있고, 신고로 가려진 글도 볼 수 있습니다.
      </p>

      <label className="라벨" htmlFor="관리자비번칸">
        관리자 비밀번호
      </label>
      <input
        id="관리자비번칸"
        className="입력"
        type="password"
        value={비번}
        autoComplete="off"
        inputMode="numeric"
        maxLength={40}
        placeholder="비밀번호"
        onChange={(e) => 비번바꾸기(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && 들어가기()}
      />

      <알림 종류="나쁨">{잘못}</알림>

      <button
        className="단추 주 가득"
        style={{ marginTop: 14 }}
        onClick={들어가기}
        disabled={!비번 || 보내는중}
        type="button"
      >
        {보내는중 ? '확인하는 중…' : '들어가기'}
      </button>

      <p className="흐리게" style={{ marginTop: 10 }}>
        한 번 들어가면 12시간 동안 유지됩니다.
      </p>
    </덮개>
  )
}
