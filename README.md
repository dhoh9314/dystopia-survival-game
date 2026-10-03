# 황폐 신호 (Dystopia Survival Game)

SF 디스토피아를 배경으로 한 초대코드 기반 멀티플레이어 생존 게임. 노드형 지도에서 장소를 이동하며 탐색하고, 턴제 선택지 전투로 고장난 로봇과 싸우고, 아이템을 조합하고, 다른 플레이어와 거래하며, 쉘터를 지어 사망 시 되살아날 거점을 만듭니다.

## 기술 스택

- **서버**: Node.js, Express, Socket.io, Prisma (SQLite / Turso)
- **클라이언트**: React, Vite

## 로컬에서 실행하기

```bash
# 서버
cd server
npm install
cp .env.example .env   # JWT_SECRET 등 채워넣기
npx prisma migrate dev
npm run dev             # http://localhost:4000

# 클라이언트 (새 터미널)
cd client
npm install
npm run dev              # http://localhost:5173
```

초대코드 발급:

```bash
cd server
npm run seed:invites -- 5   # 코드 5개 생성
```

`http://localhost:5173` 접속 후 발급받은 초대코드로 로그인합니다.

## 배포 (Render + Turso)

이 저장소는 단일 Node 서비스로 배포되도록 구성되어 있습니다 (서버가 클라이언트 빌드 결과물을 함께 서빙). `render.yaml`을 포함하고 있어 Render의 Blueprint 기능으로 바로 배포할 수 있습니다.

1. **Turso 데이터베이스 생성** (Render의 디스크는 재배포 시 초기화되므로 영속 저장소가 필요합니다)
   - [turso.tech](https://turso.tech)에서 계정 생성 후 `turso` CLI 설치
   - `turso db create dystopia-game`
   - `turso db show dystopia-game --url` → `TURSO_DATABASE_URL`
   - `turso db tokens create dystopia-game` → `TURSO_AUTH_TOKEN`

2. **Render에 배포**
   - [render.com](https://render.com) 가입 후 이 GitHub 저장소 연결
   - "New Blueprint Instance" → 이 저장소 선택 (render.yaml 자동 인식)
   - 환경변수 `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`을 Render 대시보드에서 입력
   - 배포 완료 후 발급되는 URL로 친구들과 플레이

3. **초대코드 발급** (배포 후)
   - Render 대시보드 → 해당 서비스 → Shell 탭에서:
     ```bash
     cd server && npm run seed:invites -- 10
     ```

## 프로젝트 구조

```
server/   Express + Socket.io 게임 서버, Prisma 스키마/데이터
client/   React 클라이언트
```
