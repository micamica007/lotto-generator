/**
 * 로또 가중치 무작위 추출 및 게임 생성 모듈
 */

const BASE_WEIGHT = 1; // 기본 가중치 (출현 빈도가 0인 번호도 최소 확률 보장)

/**
 * 번호별 색상 스타일 반환
 * 1~10: 노란색(#FBC400)
 * 11~20: 파란색(#69C8F2)
 * 21~30: 빨간색(#FF7272)
 * 31~40: 회색(#AAAAAA)
 * 41~45: 초록색(#B0D840)
 */
export function getBallColorInfo(number) {
  const n = parseInt(number, 10);
  if (n >= 1 && n <= 10) {
    return {
      bg: '#FBC400',
      text: '#ffffff',
      border: '#E2AF00',
      category: '1-10',
      colorName: 'yellow'
    };
  } else if (n >= 11 && n <= 20) {
    return {
      bg: '#69C8F2',
      text: '#ffffff',
      border: '#46B3E6',
      category: '11-20',
      colorName: 'blue'
    };
  } else if (n >= 21 && n <= 30) {
    return {
      bg: '#FF7272',
      text: '#ffffff',
      border: '#E85B5B',
      category: '21-30',
      colorName: 'red'
    };
  } else if (n >= 31 && n <= 40) {
    return {
      bg: '#AAAAAA',
      text: '#ffffff',
      border: '#8E8E8E',
      category: '31-40',
      colorName: 'gray'
    };
  } else {
    return {
      bg: '#B0D840',
      text: '#ffffff',
      border: '#97C02D',
      category: '41-45',
      colorName: 'green'
    };
  }
}

/**
 * 단일 게임 추첨 (가중치 기반 비복원 추출)
 * @param {Object} frequencyMap - { [num: number]: count }
 * @param {Array<number>} fixedNumbers - 반드시 포함할 고정 번호 (최대 5개)
 * @param {Array<number>} excludedNumbers - 제외할 번호 (최대 10개)
 * @returns {Array<number>} 6개 오름차순 정렬된 번호 배열
 */
export function generateSingleGame(frequencyMap = {}, fixedNumbers = [], excludedNumbers = []) {
  const fixedSet = new Set(fixedNumbers.map(Number));
  const excludedSet = new Set(excludedNumbers.map(Number));

  // 1. 고정 번호 우선 배치
  const selectedNumbers = new Set(fixedSet);

  // 2. 고정 및 제외 번호를 제외한 1~45 후보군과 가중치 목록 작성
  // Weight(n) = Count(n) + Base Weight
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

  // 3. 6개가 될 때까지 가중치 확률 기반 비복원 추출
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

  // 4. 오름차순 정렬 후 반환
  return Array.from(selectedNumbers).sort((a, b) => a - b);
}

/**
 * 5게임(A, B, C, D, E) 번호 조합 일괄 생성
 * @param {Object} frequencyMap
 * @param {Array<number>} fixedNumbers
 * @param {Array<number>} excludedNumbers
 * @returns {Array<{ label: string, numbers: Array<number> }>}
 */
export function generateFiveGames(frequencyMap = {}, fixedNumbers = [], excludedNumbers = []) {
  const labels = ['A', 'B', 'C', 'D', 'E'];
  return labels.map(label => ({
    label,
    numbers: generateSingleGame(frequencyMap, fixedNumbers, excludedNumbers)
  }));
}

/**
 * 5게임 번호 조합 클립보드 텍스트 포맷 생성
 */
export function formatGamesForClipboard(games) {
  return games.map(g => {
    const formattedNums = g.numbers.map(n => String(n).padStart(2, '0')).join(', ');
    return `[${g.label}게임] ${formattedNums}`;
  }).join('\n');
}
