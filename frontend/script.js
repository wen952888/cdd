// frontend/script.js
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '../api/'; // 相对于 frontend 目录

    const SUITS_ORDER = ["diamonds", "clubs", "hearts", "spades"]; // 方块<梅花<红桃<黑桃
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
        if (!valuePart || card.displayValue === 'BACK') { // Handle 'BACK' for opponents
            return 'images/cards/back.png';
        }
        return `images/cards/${valuePart}_of_${card.suit}.png`;
    }
    
    function renderPlayerHand(playerId, handData, isHuman) { // handData can be array of cards or just count
        const playerArea = playerElements[playerId];
        if (!playerArea) return;

        playerArea.hand.innerHTML = '';
        
        let cardCount;
        let cardsToRender;

        if (isHuman && Array.isArray(handData)) {
            cardCount = handData.length;
            cardsToRender = [...handData]; // Create a copy to sort
            cardsToRender.sort((a, b) => { // Sort human player's hand
                if (a.value === b.value) {
                    return SUITS_ORDER.indexOf(a.suit) - SUITS_ORDER.indexOf(b.suit);
                }
                return a.value - b.value;
            });
        } else { // Opponent or count-based
            cardCount = typeof handData === 'number' ? handData : (Array.isArray(handData) ? handData.length : 0);
            cardsToRender = Array(cardCount).fill({ displayValue: 'BACK', suit: 'none' });
        }

        if (playerArea.countDisplay) {
             playerArea.countDisplay.textContent = cardCount;
        }

        if (cardCount === 0) return;

        const isSidePlayer = playerId === 'player3' || playerId === 'player4';

        cardsToRender.forEach((card, index) => {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card');
            
            let cardId = `back_${playerId}_${index}`;
            if (isHuman && card.displayValue !== 'BACK') {
                cardId = `${FILENAME_VALUES[card.displayValue]}_${card.suit}`;
                cardDiv.style.backgroundImage = `url(${getCardFilename(card)})`;
                if (selectedCards.find(sc => sc.displayValue === card.displayValue && sc.suit === card.suit)) {
                    cardDiv.classList.add('selected');
                }
                cardDiv.addEventListener('click', () => toggleCardSelection(card, cardDiv));
            } else {
                cardDiv.style.backgroundImage = `url(${getCardFilename({displayValue: 'BACK'})})`; // Use 'BACK' for filename
                if (isSidePlayer) {
                    cardDiv.style.zIndex = index + 1; // Higher index = more "on top" for vertical stack
                }
            }
            cardDiv.dataset.cardId = cardId;
            cardDiv.dataset.cardData = JSON.stringify(card); // Store original card data
            playerArea.hand.appendChild(cardDiv);
        });
    }

    function renderAllHands(gameState) {
        if (!gameState || !gameState.playerCardCounts) {
             console.warn("RenderAllHands: gameState or playerCardCounts missing");
             return;
        }
        
        renderPlayerHand(localPlayerId, gameState.hands?.[localPlayerId] || [], true); 
        
        for (const playerId in playerElements) {
            if (playerId !== localPlayerId) {
                const opponentCardCount = gameState.playerCardCounts[playerId] !== undefined ? gameState.playerCardCounts[playerId] : 0;
                renderPlayerHand(playerId, opponentCardCount, false); 
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
        const cardIdentifier = `${cardData.displayValue}_${cardData.suit}`;
        const index = selectedCards.findIndex(sc => `${sc.displayValue}_${sc.suit}` === cardIdentifier);

        if (index > -1) {
            selectedCards.splice(index, 1);
            cardDiv.classList.remove('selected');
        } else {
            selectedCards.push(cardData); // Store the actual card object from player's hand
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
            // gameId: currentGameState.gameId, // gameId is managed by session on backend
            playerId: localPlayerId, // Backend knows this is 'player1' contextually
            action: action,
            cards: action === 'play' ? cards.map(c => ({ displayValue: c.displayValue, suit: c.suit, value: c.value })) : []
        };

        try {
            const response = await fetch(`${API_BASE_URL}submit_hand.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const responseText = await response.text();
            if (!response.ok) {
                let errorMsg = `服务器错误 ${response.status}.`;
                try { const errData = JSON.parse(responseText); errorMsg = errData.message || errorMsg; }
                catch (e) { errorMsg += ` 响应: ${responseText.substring(0,100)}...`; }
                throw new Error(errorMsg);
            }
            
            const newState = JSON.parse(responseText);
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
            messageArea.textContent = `操作失败: ${error.message || error.toString()}`;
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
        sendActionToServer('play', selectedCards);
    });

    passButton.addEventListener('click', () => {
        sendActionToServer('pass');
    });

    startGameButton.addEventListener('click', async () => {
        showLoading(true);
        startGameButton.disabled = true;
        messageArea.textContent = "正在开始新游戏...";
        let rawResponseTextForDebug = "";

        try {
            const response = await fetch(`${API_BASE_URL}deal.php`, { method: 'GET' });
            
            rawResponseTextForDebug = await response.text(); 

            if (!response.ok) {
                let errorMsg = `服务器错误 ${response.status}.`;
                try { const errData = JSON.parse(rawResponseTextForDebug); errorMsg = errData.message || errorMsg; }
                catch (e) { errorMsg += ` 响应: ${rawResponseTextForDebug.substring(0,200)}...`; }
                throw new Error(errorMsg);
            }
            
            const initialState = JSON.parse(rawResponseTextForDebug);
            if (initialState.success) {
                updateUIWithGameState(initialState.gameState);
            } else {
                messageArea.textContent = `开始游戏失败: ${initialState.message || '服务器返回了操作失败。'}`;
                startGameButton.disabled = false;
            }
        } catch (error) {
            console.error("开始游戏时发生捕获的错误:", error);
            if (error instanceof SyntaxError) { // Specifically catch JSON parsing errors
                 messageArea.textContent = `开始游戏失败: 服务器返回无效数据 (非JSON)。请检查服务器日志。`;
                 console.error("原始响应 (导致JSON解析失败):", rawResponseTextForDebug);
            } else {
                 messageArea.textContent = `开始游戏失败: ${error.message || '未知网络或脚本错误。'}`;
            }
            startGameButton.disabled = false;
        } finally {
            showLoading(false);
        }
    });

    playButton.disabled = true;
    passButton.disabled = true;
});
