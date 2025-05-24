// frontend/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const dealButton = document.getElementById('deal-button');
    const sortHandButton = document.getElementById('sort-hand-button');
    const aiReferenceButton = document.getElementById('ai-reference-button');
    const aiAutoplayButton = document.getElementById('ai-autoplay-button');
    const confirmOrganizationButton = document.getElementById('confirm-organization-button');
    const compareButton = document.getElementById('compare-button');
    const callBackendButton = document.getElementById('call-backend-button');
    const initialAndMiddleHandElement = document.getElementById('player-hand');
    const topRowElement = document.getElementById('player-top-row');
    const bottomRowElement = document.getElementById('player-bottom-row');
    const middleHandHeader = document.getElementById('middle-hand-header');
    const topEvalTextElement = document.getElementById('top-eval-text');
    // middleEvalTextElement will be the span inside middleHandHeader, get it dynamically
    const bottomEvalTextElement = document.getElementById('bottom-eval-text');
    const aiReferenceDisplayElement = document.getElementById('ai-reference-display');
    const aiTopRefElement = document.getElementById('ai-top-ref');
    const aiMiddleRefElement = document.getElementById('ai-middle-ref');
    const aiBottomRefElement = document.getElementById('ai-bottom-ref');

    const API_BASE_URL = 'https://wenge.cloudns.ch/backend/';
    let playerFullHandSource = [];
    let playerOrganizedHand = { top: [], middle: [], bottom: [] };
    let sortableInstances = {};
    const MAX_SORTABLE_INIT_ATTEMPTS = 10, SORTABLE_INIT_DELAY = 200;
    let sortableInitializationAttempts = 0;

    const safeDisplayMessage = (msg, isErr = false) => { if (typeof displayMessage === "function") displayMessage(msg, isErr); else isErr ? console.error(msg) : console.log(msg); };

    function initializeSortable() {
        if (typeof Sortable === 'undefined') {
            sortableInitializationAttempts++;
            if (sortableInitializationAttempts < MAX_SORTABLE_INIT_ATTEMPTS) setTimeout(initializeSortable, SORTABLE_INIT_DELAY);
            else { console.error("SortableJS failed!"); safeDisplayMessage("错误：拖拽功能加载失败。", true); } return;
        }
        const opts = { group: 'thirteen-water-cards-group', animation: 150, ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', dragClass: 'sortable-drag',
            onEnd: (evt) => { updateHandModelFromDOM(evt.from, evt.from.dataset.rowName); if (evt.to !== evt.from) updateHandModelFromDOM(evt.to, evt.to.dataset.rowName); displayCurrentArrangementState(); checkAllCardsOrganized(); },
            onMove: (evt) => { const to = evt.to, lim = parseInt(to.dataset.rowLimit); return !(lim && to !== evt.from && to.children.length >= lim); },
            onAdd: (evt) => { const to = evt.to, from = evt.from, lim = parseInt(to.dataset.rowLimit); if (lim && to.children.length > lim) { Sortable.utils.select(evt.item).remove(); from.appendChild(evt.item); safeDisplayMessage(`${to.dataset.rowName === 'top' ? '头' : '尾'}道已满!`, true); updateHandModelFromDOM(from, from.dataset.rowName); if (to !== from) updateHandModelFromDOM(to, to.dataset.rowName); displayCurrentArrangementState(); }}
        };
        if(initialAndMiddleHandElement) sortableInstances.initial_middle = new Sortable(initialAndMiddleHandElement, {...opts, sort: true});
        if(topRowElement) sortableInstances.top = new Sortable(topRowElement, {...opts, sort: true});
        if(bottomRowElement) sortableInstances.bottom = new Sortable(bottomRowElement, {...opts, sort: true});
    }

    function updateHandModelFromDOM(rowEl, name) { if (!rowEl || !name) return; const cards = Array.from(rowEl.children).map(d => d.cardData).filter(Boolean); if (name === 'top') playerOrganizedHand.top = cards; else if (name === 'bottom') playerOrganizedHand.bottom = cards; }

    function displayCurrentArrangementState() {
        const topC = playerOrganizedHand.top, botC = playerOrganizedHand.bottom;
        const midCSource = Array.from(initialAndMiddleHandElement.children).map(d => d.cardData).filter(Boolean);
        const midReady = topC.length === 3 && botC.length === 5 && midCSource.length === 5;
        const evalF = typeof evaluateHand === "function" ? evaluateHand : () => ({message: "N/A"});
        if(topEvalTextElement) topEvalTextElement.textContent = topC.length > 0 ? ` (${(topC.length===3 ? evalF(topC).message : '...') || '...'})` : '';
        if(bottomEvalTextElement) bottomEvalTextElement.textContent = botC.length > 0 ? ` (${(botC.length===5 ? evalF(botC).message : '...') || '...'})` : '';
        if (middleHandHeader) {
            const h3 = document.getElementById('middle-hand-header'); const span = document.getElementById('middle-eval-text');
            if(h3 && span) {
                if (midReady) { h3.childNodes[0].nodeValue = `中道 (5张): `; span.textContent = ` (${evalF(midCSource).message || '...'})`; initialAndMiddleHandElement.classList.add('is-middle-row-style'); }
                else { h3.childNodes[0].nodeValue = `我的手牌 / 中道 (剩余牌): `; span.textContent = midCSource.length > 0 ? ` (共${midCSource.length}张)` : ''; initialAndMiddleHandElement.classList.remove('is-middle-row-style'); }
            }
        }
        if(typeof checkDaoshuiForUI === "function") checkDaoshuiForUI(midCSource);
    }

    function checkDaoshuiForUI(midC) {
        const topC = playerOrganizedHand.top, botC = playerOrganizedHand.bottom;
        if(typeof evaluateHand !== "function" || typeof checkDaoshui !== "function") { safeDisplayMessage("牌型逻辑缺失。", true); return; }
        if (topC.length===3 && botC.length===5 && midC.length===5) {
            const tE=evaluateHand(topC), mE=evaluateHand(midC), bE=evaluateHand(botC);
            const isDS = checkDaoshui(tE,mE,bE);
            [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el => el && (isDS ? el.classList.add('daoshui-warning') : el.classList.remove('daoshui-warning')));
            if(isDS) safeDisplayMessage("警告: 检测到倒水！", true);
            else if (confirmOrganizationButton && confirmOrganizationButton.disabled && !checkAllCardsOrganized(true)) safeDisplayMessage("请继续理牌...", false);
        } else [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el => el && el.classList.remove('daoshui-warning'));
    }

    function checkAllCardsOrganized(silent = false) {
        const midCount = initialAndMiddleHandElement.children.length;
        const topOK = playerOrganizedHand.top.length === 3, botOK = playerOrganizedHand.bottom.length === 5, midOK = midCount === 5;
        const allSet = topOK && botOK && midOK;
        if(confirmOrganizationButton) confirmOrganizationButton.disabled = !allSet;
        if(allSet && !silent) safeDisplayMessage("牌型已分配，请确认。", false);
        return allSet;
    }

    function initializeGame() {
        playerFullHandSource = []; playerOrganizedHand = {top:[],middle:[],bottom:[]};
        [topRowElement,bottomRowElement].forEach(el => el && (el.innerHTML = ''));
        if(initialAndMiddleHandElement) initialAndMiddleHandElement.innerHTML='<p>点击 "发牌" 开始</p>';
        [topEvalTextElement,bottomEvalTextElement].forEach(el => el && (el.textContent=''));
        const h3MidHeader = document.getElementById('middle-hand-header'); const spanMidEval = document.getElementById('middle-eval-text');
        if(h3MidHeader && spanMidEval) { h3MidHeader.childNodes[0].nodeValue = `我的手牌 / 中道 (剩余牌): `; spanMidEval.textContent = ''; }
        [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el => el && el.classList.remove('daoshui-warning','is-middle-row-style'));
        safeDisplayMessage("点击“发牌”开始。", false);
        if(typeof displayScore === "function") displayScore("");
        if(dealButton) dealButton.disabled=false;
        [sortHandButton, aiReferenceButton, aiAutoplayButton, confirmOrganizationButton, compareButton].forEach(btn => btn && (btn.style.display='none'));
        if(confirmOrganizationButton) confirmOrganizationButton.disabled=true;
        if(aiReferenceDisplayElement) aiReferenceDisplayElement.style.display = 'none';
        console.log("Game Initialized.");
    }

    dealButton.addEventListener('click', async () => {
        console.log("--- Deal Button Clicked ---");
        initializeGame(); safeDisplayMessage("发牌中...", false); if(dealButton) dealButton.disabled=true;
        try {
            const res = await fetch(`${API_BASE_URL}deal_cards.php`);
            if(!res.ok) throw new Error(`发牌失败: ${res.status} ${await res.text()}`);
            const data = await res.json();
            if(!data || !Array.isArray(data.cards) || data.cards.length!==13) throw new Error("牌数据错误。");

            playerFullHandSource = data.cards.map(c => {
                const sI = (typeof SUITS_DATA !== "undefined" && SUITS_DATA[c.suitKey]) || { displayChar: '?', cssClass: 'unknown', fileNamePart: 'unknown' };
                return { rank: c.rank, suitKey: c.suitKey, displaySuitChar: sI.displayChar, suitCssClass: sI.cssClass, id: (c.rank || 'X') + (c.suitKey || 'Y') + Math.random().toString(36).substring(2, 7)};
            }).filter(c => c.rank && c.suitKey);

            let specialHand = null;
            if (typeof evaluateThirteenCardSpecial === 'function') specialHand = evaluateThirteenCardSpecial(playerFullHandSource);

            if (specialHand) {
                safeDisplayMessage(`特殊牌型：${specialHand.message}！`, false);
                initialAndMiddleHandElement.innerHTML='';
                if(typeof sortHandCardsForDisplay === "function") sortHandCardsForDisplay(playerFullHandSource).forEach(card => initialAndMiddleHandElement.appendChild(renderCard(card, true)));
                else playerFullHandSource.forEach(card => initialAndMiddleHandElement.appendChild(renderCard(card, true))); // Fallback if sort not ready
                [sortHandButton, aiReferenceButton, aiAutoplayButton, confirmOrganizationButton, compareButton].forEach(btn => btn && (btn.style.display='none'));
                if(dealButton) dealButton.disabled = false;
            } else {
                initialAndMiddleHandElement.innerHTML='';
                playerFullHandSource.forEach(c => c && typeof renderCard === "function" && initialAndMiddleHandElement.appendChild(renderCard(c,true)));
                displayCurrentArrangementState(); safeDisplayMessage("请理牌。", false);
                [sortHandButton, aiReferenceButton, aiAutoplayButton, confirmOrganizationButton].forEach(btn => btn && (btn.style.display='inline-block'));
            }
        } catch(err) {
            console.error("发牌错误:", err); safeDisplayMessage(`错误: ${err.message}`,true);
            if(dealButton) dealButton.disabled=false;
        }
    });

    if (sortHandButton) sortHandButton.addEventListener('click', () => {
        console.log("--- Sort Hand Button Clicked ---");
        if (!initialAndMiddleHandElement || typeof sortHandCardsForDisplay !== 'function' || typeof renderCard !== 'function') { safeDisplayMessage("整理功能出错。", true); return; }
        let cardsToSort = Array.from(initialAndMiddleHandElement.children).map(div => div.cardData).filter(Boolean);
        const sortedCards = sortHandCardsForDisplay(cardsToSort);
        initialAndMiddleHandElement.innerHTML = '';
        sortedCards.forEach(card => initialAndMiddleHandElement.appendChild(renderCard(card, true)));
        safeDisplayMessage("手牌已整理。", false); displayCurrentArrangementState();
    });

    if (aiReferenceButton) aiReferenceButton.addEventListener('click', () => {
        safeDisplayMessage("AI参考功能建设中...", true);
        if(aiReferenceDisplayElement) aiReferenceDisplayElement.style.display = 'block';
        if(aiTopRefElement) aiTopRefElement.textContent = "AI思考中..."; if(aiMiddleRefElement) aiMiddleRefElement.textContent = "AI思考中..."; if(aiBottomRefElement) aiBottomRefElement.textContent = "AI思考中...";
        setTimeout(() => { if(aiTopRefElement) aiTopRefElement.textContent = "♠A ♠K ♠Q"; if(aiMiddleRefElement) aiMiddleRefElement.textContent = "♥J ♥10 ♥9 ♥8 ♥7"; if(aiBottomRefElement) aiBottomRefElement.textContent = "♦6 ♦6 ♣6 ♣5 ♣5"; }, 1000);
    });
    if (aiAutoplayButton) aiAutoplayButton.addEventListener('click', () => { safeDisplayMessage("AI托管功能建设中...", true); });

    confirmOrganizationButton.addEventListener('click', () => {
        console.log("--- Confirm Organization Button Clicked ---");
        playerOrganizedHand.middle = Array.from(initialAndMiddleHandElement.children).map(d=>d.cardData).filter(Boolean);
        if(playerOrganizedHand.top.length!==3 || playerOrganizedHand.middle.length!==5 || playerOrganizedHand.bottom.length!==5) { safeDisplayMessage(`牌数错误！头${playerOrganizedHand.top.length}/3, 中${playerOrganizedHand.middle.length}/5, 尾${playerOrganizedHand.bottom.length}/5.`,true); return; }
        const evalF = typeof evaluateHand === "function" ? evaluateHand : () => ({message:"N/A"});
        const tE=evalF(playerOrganizedHand.top), mE=evalF(playerOrganizedHand.middle), bE=evalF(playerOrganizedHand.bottom);
        const h3MidH = document.getElementById('middle-hand-header'), spanMidE = document.getElementById('middle-eval-text');
        if(h3MidH && spanMidE) { h3MidH.childNodes[0].nodeValue =`中道 (5张): `; spanMidE.textContent=` (${mE.message||'未知'})`; initialAndMiddleHandElement.classList.add('is-middle-row-style'); }
        if(typeof checkDaoshui==="function" && checkDaoshui(tE,mE,bE)){
            safeDisplayMessage("警告: 倒水！",true); [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el=>el&&el.classList.add('daoshui-warning'));
        } else {
            safeDisplayMessage("理牌完成，可比牌。",false); [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el=>el&&el.classList.remove('daoshui-warning'));
        }
        [confirmOrganizationButton, sortHandButton, aiReferenceButton, aiAutoplayButton].forEach(btn => btn && (btn.style.display='none'));
        if(compareButton) { compareButton.style.display='inline-block'; compareButton.disabled=false; }
    });

    compareButton.addEventListener('click', async () => {
        console.log("--- Compare Button Clicked ---");
        safeDisplayMessage("提交比牌中...",false); if(compareButton) compareButton.disabled=true;
        if(playerOrganizedHand.middle.length!==5) playerOrganizedHand.middle=Array.from(initialAndMiddleHandElement.children).map(d=>d.cardData).filter(Boolean);
        const pL={top:playerOrganizedHand.top.map(c=>({rank:c.rank,suitKey:c.suitKey})), middle:playerOrganizedHand.middle.map(c=>({rank:c.rank,suitKey:c.suitKey})), bottom:playerOrganizedHand.bottom.map(c=>({rank:c.rank,suitKey:c.suitKey}))};
        if(pL.top.length!==3||pL.middle.length!==5||pL.bottom.length!==5){ safeDisplayMessage("错误:提交牌数不对。",true); if(compareButton)compareButton.style.display='none'; if(dealButton)dealButton.disabled=false; return; }
        try {
            const res = await fetch(`${API_BASE_URL}submit_hand.php`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pL)});
            if(!res.ok) throw new Error(`比牌请求失败: ${res.status} ${await res.text()}`);
            const rst = await res.json(); console.log("比牌结果:",rst);
            if(rst.success){ let msg=`服务器: ${rst.message||'完成.'}`; if(rst.daoshui)msg+=" (倒水)"; safeDisplayMessage(msg,rst.daoshui); }
            else safeDisplayMessage(`服务器错误: ${rst.message||'失败.'}`,true);
            if(typeof displayScore==="function"&&typeof rst.score!=="undefined")displayScore(`得分: ${rst.score}`);
        } catch(err){ console.error("比牌错误:",err); safeDisplayMessage(`错误: ${err.message}`,true);
        } finally { if(dealButton) dealButton.disabled=false; if(compareButton) compareButton.style.display='none'; }
    });

    if (callBackendButton) {
        callBackendButton.addEventListener('click', async () => {
            console.log("--- Test Backend Button Clicked! ---"); safeDisplayMessage("正在测试后端通讯...", false);
            try {
                const testEndpoint = `${API_BASE_URL}deal_cards.php`; console.log("Test endpoint URL:", testEndpoint);
                const response = await fetch(testEndpoint); console.log("Test Backend - Fetch response:", response);
                if (!response.ok) { const errTxt = await response.text(); throw new Error(`HTTP error! ${response.status} - ${errTxt}`); }
                const data = await response.json(); console.log("Test Backend - Backend response data:", data);
                let msg = "后端通讯成功！"; if(data?.cards?.length > 0) msg += ` (后端返回 ${data.cards.length} 张牌)`; else if(data?.message) msg += ` 后端消息: ${data.message}`;
                safeDisplayMessage(msg, false);
            } catch (error) { console.error("Test Backend - 通讯捕获到错误:", error); safeDisplayMessage(`后端通讯测试失败: ${error.message}`, true); }
        });
    } else console.error("callBackendButton element NOT found!");

    initializeGame();
    initializeSortable();
});
