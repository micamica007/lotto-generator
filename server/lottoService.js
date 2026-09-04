// lottoService.js - 동행복권 API 연동 및 최근 회차 통계 집계 서비스

const cache = new Map(); // drwNo -> round data
let cachedLatestRound = null;
let lastLatestFetchTime = 0;
const CACHE_TTL = 1000 * 60 * 30; // 30분 캐시

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Referer': 'https://dhlottery.co.kr/',
  'Accept': 'application/json, text/plain, */*'
};

/**
 * 특정 회차의 당첨 번호를 가져옵니다.
 */
async function fetchRound(drwNo) {
  const num = parseInt(drwNo, 10);
  if (isNaN(num) || num < 1) {
    throw new Error('유효하지 않은 회차 번호입니다.');
  }

  if (cache.has(num)) {
    return cache.get(num);
  }

  try {
    const url = `https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do?srchLtEpsd=${num}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      throw new Error(`동행복권 API 응답 오류 (${res.status})`);
    }

    const json = await res.json();
    const item = json?.data?.list?.[0];

    if (!item) {
      return null;
    }

    const roundData = {
      drwNo: item.ltEpsd,
      drwtNo1: item.tm1WnNo,
      drwtNo2: item.tm2WnNo,
      drwtNo3: item.tm3WnNo,
      drwtNo4: item.tm4WnNo,
      drwtNo5: item.tm5WnNo,
      drwtNo6: item.tm6WnNo,
      bnusNo: item.bnsWnNo,
      drwNoDate: item.ltRflYmd ? `${item.ltRflYmd.slice(0, 4)}-${item.ltRflYmd.slice(4, 6)}-${item.ltRflYmd.slice(6, 8)}` : '',
      totPrzm: item.rnk1SumWnAmt || 0,
      firstWinamnt: item.rnk1WnAmt || 0,
      firstPrzwnerCo: item.rnk1WnNope || 0,
      returnValue: 'success'
    };

    cache.set(num, roundData);
    return roundData;
  } catch (error) {
    console.error(`회차 ${drwNo} 조회 실패:`, error.message);
    throw error;
  }
}

/**
 * 가장 최신 회차 데이터를 가져옵니다.
 */
async function getLatestRound() {
  const now = Date.now();
  if (cachedLatestRound && (now - lastLatestFetchTime < CACHE_TTL)) {
    return cachedLatestRound;
  }

  try {
    const url = 'https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do';
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`동행복권 API 응답 오류 (${res.status})`);

    const json = await res.json();
    const item = json?.data?.list?.[0];

    if (!item) {
      throw new Error('최신 회차 데이터를 찾을 수 없습니다.');
    }

    const roundData = {
      drwNo: item.ltEpsd,
      drwtNo1: item.tm1WnNo,
      drwtNo2: item.tm2WnNo,
      drwtNo3: item.tm3WnNo,
      drwtNo4: item.tm4WnNo,
      drwtNo5: item.tm5WnNo,
      drwtNo6: item.tm6WnNo,
      bnusNo: item.bnsWnNo,
      drwNoDate: item.ltRflYmd ? `${item.ltRflYmd.slice(0, 4)}-${item.ltRflYmd.slice(4, 6)}-${item.ltRflYmd.slice(6, 8)}` : '',
      totPrzm: item.rnk1SumWnAmt || 0,
      firstWinamnt: item.rnk1WnAmt || 0,
      firstPrzwnerCo: item.rnk1WnNope || 0,
      returnValue: 'success'
    };

    cachedLatestRound = roundData;
    lastLatestFetchTime = now;
    cache.set(roundData.drwNo, roundData);

    return roundData;
  } catch (error) {
    console.error('최신 회차 조회 실패:', error.message);
    if (cachedLatestRound) return cachedLatestRound;
    throw error;
  }
}

/**
 * 최근 N회차의 당첨 데이터를 병렬 호출하여 번호별 출현 빈도를 집계합니다.
 */
async function getRecentStats(count = 30) {
  const numCount = Math.min(Math.max(parseInt(count, 10) || 30, 5), 100);
  const latest = await getLatestRound();
  const latestDrwNo = latest.drwNo;

  const targetRounds = [];
  for (let i = 0; i < numCount; i++) {
    const r = latestDrwNo - i;
    if (r >= 1) targetRounds.push(r);
  }

  // 10개씩 배치 병렬 호출
  const results = [];
  const batchSize = 10;
  for (let i = 0; i < targetRounds.length; i += batchSize) {
    const batch = targetRounds.slice(i, i + batchSize);
    const batchPromises = batch.map(r => fetchRound(r).catch(err => {
      console.warn(`Round ${r} fetch failed:`, err.message);
      return null;
    }));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter(Boolean));
  }

  // 번호별(1~45) 출현 빈도 통계 생성
  const frequency = {};
  const bonusFrequency = {};
  for (let n = 1; n <= 45; n++) {
    frequency[n] = 0;
    bonusFrequency[n] = 0;
  }

  for (const round of results) {
    const nums = [
      round.drwtNo1,
      round.drwtNo2,
      round.drwtNo3,
      round.drwtNo4,
      round.drwtNo5,
      round.drwtNo6
    ];
    for (const n of nums) {
      if (frequency[n] !== undefined) {
        frequency[n]++;
      }
    }
    if (round.bnusNo && bonusFrequency[round.bnusNo] !== undefined) {
      bonusFrequency[round.bnusNo]++;
    }
  }

  // 정렬된 번호 목록 (출현 빈도 순)
  const sortedByCount = Object.entries(frequency)
    .map(([num, cnt]) => ({
      number: parseInt(num, 10),
      count: cnt,
      bonusCount: bonusFrequency[num] || 0,
      totalCount: cnt + (bonusFrequency[num] || 0)
    }))
    .sort((a, b) => b.count - a.count || a.number - b.number);

  const hotNumbers = sortedByCount.slice(0, 10);
  const coldNumbers = [...sortedByCount].reverse().slice(0, 10);

  return {
    latestRound: latestDrwNo,
    analyzedCount: results.length,
    startRound: targetRounds[targetRounds.length - 1],
    endRound: latestDrwNo,
    frequency, // { 1: cnt, 2: cnt, ... 45: cnt }
    bonusFrequency,
    hotNumbers,
    coldNumbers,
    recentDraws: results.slice(0, 10).map(r => ({
      drwNo: r.drwNo,
      drwNoDate: r.drwNoDate,
      numbers: [r.drwtNo1, r.drwtNo2, r.drwtNo3, r.drwtNo4, r.drwtNo5, r.drwtNo6],
      bonus: r.bnusNo
    }))
  };
}

module.exports = {
  fetchRound,
  getLatestRound,
  getRecentStats
};
