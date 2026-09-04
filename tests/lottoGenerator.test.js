// tests/lottoGenerator.test.js - 단위 테스트 스크립트
const assert = require('assert');

// CommonJS wrapper for testing the algorithm
function generateSingleGame(frequencyMap = {}, fixedNumbers = [], excludedNumbers = []) {
  const BASE_WEIGHT = 1;
  const fixedSet = new Set(fixedNumbers.map(Number));
  const excludedSet = new Set(excludedNumbers.map(Number));

  const selectedNumbers = new Set(fixedSet);

  const candidatePool = [];
  for (let n = 1; n <= 45; n++) {
    if (!fixedSet.has(n) && !excludedSet.has(n)) {
      const count = frequencyMap[n] || 0;
      const weight = count + BASE_WEIGHT;
      candidatePool.push({ number: n, weight });
    }
  }

  if (selectedNumbers.size + candidatePool.length < 6) {
    throw new Error('제외 번호가 너무 많아 6개 번호를 조합할 수 없습니다.');
  }

  while (selectedNumbers.size < 6 && candidatePool.length > 0) {
    const totalWeight = candidatePool.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * totalWeight;

    let pickedIndex = -1;
    for (let i = 0; i < candidatePool.length; i++) {
      rand -= candidatePool[i].weight;
      if (rand <= 0) {
        pickedIndex = i;
        break;
      }
    }

    if (pickedIndex === -1) {
      pickedIndex = candidatePool.length - 1;
    }

    const picked = candidatePool.splice(pickedIndex, 1)[0];
    selectedNumbers.add(picked.number);
  }

  return Array.from(selectedNumbers).sort((a, b) => a - b);
}

function generateFiveGames(frequencyMap = {}, fixedNumbers = [], excludedNumbers = []) {
  const labels = ['A', 'B', 'C', 'D', 'E'];
  return labels.map(label => ({
    label,
    numbers: generateSingleGame(frequencyMap, fixedNumbers, excludedNumbers)
  }));
}

console.log('--- 로또 가중치 알고리즘 테스트 시작 ---');

// 테스트 1: 기본 5게임 생성 및 속성 검증
{
  const games = generateFiveGames();
  assert.strictEqual(games.length, 5, '5개 게임이 생성되어야 함');
  games.forEach(g => {
    assert.strictEqual(g.numbers.length, 6, `${g.label}게임은 정확히 6개 번호여야 함`);
    assert.strictEqual(new Set(g.numbers).size, 6, `${g.label}게임 번호는 중복이 없어야 함`);
    // 오름차순 정렬 검증
    for (let i = 0; i < g.numbers.length - 1; i++) {
      assert.ok(g.numbers[i] < g.numbers[i+1], `${g.label}게임 번호는 오름차순 정렬되어야 함`);
    }
    // 범위 검증 1~45
    g.numbers.forEach(n => {
      assert.ok(n >= 1 && n <= 45, `번호 ${n}은 1~45 범위 내여야 함`);
    });
  });
  console.log('✅ 테스트 1 통과: 기본 5게임(A~E), 6개 번호 중복 없음, 오름차순 정렬');
}

// 테스트 2: 고정 번호 (1~5개) 포함 검증
{
  const fixed = [7, 14, 21];
  const games = generateFiveGames({}, fixed, []);
  games.forEach(g => {
    fixed.forEach(num => {
      assert.ok(g.numbers.includes(num), `${g.label}게임에 고정번호 ${num}이 반드시 포함되어야 함`);
    });
  });
  console.log('✅ 테스트 2 통과: 고정 번호(7, 14, 21)가 모든 5게임에 정확히 포함됨');
}

// 테스트 3: 제외 번호 (최대 10개) 배제 검증
{
  const excluded = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const games = generateFiveGames({}, [], excluded);
  games.forEach(g => {
    excluded.forEach(num => {
      assert.ok(!g.numbers.includes(num), `${g.label}게임에 제외번호 ${num}이 절대 포함되지 않아야 함`);
    });
  });
  console.log('✅ 테스트 3 통과: 제외 번호(1~10)가 모든 5게임에서 완벽히 배제됨');
}

// 테스트 4: 고정 번호 + 제외 번호 동시 적용 검증
{
  const fixed = [11, 22];
  const excluded = [31, 32, 33, 34, 35];
  const games = generateFiveGames({}, fixed, excluded);
  games.forEach(g => {
    fixed.forEach(num => assert.ok(g.numbers.includes(num), '고정 번호 포함 확인'));
    excluded.forEach(num => assert.ok(!g.numbers.includes(num), '제외 번호 배제 확인'));
  });
  console.log('✅ 테스트 4 통과: 고정 번호와 제외 번호 동시 적용 정상 작동');
}

// 테스트 5: 가중치 반영 검증 (통계적 검증)
{
  // 번호 7에 가중치 100 부여, 나머지 0
  const freq = { 7: 100 };
  let count7 = 0;
  const iterations = 50;
  for (let i = 0; i < iterations; i++) {
    const res = generateSingleGame(freq, [], []);
    if (res.includes(7)) count7++;
  }
  // 가중치가 압도적이므로 거의 매번(최소 90% 이상) 포함되어야 함
  assert.ok(count7 >= iterations * 0.9, `가중치 높은 7번이 높은 빈도로 추출되어야 함 (출현: ${count7}/${iterations})`);
  console.log(`✅ 테스트 5 통과: 가중치 추첨 알고리즘 정상 작동 (가중치 우대 번호 출현율: ${(count7/iterations*100).toFixed(1)}%)`);
}

console.log('--- 모든 가중치 알고리즘 단위 테스트 성공 ---');
