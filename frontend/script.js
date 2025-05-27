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
    let draggedCardData = null;

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
    const playAreaElement = document.getElementById('play-area');

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
            handElement.style.width = 'auto';
            handElement.style.height = 'auto'; // Reset if dynamically set
            return;
        }

        const isSidePlayer = playerId === 'player3' || playerId === 'player4';
        const baseCardWidth = isHuman ? 60 : 45;  // 牌的原始宽度
        const baseCardHeight = isHuman ? 90 : 70; // 牌的原始高度
        // overlapPx 定义牌与牌之间的视觉重叠距离
        // 对于旋转后的左右玩家，这个重叠是基于原始宽度的，作用于旋转后的垂直方向
        const overlapPx = isHuman ? 28 : (playerId === 'player2' ? 35 : (baseCardWidth * 0.70)); // 左右玩家重叠其原始宽度的70%

        // --- 动态调整手牌容器尺寸 ---
        if (isSidePlayer && cardCount > 0) {
            // 旋转后，容器的视觉宽度约等于一张牌的原始高度
            handElement.style.width = `${baseCardHeight}px`;
            // 容器的视觉高度是所有牌旋转后垂直堆叠的总高度
            // 每张牌贡献 (原始宽度 - 重叠量) 的高度，第一张牌贡献完整原始宽度
            const totalVisualHeight = baseCardWidth + (cardCount > 1 ? (cardCount - 1) * (baseCardWidth - overlapPx) : 0);
            handElement.style.height = `${Math.max(totalVisualHeight, baseCardHeight)}px`;
            handElement.style.position = 'relative'; // 确保是绝对定位的上下文
            // handElement.style.border = '1px dashed blue'; // 调试边框
        } else if (playerId === 'player2' && cardCount > 0) { // 顶部玩家
            handElement.style.width = '100%';
            handElement.style.height = `${baseCardHeight}px`;
            handElement.style.position = 'relative';
        } else if (isHuman) { // 人类玩家
            handElement.style.width = '100%';
            handElement.style.height = 'auto'; // or min-height
            handElement.style.position = 'relative';
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
                cardDiv.draggable = true;
                cardDiv.addEventListener('dragstart', (event) => {
                    if (currentGameState && currentGameState.currentPlayer === localPlayerId) {
                        draggedCardData = card;
                        event.dataTransfer.setData('text/plain', JSON.stringify(card));
                        event.dataTransfer.effectAllowed = 'move';
                        event.target.classList.add('dragging');
                    } else { event.preventDefault(); }
                });
                cardDiv.addEventListener('dragend', (event) => {
                    event.target.classList.remove('dragging');
                    draggedCardData = null;
                });
                if (selectedCards.find(sc => sc.displayValue === card.displayValue && sc.suit === card.suit)) {
                    cardDiv.classList.add('selected');
                }
                cardDiv.addEventListener('click', () => toggleCardSelection(card, cardDiv));
                cardDiv.style.marginRight = (index === cardCount - 1) ? '0' : `-${overlapPx}px`;
            } else { // 对手牌（牌背）
                cardDiv.style.backgroundImage = `url(${getCardFilename({displayValue: 'BACK'})})`;
                
                if (isSidePlayer) {
                    cardDiv.style.position = 'absolute';
                    cardDiv.style.zIndex = index;
                    
                    // --- 上下伸缩的核心定位逻辑 ---
                    // 牌旋转后，其视觉高度是 baseCardWidth
                    // 我们希望牌在父容器 .hand 的水平中心对齐
                    // top 属性控制垂直堆叠

                    const verticalCardOffset = index * (baseCardWidth - overlapPx);
                    cardDiv.style.top = `${verticalCardOffset}px`;

                    // 水平居中：旋转后的牌的视觉宽度是 baseCardHeight
                    // 父容器 .hand 的宽度也是 baseCardHeight
                    // 所以 left 应该是 (父容器宽度 - 牌视觉宽度) / 2 = (baseCardHeight - baseCardHeight) / 2 = 0
                    // 但由于transform-origin默认为center，旋转后牌的左上角不再是(0,0)
                    // 我们需要调整使牌的“新”中心与父容器的中心对齐
                    
                    cardDiv.style.left = '50%'; // 将牌的 transform-origin 参考点移到容器中线

                    if (playerId === 'player3') { // 左边玩家，顺时针转90度
                        // 旋转后，牌的左边缘是其原始的上边缘。
                        // transform-origin 默认是 'center center' (50% 50%)
                        // 旋转90度后，原始的水平中心线变成了垂直中心线。
                        // 我们想让这条垂直中心线对齐父容器的水平中心 (left: 50%)
                        // 然后需要将牌向上平移自身高度的一半（原始宽度的一半）
                        cardDiv.style.transform = `translateX(-${baseCardHeight/2}px) translateY(-${baseCardWidth/2}px) rotate(90deg) translateY(${baseCardWidth/2}px)`;
                        // 更简单的（如果transform-origin是牌的中心）
                        // cardDiv.style.transform = `translateX(-50%) rotate(90deg)`; // 假设父容器已正确设置宽度
                    } else if (playerId === 'player4') { // 右边玩家，逆时针转90度
                        cardDiv.style.transform = `translateX(-${baseCardHeight/2}px) translateY(-${baseCardWidth/2}px) rotate(-90deg) translateY(${baseCardWidth/2}px)`;
                        // cardDiv.style.transform = `translateX(-50%) rotate(-90deg)`;
                    }
                    // 最终方案：直接设置transform-origin为牌的中心，然后用translateX(-50%)来居中
                    cardDiv.style.transformOrigin = 'center center';
                    if (playerId === 'player3') {
                        cardDiv.style.transform = `translateX(-50%) rotate(90deg)`;
                    } else if (playerId === 'player4') {
                        cardDiv.style.transform = `translateX(-50%) rotate(-90deg)`;
                    }


                } else if (playerId === 'player2') { // 顶部玩家
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
        if (!gameState || !gameState.playerCardCounts) { console.warn("RenderAllHands: gameState or playerCardCounts missing", gameState); return; }
        renderPlayerHand(localPlayerId, gameState.hands?.[localPlayerId] || [], true); 
        for (const playerId in playerElements) {
            if (playerId !== localPlayerId) {
                const opponentCardCount = gameState.playerCardCounts[playerId] ?? 0;
                renderPlayerHand(playerId, opponentCardCount, false); 
            }
        }
    }

    function renderPlayedCards(lastPlayed) { /* ... (保持不变) ... */ }
    function toggleCardSelection(cardData, cardDiv) { /* ... (保持不变) ... */ }
    function updateUIWithGameState(gameState) { /* ... (保持不变) ... */ }
    async function sendActionToServer(action, cards = []) { /* ... (保持不变) ... */ }

    playButton.addEventListener('click', () => { /* ... (保持不变) ... */ });
    passButton.addEventListener('click', () => { /* ... (保持不变) ... */ });
    startGameButton.addEventListener('click', async () => { /* ... (保持不变) ... */ });

    playAreaElement.addEventListener('dragover', (event) => { /* ... (保持不变) ... */ });
    playAreaElement.addEventListener('dragleave', () => { /* ... (保持不变) ... */ });
    playAreaElement.addEventListener('drop', (event) => { /* ... (保持不变) ... */ });

    playButton.disabled = true; passButton.disabled = true;
});
