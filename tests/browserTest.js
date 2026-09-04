// tests/browserTest.js - Headless Browser E2E Automation Test via CDP
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BROWSER_BIN = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
const SCREENSHOT_PATH = "C:\\Users\\USER\\.gemini\\antigravity\\brain\\40b07424-a36c-4243-b05e-c7fa4a564187\\lotto_screenshot.png";

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.pending = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = err => reject(err);
      this.ws.onmessage = msg => {
        const data = JSON.parse(msg.data);
        if (data.id && this.pending.has(data.id)) {
          const { resolve, reject } = this.pending.get(data.id);
          this.pending.delete(data.id);
          if (data.error) reject(new Error(data.error.message));
          else resolve(data.result);
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      const desc = res.exceptionDetails.exception ? res.exceptionDetails.exception.description : res.exceptionDetails.text;
      throw new Error(desc || 'Eval error');
    }
    return res.result.value;
  }
}

async function runTest() {
  console.log('--- 브라우저 검증 시작 ---');
  console.log('실행 브라우저:', BROWSER_BIN);

  const userDataDir = path.join(__dirname, '..', '.tmp-browser-profile');
  const browserProc = spawn(BROWSER_BIN, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1280,1000',
    'about:blank'
  ]);

  try {
    // 9222 포트 열릴 때까지 대기
    let targets = null;
    for (let i = 0; i < 20; i++) {
      await sleep(500);
      try {
        const res = await fetch('http://127.0.0.1:9222/json');
        if (res.ok) {
          targets = await res.json();
          if (targets && targets.length > 0) break;
        }
      } catch (e) {}
    }

    if (!targets || targets.length === 0) {
      throw new Error('CDP 연결 실패 (포트 9222 응답 없음)');
    }

    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();
    console.log('✅ CDP WebSocket 연결 성공');

    await client.send('Page.enable');
    await client.send('Runtime.enable');

    // 프론트엔드 페이지 이동
    console.log('페이지 이동: http://localhost:5173');
    await client.send('Page.navigate', { url: 'http://localhost:5173' });

    // 데이터 로드 대기 (최신 회차 및 통계 로드)
    console.log('데이터 로딩 대기 중...');
    let loaded = false;
    for (let i = 0; i < 30; i++) {
      await sleep(500);
      const hasDraw = await client.eval(`Boolean(document.body.innerText.includes('당첨결과'))`);
      if (hasDraw) {
        loaded = true;
        break;
      }
    }

    if (!loaded) {
      throw new Error('로또 최신 정보 로드 시간 초과');
    }
    console.log('✅ 최신 당첨 번호 및 통계 로드 완료');

    // 1. 고정 번호 테스트: 고정 모드에서 7번과 14번 클릭
    console.log('\n[테스트 1] 고정 번호 (7, 14) 설정 테스트 진행...');
    await client.eval(`
      (() => {
        const btn = document.querySelector('[data-tab="fixed"]');
        if (btn) btn.click();
      })()
    `);
    await sleep(200);

    await client.eval(`
      (() => {
        const b7 = document.querySelector('[data-ball="7"]');
        if (b7) b7.click();
      })()
    `);
    await sleep(150);

    await client.eval(`
      (() => {
        const b14 = document.querySelector('[data-ball="14"]');
        if (b14) b14.click();
      })()
    `);
    await sleep(250);

    const fixedCount = await client.eval(`
      document.querySelectorAll('[data-tab="fixed"]')[0]?.innerText || ''
    `);
    console.log('고정 번호 탭 텍스트:', fixedCount);

    // 2. 제외 번호 테스트: 제외 모드로 변경 후 1번, 2번, 3번 클릭
    console.log('\n[테스트 2] 제외 번호 (1, 2, 3) 설정 테스트 진행...');
    await client.eval(`
      (() => {
        const btn = document.querySelector('[data-tab="excluded"]');
        if (btn) btn.click();
      })()
    `);
    await sleep(200);

    for (const n of [1, 2, 3]) {
      await client.eval(`
        (() => {
          const b = document.querySelector('[data-ball="${n}"]');
          if (b) b.click();
        })()
      `);
      await sleep(150);
    }

    const excludedCount = await client.eval(`
      document.querySelectorAll('[data-tab="excluded"]')[0]?.innerText || ''
    `);
    console.log('제외 번호 탭 텍스트:', excludedCount);

    // 3. 5게임 번호 생성 버튼 클릭
    console.log('\n[테스트 3] "5게임 번호 생성" 버튼 클릭...');
    await client.eval(`
      (() => {
        const btn = document.querySelector('[data-action="generate-games"]');
        if (btn) btn.click();
      })()
    `);
    await sleep(500);

    // 4. 생성된 A, B, C, D, E 게임의 번호 추출 및 검증
    const gamesData = await client.eval(`
      (() => {
        const labels = ['A', 'B', 'C', 'D', 'E'];
        return labels.map(label => {
          const gameEl = document.querySelector('[data-game="' + label + '"]');
          if (!gameEl) return { label, numbers: [] };
          const balls = Array.from(gameEl.querySelectorAll('[data-ball]'));
          const numbers = balls.map(b => parseInt(b.getAttribute('data-ball'), 10));
          return { label, numbers };
        });
      })()
    `);

    console.log('\n--- 브라우저 내 5게임 생성 결과 ---');
    console.log(JSON.stringify(gamesData, null, 2));

    let allValid = true;
    gamesData.forEach(g => {
      // 검증 1: 6개 번호인지
      if (g.numbers.length !== 6) {
        console.error(`❌ [${g.label}게임] 번호 개수 오류: ${g.numbers.length}개`);
        allValid = false;
      }
      // 검증 2: 고정수 7, 14 포함 여부
      if (!g.numbers.includes(7) || !g.numbers.includes(14)) {
        console.error(`❌ [${g.label}게임] 고정수(7, 14) 누락: [${g.numbers.join(', ')}]`);
        allValid = false;
      } else {
        console.log(`✅ [${g.label}게임] 고정수(7, 14) 정상 포함`);
      }
      // 검증 3: 제외수 1, 2, 3 배제 여부
      const hasExcluded = g.numbers.some(n => [1, 2, 3].includes(n));
      if (hasExcluded) {
        console.error(`❌ [${g.label}게임] 제외수(1, 2, 3) 발견: [${g.numbers.join(', ')}]`);
        allValid = false;
      } else {
        console.log(`✅ [${g.label}게임] 제외수(1, 2, 3) 완벽 배제`);
      }
      // 검증 4: 오름차순 정렬 여부
      for (let i = 0; i < g.numbers.length - 1; i++) {
        if (g.numbers[i] >= g.numbers[i + 1]) {
          console.error(`❌ [${g.label}게임] 오름차순 정렬 실패: [${g.numbers.join(', ')}]`);
          allValid = false;
        }
      }
    });

    if (!allValid) {
      throw new Error('브라우저 게임 검증 실패');
    }

    // 스크린샷 캡처
    console.log('\n전체 페이지 스크린샷 캡처 중...');
    const screenshot = await client.send('Page.captureScreenshot', {
      format: 'png',
      quality: 95,
      captureBeyondViewport: true
    });

    fs.writeFileSync(SCREENSHOT_PATH, Buffer.from(screenshot.data, 'base64'));
    console.log('✅ 스크린샷 저장 완료:', SCREENSHOT_PATH);

    console.log('\n🎉 모든 브라우저 자동화 검증 완료 (고정수 포함, 제외수 배제, 5게임 생성, 오름차순 정렬 모두 통과)!');
  } finally {
    browserProc.kill();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

runTest().catch(err => {
  console.error('테스트 실패:', err);
  process.exit(1);
});
