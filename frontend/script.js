// frontend/script.js
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '../api/'; // 相对于 frontend 目录

    const SUITS_ORDER = ["diamonds", "clubs", "hearts", "spades"];
    const FILENAME_VALUES = {
        "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9", "10": "10",
        "J": "jack", "Q": "queen", "K": "king", "A": "ace", "2": "2"
    };

    let localPlayerId = 'player1';
    let selectedCards = [];
    let currentGameState = null;

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

    function getCardFilename(card) {
        const valuePart = FILENAME_VALUES[card.displayValue];
        if (!valuePart) {
            console.error("Invalid card displayValue for filename:", card.displayValue);
            return 'images/cards/back.png';
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
        const cardCount = handCards ? handCards.length : (currentGameState && currentGameState.playerCardCounts && currentGameState.playerCardCounts[playerId] !== undefined ? currentGameState.playerCardCounts[playerId] : 0);
        if (playerArea.countDisplay) {
             playerArea.countDisplay.textContent = cardCount;
        }

        if (!handCards || cardCount === 0) return;


        if (isHuman && handCards && Array.isArray(handCards)) { // 确保 handCards 是数组
            handCards.sort((a, b) => {
                if (a.value === b.value) {
                    return SUITS_ORDER.indexOf(a.suit) - SUITS_ORDER.indexOf(b.suit);
                }
                return a.value - b.value;
            });
        }

        const isSidePlayer = playerId === 'player3' || playerId === 'player4';
        
        // 如果是模拟的牌背数组，则直接使用cardCount
        const cardsToRender = (isHuman || !Array.isArray(handCards) || typeof handCards[0] === 'number') 
                            ? Array(cardCount).fill({ displayValue: 'BACK', suit: 'none' }) 
                            : handCards;

        let zIndexCounter = cardsToRender.length; // 用于从高到低分配z-index

        cardsToRender.forEach((card, index) => {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card');
            
            let cardId = `back_${index}`; // 默认ID
            let cardDataForStorage = card;

            if (isHuman && card.displayValue !== 'BACK') {
                cardId = `${FILENAME_VALUES[card.displayValue]}_${card.suit}`;
                cardDiv.style.backgroundImage = `url(${getCardFilename(card)})`;
                if (selectedCards.find(sc => sc.displayValue === card.displayValue && sc.suit === card.suit)) {
                    cardDiv.classList.add('selected');
                }
                cardDiv.addEventListener('click', () => toggleCardSelection(card, cardDiv));
            } else { // 对手牌或模拟牌背
                cardDiv.style.backgroundImage = `url(images/cards/back.png)`;
                if (isSidePlayer) {
                    // 为了让HTML中后出现的牌（通常视觉上是“更靠前”或“最上面”的牌）有更高的z-index
                    // 我们从一个较高的数字开始递减。
                    // 或者，如果希望HTML中第一张牌在最上面，则从1开始递增。
                    // 当前CSS的重叠方式（margin-left负值），HTML中后出现的牌会覆盖先出现的。
                    // 如果要反转这个视觉效果，就需要调整z-index。
                    // 例如，让第一张牌在最上面：
                    // cardDiv.style.zIndex = cardsToRender.length - index;
                    // 或者让最后一张牌在最上面（默认行为，但明确设置也可以）：
                    cardDiv.style.zIndex = index + 1;
                }
            }
            cardDiv.dataset.cardId = cardId;
            cardDiv.dataset.cardData = JSON.stringify(cardDataForStorage);
            playerArea.hand.appendChild(cardDiv);
        });
    }

    function renderAllHands(gameState) {
        if (!gameState || !gameState.playerCardCounts) { // 依赖 playerCardCounts
             console.warn("RenderAllHands: gameState or gameState.playerCardCounts is missing");
             return;
        }
        
        // 渲染人类玩家
        renderPlayerHand(localPlayerId, gameState.hands?.[localPlayerId], true); 
        
        for (const playerId in playerElements) {
            if (playerId !== localPlayerId) { // 渲染对手
                // 对手的手牌数量来自 gameState.playerCardCounts
                const opponentCardCount = gameState.playerCardCounts[playerId] !== undefined ? gameState.playerCardCounts[playerId] : 0;
                // 传递数量给 renderPlayerHand，它会据此创建牌背数组
                renderPlayerHand(playerId, Array(opponentCardCount).fill({displayValue: 'BACK'}), false); 
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

        if (index > -1) {
            selectedCards.splice(index, 1);
            cardDiv.classList.remove('selected');
        } else {
            selectedCards.push(cardData);
            cardDiv.classList.add('selected');
        }
    }
    
    function updateUIWithGameState(gameState) {
        currentGameState = gameState;
        selectedCards = []; 

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
                                 (gameState.currentPlayer === gameState.roundLeadPlayer && (!gameState.lastPlayedHand || gameState.lastPlayedHand.cards.length === 0));
            startGameButton.disabled = false;
        }
    }

    async function sendActionToServer(action, cards = []) {
        if (!currentGameState || currentGameState.gameOver) return;
        showLoading(true);
        playButton.disabled = true;
        passButton.disabled = true;

        const payload = {
            gameId: currentGameState.gameId,
            playerId: localPlayerId,
            action: action,
            cards: action === 'play' ? cards : []
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
                 passButton.disabled = false;
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
        const cardsToPlay = selectedCards.map(card => ({
            displayValue: card.displayValue,
            suit: card.suit,
            value: card.value
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
            const response = await fetch(`${API_BASE_URL}deal.php`, { method: 'POST' });
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

    playButton.disabled = true;
    passButton.disabled = true;
});
