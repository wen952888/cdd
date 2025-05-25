// frontend/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Ensure UI elements from ui.js are initialized first.
    if (typeof initializeUiElements === "function") {
        initializeUiElements();
    } else {
        // This is a critical failure if ui.js didn't load or define the function.
        console.error("CRITICAL: initializeUiElements function from ui.js is not defined! UI will not work correctly.");
        alert("A critical error occurred initializing the UI. Please refresh the page. (Error: UI_INIT_MISSING)");
        return; // Stop further execution if UI can't be initialized
    }

    // DOM Elements
    const dealButton = document.getElementById('deal-button');
    const confirmOrganizationButton = document.getElementById('confirm-organization-button');
    const compareButton = document.getElementById('compare-button');
    const callBackendButton = document.getElementById('call-backend-button');
    const lobbyButton = document.getElementById('lobby-button');
    const pointsButton = document.getElementById('points-button');
    const initialAndMiddleHandElement = document.getElementById('player-hand');
    const topRowElement = document.getElementById('player-top-row');
    const bottomRowElement = document.getElementById('player-bottom-row');
    const middleHandHeader = document.getElementById('middle-hand-header');
    const topEvalTextElement = document.getElementById('top-eval-text');
    const middleEvalTextElement = document.getElementById('middle-eval-text');
    const bottomEvalTextElement = document.getElementById('bottom-eval-text');

    const API_BASE_URL = 'https://wenge.cloudns.ch/backend/';
    let playerFullHandSource = [];
    let playerOrganizedHand = { top: [], middle: [], bottom: [] };
    let sortableInstances = {};
    const MAX_SORTABLE_INIT_ATTEMPTS = 10, SORTABLE_INIT_DELAY = 200;
    let sortableInitializationAttempts = 0;

    // Helper to safely call displayMessage
    const safeDisplayMessage = (msg, isErr = false) => {
        if (typeof displayMessage === "function") displayMessage(msg, isErr);
        else isErr ? console.error(msg) : console.log(msg); // Fallback if displayMessage itself is an issue
    };

    function initializeSortable() {
        if (typeof Sortable === 'undefined') {
            sortableInitializationAttempts++;
            if (sortableInitializationAttempts < MAX_SORTABLE_INIT_ATTEMPTS) setTimeout(initializeSortable, SORTABLE_INIT_DELAY);
            else {
                console.error("SortableJS failed to load!");
                safeDisplayMessage("错误：拖拽功能加载失败。", true);
            }
            return;
        }
        const sharedGroupName = 'thirteen-water-cards-group';
        const commonSortableOptions = {
            group: sharedGroupName, animation: 150, ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen', dragClass: 'sortable-drag',
            onEnd: function (evt) {
                updateHandModelFromDOM(evt.from, evt.from.dataset.rowName);
                if (evt.to !== evt.from) updateHandModelFromDOM(evt.to, evt.to.dataset.rowName);
                displayCurrentArrangementState(); checkAllCardsOrganized();
            },
            onMove: function (evt) {
                const toEl = evt.to, limit = parseInt(toEl.dataset.rowLimit);
                if (limit && toEl !== evt.from && toEl.children.length >= limit) return false;
                return true;
            },
            onAdd: function(evt) {
                const toEl = evt.to, fromEl = evt.from, limit = parseInt(toEl.dataset.rowLimit);
                if (limit && toEl.children.length > limit) {
                    Sortable.utils.select(evt.item).parentNode.removeChild(evt.item); fromEl.appendChild(evt.item);
                    safeDisplayMessage(`${toEl.dataset.rowName === 'top' ? '头' : '尾'}道已满! 卡片已退回。`, true);
                    updateHandModelFromDOM(fromEl, fromEl.dataset.rowName); if (toEl !== fromEl) updateHandModelFromDOM(toEl, toEl.dataset.rowName);
                    displayCurrentArrangementState();
                }
            }
        };
        if(initialAndMiddleHandElement) sortableInstances.initial_middle = new Sortable(initialAndMiddleHandElement, {...commonSortableOptions, sort: true, group: {name: sharedGroupName, pull: true, put: true}});
        if(topRowElement) sortableInstances.top = new Sortable(topRowElement, {...commonSortableOptions, sort: true, group: {name: sharedGroupName, pull: true, put: true}});
        if(bottomRowElement) sortableInstances.bottom = new Sortable(bottomRowElement, {...commonSortableOptions, sort: true, group: {name: sharedGroupName, pull: true, put: true}});
    }

    function updateHandModelFromDOM(rowEl, rowName) {
        if (!rowEl || !rowName) return;
        const cards = Array.from(rowEl.children).map(div => div.cardData).filter(Boolean);
        if (rowName === 'top') playerOrganizedHand.top = cards;
        else if (rowName === 'bottom') playerOrganizedHand.bottom = cards;
    }

    function displayCurrentArrangementState() {
        const topC = playerOrganizedHand.top, botC = playerOrganizedHand.bottom;
        const midCSource = Array.from(initialAndMiddleHandElement.children).map(div => div.cardData).filter(Boolean);
        const midReady = topC.length === 3 && botC.length === 5 && midCSource.length === 5;

        const evalFunc = typeof evaluateHand === "function" ? evaluateHand : () => ({message: "评价逻辑缺失"});

        if(topEvalTextElement) topEvalTextElement.textContent = topC.length > 0 ? ` (${(topC.length===3 ? evalFunc(topC).message : '未完成') || '未完成'})` : '';
        if(bottomEvalTextElement) bottomEvalTextElement.textContent = botC.length > 0 ? ` (${(botC.length===5 ? evalFunc(botC).message : '未完成') || '未完成'})` : '';

        if (middleHandHeader) { 
            const h3TitleElement = document.getElementById('middle-hand-header'); 
            const spanEvalElement = document.getElementById('middle-eval-text'); 
            if (h3TitleElement && spanEvalElement) {
                if (midReady) {
                    h3TitleElement.childNodes[0].nodeValue = `中道 (5张): `; 
                    spanEvalElement.textContent = ` (${evalFunc(midCSource).message || '计算中...'})`;
                    initialAndMiddleHandElement.classList.add('is-middle-row-style');
                } else {
                    h3TitleElement.childNodes[0].nodeValue = `我的手牌 / 中道 (剩余牌): `;
                    spanEvalElement.textContent = midCSource.length > 0 ? ` (共${midCSource.length}张)` : '';
                    initialAndMiddleHandElement.classList.remove('is-middle-row-style');
                }
            }
        }
        if(typeof checkDaoshuiForUI === "function") checkDaoshuiForUI(midCSource);
    }

    function checkDaoshuiForUI(midC) {
        const topC = playerOrganizedHand.top, botC = playerOrganizedHand.bottom;
        if(typeof evaluateHand !== "function" || typeof checkDaoshui !== "function") return;
        if (topC.length===3 && botC.length===5 && midC.length===5) {
            const tE=evaluateHand(topC), mE=evaluateHand(midC), bE=evaluateHand(botC);
            const isDS = checkDaoshui(tE,mE,bE);
            [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el => el && (isDS ? el.classList.add('daoshui-warning') : el.classList.remove('daoshui-warning')));
            if(isDS) safeDisplayMessage("警告: 检测到倒水！", true);
            else if (confirmOrganizationButton.disabled && !checkAllCardsOrganized(true)) safeDisplayMessage("请继续理牌...", false);
        } else [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el => el && el.classList.remove('daoshui-warning'));
    }

    function checkAllCardsOrganized(silent = false) {
        const midCount = initialAndMiddleHandElement.children.length;
        const topOK = playerOrganizedHand.top.length === 3, botOK = playerOrganizedHand.bottom.length === 5, midOK = midCount === 5;
        const allSet = topOK && botOK && midOK;
        confirmOrganizationButton.disabled = !allSet;
        if(allSet && !silent) safeDisplayMessage("牌型已分配，请确认。", false);
        return allSet;
    }

    function initializeGame() {
        playerFullHandSource = []; playerOrganizedHand = {top:[],middle:[],bottom:[]};
        [topRowElement,bottomRowElement].forEach(el => el && (el.innerHTML = ''));
        if(initialAndMiddleHandElement) initialAndMiddleHandElement.innerHTML='<p>点击 "发牌" 开始</p>';
        [topEvalTextElement,middleEvalTextElement,bottomEvalTextElement].forEach(el => el && (el.textContent=''));

        const h3MidHeader = document.getElementById('middle-hand-header');
        const spanMidEval = document.getElementById('middle-eval-text');
        if(h3MidHeader && spanMidEval) {
            h3MidHeader.childNodes[0].nodeValue = `我的手牌 / 中道 (剩余牌): `;
            spanMidEval.textContent = '';
        }

        [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el => el && el.classList.remove('daoshui-warning','is-middle-row-style'));
        safeDisplayMessage("点击“发牌”开始。", false);
        if(typeof displayScore === "function") displayScore("得分: --");
        dealButton.disabled=false; confirmOrganizationButton.style.display='none'; confirmOrganizationButton.disabled=true; compareButton.style.display='none';
        console.log("Game Initialized.");
    }

    dealButton.addEventListener('click', async () => {
        console.log("--- Deal Button Clicked ---");
        initializeGame(); safeDisplayMessage("发牌中...", false); dealButton.disabled=true;
        try {
            const res = await fetch(`${API_BASE_URL}deal_cards.php`);
            if(!res.ok) throw new Error(`发牌失败: ${res.status} ${await res.text()}`);
            const data = await res.json();
            if(!data || !Array.isArray(data.cards) || data.cards.length!==13) throw new Error("牌数据错误。");

            playerFullHandSource = data.cards.map(cardFromServer => {
                const suitInfo = (typeof SUITS_DATA !== "undefined" && SUITS_DATA[cardFromServer.suitKey]) || { displayChar: '?', cssClass: 'unknown', fileNamePart: 'unknown' };
                return {
                    rank: cardFromServer.rank, suitKey: cardFromServer.suitKey,
                    displaySuitChar: suitInfo.displayChar, suitCssClass: suitInfo.cssClass,
                    id: (cardFromServer.rank || 'X') + (cardFromServer.suitKey || 'Y') + Math.random().toString(36).substring(2, 7)
                };
            }).filter(card => card.rank && card.suitKey);

            if (typeof sortCards === "function") {
                playerFullHandSource = sortCards(playerFullHandSource); 
            } else {
                console.warn("sortCards function not available. Cards will not be auto-sorted.");
            }

            initialAndMiddleHandElement.innerHTML='';
            playerFullHandSource.forEach(card => {
                if (card && typeof renderCard === "function") initialAndMiddleHandElement.appendChild(renderCard(card, true));
                else console.error("Cannot render card:", card, "renderCard available:", typeof renderCard === "function");
            });
            displayCurrentArrangementState(); safeDisplayMessage("请理牌。", false);
            confirmOrganizationButton.style.display='inline-block';
        } catch(err) {
            console.error("发牌错误:", err); safeDisplayMessage(`错误: ${err.message}`,true);
            dealButton.disabled=false; confirmOrganizationButton.style.display='none';
        }
    });

    confirmOrganizationButton.addEventListener('click', () => {
        console.log("--- Confirm Organization Button Clicked ---");
        playerOrganizedHand.middle = Array.from(initialAndMiddleHandElement.children).map(d=>d.cardData).filter(Boolean);
        if(playerOrganizedHand.top.length!==3 || playerOrganizedHand.middle.length!==5 || playerOrganizedHand.bottom.length!==5) {
            safeDisplayMessage(`牌数错误！头${playerOrganizedHand.top.length}/3, 中${playerOrganizedHand.middle.length}/5, 尾${playerOrganizedHand.bottom.length}/5.`,true); return;
        }
        const evalFunc = typeof evaluateHand === "function" ? evaluateHand : () => ({message:"N/A"});
        const tE=evalFunc(playerOrganizedHand.top), mE=evalFunc(playerOrganizedHand.middle), bE=evalFunc(playerOrganizedHand.bottom);

        const h3MidHeader = document.getElementById('middle-hand-header');
        const spanMidEval = document.getElementById('middle-eval-text');
        if(h3MidHeader && spanMidEval) {
            h3MidHeader.childNodes[0].nodeValue =`中道 (5张): `;
            spanMidEval.textContent=` (${mE.message||'未知'})`;
            initialAndMiddleHandElement.classList.add('is-middle-row-style');
        }

        if(typeof checkDaoshui==="function" && checkDaoshui(tE,mE,bE)){
            safeDisplayMessage("警告: 倒水！",true);
            [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el=>el&&el.classList.add('daoshui-warning'));
        } else {
            safeDisplayMessage("理牌完成，可比牌。",false);
            [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el=>el&&el.classList.remove('daoshui-warning'));
        }
        confirmOrganizationButton.style.display='none'; compareButton.style.display='inline-block'; compareButton.disabled=false;
    });

    compareButton.addEventListener('click', async () => {
        console.log("--- Compare Button Clicked ---");
        safeDisplayMessage("提交比牌中...",false); compareButton.disabled=true;
        if(playerOrganizedHand.middle.length!==5) playerOrganizedHand.middle=Array.from(initialAndMiddleHandElement.children).map(d=>d.cardData).filter(Boolean);
        const pL={top:playerOrganizedHand.top.map(c=>({rank:c.rank,suitKey:c.suitKey})), middle:playerOrganizedHand.middle.map(c=>({rank:c.rank,suitKey:c.suitKey})), bottom:playerOrganizedHand.bottom.map(c=>({rank:c.rank,suitKey:c.suitKey}))};
        if(pL.top.length!==3||pL.middle.length!==5||pL.bottom.length!==5){
            safeDisplayMessage("错误:提交牌数不对。",true); compareButton.style.display='none'; dealButton.disabled=false; return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}submit_hand.php`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pL)});
            if(!res.ok) throw new Error(`比牌请求失败: ${res.status} ${await res.text()}`);
            const rst = await res.json(); 
            if(rst.success){ let msg=`服务器: ${rst.message||'完成.'}`; if(rst.daoshui)msg+=" (倒水)"; safeDisplayMessage(msg,rst.daoshui); }
            else safeDisplayMessage(`服务器错误: ${rst.message||'失败.'}`,true);
            if(typeof displayScore==="function"&&typeof rst.score!=="undefined")displayScore(`得分: ${rst.score}`);
        } catch(err){
            console.error("比牌错误:",err); safeDisplayMessage(`错误: ${err.message}`,true);
        } finally { dealButton.disabled=false; compareButton.style.display='none'; }
    });

    if (callBackendButton) {
        callBackendButton.addEventListener('click', async () => {
            safeDisplayMessage("正在测试后端通讯...", false);
            try {
                const testEndpoint = `${API_BASE_URL}deal_cards.php`;
                const response = await fetch(testEndpoint);
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! ${response.status} - ${errorText}`);
                }
                const data = await response.json();
                let msg = "后端通讯成功！";
                if(data && data.cards && data.cards.length > 0) msg += ` (后端返回 ${data.cards.length} 张牌)`
                else if(data && data.message) msg += ` 后端消息: ${data.message}`;
                safeDisplayMessage(msg, false);
            } catch (error) {
                safeDisplayMessage(`后端通讯测试失败: ${error.message}`, true);
            }
        });
    } else console.error("callBackendButton element NOT found!");

    if (lobbyButton) {
        lobbyButton.addEventListener('click', () => {
            safeDisplayMessage("大厅功能暂未实现。", false);
        });
    } else {
        console.error("Lobby button element NOT found!");
    }

    if (pointsButton) {
        pointsButton.addEventListener('click', () => {
            safeDisplayMessage("积分查看功能暂未实现。", false);
        });
    } else {
        console.error("Points button element NOT found!");
    }

    initializeGame(); // This will call displayMessage, which now relies on initializeUiElements having run.
    initializeSortable();
});
