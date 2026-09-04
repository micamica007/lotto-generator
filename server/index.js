// server/index.js - Express server for Lotto stats & proxy
const express = require('express');
const cors = require('cors');
const { fetchRound, getLatestRound, getRecentStats } = require('./lottoService');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// 헬스체크
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 최신 회차 당첨 번호 조회
app.get('/api/lotto/latest', async (req, res) => {
  try {
    const data = await getLatestRound();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message || '최신 회차 조회 실패' });
  }
});

// 특정 회차 번호 조회
app.get('/api/lotto/round/:drwNo', async (req, res) => {
  try {
    const { drwNo } = req.params;
    const data = await fetchRound(drwNo);
    if (!data) {
      return res.status(404).json({ error: '해당 회차 정보를 찾을 수 없습니다.' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message || '회차 정보 조회 실패' });
  }
});

// 최근 회차 출현 빈도 통계 조회 (?count=30)
app.get('/api/lotto/stats', async (req, res) => {
  try {
    const count = parseInt(req.query.count, 10) || 30;
    const stats = await getRecentStats(count);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message || '통계 조회 실패' });
  }
});

// 동행복권 기존 getLottoNumber 형식 호환 프록시 엔드포인트
// /common.do?method=getLottoNumber&drwNo=1100
app.get('/common.do', async (req, res) => {
  const { method, drwNo } = req.query;
  if (method === 'getLottoNumber' && drwNo) {
    try {
      const data = await fetchRound(drwNo);
      return res.json(data);
    } catch (error) {
      return res.json({ returnValue: 'fail', error: error.message });
    }
  }
  res.status(400).json({ returnValue: 'fail', message: '지원하지 않는 요청입니다.' });
});

// 프로덕션 환경에서 React 정적 빌드 파일(client/dist) 서빙
const path = require('path');
const fs = require('fs');
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    // API 요청이 아닌 경우 index.html 반환
    if (!req.path.startsWith('/api') && !req.path.startsWith('/common.do')) {
      res.sendFile(path.join(clientDist, 'index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`[Lotto Server] Running on http://localhost:${PORT}`);
});
