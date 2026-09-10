/**
 * 마음 남기기
 * ------------------------------------------------------------
 * 이름을 묻지 않습니다. 글마다 익명 별명이 저절로 붙습니다.
 * 지울 때 쓸 숫자 4자리만 정해 두면 됩니다.
 */
import { useState } from 'react'
import { 글쓰기 as 서버에쓰기 } from '../lib/서버.js'
import { 내글기억 } from '../lib/나.js'
import { 마음들 } from '../lib/시각.js'
import { 덮개, 알림 } from './공통.jsx'

const 내용최대 = 600
const 받는이최대 = 20

export default function 글쓰기({ 닫기, 다썼을때 }) {
  const [내용, 내용바꾸기] = useState('')
  const [받는이, 받는이바꾸기] = useState('')
  const [태그, 태그바꾸기] = useState(마음들[0].키)
  const [비번, 비번바꾸기] = useState('')
  const [보내는중, 보내는중바꾸기] = useState(false)
  const [잘못, 잘못바꾸기] = useState('')

  const 쓸수있나 = 내용.trim().length >= 5 && /^[0-9]{4}$/.test(비번) && !보내는중

  async function 보내기() {
    if (!쓸수있나) return
    잘못바꾸기('')
    보내는중바꾸기(true)
    try {
      const ㄱ = await 서버에쓰기({ 내용, 받는이, 태그, 비번 })
      내글기억(ㄱ.id)
      다썼을때(ㄱ)
    } catch (ㅇ) {
      잘못바꾸기(ㅇ.message)
      보내는중바꾸기(false)
    }
  }

  return (
    <덮개 제목="💌 마음 남기기" 닫기={닫기}>
      <p className="흐리게" style={{ marginTop: 4 }}>
        이름은 묻지 않습니다. 글마다 익명 별명이 저절로 붙어요.
      </p>

      <label className="라벨">어떤 마음인가요?</label>
      <div className="고르기줄">
        {마음들.map((ㅁ) => (
          <button
            key={ㅁ.키}
            type="button"
            className={'고르기' + (태그 === ㅁ.키 ? ' 켬' : '')}
            onClick={() => 태그바꾸기(ㅁ.키)}
          >
            {ㅁ.그림} {ㅁ.이름}
          </button>
        ))}
      </div>

      <label className="라벨" htmlFor="받는이칸">
        누구에게 (선택) — 실명 대신 별명이나 이니셜을 권해요
      </label>
      <input
        id="받는이칸"
        className="입력"
        value={받는이}
        maxLength={받는이최대}
        placeholder="예) 3층 그분, J에게"
        onChange={(e) => 받는이바꾸기(e.target.value)}
      />

      <label className="라벨" htmlFor="내용칸">
        하고 싶은 말
      </label>
      <textarea
        id="내용칸"
        className="여러줄"
        value={내용}
        maxLength={내용최대}
        placeholder="차마 못 했던 말을 여기에 남겨 보세요."
        onChange={(e) => 내용바꾸기(e.target.value)}
      />
      <div className="글자수">
        {내용.length} / {내용최대}
      </div>

      <label className="라벨" htmlFor="비번칸">
        지울 때 쓸 숫자 4자리
      </label>
      <input
        id="비번칸"
        className="입력"
        value={비번}
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        placeholder="예) 0417"
        onChange={(e) => 비번바꾸기(e.target.value.replace(/[^0-9]/g, ''))}
      />
      <p className="흐리게" style={{ marginTop: 6 }}>
        이 숫자를 잊으면 글을 지울 수 없습니다. 다른 곳에서 쓰는 비밀번호는 쓰지 마세요.
      </p>

      <알림 종류="나쁨">{잘못}</알림>

      <button
        className="단추 주 가득"
        style={{ marginTop: 14 }}
        onClick={보내기}
        disabled={!쓸수있나}
        type="button"
      >
        {보내는중 ? '보내는 중…' : '이 마음 남기기 💗'}
      </button>
    </덮개>
  )
}
