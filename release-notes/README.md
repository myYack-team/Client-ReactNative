# 릴리즈 노트 (Google Play)

이 디렉터리의 `<locale>.txt` 파일이 배포 시 Google Play 프로덕션 트랙 릴리즈의 "변경사항(What's new)"으로 자동 등록됩니다.

## 사용법

1. 다음 배포에 넣을 변경사항을 `ko-KR.txt`에 작성합니다. (로케일 추가 시 `en-US.txt` 등 파일 추가)
2. main 머지 → 배포 워크플로우(`Build and Deploy to Google Play`)가 EAS 제출 완료 후 이 노트를 방금 올린 versionCode 릴리즈에 등록합니다.

## 규칙

- 로케일별 최대 500자 (초과 시 자동으로 잘림)
- 파일이 비어 있으면 해당 로케일은 건너뜀
- 노트가 하나도 없거나 등록에 실패해도 배포 자체는 실패하지 않음 (릴리즈 노트는 Play Console에서 수동 수정 가능)

## 로컬에서 수동 등록

```bash
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH="<서비스계정 키 경로>" \
  node scripts/attach-release-notes.mjs [--version-code <코드>]
```

`--version-code`를 생략하면 `app.json`의 `android.versionCode`를 사용합니다.
