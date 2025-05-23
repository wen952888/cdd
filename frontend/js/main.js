// frontend/js/main.js

const dealButton = document.getElementById('deal-button');
const callBackendButton = document.getElementById('call-backend-button');
const compareButton = document.getElementById('compare-button'); // 新按钮
const confirmOrganizationButton = document.getElementById('confirm-organization-button'); // 新按钮

// ... (API_BASE_URL, deck, playerHand, initializeGame 定义) ...

function initializeGame() {
    deck = createDeck();
    shuffleDeck(deck);
    playerHand = []; // 清空手牌
    playerOrganizedHand = { top: [], middle: [], bottom: [] }; // 清空理好的牌

    // 清空显示区域
    document.getElementById('player-hand').innerHTML = '<p>点击 "发牌" 开始</p>';
    document.getElementById('player-top-row').innerHTML = '';
    document.getElementById('player-middle-row').innerHTML = '';
    document.getElementById('player-bottom-row').innerHTML = '';
    document.getElementById('top-eval-text').textContent = '';
    document.getElementById('middle-eval-text').textContent = '';
    document.getElementById('bottom-eval-text').textContent = '';


    displayMessage("Game initialized. Click '发牌' to deal.");
    compareButton.style.display = 'none';
    confirmOrganizationButton.style.display = 'none';
    dealButton.disabled = false;
}


dealButton.addEventListener('click', () => {
    deck = createDeck();
    shuffleDeck(deck);
    playerHand = dealCards(deck, 13);

    displayInitialHand(playerHand); // 显示初始13张牌，使其可选
    displayMessage("请理牌！将手牌分配到头道、中道、尾道。");

    dealButton.disabled = true; // 发牌后禁用发牌按钮
    confirmOrganizationButton.style.display = 'inline-block'; // 显示确认理牌按钮
});


confirmOrganizationButton.addEventListener('click', () => {
    // 1. 从UI的三个牌道获取卡牌数据并填充到 playerOrganizedHand
    // (如果使用 SortableJS, 你可能需要在 onAdd/onUpdate 回调中实时更新 playerOrganizedHand)
    // 这里简化为手动从DOM读取 (假设卡牌DOM元素上存有cardData)
    playerOrganizedHand.top = Array.from(document.getElementById('player-top-row').children).map(div => div.cardData);
    playerOrganizedHand.middle = Array.from(document.getElementById('player-middle-row').children).map(div => div.cardData);
    playerOrganizedHand.bottom = Array.from(document.getElementById('player-bottom-row').children).map(div => div.cardData);

    // 2. 校验牌数
    if (playerOrganizedHand.top.length !== 3 ||
        playerOrganizedHand.middle.length !== 5 ||
        playerOrganizedHand.bottom.length !== 5) {
        displayMessage("牌数不正确！头道3张，中道5张，尾道5张。", true);
        return;
    }

    // 3. 计算牌型并显示
    const topEval = evaluateHand(playerOrganizedHand.top);
    const middleEval = evaluateHand(playerOrganizedHand.middle);
    const bottomEval = evaluateHand(playerOrganizedHand.bottom);

    document.getElementById('top-eval-text').textContent = ` (${topEval.message || '未知'})`;
    document.getElementById('middle-eval-text').textContent = ` (${middleEval.message || '未知'})`;
    document.getElementById('bottom-eval-text').textContent = ` (${bottomEval.message || '未知'})`;


    // 4. 检查倒水
    if (checkDaoshui(topEval, middleEval, bottomEval)) {
        displayMessage("倒水了！请重新理牌或确认。", true);
        // 倒水通常直接判输，但这里可以先提示
    } else {
        displayMessage("理牌完成，可以比牌了！");
    }

    compareButton.style.display = 'inline-block'; // 显示比牌按钮
    confirmOrganizationButton.style.display = 'none'; // 隐藏确认按钮
});

compareButton.addEventListener('click', () => {
    // 这里假设是与AI或另一个玩家比牌
    // 简单起见，我们只显示玩家自己的牌型信息和是否倒水
    // 真实的比较逻辑需要对手的牌

    // 重新评估以防万一
    const topEval = evaluateHand(playerOrganizedHand.top);
    const middleEval = evaluateHand(playerOrganizedHand.middle);
    const bottomEval = evaluateHand(playerOrganizedHand.bottom);

    if (checkDaoshui(topEval, middleEval, bottomEval)) {
        displayMessage("倒水！本局判输。", true);
        // 处理输的逻辑...
    } else {
        displayMessage("比牌完成！（此处应有计分和对手比较逻辑）");
        // 处理计分和胜负判断逻辑...
        // 例如:
        // let playerScore = 0;
        // // 假设有个对手牌 player2OrganizedHand
        // // const comparisonResult = compareAllRows(playerOrganizedHand, player2OrganizedHand);
        // // playerScore = calculateFinalScore(comparisonResult);
        // document.getElementById('score-area').textContent = `得分: ${playerScore}`;
    }
    compareButton.style.display = 'none';
    dealButton.disabled = false; // 允许开始下一局
});


// ... (callBackendButton 逻辑不变) ...

// 初始化游戏
initializeGame();
