# 내 기록 사이트 — 만들기·운영 가이드

글(블로그), 사진, 영상을 한곳에 올리는 개인 사이트입니다.
서버나 데이터베이스 없이 **파일 몇 개**로 돌아가서, 무료로 인터넷에 올릴 수 있습니다.

---

## 1. 폴더 구성

```
my-site/
├─ index.html   ← 뼈대 (거의 안 건드림)
├─ style.css    ← 색·글꼴·배치 (디자인 바꿀 때만)
├─ app.js       ← 화면 그리는 코드 (안 건드림)
├─ content.js   ← ★ 내용은 전부 여기서 고칩니다
├─ photos/      ← 사진 파일
└─ videos/      ← (선택) 짧은 영상 파일
```

평소에 손대는 건 `content.js`와 `photos/` 폴더 두 곳뿐입니다.

---

## 2. 준비물 (무료)

| 도구 | 용도 |
|---|---|
| **VS Code** (code.visualstudio.com) | 파일 편집기. 메모장보다 실수가 훨씬 적습니다 |
| **GitHub 계정** (github.com) | 사이트 파일 보관 + 무료 공개(GitHub Pages) |
| **GitHub Desktop** (desktop.github.com) | 명령어 없이 버튼으로 업로드 |
| **YouTube 계정** | 영상 저장소 (영상은 사이트에 직접 넣지 않는 게 좋습니다) |

---

## 3. 내 컴퓨터에서 먼저 보기

1. 압축을 풀고 `index.html`을 더블클릭 → 브라우저에서 열립니다.
2. 이것저것 눌러 보며 구조를 익히세요.
3. `content.js`를 VS Code로 열어 `SITE`의 `title`, `tagline`, `author`를 내 것으로 바꾸고 저장 → 브라우저 새로고침(F5).

> 인터넷이 연결돼 있어야 글꼴과 마크다운 변환기가 불러와집니다.

---

## 4. 내용 올리는 법

### 글 쓰기
`content.js`의 `POSTS = [` 바로 아래에 블록 하나를 복사해 붙입니다.

```js
  {
    id: "first-trip",            // 영어 소문자·숫자·하이픈만, 글마다 다르게
    title: "첫 여행 기록",
    date: "2026-11-02",
    tags: ["여행"],
    cover: "photos/2026-11-02-trip.jpg",   // 없으면 ""
    summary: "목록에 보일 한 줄 요약",
    body: `
여기에 본문을 마크다운으로 씁니다.

## 소제목

![사진 설명](photos/2026-11-02-trip.jpg)
`,
  },
```

블록 끝의 **`},` 쉼표**를 빠뜨리지 마세요. 화면이 하얗게 나오면 대부분 쉼표·따옴표 문제입니다.
마크다운 문법은 사이트 안의 「글 쓰는 법」 예시 글에 정리돼 있습니다.

### 사진 올리기
1. 사진을 **가로 1600px 정도**로 줄입니다 (윈도우 '사진' 앱 → 크기 조정, 또는 squoosh.app).
   휴대폰 원본(4~8MB)을 그대로 올리면 사이트가 느려집니다. 장당 300KB~1MB가 적당합니다.
2. 파일 이름은 영어·숫자로: `2026-11-02-sea.jpg`
3. `photos/` 폴더에 넣고, `PHOTOS`에 한 줄 추가:
   ```js
   { src: "photos/2026-11-02-sea.jpg", caption: "겨울 바다", date: "2026-11-02", place: "강릉" },
   ```

### 영상 올리기
1. YouTube에 업로드합니다. 공개 범위를 **'일부 공개'**로 하면 주소를 아는 사람만 봅니다.
2. 공유 버튼으로 주소(`https://youtu.be/...`)를 복사해서 `VIDEOS`에 추가:
   ```js
   { title: "퇴근길", date: "2026-11-03", youtube: "https://youtu.be/xxxxxxxxxxx", note: "짧은 설명" },
   ```
3. 10~20초짜리 아주 짧은 클립(수 MB)은 `videos/` 폴더에 넣고 `file: "videos/clip.mp4"`로도 됩니다.
   GitHub는 파일 하나 100MB, 저장소 전체 1GB 정도가 한계라서 긴 영상은 YouTube가 맞습니다.

### 예시 지우기
`(예시)`라고 적힌 항목과 `photos/sample-*.jpg` 파일은 내 내용이 생기면 지우세요.

---

## 5. 인터넷에 공개하기 (GitHub Pages, 무료)

1. **github.com** 가입 → 오른쪽 위 `+` → **New repository**
   - 이름: `내아이디.github.io` 로 하면 주소가 `https://내아이디.github.io` 가 됩니다
   - **Public** 선택 (무료 Pages는 공개 저장소 기준) → Create
2. **GitHub Desktop** 설치·로그인 → `File > Clone repository` → 방금 만든 저장소를 내 컴퓨터로 받기
3. 받은 폴더 안에 `my-site` 안의 파일들을 **통째로 복사** (index.html이 맨 위에 오도록)
4. GitHub Desktop 왼쪽 아래 요약 칸에 "첫 업로드" 입력 → **Commit to main** → **Push origin**
5. 웹의 저장소 화면 → **Settings → Pages** → Source: `Deploy from a branch`, Branch: `main` / `(root)` → Save
6. 1~3분 뒤 `https://내아이디.github.io` 접속 🎉

**이후 업데이트**: content.js 수정·사진 추가 → GitHub Desktop에서 Commit → Push. 1~2분이면 반영됩니다.

> 주의: 공개 저장소는 **파일 자체도 누구나 볼 수 있습니다.** 집 주소, 회사 내부 자료,
> 가족 얼굴처럼 공개하기 싫은 것은 올리지 마세요. 사진의 위치 정보(EXIF)도 지우고 올리는 게 좋습니다.

### 더 쉬운 대안: Netlify Drop
app.netlify.com/drop 에 `my-site` 폴더를 끌어다 놓기만 하면 바로 주소가 생깁니다.
다만 고칠 때마다 다시 끌어다 놓아야 해서, 꾸준히 운영하려면 GitHub 방식이 편합니다.

---

## 6. 내 도메인 연결 (선택, 연 1~2만 원대)

1. 가비아, Cloudflare, Namecheap 등에서 도메인 구매 (예: `hongmu.kr`)
2. GitHub 저장소 **Settings → Pages → Custom domain**에 도메인 입력
3. 도메인 회사 DNS 설정에 GitHub가 안내하는 레코드 추가 → **Enforce HTTPS** 체크

---

## 7. 자주 막히는 곳

| 증상 | 원인 / 해결 |
|---|---|
| 화면이 하얗다 | content.js 문법 오류. F12 → Console의 빨간 줄이 몇 번째 줄인지 알려 줌 |
| 사진 대신 색 상자 | 파일 이름 오타 또는 대소문자 차이 (`.JPG` ≠ `.jpg`) |
| 영상이 '영상 자리'로 나옴 | youtube 칸이 비었거나 주소가 잘못됨 |
| 올렸는데 안 바뀜 | Push를 안 했거나 브라우저 캐시. Ctrl+F5 |

---

## 8. 나중에 키우고 싶어지면

- 글이 50편 넘어가면: 글마다 파일을 따로 두는 **Astro** 같은 정적 사이트 생성기로 옮기기
- 댓글: **giscus** (GitHub 계정으로 댓글)
- 방문자 수: **Cloudflare Web Analytics** (무료, 쿠키 없음)
- 코딩 없이 쓰고 싶으면: 티스토리, 네이버 블로그, Ghost
