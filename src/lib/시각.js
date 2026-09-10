/** "3분 전" 처럼 읽기 쉬운 시각으로 바꿉니다. */
export function 흐른시간(시각) {
  const 초 = Math.max(0, Math.floor((Date.now() - Number(시각 || 0)) / 1000))
  if (초 < 60) return '방금'
  const 분 = Math.floor(초 / 60)
  if (분 < 60) return 분 + '분 전'
  const 시 = Math.floor(분 / 60)
  if (시 < 24) return 시 + '시간 전'
  const 날 = Math.floor(시 / 24)
  if (날 < 7) return 날 + '일 전'
  const ㄷ = new Date(Number(시각))
  return `${ㄷ.getMonth() + 1}월 ${ㄷ.getDate()}일`
}

export const 마음들 = [
  { 키: 'seolem', 이름: '설렘', 그림: '💗' },
  { 키: 'jjaksarang', 이름: '짝사랑', 그림: '🌙' },
  { 키: 'gomawo', 이름: '고마움', 그림: '🌷' },
  { 키: 'mianhae', 이름: '미안함', 그림: '🌧️' },
  { 키: 'yonggi', 이름: '용기', 그림: '🔥' },
  { 키: 'geurium', 이름: '그리움', 그림: '🕊️' },
]

export const 마음찾기 = (키) =>
  마음들.find((ㅁ) => ㅁ.키 === 키) || { 키, 이름: '마음', 그림: '💌' }
