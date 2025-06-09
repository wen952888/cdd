// 牌型判断和AI分牌逻辑
export const cardValues = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export const suitValues = {
  '方块': 1, '梅花': 2, '红桃': 3, '黑桃': 4
};

// 获取牌的值用于排序
export const getCardValue = (card) => {
  return cardValues[card.rank] * 10 + suitValues[card.suit];
};

// 排序手牌
export const sortHand = (hand) => {
  return [...hand].sort((a, b) => getCardValue(b) - getCardValue(a));
};

// AI自动分牌逻辑
export const aiArrangeCards = (hand) => {
  const sortedHand = sortHand(hand);
  
  // 简单AI策略: 
  // 1. 将最大的5张牌作为尾墩
  // 2. 次大的5张牌作为中墩
  // 3. 最小的3张牌作为头墩
  
  return {
    head: sortedHand.slice(8, 13), // 最小3张
    middle: sortedHand.slice(3, 8), // 中间5张
    tail: sortedHand.slice(0, 3) // 最大5张
  };
};

// 判断牌型
export const getHandType = (cards) => {
  if (cards.length === 0) return '无牌';
  
  // 按点数分组
  const rankGroups = {};
  cards.forEach(card => {
    if (!rankGroups[card.rank]) rankGroups[card.rank] = 0;
    rankGroups[card.rank]++;
  });
  
  // 按花色分组
  const suitGroups = {};
  cards.forEach(card => {
    if (!suitGroups[card.suit]) suitGroups[card.suit] = 0;
    suitGroups[card.suit]++;
  });
  
  // 判断是否为同花顺
  const isFlush = Object.values(suitGroups).some(count => count === cards.length);
  
  // 排序点数
  const sortedRanks = [...cards].map(card => cardValues[card.rank])
    .sort((a, b) => a - b);
  
  // 检查顺子
  let isStraight = true;
  for (let i = 1; i < sortedRanks.length; i++) {
    if (sortedRanks[i] !== sortedRanks[i-1] + 1) {
      isStraight = false;
      break;
    }
  }
  
  // 特殊顺子：A,2,3,4,5
  if (!isStraight && sortedRanks.includes(14) && sortedRanks.includes(2)) {
    const temp = [...sortedRanks].filter(r => r !== 14).map(r => r === 14 ? 1 : r);
    temp.push(1);
    temp.sort((a, b) => a - b);
    isStraight = true;
    for (let i = 1; i < temp.length; i++) {
      if (temp[i] !== temp[i-1] + 1) {
        isStraight = false;
        break;
      }
    }
  }
  
  // 牌型判断
  if (isStraight && isFlush) {
    return sortedRanks[0] === 10 ? '皇家同花顺' : '同花顺';
  }
  
  // 四条
  if (Object.values(rankGroups).includes(4)) {
    return '四条';
  }
  
  // 葫芦
  if (Object.values(rankGroups).includes(3) && Object.values(rankGroups).includes(2)) {
    return '葫芦';
  }
  
  // 同花
  if (isFlush) {
    return '同花';
  }
  
  // 顺子
  if (isStraight) {
    return '顺子';
  }
  
  // 三条
  if (Object.values(rankGroups).includes(3)) {
    return '三条';
  }
  
  // 两对
  if (Object.values(rankGroups).filter(count => count === 2).length === 2) {
    return '两对';
  }
  
  // 一对
  if (Object.values(rankGroups).includes(2)) {
    return '一对';
  }
  
  return '散牌';
};

// 计算墩的分数
export const calculateHandScore = (cards) => {
  const type = getHandType(cards);
  const typeScores = {
    '皇家同花顺': 100,
    '同花顺': 90,
    '四条': 80,
    '葫芦': 70,
    '同花': 60,
    '顺子': 50,
    '三条': 40,
    '两对': 30,
    '一对': 20,
    '散牌': 10
  };
  
  // 基础分 + 牌面分
  const baseScore = typeScores[type] || 0;
  const cardScore = cards.reduce((sum, card) => sum + cardValues[card.rank], 0);
  
  return baseScore + cardScore / 100;
};
