import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GameTable from '../components/GameTable';
import PlayerHand from '../components/PlayerHand';
import UserPanel from '../components/UserPanel';
import { joinGame, leaveGame, getGameState, arrangeCards, playTurn } from '../services/api';
import { aiArrangeCards } from '../services/gameLogic';

const GameRoom = ({ userData }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(null);
  const [playerHand, setPlayerHand] = useState([]);
  const [arrangedCards, setArrangedCards] = useState({ head: [], middle: [], tail: [] });
  const [selectedCard, setSelectedCard] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState(null);
  const gameInterval = useRef(null);

  useEffect(() => {
    const joinGameRoom = async () => {
      try {
        const state = await joinGame(roomId, userData.id);
        setGameState(state);
        if (state.players[userData.id]?.hand) {
          setPlayerHand(state.players[userData.id].hand);
        }
      } catch (error) {
        alert(`加入游戏失败: ${error.message}`);
        navigate('/');
      }
    };

    joinGameRoom();

    return () => {
      if (gameInterval.current) clearInterval(gameInterval.current);
      leaveGame(roomId, userData.id);
    };
  }, [roomId, userData.id, navigate]);

  useEffect(() => {
    if (!gameState) return;

    // 设置轮询更新游戏状态
    gameInterval.current = setInterval(async () => {
      try {
        const state = await getGameState(roomId);
        setGameState(state);
        
        // 更新玩家手牌
        if (state.players[userData.id]?.hand) {
          setPlayerHand(state.players[userData.id].hand);
        }
        
        // 如果游戏结束，停止轮询
        if (state.status === 'completed') {
          clearInterval(gameInterval.current);
        }
      } catch (error) {
        console.error('更新游戏状态失败:', error);
      }
    }, 3000);

    return () => {
      if (gameInterval.current) clearInterval(gameInterval.current);
    };
  }, [gameState, roomId, userData.id]);

  // AI自动出牌
  useEffect(() => {
    if (!gameState || gameState.currentPlayer !== userData.id) return;
    if (gameState.status !== 'playing') return;
    
    // 如果玩家没有分牌，AI自动分牌
    if (!gameState.players[userData.id]?.arranged) {
      const aiArranged = aiArrangeCards(playerHand);
      handleArrangeCards(aiArranged);
    }
  }, [gameState, playerHand, userData.id]);

  const handleCardClick = (card) => {
    setSelectedCard(card);
  };

  const handleDragStart = (e, card) => {
    e.dataTransfer.setData('card', JSON.stringify(card));
    setIsDragging(true);
    setSelectedCard(card);
  };

  const handleDragOver = (e, target) => {
    e.preventDefault();
    setDragTarget(target);
  };

  const handleDrop = async (e, target) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!selectedCard) return;
    
    // 移动牌到目标区域
    const newArranged = { ...arrangedCards };
    
    // 从原区域移除
    Object.keys(newArranged).forEach(area => {
      newArranged[area] = newArranged[area].filter(c => 
        c.rank !== selectedCard.rank || c.suit !== selectedCard.suit
      );
    });
    
    // 添加到新区域
    if (newArranged[target].length < (target === 'head' ? 3 : 5)) {
      newArranged[target].push(selectedCard);
      setArrangedCards(newArranged);
    }
    
    setSelectedCard(null);
    setDragTarget(null);
  };

  const handleArrangeCards = async (cards = null) => {
    try {
      const arrangement = cards || arrangedCards;
      await arrangeCards(roomId, userData.id, arrangement);
      setArrangedCards(arrangement);
    } catch (error) {
      alert(`分牌失败: ${error.message}`);
    }
  };

  const handlePlayTurn = async () => {
    try {
      await playTurn(roomId, userData.id);
    } catch (error) {
      alert(`出牌失败: ${error.message}`);
    }
  };

  if (!gameState) {
    return <div className="loading">加载游戏中...</div>;
  }

  return (
    <div className="game-room">
      <div className="game-header">
        <h2>十三水游戏 - 房间 {roomId}</h2>
        <UserPanel userData={userData} />
      </div>
      
      <GameTable 
        gameState={gameState} 
        currentPlayerId={userData.id}
      />
      
      <div className="player-area">
        <PlayerHand 
          cards={playerHand} 
          onCardClick={handleCardClick}
          onDragStart={handleDragStart}
        />
        
        <div className="arrangement-area">
          <h3>分牌区域</h3>
          <div className="arrangement-sections">
            {['head', 'middle', 'tail'].map((section) => (
              <div 
                key={section}
                className={`arrangement-section ${section} ${dragTarget === section ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, section)}
                onDrop={(e) => handleDrop(e, section)}
              >
                <div className="section-header">
                  {section === 'head' ? '头墩 (3张)' : 
                   section === 'middle' ? '中墩 (5张)' : '尾墩 (5张)'}
                </div>
                <div className="section-cards">
                  {arrangedCards[section].map((card, index) => (
                    <div 
                      key={`${card.rank}-${card.suit}-${index}`} 
                      className="arranged-card"
                    >
                      <span>{card.rank}{card.suit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="arrangement-controls">
            <button 
              className="btn btn-primary"
              onClick={() => handleArrangeCards()}
              disabled={arrangedCards.head.length !== 3 || 
                       arrangedCards.middle.length !== 5 || 
                       arrangedCards.tail.length !== 5}
            >
              确认分牌
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setArrangedCards({ head: [], middle: [], tail: [] })}
            >
              重置
            </button>
            <button 
              className="btn btn-ai"
              onClick={() => {
                const aiArranged = aiArrangeCards(playerHand);
                setArrangedCards(aiArranged);
              }}
            >
              AI分牌
            </button>
          </div>
        </div>
      </div>
      
      <div className="game-controls">
        {gameState.currentPlayer === userData.id && gameState.status === 'playing' && (
          <button className="btn btn-play" onClick={handlePlayTurn}>
            出牌
          </button>
        )}
      </div>
    </div>
  );
};

export default GameRoom;
