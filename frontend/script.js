// frontend/script.js
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://wenge.cloudns.ch/api/';

    const SUITS_ORDER = ["diamonds", "clubs", "hearts", "spades"];
    const FILENAME_VALUES = {
        "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9", "10": "10",
        "J": "jack", "Q": "queen", "K": "king", "A": "ace", "2": "2"
    };

    let localPlayerId = 'player1';
    let selectedCards = [];
    let currentGameState = null;
    let draggedCardData = null; // 用于存储拖拽的卡牌数据

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
    const playAreaElement = document.getElementById('play-area'); // 获取出牌区元素

    function showLoading(show) {
        loadingIndicator.style.display = show ? 'block' : 'none';
    }

    function getCardFilename(card) {
        const valuePart = FILENAME_VALUES[card.displayValue];
        if (!valuePart || card.displayValue === 'BACK') {
            return 'images/cards/back.png';
        }
        return `images/cards/${valuePart}_of_${card.suit}.png`;
    }
    
    function renderPlayerHand(playerId, handData, isHuman) {
        const playerArea = playerElements[playerId];
        if (!playerArea) return;

        const handElement = playerArea.hand;
        handElement.innerHTML = '';
        
        let cardCount;
        let cardsToRenderObjects;

        if (isHuman && Array.isArray(handData) && handData.length > 0 && typeof handData[0] === 'object') {
            cardCount = handData.length;
            cardsToRenderObjects = [...handData];
            cardsToRenderObjects.sort((a, b) => {
                if (a.value === b.value) return SUITS_ORDER.indexOf(a.suit) - SUITS_ORDER.indexOf(b.suit);
                return a.value - b.value;
            });
        } else {
            cardCount = typeof handData === 'number' ? handData : (Array.isArray(handData) ? handData.length : 0);
            cardsToRenderObjects = Array(cardCount).fill({ displayValue: 'BACK', suit: 'none' });
        }

        if (playerArea.countDisplay) playerArea.countDisplay.textContent = cardCount;
        if (cardCount === 0 && !isHuman) {
            handElement.style.height = 'auto';
            return;
        }

        const isSidePlayer = playerId === 'player3' || playerId === 'player4';
        const baseCardWidth = isHuman ? 60 : 45;
        const baseCardHeight = isHuman ? 90 : 70;
        const overlapPx = isHuman ? 28 : (playerId === 'player2' ? 35 : 38);

        if (isSidePlayer && cardCount > 0) {
            handElement.style.width = `${baseCardHeight}px`;
            const totalVisualHeightAfterRotation = baseCardWidth + (cardCount - 1) * (baseCardWidth - overlapPx * 0.7);
            handElement.style.height = `${Math.max(totalVisualHeightAfterRotation, baseCardHeight)}px`;
        } else if (playerId === 'player2' && cardCount > 0) {
            handElement.style.width = '100%';
            handElement.style.height = `${baseCardHeight}px`;
        } else if (isHuman) {
            handElement.style.width = '100%';
            handElement.style.height = 'auto';
        }

        cardsToRenderObjects.forEach((card, index) => {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card');
            cardDiv.style.width = `${baseCardWidth}px`;
            cardDiv.style.height = `${baseCardHeight}px`;
            let cardId = `back_${playerId}_${index}`;

            if (isHuman && card.displayValue !== 'BACK') {
                cardId = `${FILENAME_VALUES[card.displayValue]}_${card.suit}`;
                cardDiv.style.backgroundImage = `url(${getCardFilename(card)})`;
                
                // --- 拖拽功能 ---
                cardDiv.draggable = true;
                cardDiv.addEventListener('dragstart', (event) => {
                    if (currentGameState && currentGameState.currentPlayer === localPlayerId) { // 只在轮到当前玩家时允许拖拽
                        draggedCardData = card;
                        event.dataTransfer.setData('text/plain', JSON.stringify(card));
                        event.dataTransfer.effectAllowed = 'move';
                        event.target.classList.add('dragging'); // 对实际拖动的元素添加样式
                    } else {
                        event.preventDefault(); // 如果不是当前玩家，阻止拖拽
                    }
                });
                cardDiv.addEventListener('dragend', (event) => {
                    event.target.classList.remove('dragging');
                    draggedCardData = null;
                });
                // --- 拖拽功能结束 ---

                if (selectedCards.find(sc => sc.displayValue === card.displayValue && sc.suit === card.suit)) {
                    cardDiv.classList.add('selected');
                }
                cardDiv.addEventListener('click', () => toggleCardSelection(card, cardDiv));
                cardDiv.style.marginRight = (index === cardCount - 1) ? '0' : `-${overlapPx}px`;
            } else {
                cardDiv.style.backgroundImage = `url(${getCardFilename({displayValue: 'BACK'})})`;
                if (isSidePlayer) {
                    cardDiv.style.position = 'absolute';
                    cardDiv.style.zIndex = index + 1;
                    const horizontalOffsetBeforeRotation = index * (baseCardWidth - overlapPx);
                    cardDiv.style.left = `${horizontalOffsetBeforeRotation}px`; 
                    cardDiv.style.top = `50%`; 
                    if (playerId === 'player3') { 
                        cardDiv.style.transformOrigin = '0% 50%'; 
                        cardDiv.style.transform = `translateY(-50%) rotate(90deg)`; 
                    } else if (playerId === 'player4') { 
                        cardDiv.style.transformOrigin = '100% 50%'; 
                        cardDiv.style.transform = `translateY(-50%) rotate(-90deg)`;
                    }
                } else if (playerId === 'player2') {
                    cardDiv.style.position = 'relative';
                    cardDiv.style.marginRight = (index === cardCount - 1) ? '0' : `-${overlapPx}px`;
                }
            }
            cardDiv.dataset.cardId = cardId;
            cardDiv.dataset.cardData = JSON.stringify(card);
            handElement.appendChild(cardDiv);
        });
    }

    function renderAllHands(gameState) {
        if (!gameState || !gameState.playerCardCounts) {
             console.warn("RenderAllHands: gameState or playerCardCounts missing", gameState); return;
        }
        renderPlayerHand(localPlayerId, gameState.hands?.[localPlayerId] || [], true); 
        for (const playerId in playerElements) {
            if (playerId !== localPlayerId) {
                const opponentCardCount = gameState.playerCardCounts[playerId] ?? 0;
                renderPlayerHand(playerId, opponentCardCount, false); 
            }
        }
    }

    function renderPlayedCards(lastPlayed) {
        playedCardsDisplay.innerHTML = ''; lastPlayedPlayerInfo.textContent = '';
        if (lastPlayed && lastPlayed.cards && lastPlayed.cards.length > 0) {
            lastPlayedPlayerInfo.textContent = `${playerElements[lastPlayed.playerId]?.name || lastPlayed.playerId} 打出:`;
            lastPlayed.cards.forEach(card => {
                const cardDiv = document.createElement('div'); cardDiv.classList.add('card');
                cardDiv.style.width = '60px'; cardDiv.style.height = '90px';
                cardDiv.style.backgroundImage = `url(${getCardFilename(card)})`;
                cardDiv.style.cursor = 'default'; cardDiv.style.margin = '2px';
                cardDiv.style.position = 'relative';
                playedCardsDisplay.appendChild(cardDiv);
            });
        } else { lastPlayedPlayerInfo.textContent = '出牌区已清空'; }
    }

    function toggleCardSelection(cardData, cardDiv) {
        if (currentGameState && currentGameState.currentPlayer !== localPlayerId) {
            messageArea.textContent = "还没轮到您！"; return;
        }
        const cardIdentifier = `${cardData.displayValue}_${cardData.suit}`;
        const index = selectedCards.findIndex(sc => `${sc.displayValue}_${sc.suit}` === cardIdentifier);
        if (index > -1) {
            selectedCards.splice(index, 1); cardDiv.classList.remove('selected');
        } else {
            selectedCards.push(cardData); cardDiv.classList.add('selected');
        }
    }
    
    function updateUIWithGameState(gameState) {
        currentGameState = gameState; selectedCards = []; 
        renderAllHands(gameState); renderPlayedCards(gameState.lastPlayedHand);
        messageArea.textContent = gameState.message || `轮到 ${playerElements[gameState.currentPlayer]?.name || gameState.currentPlayer}`;
        if (gameState.gameOver) {
            messageArea.textContent = `游戏结束！${playerElements[gameState.winner]?.name || gameState.winner} 获胜！ ${gameState.message || ''}`;
            playButton.disabled = true; passButton.disabled = true; startGameButton.disabled = false;
        } else {
            playButton.disabled = gameState.currentPlayer !== localPlayerId;
            passButton.disabled = gameState.currentPlayer !== localPlayerId || (gameState.currentPlayer === gameState.roundLeadPlayer && (!gameState.lastPlayedHand || gameState.lastPlayedHand.cards.length === 0));
            startGameButton.disabled = false;
        }
    }

    async function sendActionToServer(action, cards = []) {
        if (!currentGameState || currentGameState.gameOver) return;
        showLoading(true); playButton.disabled = true; passButton.disabled = true;
        const payload = {
            playerId: localPlayerId, action: action,
            cards: action === 'play' ? cards.map(c => ({ displayValue: c.displayValue, suit: c.suit, value: c.value })) : []
        };
        let rawResponseTextForDebug = "";
        try {
            const response = await fetch(`${API_BASE_URL}submit_hand.php`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload), credentials: 'include'
            });
            rawResponseTextForDebug = await response.text();
            if (!response.ok) {
                let errorMsg = `服务器错误 ${response.status}.`;
                try { const errData = JSON.parse(rawResponseTextForDebug); errorMsg = errData.message || errorMsg; }
                catch (e) { errorMsg += ` 响应: ${rawResponseTextForDebug.substring(0,100)}...`; }
                throw new Error(errorMsg);
            }
            const newState = JSON.parse(rawResponseTextForDebug);
            if (newState.success) {
                updateUIWithGameState(newState.gameState);
            } else {
                messageArea.textContent = `操作失败: ${newState.message}`;
                if (newState.gameState && newState.gameState.currentPlayer) {
                     updateUIWithGameState(newState.gameState);
                } else if (currentGameState && currentGameState.currentPlayer === localPlayerId && !currentGameState.gameOver) {
                    playButton.disabled = false;
                    passButton.disabled = currentGameState.currentPlayer === currentGameState.roundLeadPlayer && (!currentGameState.lastPlayedHand || currentGameState.lastPlayedHand.cards.length === 0);
                }
            }
        } catch (error) {
            console.error("操作失败时捕获的错误:", error);
            if (error instanceof SyntaxError) {
                 messageArea.textContent = `操作失败: 服务器返回无效数据。`;
                 console.error("原始响应 (导致JSON解析失败):", rawResponseTextForDebug);
            } else {
                messageArea.textContent = `操作失败: ${error.message || '未知错误。'}`;
            }
            if (currentGameState && currentGameState.currentPlayer === localPlayerId && !currentGameState.gameOver) {
                 playButton.disabled = false; passButton.disabled = false;
            }
        } finally { showLoading(false); }
    }

    playButton.addEventListener('click', () => {
        if (selectedCards.length === 0) { messageArea.textContent = "请先选择要出的牌！"; return; }
        sendActionToServer('play', selectedCards); // selectedCards 是对象数组
    });
    passButton.addEventListener('click', () => sendActionToServer('pass'));

    startGameButton.addEventListener('click', async () => {
        showLoading(true); startGameButton.disabled = true; messageArea.textContent = "正在开始新游戏...";
        let rawResponseTextForDebug = "";
        try {
            const response = await fetch(`${API_BASE_URL}deal.php`, { method: 'GET', credentials: 'include' });
            rawResponseTextForDebug = await response.text();
            if (!response.ok) {
                let errorMsg = `服务器错误 ${response.status}.`;
                try { const errData = JSON.parse(rawResponseTextForDebug); errorMsg = errData.message || errorMsg; }
                catch (e) { errorMsg += ` 响应内容: ${rawResponseTextForDebug.substring(0,200)}...`; }
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
            if (error instanceof SyntaxError) {
                 messageArea.textContent = `开始游戏失败: 服务器返回无效数据 (非JSON)。请直接访问后端API URL检查响应。`;
                 console.error("原始响应 (导致JSON解析失败):", rawResponseTextForDebug);
            } else {
                 messageArea.textContent = `开始游戏失败: ${error.message || '未知网络或脚本错误。'}`;
            }
            startGameButton.disabled = false;
        } finally { showLoading(false); }
    });

    // --- 拖放目标事件 (绑定到出牌区) ---
    playAreaElement.addEventListener('dragover', (event) => {
        event.preventDefault(); // 允许放置
        event.dataTransfer.dropEffect = 'move';
        playAreaElement.classList.add('drag-over');
    });

    playAreaElement.addEventListener('dragleave', () => {
        playAreaElement.classList.remove('drag-over');
    });

    playAreaElement.addEventListener('drop', (event) => {
        event.preventDefault();
        playAreaElement.classList.remove('drag-over');

        if (draggedCardData && currentGameState && currentGameState.currentPlayer === localPlayerId) {
            // 确保 draggedCardData 是我们期望的卡牌对象格式
            const cardToPlay = {
                displayValue: draggedCardData.displayValue,
                suit: draggedCardData.suit,
                value: draggedCardData.value
            };
            // 确保当前没有其他选中的牌，或者只处理拖拽的这张
            selectedCards = []; // 清空通过点击选中的牌
            // TODO: 更好的做法是，如果拖拽了一张牌，就只打这一张，忽略 selectedCards

            sendActionToServer('play', [cardToPlay]); // 发送单张牌
        } else {
            if (!draggedCardData) console.warn("Drop event but no draggedCardData, or data was cleared.");
            else if (currentGameState && currentGameState.currentPlayer !== localPlayerId) messageArea.textContent = "还没轮到您出牌！";
            else console.warn("Drop event, but state invalid or not current player's turn.");
        }
        draggedCardData = null; // 清理拖拽数据
    });
    // --- 拖放目标事件结束 ---


    playButton.disabled = true; passButton.disabled = true;
});
