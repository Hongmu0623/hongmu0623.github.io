# 댓글 서버 설치 안내 (처음 한 번만, 약 15분)

사이트에 달리는 댓글을 받아 두는 작은 서버입니다. Cloudflare의 무료 서비스(Workers + D1)에서 돌아가고, 카드 등록은 필요 없습니다.
화면 이름은 Cloudflare가 가끔 바꿔서 조금 다를 수 있어요. 비슷한 메뉴를 찾아 주세요. **컴퓨터에서 하는 걸 권장합니다.**

## 1. 가입
1. https://dash.cloudflare.com/sign-up 에서 이메일로 가입하고, 메일로 온 인증을 마칩니다.

## 2. 데이터베이스 만들기
1. 왼쪽 메뉴 **Storage & databases → D1 SQL database** 로 갑니다.
2. **Create database** 를 누르고 이름을 `comments` 로 적어 만듭니다. (표는 서버가 알아서 만들어요)

## 3. 서버 만들기
1. 왼쪽 메뉴 **Workers & Pages → Create** 를 누르고 **Hello World** 템플릿을 고릅니다.
2. 이름을 `hongmu-comments` 로 적고 **Deploy** 를 누릅니다.
3. 배포가 끝나면 **Edit code** 를 누릅니다.
4. 편집기에 있는 기존 코드를 **모두 지우고**, 아래 주소에서 코드를 전부 복사해 붙여 넣습니다.
   https://raw.githubusercontent.com/Hongmu0623/hongmu0623.github.io/main/comments-server/worker.js
5. 오른쪽 위 **Deploy** 를 누릅니다.

## 4. 연결과 비밀번호 설정
서버 화면의 **Settings** 에서 합니다.
1. **Bindings → Add → D1 database** : 변수 이름 `DB`, 데이터베이스는 `comments` 선택 후 저장.
2. **Variables and secrets → Add**
   - 종류 **Secret**, 이름 `ADMIN_PASSWORD`, 값은 댓글 관리용 비밀번호(길고 남이 모르는 것).
   - 종류 **Text**, 이름 `ALLOWED_ORIGIN`, 값 `https://hongmu0623.github.io`
3. **Deploy** 로 저장합니다.

## 5. 주소를 사이트에 연결
1. 서버 화면 위쪽에 있는 주소(`https://hongmu-comments.○○○.workers.dev`)를 복사합니다.
2. 그 주소를 Claude에게 알려 주세요. `content.js`의 `comments.apiUrl` 에 넣어 올려 드립니다.

## 쓰는 법
- 손님이 쓴 댓글은 "기다리는 댓글"로 쌓입니다. 사이트 주소 뒤에 `#admin` 을 붙여
  (https://hongmu0623.github.io/#admin) 비밀번호로 들어가 **승인** 또는 **삭제**하세요.
- 승인한 댓글만 글·사진 아래에 보입니다.
- 한 사람이 10분에 3개, 하루 15개까지만 쓸 수 있고 링크가 든 댓글은 막혀요.
- 비밀번호를 바꾸려면 4번과 같은 화면에서 `ADMIN_PASSWORD` 값을 새로 적으면 됩니다.
