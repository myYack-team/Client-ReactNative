// Google Play 프로덕션 트랙의 특정 릴리즈에 릴리즈 노트를 등록한다.
//
// eas submit 은 릴리즈 노트를 지원하지 않으므로, 제출 완료 후 이 스크립트로
// Play Developer API 를 직접 호출해 releaseNotes 를 patch 한다. 외부 의존성 없이
// Node 내장 모듈(crypto)과 fetch 만 사용한다.
//
// 노트 소스: release-notes/<locale>.txt  (예: release-notes/ko-KR.txt)
//   - 파일이 비어 있으면 해당 로케일은 건너뜀
//   - release-notes 디렉터리 자체가 없거나 노트가 하나도 없으면 아무 것도 하지 않고 종료(0)
//
// 인증 서비스 계정 키 (둘 중 하나):
//   - GOOGLE_PLAY_SERVICE_ACCOUNT_JSON      : 키 JSON 문자열 (CI)
//   - GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH  : 키 JSON 파일 경로 (로컬)
//
// 대상 versionCode: --version-code 인자, 없으면 app.json 의 android.versionCode 사용.
//
// 종료 코드: 0 정상/스킵, 1 인증·API 오류, 2 대상 릴리즈를 찾지 못함.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const NOTES_DIR = 'release-notes';
const TRACK = 'production';
const MAX_NOTE_LENGTH = 500; // Play 릴리즈 노트 로케일별 최대 길이

function arg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

function loadServiceAccount() {
  const json = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (json && json.trim()) return JSON.parse(json);
  const keyPath = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH;
  if (keyPath && fs.existsSync(keyPath)) return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  throw new Error('서비스 계정 키가 없습니다 (GOOGLE_PLAY_SERVICE_ACCOUNT_JSON 또는 _KEY_PATH 설정 필요).');
}

function readNotes() {
  if (!fs.existsSync(NOTES_DIR)) return [];
  return fs
    .readdirSync(NOTES_DIR)
    .filter((f) => f.endsWith('.txt'))
    .map((f) => ({ language: path.basename(f, '.txt'), text: fs.readFileSync(path.join(NOTES_DIR, f), 'utf8').trim() }))
    .filter((n) => n.text.length > 0)
    .map((n) => {
      if (n.text.length > MAX_NOTE_LENGTH) {
        console.warn(`[release-notes] ${n.language} 노트가 ${MAX_NOTE_LENGTH}자를 초과하여 잘립니다 (${n.text.length}자).`);
        return { language: n.language, text: n.text.slice(0, MAX_NOTE_LENGTH) };
      }
      return n;
    });
}

function base64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(
    JSON.stringify({
      iss: key.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 600,
    })
  );
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${header}.${claims}`);
  const signature = base64url(signer.sign(key.private_key));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${header}.${claims}.${signature}`,
  });
  const json = await res.json();
  if (!json.access_token) throw new Error(`토큰 발급 실패: ${JSON.stringify(json)}`);
  return json.access_token;
}

const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';

async function api(method, url, token, body) {
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status} ${text}`);
  return json;
}

async function main() {
  const pkg = arg('package') || JSON.parse(fs.readFileSync('app.json', 'utf8')).expo.android.package;
  const versionCode = String(arg('version-code') || JSON.parse(fs.readFileSync('app.json', 'utf8')).expo.android.versionCode);

  const notes = readNotes();
  if (notes.length === 0) {
    console.log('[release-notes] 등록할 노트가 없습니다. 건너뜁니다.');
    return;
  }
  console.log(`[release-notes] 대상: ${pkg} track=${TRACK} versionCode=${versionCode}, 로케일=[${notes.map((n) => n.language).join(', ')}]`);

  const key = loadServiceAccount();
  const token = await getAccessToken(key);

  const edit = await api('POST', `${API}/${pkg}/edits`, token, {});
  let committed = false;
  try {
    const track = await api('GET', `${API}/${pkg}/edits/${edit.id}/tracks/${TRACK}`, token);
    const release = (track.releases || []).find((r) => (r.versionCodes || []).map(String).includes(versionCode));
    if (!release) {
      console.error(`[release-notes] track=${TRACK}에서 versionCode=${versionCode} 릴리즈를 찾지 못했습니다.`);
      process.exitCode = 2;
      return;
    }
    release.releaseNotes = notes; // 기존 status/versionCodes/name 은 그대로 두고 노트만 갱신
    await api('PUT', `${API}/${pkg}/edits/${edit.id}/tracks/${TRACK}`, token, track);
    await api('POST', `${API}/${pkg}/edits/${edit.id}:commit`, token);
    committed = true;
    console.log(`[release-notes] 완료: "${release.name}" (versionCode ${versionCode})에 노트 ${notes.length}건 등록.`);
  } finally {
    if (!committed) {
      await api('DELETE', `${API}/${pkg}/edits/${edit.id}`, token).catch(() => {});
    }
  }
}

main().catch((e) => {
  console.error(`[release-notes] 실패: ${e.message}`);
  process.exitCode = 1;
});
