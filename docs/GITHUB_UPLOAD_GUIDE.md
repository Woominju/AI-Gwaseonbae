# GitHub 직접 업로드 안내

Git을 많이 써 보지 않았어도 순서대로 따라 할 수 있게 작성했습니다. **아래 `AI_GWASEONBAE_4_1_GITHUB_READY.zip` 패키지만 올리세요.** 개발 폴더의 기록에는 개인 이메일과 서버 경로가 남아 있으므로 개발 폴더를 그대로 올리면 안 됩니다.

명령어의 `<내_GitHub_아이디>`, `<저장소_이름>`, `<내_이름>`, `<GitHub_noreply_이메일>`은 **꺾쇠까지 지우고** 본인 값으로 바꿉니다.

## 1. GitHub에서 새 저장소 만들기
1. https://github.com 에 로그인합니다.
2. 오른쪽 위 **+** → **New repository**를 누릅니다.
3. Repository name에 저장소 이름을 적습니다. 예: `hufs-career-atlas`
4. 공개 범위를 고릅니다 (아래 2~3번 참고).
5. **Add a README, .gitignore, license는 모두 선택하지 않습니다.** 패키지에 이미 있어 첫 Push에서 충돌합니다.
6. **Create repository**를 누르고, 열린 페이지의 주소를 복사합니다.

## 2. Private와 Public의 차이
| | Private | Public |
|---|---|---|
| 볼 수 있는 사람 | 본인과 초대한 사람 | 인터넷의 누구나 |
| 검색 노출 | 안 됨 | 될 수 있음 |
| 나중에 지우면 | 초대한 사람에게만 영향 | 이미 복제됐을 수 있어 되돌리기 어려움 |

## 3. 이번 프로젝트의 권장 설정
**Private을 권장합니다.** 학교 명칭과 캠퍼스 표현의 사용 승인이 확인되지 않았고, 저장소 라이선스도 정하지 않았습니다. 코드를 올리는 것만으로는 홈페이지가 생기지 않습니다. 홈페이지는 `docs/DEPLOYMENT_GUIDE.md`를 참고하세요.

## 4. ZIP 압축 풀기
ZIP을 Windows로 내려받은 뒤 `C:\Projects`에 풉니다 (폴더가 없으면 만듭니다). OneDrive 안이나 경로에 한글·공백이 많은 위치는 피하세요.

압축을 풀면 다음 폴더가 생겨야 합니다.
```
C:\Projects\AI_GWASEONBAE_4_1_GITHUB_READY\README.md
C:\Projects\AI_GWASEONBAE_4_1_GITHUB_READY\web\package.json
```
`README.md`가 폴더 안에 한 번 더 들어가 있으면 그 안쪽 폴더를 사용합니다.

## 5. PowerShell 열기
시작 메뉴에서 **PowerShell**을 열고 이동합니다.
```powershell
cd C:\Projects\AI_GWASEONBAE_4_1_GITHUB_READY
dir
```
목록에 `README.md`와 `web`이 보이면 맞습니다.

## 6. Git 설치 확인
```powershell
git --version
```
`git version 2.xx`가 나오면 설치되어 있습니다. 명령을 찾을 수 없다고 나오면 https://git-scm.com/download/win 에서 설치한 뒤 PowerShell을 다시 엽니다.

## 7. Git 초기화와 첫 커밋
작성자 정보는 커밋에 기록되어 공개 범위에 따라 다른 사람에게 보입니다. 개인 이메일을 감추려면 GitHub **Settings → Emails**에서 **Keep my email addresses private**를 켜고, 표시되는 `...@users.noreply.github.com` 주소를 쓰세요.

```powershell
git init -b main
git config user.name "<내_이름>"
git config user.email "<GitHub_noreply_이메일>"
git add .
git status
```
**커밋 전에 확인하세요.** `git status` 목록에 다음이 있으면 멈추고 해결합니다: `.env`, `.env.local`, `env.sh`, `node_modules`, `.next`.

```powershell
git commit -m "AI 과선배 4.1 첫 게시"
```

## 8. 원격 저장소 연결
```powershell
git remote add origin https://github.com/<내_GitHub_아이디>/<저장소_이름>.git
git remote -v
```

## 9. GitHub 인증
Git for Windows에는 Git Credential Manager가 포함되어 있어, 다음 단계의 첫 Push 때 **브라우저 로그인 창**이 열립니다. 그 창에서 로그인하면 됩니다. 비밀번호나 토큰을 명령어에 적거나 채팅에 붙이지 마세요.

## 10. 첫 Push
```powershell
git push -u origin main
```
`Branch 'main' set up to track...` 비슷한 메시지가 나오면 끝입니다.

## 11. 업로드 확인
저장소 페이지를 새로고침해서 확인합니다.
- `README.md`, `web`, `docs`, `ml`, `scripts` 폴더가 있는가
- 저장소 이름 옆에 **Private** 표시가 있는가 (Private로 만든 경우)
- `.env`, `env.sh`, `node_modules`가 **없는가**

## 12. README와 스크린샷 확인
저장소 첫 화면을 아래로 내려 README의 이미지가 보이는지 확인합니다. 깨진 그림 아이콘이 보이면 `docs/images` 폴더가 올라갔는지 확인하세요.

## 13. 이후 변경 사항 올리기
```powershell
cd C:\Projects\AI_GWASEONBAE_4_1_GITHUB_READY
git status
git add .
git commit -m "변경 내용을 짧게 적기"
git push
```

## 14. 오류가 날 때
| 메시지 | 원인과 해결 |
|---|---|
| `git`을 찾을 수 없음 | 6번을 따라 설치하고 PowerShell을 다시 엽니다 |
| `not a git repository` | 폴더 위치가 다릅니다. 5번으로 돌아갑니다 |
| `remote origin already exists` | `git remote set-url origin https://github.com/<내_GitHub_아이디>/<저장소_이름>.git` |
| `Repository not found` | 아이디·저장소 이름 오타이거나 다른 계정으로 로그인한 경우입니다. Windows **자격 증명 관리자**에서 `git:https://github.com` 항목을 지우고 다시 Push합니다 |
| `Authentication failed` | 위와 같이 자격 증명을 지우고 브라우저 로그인을 다시 합니다 |
| `rejected ... fetch first` | 저장소를 만들 때 README 등을 추가한 경우입니다. 빈 저장소를 다시 만드는 것이 가장 간단합니다. `--force`는 쓰지 마세요 |
| `Please tell me who you are` | 7번의 `git config` 두 줄을 실행합니다 |
| `LF will be replaced by CRLF` | 경고일 뿐이니 무시해도 됩니다 |
| 실수로 비밀값을 올림 | 해당 키를 **먼저 폐기·재발급**합니다. 파일을 지워도 기록에 남으므로 저장소를 삭제하고 다시 만드는 것이 가장 안전합니다 |
