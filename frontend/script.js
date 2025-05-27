document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '../api/'; // 相对于 frontend 目录

    // 与后端 game_logic.php 中的定义保持一致
    const SUITS_ORDER = ["diamonds", "clubs", "hearts", "spades"];
    const FILENAME_VALUES = {
        "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9", "10": "10",
        "J": "jack", "Q": "queen", "K": "king", "A": "ace", "2": "2"
    };

    let localPlayerId = 'player1'; // 前端始终认为自己是player1，后端会映射
    let selectedCards = []; // 存储卡牌对象
    let currentGameState = null; // 存储从后端获取的完整游戏状态

    const playerElements = {
        player1: { hand: document.getElementById('player-1-hand'), countDisplay: document.getElementById('player-1-card-count'), isHuman: true, name: "玩家 1 (您)" },
        player2: { hand: document.getElementById('player-2-hand'), countDisplay: document.getElementById('player-2-card-count'), isHuman: false, name: "玩家 2" },
        player3: { hand: document.getElementById('player-3-hand'), countDisplay: document.getElementById('player-3-card-count'), isHuman: false, name: "玩家 3" },
        player4: { hand: document.getElementById('player-4-hand'), countDisplay: document.getElementById('player-4-card-count'), isHuman: false, name: "玩家 4" }
    };

    const playedCardsDisplay = document.getElementById('played-cards-display');
    const lastPlayedPlayerInfo = document.getElementById('last-played-player-info');
    const playButton = document.getElementById('play-button');
    const passButton = document.getElementById('pass-button');
    const startGameButton = document.getElementById('start-game-button');
    const messageArea = document.getElementById('message-area');
    const loadingIndicator = document.getElementById('loading-indicator');

    function showLoading(show) {
        loadingIndicator.style.display = show ? 'block' : 'none';
    }

    function getCardFilename(card) { // card 是后端传来的对象，如 {display: 'A', suit: 'spades'}
        const valuePart = FILENAME_VALUES[card.displayValue];
        if (!valuePart) {
            console.error("Invalid card displayValue for filename:", card.displayValue);
            return 'images/cards/back.png'; // Fallback
        }
        return `images/cards/${valuePart}_of_${card.suit}.png`;
    }

    function getSuitSymbol(suit) {
        switch(suit) {
            case 'spades': return '♠';
            case 'hearts': return '♥';
            case 'diamonds': return '♦';
            case 'clubs': return '♣';
            default: return suit.charAt(0).toUpperCase();
        }
    }
    
    function renderPlayerHand(playerId, handCards, isHuman) {
        const playerArea = playerElements[playerId];
        if (!playerArea) return;

        playerArea.hand.innerHTML = '';
        if (playerArea.countDisplay) {
             playerArea.countDisplay.textContent = handCards ? handCards.length : (currentGameState && currentGameState.hands && currentGameState.hands[playerId] ? currentGameState.hands[playerId].length : 0);
        }

        if (!handCards || handCards.length === 0) return;

        // 对人类玩家的手牌进行前端排序，方便查看（后端已排序，这里是视觉辅助）
        if (isHuman && handCards) {
            handCards.sort((a, b) => {
                if (a.value === b.value) {
                    return SUITS_ORDER.indexOf(a.suit) - SUITS_ORDER.indexOf(b.suit);
                }
                return a.value - b.value;
            });
        }

        handCards.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card');
            // 使用卡牌的唯一标识符，例如 "ace_spades"
            const cardId = `${FILENAME_VALUES[card.displayValue]}_${card.suit}`;
            cardDiv.dataset.cardId = cardId; // 用于识别
            cardDiv.dataset.cardData = JSON.stringify(card); // 存储完整卡牌数据

            if (isHuman) {
                cardDiv.style.backgroundImage = `url(${getCardFilename(card)})`;
                // 检查这张牌是否在selectedCards中 (比较对象引用或唯一ID)
                if (selectedCards.find(sc => sc.displayValue === card.displayValue && sc.suit === card.suit)) {
                    cardDiv.classList.add('selected');
                }
                cardDiv.addEventListener('click', () => toggleCardSelection(card, cardDiv));
            } else {
                cardDiv.style.backgroundImage = `url(images/cards/back.png)`;
            }
            playerArea.hand.appendChild(cardDiv);
        });
    }

    function renderAllHands(gameState) {
        if (!gameState || !gameState.hands) return;
        
        renderPlayerHand(localPlayerId, gameState.hands[localPlayerId], true); // 渲染人类玩家
        
        for (const playerId in playerElements) {
            if (playerId !== localPlayerId) { // 渲染对手
                 // 对手的手牌在gameState.hands中是数量，或者如果后端愿意也可以给牌背信息
                 // 此处我们简单地根据gameState.playerCardCounts来渲染牌背数量
                let opponentHandMock = [];
                if (gameState.playerCardCounts && gameState.playerCardCounts[playerId] !== undefined) {
                    for (let i = 0; i < gameState.playerCardCounts[playerId]; i++) {
                        opponentHandMock.push({ displayValue: 'BACK', suit: 'none' }); // 仅用于计数渲染牌背
                    }
                }
                renderPlayerHand(playerId, opponentHandMock, false);
            }
        }
    }

    function renderPlayedCards(lastPlayed) {
        playedCardsDisplay.innerHTML = '';
        lastPlayedPlayerInfo.textContent = '';

        if (lastPlayed && lastPlayed.cards && lastPlayed.cards.length > 0) {
            lastPlayedPlayerInfo.textContent = `${playerElements[lastPlayed.playerId]?.name || lastPlayed.playerId} 打出:`;
            lastPlayed.cards.forEach(card => {
                const cardDiv = document.createElement('div');
                cardDiv.classList.add('card');
                cardDiv.style.backgroundImage = `url(${getCardFilename(card)})`;
                cardDiv.style.cursor = 'default';
                playedCardsDisplay.appendChild(cardDiv);
            });
        } else {
            lastPlayedPlayerInfo.textContent = '出牌区已清空';
        }
    }

    function toggleCardSelection(cardData, cardDiv) {
        if (currentGameState && currentGameState.currentPlayer !== localPlayerId) {
            messageArea.textContent = "还没轮到您！";
            return;
        }

        const cardId = `${FILENAME_VALUES[cardData.displayValue]}_${cardData.suit}`;
        const index = selectedCards.findIndex(sc => FILENAME_VALUES[sc.displayValue] + '_' + sc.suit === cardId);

        if (index > -1) { // 已选中，取消选中
            selectedCards.splice(index, 1);
            cardDiv.classList.remove('selected');
        } else { // 未选中，加入选中
            selectedCards.push(cardData); // 存储完整的后端卡牌对象
            cardDiv.classList.add('selected');
        }
    }
    
    function updateUIWithGameState(gameState) {
        currentGameState = gameState;
        selectedCards = []; // 新状态来了，清空本地选择

        renderAllHands(gameState);
        renderPlayedCards(gameState.lastPlayedHand);

        messageArea.textContent = gameState.message || `轮到 ${playerElements[gameState.currentPlayer]?.name || gameState.currentPlayer}`;

        if (gameState.gameOver) {
            messageArea.textContent = `游戏结束！${playerElements[gameState.winner]?.name || gameState.winner} 获胜！ ${gameState.message || ''}`;
            playButton.disabled = true;
            passButton.disabled = true;
            startGameButton.disabled = false;
        } else {
            playButton.disabled = gameState.currentPlayer !== localPlayerId;
            passButton.disabled = gameState.currentPlayer !== localPlayerId || 
                                 (gameState.currentPlayer === gameState.roundLeadPlayer && (!gameState.lastPlayedHand || gameState.lastPlayedHand.cards.length === 0)); // 本轮首出不能直接PASS
            startGameButton.disabled = false; // 允许中途开始新游戏
        }
    }

    async function sendActionToServer(action, cards = []) {
        if (!currentGameState || currentGameState.gameOver) return;
        showLoading(true);
        playButton.disabled = true;
        passButton.disabled = true;

        const payload = {
            gameId: currentGameState.gameId, // 如果后端使用gameId
            playerId: localPlayerId,
            action: action,
            cards: action === 'play' ? cards : [] // cards是对象数组 {displayValue: 'A', suit: 'spades', value: 14}
        };

        try {
            const response = await fetch(`${API_BASE_URL}submit_hand.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `服务器错误: ${response.status}` }));
                throw new Error(errorData.message || `请求失败: ${response.status}`);
            }
            const newState = await response.json();
            if (newState.success) {
                updateUIWithGameState(newState.gameState);
            } else {
                messageArea.textContent = `错误: ${newState.message}`;
                // 操作失败，恢复按钮状态（如果还是该玩家的回合）
                if (currentGameState && currentGameState.currentPlayer === localPlayerId && !currentGameState.gameOver) {
                    playButton.disabled = false;
                    passButton.disabled = currentGameState.currentPlayer === currentGameState.roundLeadPlayer && (!currentGameState.lastPlayedHand || currentGameState.lastPlayedHand.cards.length === 0);
                }
            }
        } catch (error) {
            console.error("操作失败:", error);
            messageArea.textContent = `操作失败: ${error.message}`;
            if (currentGameState && currentGameState.currentPlayer === localPlayerId && !currentGameState.gameOver) {
                 playButton.disabled = false;
                 passButton.disabled = false; // 简单恢复
            }
        } finally {
            showLoading(false);
        }
    }

    playButton.addEventListener('click', () => {
        if (selectedCards.length === 0) {
            messageArea.textContent = "请先选择要出的牌！";
            return;
        }
        // 确保selectedCards中的牌与后端期望的格式一致
        const cardsToPlay = selectedCards.map(card => ({
            displayValue: card.displayValue,
            suit: card.suit,
            value: card.value // 后端可能需要value进行排序或验证
        }));
        sendActionToServer('play', cardsToPlay);
    });

    passButton.addEventListener('click', () => {
        sendActionToServer('pass');
    });

    startGameButton.addEventListener('click', async () => {
        showLoading(true);
        startGameButton.disabled = true;
        messageArea.textContent = "正在开始新游戏...";
        try {
            const response = await fetch(`${API_BASE_URL}deal.php`, { method: 'POST' }); // 使用POST以防GET缓存
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `服务器错误: ${response.status}` }));
                throw new Error(errorData.message || `请求失败: ${response.status}`);
            }
            const initialState = await response.json();
            if (initialState.success) {
                updateUIWithGameState(initialState.gameState);
            } else {
                messageArea.textContent = `开始游戏失败: ${initialState.message}`;
                startGameButton.disabled = false;
            }
        } catch (error) {
            console.error("开始游戏失败:", error);
            messageArea.textContent = `开始游戏失败: ${error.message}`;
            startGameButton.disabled = false;
        } finally {
            showLoading(false);
        }
    });

    // 初始加载时可以禁用操作按钮
    playButton.disabled = true;
    passButton.disabled = true;
});
