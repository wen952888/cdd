import React from 'react';

const Card = ({ card, onDragStart, onClick, isSelected, isDraggable }) => {
  if (!card) return null;

  // 根据文件名生成图片路径
  const getCardImage = () => {
    const rankMap = {
      'A': 'ace',
      'K': 'king',
      'Q': 'queen',
      'J': 'jack',
      '10': '10',
      '9': '9',
      '8': '8',
      '7': '7',
      '6': '6',
      '5': '5',
      '4': '4',
      '3': '3',
      '2': '2'
    };
    
    const suitMap = {
      '黑桃': 'spades',
      '红桃': 'hearts',
      '梅花': 'clubs',
      '方块': 'diamonds'
    };
    
    const rank = rankMap[card.rank] || card.rank;
    const suit = suitMap[card.suit] || card.suit;
    
    return `${rank}_of_${suit}.svg`;
  };

  const cardImage = getCardImage();

  return (
    <div 
      className={`card ${isSelected ? 'selected' : ''}`}
      draggable={isDraggable}
      onDragStart={(e) => onDragStart(e, card)}
      onClick={() => onClick(card)}
    >
      <img 
        src={`/cards/${cardImage}`} 
        alt={`${card.rank}${card.suit}`} 
        onError={(e) => {
          e.target.onerror = null; 
          e.target.src = '/cards/card_back.svg';
        }}
      />
      <div className="card-label">{card.rank}{card.suit}</div>
    </div>
  );
};

export default Card;
