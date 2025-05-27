// frontend/script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- 后端API的绝对URL ---
    const API_BASE_URL = 'https://wenge.cloudns.ch/api/';

    // --- 卡牌常量 ---
    const SUITS_ORDER = ["diamonds", "clubs", "hearts", "spades"];
    const FILENAME_VALUES = {
        "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9", "10": "10",
        "J": "jack", "Q": "queen", "K": "king", "A": "ace", "2": "2"
    };

    // --- 游戏状态变量 ---
    let localPlayerId = 'player1'; // 前端始终认为自己是player1
    let selectedCards = [];      // 存储当前玩家选中的牌对象
    let currentGameState = null; // 存储从后端获取的完整游戏状态

    // --- DOM元素获取 ---
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

    // --- UI辅助函数 ---
    function showLoading(show) {
        loadingIndicator.style.display = show ? 'block' : 'none';
    }

    function getCardFilename(card) { // card 是对象 {displayValue: 'A', suit: 'spades'}
        const valuePart = FILENAME_VALUES[card.displayValue];
        if (!valuePart || card.displayValue === 'BACK') { // 如果是牌背或者无效牌面
            return 'images/cards/back.png';
        }
        return `images/cards/${valuePart}_of_${card.suit}.png`;
    }
    
    // --- 渲染函数 ---
    function renderPlayerHand(playerId, handData, isHuman) {
        const playerArea = playerElements[playerId];
        if (!playerArea) return;

        const handElement = playerArea.hand;
        handElement.innerHTML = ''; // 清空旧牌
        
        let cardCount;
        let cardsToRenderObjects; // 存储实际的卡牌对象或模拟牌背对象

        if (isHuman && Array.isArray(handData) && handData.length > 0 && typeof handData[0] === 'object') {
            cardCount = handData.length;
            cardsToRenderObjects = [...handData]; // 复制
            // 对人类玩家手牌进行前端排序 (后端也已排序，这里主要为确保显示一致性)
            cardsToRenderObjects.sort((a, b) => {
                if (a.value === b.value) return SUITS_ORDER.indexOf(a.suit) - SUITS_ORDER.indexOf(b.suit);
                return a.value - b.value;
            });
        } else { // 对手玩家或仅有牌数信息
            cardCount = typeof handData === 'number' ? handData : (Array.isArray(handData) ? handData.length : 0);
            cardsToRenderObjects = Array(cardCount).fill({ displayValue: 'BACK', suit: 'none' });
        }

        if (playerArea.countDisplay) playerArea.countDisplay.textContent = cardCount;
        if (cardCount === 0 && !isHuman) { // 如果对手没牌了，不渲染空的牌容器
            handElement.style.height = 'auto'; // 重置可能动态设置的高度
            return;
        }


        const isSidePlayer = playerId === 'player3' || playerId === 'player4';
        // 定义卡牌原始尺寸和重叠量
        const baseCardWidth = isHuman ? 60 : 45;
        const baseCardHeight = isHuman ? 90 : 70;
        const overlapPx = isHuman ? 28 : (playerId === 'player2' ? 35 : 38); // 顶部玩家用横向重叠，左右旋转玩家用旋转前的水平重叠量

        // 动态调整左右玩家手牌容器的尺寸以尝试容纳旋转的牌
        if (isSidePlayer && cardCount > 0) {
            // 旋转后，视觉宽度约等于牌的原始高度，视觉高度约等于 (牌原始宽度 - 视觉重叠) * 数量
            handElement.style.width = `${baseCardHeight}px`; // 容器宽度约等于一张牌的高度
            // 估算旋转堆叠后的总“高度”（即旋转前的总宽度）
            const totalVisualHeightAfterRotation = baseCardWidth + (cardCount - 1) * (baseCardWidth - overlapPx * 0.7); // 0.7是个调整系数
            handElement.style.height = `${Math.max(totalVisualHeightAfterRotation, baseCardHeight)}px`;
        } else if (playerId === 'player2' && cardCount > 0) { // 顶部玩家
            handElement.style.width = '100%'; // 占满父容器
            handElement.style.height = `${baseCardHeight}px`; // 高度为一张牌的高度
        } else if (isHuman) { // 人类玩家
            handElement.style.width = '100%';
            handElement.style.height = 'auto'; // 高度由内容决定
        }


        cardsToRenderObjects.forEach((card, index) => {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card');
            // 设置卡牌原始尺寸，CSS中可能也有定义，这里JS设置可以更精确控制
            cardDiv.style.width = `${baseCardWidth}px`;
            cardDiv.style.height = `${baseCardHeight}px`;
            
            let cardId = `back_${playerId}_${index}`; // 默认ID

            if (isHuman && card.displayValue !== 'BACK') {
                cardId = `${FILENAME_VALUES[card.displayValue]}_${card.suit}`;
                cardDiv.style.backgroundImage = `url(${getCardFilename(card)})`;
                if (selectedCards.find(sc => sc.displayValue === card.displayValue && sc.suit === card.suit)) {
                    cardDiv.classList.add('selected');
                }
                cardDiv.addEventListener('click', () => toggleCardSelection(card, cardDiv));
                // 人类玩家的牌使用CSS中的margin进行横向重叠，无需JS额外处理定位
                cardDiv.style.marginRight = (index === cardCount - 1) ? '0' : `-${overlapPx}px`;
            } else { // 对手牌（牌背）
                cardDiv.style.backgroundImage = `url(${getCardFilename({displayValue: 'BACK'})})`;
                
                if (isSidePlayer) { // 玩家3和玩家4的牌需要旋转和精确定位
                    cardDiv.style.position = 'absolute';
                    cardDiv.style.zIndex = index; // 后渲染的牌在上面
                    
                    // 旋转前，牌是水平排列并重叠的
                    // 旋转后，这个水平排列变成了垂直排列
                    const horizontalOffsetBeforeRotation = index * (baseCardWidth - overlapPx);
                    
                    cardDiv.style.left = `${horizontalOffsetBeforeRotation}px`; // 在旋转前，沿X轴排列
                    cardDiv.style.top = `50%`; // 在旋转前，Y轴居中（相对于.hand容器的高度）

                    if (playerId === 'player3') { // 左边玩家，顺时针转90度
                        // 旋转中心点在牌的左边中心
                        cardDiv.style.transformOrigin = '0% 50%'; // 左边缘中点
                        cardDiv.style.transform = `translateY(-50%) rotate(90deg)`; // 先Y轴居中，再旋转
                    } else if (playerId === 'player4') { // 右边玩家，逆时针转90度
                        // 旋转中心点在牌的右边中心
                        cardDiv.style.transformOrigin = '100% 50%'; // 右边缘中点
                        cardDiv.style.transform = `translateY(-50%) rotate(-90deg)`;
                    }
                } else if (playerId === 'player2') { // 顶部玩家 (player2)
                    cardDiv.style.position = 'relative'; // 恢复默认的流式布局相关定位
                    cardDiv.style.marginRight = (index === cardCount - 1) ? '0' : `-${overlapPx}px`;
                }
            }
            cardDiv.dataset.cardId = cardId;
            cardDiv.dataset.cardData = JSON.stringify(card); // 存储原始卡牌数据
            handElement.appendChild(cardDiv);
        });
    }

    function renderAllHands(gameState) {
        if (!gameState || !gameState.playerCardCounts) {
             console.warn("RenderAllHands: gameState or playerCardCounts missing", gameState);
             return;
        }
        // 渲染人类玩家手牌
        renderPlayerHand(localPlayerId, gameState.hands?.[localPlayerId] || [], true); 
        
        // 渲染对手手牌（牌数）
        for (const playerId in playerElements) {
            if (playerId !== localPlayerId) { // 如果不是人类玩家
                const opponentCardCount = gameState.playerCardCounts[playerId] ?? 0;
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
                cardDiv.classList.add('card'); // 使用通用 .card 样式
                 // 确保出牌区的牌有明确尺寸
                cardDiv.style.width = '60px';
                cardDiv.style.height = '90px';
                cardDiv.style.backgroundImage = `url(${getCardFilename(card)})`;
                cardDiv.style.cursor = 'default';
                cardDiv.style.margin = '2px'; // 移除负边距，正常排列
                cardDiv.style.position = 'relative'; // 确保没有绝对定位残留
                playedCardsDisplay.appendChild(cardDiv);
            });
        } else {
            lastPlayedPlayerInfo.textContent = '出牌区已清空';
        }
    }

    function toggleCardSelection(cardData, cardDiv) {
        if (currentGameState && currentGameState.currentPlayer !== localPlayerId) {
            messageArea.textContent = "还没轮到您！"; return;
        }
        // 使用卡牌的唯一标识（例如displayValue和suit组合）来查找
        const cardIdentifier = `${cardData.displayValue}_${cardData.suit}`;
        const index = selectedCards.findIndex(sc => `${sc.displayValue}_${sc.suit}` === cardIdentifier);

        if (index > -1) { // 如果已选中，则从数组中移除并移除CSS类
            selectedCards.splice(index, 1); cardDiv.classList.remove('selected');
        } else { // 未选中，则添加到数组并添加CSS类
            selectedCards.push(cardData); cardDiv.classList.add('selected');
        }
    }
    
    function updateUIWithGameState(gameState) {
        currentGameState = gameState; // 更新全局游戏状态
        selectedCards = []; // 清空之前的选择

        renderAllHands(gameState); // 重新渲染所有手牌
        renderPlayedCards(gameState.lastPlayedHand); // 重新渲染出牌区

        messageArea.textContent = gameState.message || `轮到 ${playerElements[gameState.currentPlayer]?.name || gameState.currentPlayer}`;

        // 根据游戏是否结束和当前玩家来启用/禁用按钮
        if (gameState.gameOver) {
            messageArea.textContent = `游戏结束！${playerElements[gameState.winner]?.name || gameState.winner} 获胜！ ${gameState.message || ''}`;
            playButton.disabled = true; passButton.disabled = true;
            startGameButton.disabled = false; // 允许开始新游戏
        } else {
            playButton.disabled = gameState.currentPlayer !== localPlayerId;
            passButton.disabled = gameState.currentPlayer !== localPlayerId || 
                                 (gameState.currentPlayer === gameState.roundLeadPlayer && (!gameState.lastPlayedHand || gameState.lastPlayedHand.cards.length === 0));
            startGameButton.disabled = false;
        }
    }

    // --- 后端API通信函数 ---
    async function sendActionToServer(action, cards = []) {
        if (!currentGameState || currentGameState.gameOver) return;
        showLoading(true);
        playButton.disabled = true; passButton.disabled = true;

        const payload = {
            playerId: localPlayerId, // 后端通过Session识别实际玩家，这里传player1仅作参考
            action: action,
            // 发送卡牌的必要信息给后端，后端会从Session中的手牌验证
            cards: action === 'play' ? cards.map(c => ({ displayValue: c.displayValue, suit: c.suit, value: c.value })) : []
        };
        let rawResponseTextForDebug = "";
        try {
            const response = await fetch(`${API_BASE_URL}submit_hand.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include' // !! 确保发送Cookie以维持Session !!
            });

            rawResponseTextForDebug = await response.text(); // 先获取文本
            if (!response.ok) { // HTTP状态码不是2xx
                let errorMsg = `服务器错误 ${response.status}.`;
                try { // 尝试解析JSON错误信息
                    const errData = JSON.parse(rawResponseTextForDebug);
                    errorMsg = errData.message || errorMsg; 
                } catch (e) { // 如果不是JSON，显示部分原始文本
                    errorMsg += ` 响应: ${rawResponseTextForDebug.substring(0,100)}...`; 
                }
                throw new Error(errorMsg);
            }
            
            const newState = JSON.parse(rawResponseTextForDebug); // 尝试解析为JSON
            if (newState.success) {
                updateUIWithGameState(newState.gameState);
            } else {
                messageArea.textContent = `操作失败: ${newState.message}`;
                // 如果后端返回了gameState（例如session过期时），尝试用它更新UI
                if (newState.gameState && newState.gameState.currentPlayer) {
                     updateUIWithGameState(newState.gameState);
                } else if (currentGameState && currentGameState.currentPlayer === localPlayerId && !currentGameState.gameOver) {
                    // 恢复按钮状态让人类玩家可以重试（如果还是他的回合）
                    playButton.disabled = false;
                    passButton.disabled = currentGameState.currentPlayer === currentGameState.roundLeadPlayer && (!currentGameState.lastPlayedHand || currentGameState.lastPlayedHand.cards.length === 0);
                }
            }
        } catch (error) {
            console.error("操作失败时捕获的错误:", error);
            if (error instanceof SyntaxError) { // 特别处理JSON解析错误
                 messageArea.textContent = `操作失败: 服务器返回无效数据。`;
                 console.error("原始响应 (导致JSON解析失败):", rawResponseTextForDebug);
            } else { // 其他错误 (网络错误，或上面throw的Error)
                messageArea.textContent = `操作失败: ${error.message || '未知错误。'}`;
            }
            // 尝试恢复按钮状态
            if (currentGameState && currentGameState.currentPlayer === localPlayerId && !currentGameState.gameOver) {
                 playButton.disabled = false; passButton.disabled = false; // 简单恢复
            }
        } finally {
            showLoading(false);
        }
    }

    // --- 事件监听器 ---
    playButton.addEventListener('click', () => {
        if (selectedCards.length === 0) { messageArea.textContent = "请先选择要出的牌！"; return; }
        sendActionToServer('play', selectedCards);
    });

    passButton.addEventListener('click', () => sendActionToServer('pass'));

    startGameButton.addEventListener('click', async () => {
        showLoading(true); startGameButton.disabled = true; messageArea.textContent = "正在开始新游戏...";
        let rawResponseTextForDebug = "";
        try {
            const response = await fetch(`${API_BASE_URL}deal.php`, {
                method: 'GET',
                credentials: 'include' // !! 确保发送Cookie !!
            });
            
            rawResponseTextForDebug = await response.text(); 

            if (!response.ok) {
                let errorMsg = `服务器错误 ${response.status}.`;
                try { 
                    const errData = JSON.parse(rawResponseTextForDebug); 
                    errorMsg = errData.message || errorMsg; 
                } catch (e) { 
                    errorMsg += ` 响应内容: ${rawResponseTextForDebug.substring(0,200)}...`; 
                }
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
            // if (rawResponseTextForDebug && !(error instanceof SyntaxError)) { // 如果不是解析错误但有原始文本
            //     console.error("原始响应文本（调试用）:", rawResponseTextForDebug);
            // }
            startGameButton.disabled = false;
        } finally {
            showLoading(false);
        }
    });

    // --- 初始状态 ---
    playButton.disabled = true; passButton.disabled = true;
});
