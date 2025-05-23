// frontend/js/main.js

const dealButton = document.getElementById('deal-button');
const callBackendButton = document.getElementById('call-backend-button');
const compareButton = document.getElementById('compare-button');
const confirmOrganizationButton = document.getElementById('confirm-organization-button');
// 注意：在之前的代码中，我们可能还有一个 resetButton，如果不需要可以移除
// const resetButton = document.getElementById('reset-button');

const API_BASE_URL = 'https://wenge.cloudns.ch'; // 你的后端API基础URL

let deck = []; // 牌堆
let playerHand = []; // 玩家当前13张手牌

// 游戏状态，用于存放玩家理好的牌
let playerOrganizedHand = {
    top: [],
    middle: [],
    bottom: []
};

function initializeGame() {
    // 初始化牌堆和玩家手牌
    deck = createDeck(); // 确保 createDeck 返回的是数组
    shuffleDeck(deck);
    playerHand = []; // 清空手牌
    playerOrganizedHand = { top: [], middle: [], bottom: [] }; // 清空理好的牌

    // 清空显示区域
    const playerHandElem = document.getElementById('player-hand');
    if (playerHandElem) playerHandElem.innerHTML = '<p>点击 "发牌" 开始</p>';

    const topRowElem = document.getElementById('player-top-row');
    if (topRowElem) topRowElem.innerHTML = '';
    const middleRowElem = document.getElementById('player-middle-row');
    if (middleRowElem) middleRowElem.innerHTML = '';
    const bottomRowElem = document.getElementById('player-bottom-row');
    if (bottomRowElem) bottomRowElem.innerHTML = '';

    const topEvalText = document.getElementById('top-eval-text');
    if (topEvalText) topEvalText.textContent = '';
    const middleEvalText = document.getElementById('middle-eval-text');
    if (middleEvalText) middleEvalText.textContent = '';
    const bottomEvalText = document.getElementById('bottom-eval-text');
    if (bottomEvalText) bottomEvalText.textContent = '';

    const scoreArea = document.getElementById('score-area');
    if (scoreArea) scoreArea.textContent = '';


    displayMessage("Game initialized. Click '发牌' to deal.");
    if (compareButton) compareButton.style.display = 'none';
    if (confirmOrganizationButton) confirmOrganizationButton.style.display = 'none';
    if (dealButton) dealButton.disabled = false;
}


dealButton.addEventListener('click', () => {
    console.log("--- Deal Button Clicked ---");
    console.log("Before createDeck, deck is:", JSON.stringify(deck)); // 打印初始deck状态
    deck = createDeck();
    console.log("After createDeck, deck length:", deck ? deck.length : 'undefined', "Is deck an array?", Array.isArray(deck));

    if (!Array.isArray(deck)) {
        console.error("CRITICAL: deck is not an array after createDeck!");
        displayMessage("错误：无法创建牌堆！", true);
        return; // 如果deck有问题，提前退出
    }
    shuffleDeck(deck); // shuffleDeck 应该是原地洗牌或者返回洗好的牌
    console.log("After shuffleDeck, deck length:", deck.length);

    playerHand = dealCards(deck, 13); // dealCards 应该返回一个包含13张牌的数组
    console.log("After dealCards, playerHand is:", playerHand);
    console.log("Is playerHand an array?", Array.isArray(playerHand), "playerHand length:", playerHand ? playerHand.length : 'undefined or null');


    if (playerHand === undefined || !Array.isArray(playerHand)) { // 增加对 playerHand 类型的检查
        console.error("CRITICAL: playerHand is undefined or not an array! Problem in dealCards or its inputs.");
        displayMessage("错误：发牌失败！", true);
        // 可以进一步打印 dealCards 的输入参数
        console.log("Input to dealCards when playerHand was problematic - deck length:", deck ? deck.length : 'undefined', "numberOfCards:", 13);
        return; // 如果 playerHand 有问题，不继续执行
    }

    displayInitialHand(playerHand); // 将玩家手牌显示到UI，并使其可选
    displayMessage("请理牌！将手牌分配到头道、中道、尾道。");

    if (dealButton) dealButton.disabled = true; // 发牌后禁用发牌按钮
    if (confirmOrganizationButton) confirmOrganizationButton.style.display = 'inline-block'; // 显示确认理牌按钮
});


confirmOrganizationButton.addEventListener('click', () => {
    console.log("--- Confirm Organization Button Clicked ---");
    // 1. 从UI的三个牌道获取卡牌数据并填充到 playerOrganizedHand
    // 注意：确保卡牌DOM元素上通过 cardDiv.cardData = card; 存储了卡牌对象
    const topRowCards = Array.from(document.getElementById('player-top-row').children).map(div => div.cardData);
    const middleRowCards = Array.from(document.getElementById('player-middle-row').children).map(div => div.cardData);
    const bottomRowCards = Array.from(document.getElementById('player-bottom-row').children).map(div => div.cardData);

    // 过滤掉可能的undefined值（如果某个div没有cardData）
    playerOrganizedHand.top = topRowCards.filter(card => card !== undefined);
    playerOrganizedHand.middle = middleRowCards.filter(card => card !== undefined);
    playerOrganizedHand.bottom = bottomRowCards.filter(card => card !== undefined);

    console.log("Organized Hand - Top:", playerOrganizedHand.top);
    console.log("Organized Hand - Middle:", playerOrganizedHand.middle);
    console.log("Organized Hand - Bottom:", playerOrganizedHand.bottom);

    // 2. 校验牌数
    if (playerOrganizedHand.top.length !== 3 ||
        playerOrganizedHand.middle.length !== 5 ||
        playerOrganizedHand.bottom.length !== 5) {
        const totalCardsOrganized = playerOrganizedHand.top.length + playerOrganizedHand.middle.length + playerOrganizedHand.bottom.length;
        displayMessage(
            `牌数不正确！头道需3张(当前${playerOrganizedHand.top.length}), 中道需5张(当前${playerOrganizedHand.middle.length}), 尾道需5张(当前${playerOrganizedHand.bottom.length}). 总共已分配 ${totalCardsOrganized} / 13 张.`,
             true
        );
        return;
    }

    // 3. 计算牌型并显示
    const topEval = evaluateHand(playerOrganizedHand.top);
    const middleEval = evaluateHand(playerOrganizedHand.middle);
    const bottomEval = evaluateHand(playerOrganizedHand.bottom);

    console.log("Top Eval:", topEval);
    console.log("Middle Eval:", middleEval);
    console.log("Bottom Eval:", bottomEval);

    const topEvalText = document.getElementById('top-eval-text');
    if (topEvalText) topEvalText.textContent = ` (${topEval.message || '未知'})`;
    const middleEvalText = document.getElementById('middle-eval-text');
    if (middleEvalText) middleEvalText.textContent = ` (${middleEval.message || '未知'})`;
    const bottomEvalText = document.getElementById('bottom-eval-text');
    if (bottomEvalText) bottomEvalText.textContent = ` (${bottomEval.message || '未知'})`;

    // 4. 检查倒水
    if (checkDaoshui(topEval, middleEval, bottomEval)) {
        displayMessage("倒水了！请重新理牌或确认。", true);
        // 倒水通常直接判输，但这里可以先提示
    } else {
        displayMessage("理牌完成，可以比牌了！");
    }

    if (compareButton) compareButton.style.display = 'inline-block'; // 显示比牌按钮
    if (confirmOrganizationButton) confirmOrganizationButton.style.display = 'none'; // 隐藏确认按钮
});

compareButton.addEventListener('click', () => {
    console.log("--- Compare Button Clicked ---");
    // 重新评估以防万一 (通常不需要，因为数据在confirm时已固定)
    const topEval = evaluateHand(playerOrganizedHand.top);
    const middleEval = evaluateHand(playerOrganizedHand.middle);
    const bottomEval = evaluateHand(playerOrganizedHand.bottom);

    if (checkDaoshui(topEval, middleEval, bottomEval)) {
        displayMessage("倒水！本局判输。", true);
        // 处理输的逻辑...
    } else {
        displayMessage("比牌完成！（此处应有计分和与对手比较的逻辑）");
        // 处理计分和胜负判断逻辑...
        // let playerScore = 0; // 示例
        // document.getElementById('score-area').textContent = `得分: ${playerScore}`;
    }
    if (compareButton) compareButton.style.display = 'none';
    if (dealButton) dealButton.disabled = false; // 允许开始下一局
});


callBackendButton.addEventListener('click', async () => {
    displayMessage("Calling backend...", false);
    try {
        const response = await fetch(`${API_BASE_URL}/api/index.php?action=hello`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        displayMessage(`Backend says: ${data.message} (Timestamp: ${data.timestamp})`, false);
    } catch (error) {
        console.error("Error calling backend:", error);
        displayMessage(`Error connecting to backend: ${error.message}`, true);
    }
});

// 初始化游戏
// 确保在所有DOM元素加载完毕后调用
document.addEventListener('DOMContentLoaded', (event) => {
    initializeGame();
});
