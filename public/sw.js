/**
 * 마음 우체통 - 서비스 워커
 * ------------------------------------------------------------
 * 바탕화면 아이콘(웹앱)으로 설치할 수 있게 해 주고,
 * 화면 파일을 미리 담아 두어 다음부터 빨리 열리게 합니다.
 *
 * ★ 중요 : 글 목록 같은 /api/ 요청은 절대 담아 두지 않습니다.
 *          담아 두면 새 글이 안 보이고 옛날 화면만 계속 나옵니다.
 */
const 곳간 = 'maeum-v1'

self.addEventListener('install', (일) => {
  // 새 서비스 워커를 바로 쓰게 합니다.
  self.skipWaiting()
  일.waitUntil(
    caches.open(곳간).then((ㄱ) =>
      ㄱ.addAll(['./', './index.html', './manifest.webmanifest']).catch(() => {})
    )
  )
})

self.addEventListener('activate', (일) => {
  일.waitUntil(
    caches
      .keys()
      .then((이름들) =>
        Promise.all(이름들.filter((ㄴ) => ㄴ !== 곳간).map((ㄴ) => caches.delete(ㄴ)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (일) => {
  const 요청 = 일.request
  if (요청.method !== 'GET') return

  let 주소
  try {
    주소 = new URL(요청.url)
  } catch {
    return
  }

  // 다른 사이트 주소는 손대지 않습니다.
  if (주소.origin !== self.location.origin) return

  // ★ 글 관련 요청은 언제나 진짜 서버에서 받아 옵니다.
  if (주소.pathname.startsWith('/api/')) return

  // 화면 이동(새로고침 포함)은 서버 먼저, 안 되면 담아 둔 것으로.
  if (요청.mode === 'navigate') {
    일.respondWith(
      fetch(요청)
        .then((답) => {
          const 사본 = 답.clone()
          caches.open(곳간).then((ㄱ) => ㄱ.put('./index.html', 사본)).catch(() => {})
          return 답
        })
        .catch(() => caches.match('./index.html').then((ㄱ) => ㄱ || Response.error()))
    )
    return
  }

  // 그림·글꼴·스크립트는 담아 둔 것 먼저 (이름에 번호가 붙어 있어 안전합니다)
  일.respondWith(
    caches.match(요청).then(
      (담긴것) =>
        담긴것 ||
        fetch(요청)
          .then((답) => {
            if (답 && 답.status === 200 && 답.type === 'basic') {
              const 사본 = 답.clone()
              caches.open(곳간).then((ㄱ) => ㄱ.put(요청, 사본)).catch(() => {})
            }
            return 답
          })
          .catch(() => 담긴것 || Response.error())
    )
  )
})
