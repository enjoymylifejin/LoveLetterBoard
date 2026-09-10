/**
 * 로컬 확인용 서버
 * ------------------------------------------------------------
 * Vercel 에 올리기 전에, 내 컴퓨터에서 똑같이 돌려 보는 서버입니다.
 * Vercel 이 하는 일(정적 파일 + /api 함수)을 그대로 흉내 냅니다.
 *
 *   실행 : node 로컬서버.mjs
 *   주소 : http://localhost:5180
 *
 * Vercel 에 올리면 이 파일은 쓰이지 않습니다.
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 배포폴더 = path.join(여기, 'dist')
const 포트 = Number(process.env.PORT || 5180)

const 종류 = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

if (!fs.existsSync(배포폴더)) {
  console.error('dist 폴더가 없습니다. 먼저 "npm run build" 를 해 주세요.')
  process.exit(1)
}

/* 함수를 매번 새로 읽어서, 고치면 바로 반영되게 합니다. */
async function 함수불러오기() {
  const ㄱ = pathToFileURL(path.join(여기, 'api', 'board.js')).href
  const ㄴ = await import(ㄱ + '?t=' + Date.now())
  return ㄴ.default
}

/** Vercel 의 요청/응답 모양을 흉내 냅니다. */
function 요청꾸미기(요청, 주소, 몸글) {
  const 질문 = {}
  for (const [ㅋ, ㅄ] of 주소.searchParams) 질문[ㅋ] = ㅄ
  let 몸 = {}
  if (몸글) {
    try {
      몸 = JSON.parse(몸글)
    } catch {
      몸 = {}
    }
  }
  return { method: 요청.method, query: 질문, body: 몸, headers: 요청.headers }
}

function 답장꾸미기(답장) {
  const 꾸민것 = {
    _코드: 200,
    setHeader: (ㅋ, ㅄ) => answerSafe(() => 답장.setHeader(ㅋ, ㅄ)),
    status(코드) {
      this._코드 = 코드
      return this
    },
    json(값) {
      const 글 = JSON.stringify(값)
      답장.writeHead(this._코드, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      })
      답장.end(글)
    },
  }
  return 꾸민것
}
const answerSafe = (f) => {
  try {
    f()
  } catch {
    /* 헤더가 이미 나갔으면 그냥 넘어갑니다. */
  }
}

const 서버 = http.createServer(async (요청, 답장) => {
  const 주소 = new URL(요청.url, 'http://localhost')

  /* ── /api 로 오는 것은 함수로 넘깁니다 ── */
  if (주소.pathname.startsWith('/api/')) {
    let 몸글 = ''
    for await (const ㅈ of 요청) 몸글 += ㅈ
    try {
      const 처리 = await 함수불러오기()
      await 처리(요청꾸미기(요청, 주소, 몸글), 답장꾸미기(답장))
    } catch (ㅇ) {
      console.error('함수 오류 :', ㅇ)
      답장.writeHead(500, { 'content-type': 'application/json; charset=utf-8' })
      답장.end(JSON.stringify({ 오류: ㅇ?.message || '서버 오류' }))
    }
    return
  }

  /* ── 나머지는 만들어 둔 화면 파일 ── */
  let 파일 = path.join(배포폴더, decodeURIComponent(주소.pathname))
  if (!파일.startsWith(배포폴더)) 파일 = 배포폴더 // 바깥으로 못 나가게
  if (!fs.existsSync(파일) || fs.statSync(파일).isDirectory()) {
    파일 = path.join(배포폴더, 'index.html') // 한 페이지 앱
  }

  const 확장 = path.extname(파일).toLowerCase()
  답장.writeHead(200, {
    'content-type': 종류[확장] || 'application/octet-stream',
    'cache-control': 확장 === '.html' ? 'no-store' : 'public, max-age=3600',
  })
  fs.createReadStream(파일).pipe(답장)
})

서버.listen(포트, () => {
  console.log('')
  console.log('  💌 마음 우체통이 열렸습니다.')
  console.log('  주소 : http://localhost:' + 포트)
  console.log('')
  console.log('  (저장소는 파일을 씁니다. Vercel 에 올리면 Upstash Redis 를 씁니다)')
  console.log('  끄려면 이 창에서 Ctrl+C 를 누르세요.')
  console.log('')
})
