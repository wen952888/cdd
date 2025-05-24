// frontend/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
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
    const middleHandHeader = document.getElementById('middle-hand-header'); // The H3 element
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

    const safeDisplayMessage = (msg, isErr = false) => {
        // Ensure displayMessage is available (from ui.js)
        if (typeof displayMessage === "function") {
            displayMessage(msg, isErr);
        } else {
            // Fallback to console if displayMessage is not available
            isErr ? console.error(msg) : console.log(msg);
        }
    };

    function initializeSortable() {
        if (typeof Sortable === 'undefined') {
            sortableInitializationAttempts++;
            if (sortableInitializationAttempts < MAX_SORTABLE_INIT_ATTEMPTS) {
                setTimeout(initializeSortable, SORTABLE_INIT_DELAY);
            } else {
                console.error("SortableJS library failed to load after multiple attempts!");
                safeDisplayMessage("错误：拖拽功能加载失败，请刷新页面重试。", true);
            }
            return;
        }

        const sharedGroupName = 'thirteen-water-cards-group';
        const commonSortableOptions = {
            group: sharedGroupName,
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            onEnd: function (evt) {
                updateHandModelFromDOM(evt.from, evt.from.dataset.rowName);
                if (evt.to !== evt.from) {
                    updateHandModelFromDOM(evt.to, evt.to.dataset.rowName);
                }
                displayCurrentArrangementState();
                checkAllCardsOrganized();
            },
            onMove: function (evt) {
                const toRowElement = evt.to;
                const fromRowElement = evt.from; // Not used in this simple check, but available
                const rowLimit = parseInt(toRowElement.dataset.rowLimit);
                if (rowLimit && toRowElement !== evt.from) { // Only apply limit if moving to a *different* limited row
                    if (toRowElement.children.length >= rowLimit) {
                        return false; // Prevent adding to a full row
                    }
                }
                return true; // Allow move
            },
            onAdd: function(evt) {
                const toRowElement = evt.to;
                const fromRowElement = evt.from;
                const rowLimit = parseInt(toRowElement.dataset.rowLimit);
                 if (rowLimit && toRowElement.children.length > rowLimit) {
                    // This is a fallback if onMove somehow didn't prevent it
                    Sortable.utils.select(evt.item).parentNode.removeChild(evt.item); // Remove from target
                    fromRowElement.appendChild(evt.item); // Add back to source
                    safeDisplayMessage(`${toRowElement.dataset.rowName === 'top' ? '头' : '尾'}道已满! 卡片已退回。`, true);
                    // Update models after programmatic move
                    updateHandModelFromDOM(fromRowElement, fromRowElement.dataset.rowName);
                    if (toRowElement !== fromRowElement) { // Should always be true here
                         updateHandModelFromDOM(toRowElement, toRowElement.dataset.rowName);
                    }
                    displayCurrentArrangementState(); // Refresh UI
                }
            }
        };

        if(initialAndMiddleHandElement) sortableInstances.initial_middle = new Sortable(initialAndMiddleHandElement, {...commonSortableOptions, sort: true});
        if(topRowElement) sortableInstances.top = new Sortable(topRowElement, {...commonSortableOptions, sort: true});
        if(bottomRowElement) sortableInstances.bottom = new Sortable(bottomRowElement, {...commonSortableOptions, sort: true});
    }

    function updateHandModelFromDOM(rowEl, rowName) {
        if (!rowEl || !rowName) return;
        const cards = Array.from(rowEl.children).map(div => div.cardData).filter(Boolean);
        if (rowName === 'top') playerOrganizedHand.top = cards;
        else if (rowName === 'bottom') playerOrganizedHand.bottom = cards;
        // initial_middle (player-hand) is not directly updating playerOrganizedHand.middle here.
        // It's used as the source when confirmOrganizationButton is clicked.
    }

    function displayCurrentArrangementState() {
        const topC = playerOrganizedHand.top;
        const botC = playerOrganizedHand.bottom;
        const midCSource = Array.from(initialAndMiddleHandElement.children).map(d => d.cardData).filter(Boolean);
        const midReady = topC.length === 3 && botC.length === 5 && midCSource.length === 5;

        const evalF = typeof evaluateHand === "function" ? evaluateHand : () => ({message: "评价逻辑缺失"}); // Fallback

        if(topEvalTextElement) topEvalTextElement.textContent = topC.length > 0 ? ` (${(topC.length===3 ? evalF(topC).message : '...') || '...'})` : '';
        if(bottomEvalTextElement) bottomEvalTextElement.textContent = botC.length > 0 ? ` (${(botC.length===5 ? evalF(botC).message : '...') || '...'})` : '';

        if (middleHandHeader) { // The H3 element
            const spanEvalElement = document.getElementById('middle-eval-text'); // The span inside H3
            if (spanEvalElement) { // Check if span exists
                if (midReady) {
                    middleHandHeader.childNodes[0].nodeValue = `中道 (5张): `; // Update text part of H3
                    spanEvalElement.textContent = ` (${evalF(midCSource).message || '...'})`;
                    initialAndMiddleHandElement.classList.add('is-middle-row-style');
                } else {
                    middleHandHeader.childNodes[0].nodeValue = `我的手牌 / 中道 (剩余牌): `;
                    spanEvalElement.textContent = midCSource.length > 0 ? ` (共${midCSource.length}张)` : '';
                    initialAndMiddleHandElement.classList.remove('is-middle-row-style');
                }
            } else {
                // console.warn("displayCurrentArrangementState: middle-eval-text span not found inside middleHandHeader.");
            }
        }
        if(typeof checkDaoshuiForUI === "function") checkDaoshuiForUI(midCSource);
        else console.warn("checkDaoshuiForUI function is not available from game.js");
    }

    function checkDaoshuiForUI(midC) {
        const topC = playerOrganizedHand.top;
        const botC = playerOrganizedHand.bottom;
        if(typeof evaluateHand !== "function" || typeof checkDaoshui !== "function") {
            safeDisplayMessage("牌型逻辑缺失，无法检查倒水。", true);
            return;
        }
        if (topC.length===3 && botC.length===5 && midC.length===5) {
            const tE=evaluateHand(topC), mE=evaluateHand(midC), bE=evaluateHand(botC);
            const isDS = checkDaoshui(tE,mE,bE);
            [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el => el && (isDS ? el.classList.add('daoshui-warning') : el.classList.remove('daoshui-warning')));
            if(isDS) safeDisplayMessage("警告: 检测到倒水！", true);
            else if (confirmOrganizationButton && confirmOrganizationButton.disabled && !checkAllCardsOrganized(true) ) {
                // Only show "请继续理牌" if not daoshui and confirm button isn't enabled yet by meeting card counts
                 safeDisplayMessage("请继续理牌...", false);
            }
        } else {
            // Clear warnings if not all rows have correct card counts for a daoshui check
            [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el => el && el.classList.remove('daoshui-warning'));
        }
    }

    function checkAllCardsOrganized(silent = false) {
        const midCount = initialAndMiddleHandElement.children.length;
        const topOK = playerOrganizedHand.top.length === 3;
        const botOK = playerOrganizedHand.bottom.length === 5;
        const midOK = midCount === 5;
        const allSet = topOK && botOK && midOK;

        if(confirmOrganizationButton) confirmOrganizationButton.disabled = !allSet;

        if(allSet && !silent) {
            safeDisplayMessage("牌型已分配完毕，请点击“确认理牌”。", false);
        }
        return allSet;
    }

    function initializeGame() {
        playerFullHandSource = [];
        playerOrganizedHand = {top:[],middle:[],bottom:[]};

        [topRowElement,bottomRowElement].forEach(el => { if (el) el.innerHTML = ''; });
        if(initialAndMiddleHandElement) initialAndMiddleHandElement.innerHTML='<p>点击 "发牌" 开始</p>';

        [topEvalTextElement,bottomEvalTextElement].forEach(el => { if (el) el.textContent=''; });
        const h3MidHeader = document.getElementById('middle-hand-header');
        const spanMidEval = document.getElementById('middle-eval-text');
        if(h3MidHeader && spanMidEval) {
            h3MidHeader.childNodes[0].nodeValue = `我的手牌 / 中道 (剩余牌): `;
            spanMidEval.textContent = '';
        }

        [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el => {
            if (el) el.classList.remove('daoshui-warning','is-middle-row-style');
        });

        safeDisplayMessage("点击“发牌”开始新游戏。", false);
        if(typeof displayScore === "function") displayScore("");

        if(dealButton) dealButton.disabled=false;
        [sortHandButton, aiReferenceButton, aiAutoplayButton, confirmOrganizationButton, compareButton].forEach(btn => {
            if (btn) btn.style.display='none';
        });
        if(confirmOrganizationButton) confirmOrganizationButton.disabled=true;
        if(aiReferenceDisplayElement) aiReferenceDisplayElement.style.display = 'none';
        console.log("Game Initialized.");
    }

    dealButton.addEventListener('click', async () => {
        console.log("--- Deal Button Clicked ---");
        initializeGame(); // Reset game state and UI before dealing
        safeDisplayMessage("正在从服务器获取手牌...", false);
        if(dealButton) dealButton.disabled=true;

        try {
            const response = await fetch(`${API_BASE_URL}deal_cards.php`);
            // console.log("Deal cards fetch response:", response);
            if(!response.ok) {
                const errorText = await response.text();
                // console.error("Deal cards error text from server:", errorText);
                throw new Error(`获取手牌失败: ${response.status} ${response.statusText}. Server: ${errorText}`);
            }
            const data = await response.json();
            // console.log("Data from deal_cards.php:", JSON.stringify(data).substring(0, 200) + "...");
            if(!data || !Array.isArray(data.cards) || data.cards.length!==13) {
                throw new Error("从服务器获取的手牌数据格式不正确。");
            }

            playerFullHandSource = data.cards.map(cardFromServer => {
                const suitInfo = (typeof SUITS_DATA !== "undefined" && SUITS_DATA[cardFromServer.suitKey])
                                 ? SUITS_DATA[cardFromServer.suitKey]
                                 : { displayChar: '?', cssClass: 'unknown', fileNamePart: 'unknown' }; // Fallback
                return {
                    rank: cardFromServer.rank,
                    suitKey: cardFromServer.suitKey,
                    displaySuitChar: suitInfo.displayChar,
                    suitCssClass: suitInfo.cssClass,
                    id: (cardFromServer.rank || 'X') + (cardFromServer.suitKey || 'Y') + Math.random().toString(36).substring(2, 7) // Make ID more unique
                };
            }).filter(card => card.rank && card.suitKey); // Ensure only valid cards proceed

            // console.log("playerFullHandSource after mapping:", JSON.stringify(playerFullHandSource).substring(0,200) + "...");

            let specialHand = null;
            if (typeof evaluateThirteenCardSpecial === 'function') {
                specialHand = evaluateThirteenCardSpecial(playerFullHandSource);
            } else {
                console.warn("evaluateThirteenCardSpecial function not found or not ready in game.js");
            }

            if (specialHand) {
                safeDisplayMessage(`特殊牌型：${specialHand.message}！`, false);
                initialAndMiddleHandElement.innerHTML='';
                const cardsToDisplay = (typeof sortHandCardsForDisplay === "function") ? sortHandCardsForDisplay(playerFullHandSource) : playerFullHandSource;
                cardsToDisplay.forEach(card => {
                    if (card && typeof renderCard === "function") initialAndMiddleHandElement.appendChild(renderCard(card, true));
                });
                // Hide/disable arrangement buttons, show score or next game option
                [sortHandButton, aiReferenceButton, aiAutoplayButton, confirmOrganizationButton, compareButton].forEach(btn => btn && (btn.style.display='none'));
                if(dealButton) dealButton.disabled = false; // Allow new game
            } else {
                initialAndMiddleHandElement.innerHTML='';
                playerFullHandSource.forEach(card => {
                    // console.log("Processing card for render:", JSON.stringify(card));
                    if (card && typeof renderCard === "function") {
                        initialAndMiddleHandElement.appendChild(renderCard(card, true));
                    } else {
                        console.error("Cannot render card in dealButton: Card data or renderCard function is invalid.", card, typeof renderCard);
                    }
                });
                displayCurrentArrangementState();
                safeDisplayMessage("请理牌。", false);
                [sortHandButton, aiReferenceButton, aiAutoplayButton, confirmOrganizationButton].forEach(btn => btn && (btn.style.display='inline-block'));
            }

        } catch (error) {
            console.error("发牌过程中捕获到错误:", error);
            safeDisplayMessage(`发牌错误: ${error.message}`, true);
            if(dealButton) dealButton.disabled=false;
            [sortHandButton, aiReferenceButton, aiAutoplayButton, confirmOrganizationButton].forEach(btn => btn && (btn.style.display='none'));
        }
    });

    if (sortHandButton) {
        sortHandButton.addEventListener('click', () => {
            console.log("--- Sort Hand Button Clicked ---");
            if (!initialAndMiddleHandElement || typeof sortHandCardsForDisplay !== 'function' || typeof renderCard !== 'function') {
                safeDisplayMessage("整理手牌功能出错（依赖缺失）。", true);
                return;
            }
            let cardsToSort = Array.from(initialAndMiddleHandElement.children)
                                .map(cardDiv => cardDiv.cardData)
                                .filter(Boolean);
            const sortedCards = sortHandCardsForDisplay(cardsToSort);
            initialAndMiddleHandElement.innerHTML = ''; // Clear current cards
            sortedCards.forEach(card => {
                initialAndMiddleHandElement.appendChild(renderCard(card, true));
            });
            safeDisplayMessage("手牌已整理。", false);
            displayCurrentArrangementState(); // Update evaluations if any
        });
    } else { console.warn("Sort Hand Button not found."); }


    if (aiReferenceButton) {
        aiReferenceButton.addEventListener('click', () => {
            safeDisplayMessage("AI参考功能建设中...", true);
            if(aiReferenceDisplayElement) aiReferenceDisplayElement.style.display = 'block';
            if(aiTopRefElement) aiTopRefElement.textContent = "AI思考中...";
            if(aiMiddleRefElement) aiMiddleRefElement.textContent = "AI思考中...";
            if(aiBottomRefElement) aiBottomRefElement.textContent = "AI思考中...";
            // Placeholder: Simulate AI result
            setTimeout(() => {
                if(aiTopRefElement) aiTopRefElement.textContent = "♠A ♠K ♠Q (AI示例)";
                if(aiMiddleRefElement) aiMiddleRefElement.textContent = "♥J ♥10 ♥9 ♥8 ♥7 (AI示例)";
                if(aiBottomRefElement) aiBottomRefElement.textContent = "♦6 ♦6 ♣6 ♣5 ♣5 (AI示例)";
            }, 1000);
        });
    } else { console.warn("AI Reference Button not found."); }

    if (aiAutoplayButton) {
        aiAutoplayButton.addEventListener('click', () => {
            safeDisplayMessage("AI托管功能建设中...", true);
        });
    } else { console.warn("AI Autoplay Button not found."); }


    confirmOrganizationButton.addEventListener('click', () => {
        console.log("--- Confirm Organization Button Clicked ---");
        playerOrganizedHand.middle = Array.from(initialAndMiddleHandElement.children).map(d=>d.cardData).filter(Boolean);
        if(playerOrganizedHand.top.length!==3 || playerOrganizedHand.middle.length!==5 || playerOrganizedHand.bottom.length!==5) {
            safeDisplayMessage(`牌数错误！头${playerOrganizedHand.top.length}/3, 中${playerOrganizedHand.middle.length}/5, 尾${playerOrganizedHand.bottom.length}/5.`,true); return;
        }
        const evalF = typeof evaluateHand === "function" ? evaluateHand : () => ({message:"N/A"});
        const tE=evalF(playerOrganizedHand.top), mE=evalF(playerOrganizedHand.middle), bE=evalF(playerOrganizedHand.bottom);

        const h3MidH = document.getElementById('middle-hand-header'); const spanMidE = document.getElementById('middle-eval-text');
        if(h3MidH && spanMidE) { h3MidH.childNodes[0].nodeValue =`中道 (5张): `; spanMidE.textContent=` (${mE.message||'未知'})`; initialAndMiddleHandElement.classList.add('is-middle-row-style'); }

        if(typeof checkDaoshui==="function" && checkDaoshui(tE,mE,bE)){
            safeDisplayMessage("警告: 倒水！",true);
            [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el=>el&&el.classList.add('daoshui-warning'));
        } else {
            safeDisplayMessage("理牌完成，可比牌。",false);
            [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el=>el&&el.classList.remove('daoshui-warning'));
        }
        [confirmOrganizationButton, sortHandButton, aiReferenceButton, aiAutoplayButton].forEach(btn => btn && (btn.style.display='none'));
        if(compareButton) { compareButton.style.display='inline-block'; compareButton.disabled=false; }
    });

    compareButton.addEventListener('click', async () => {
        console.log("--- Compare Button Clicked ---");
        safeDisplayMessage("提交比牌中...",false); if(compareButton) compareButton.disabled=true;
        if(playerOrganizedHand.middle.length!==5) playerOrganizedHand.middle=Array.from(initialAndMiddleHandElement.children).map(d=>d.cardData).filter(Boolean);
        const pL={top:playerOrganizedHand.top.map(c=>({rank:c.rank,suitKey:c.suitKey})), middle:playerOrganizedHand.middle.map(c=>({rank:c.rank,suitKey:c.suitKey})), bottom:playerOrganizedHand.bottom.map(c=>({rank:c.rank,suitKey:c.suitKey}))};
        // console.log("Payload to submit_hand.php:", JSON.stringify(pL));
        if(pL.top.length!==3||pL.middle.length!==5||pL.bottom.length!==5){ safeDisplayMessage("错误:提交牌数不对。",true); if(compareButton)compareButton.style.display='none'; if(dealButton)dealButton.disabled=false; return; }
        try {
            const res = await fetch(`${API_BASE_URL}submit_hand.php`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pL)});
            // console.log("Submit hand fetch response:", res);
            if(!res.ok) throw new Error(`比牌请求失败: ${res.status} ${await res.text()}`);
            const rst = await res.json(); console.log("比牌结果:",rst);
            if(rst.success){ let msg=`服务器: ${rst.message||'完成.'}`; if(rst.daoshui)msg+=" (倒水)"; safeDisplayMessage(msg,rst.daoshui); }
            else safeDisplayMessage(`服务器错误: ${rst.message||'失败.'}`,true);
            if(typeof displayScore==="function"&&typeof rst.score!=="undefined")displayScore(`得分: ${rst.score}`);
        } catch(err){ console.error("比牌错误:",err); safeDisplayMessage(`比牌错误: ${err.message}`,true);
        } finally { if(dealButton) dealButton.disabled=false; if(compareButton) compareButton.style.display='none'; }
    });

    if (callBackendButton) {
        // console.log("callBackendButton element found:", callBackendButton); // Moved this log to where listener is attached
        callBackendButton.addEventListener('click', async () => {
            console.log("--- Test Backend Button Clicked! ---");
            safeDisplayMessage("正在测试后端通讯...", false);
            try {
                const testEndpoint = `${API_BASE_URL}deal_cards.php`;
                console.log("Test endpoint URL:", testEndpoint);
                const response = await fetch(testEndpoint);
                console.log("Test Backend - Fetch response received:", response);
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Test Backend - HTTP error! Status: ${response.status} - Response Text: ${errorText}`);
                    throw new Error(`HTTP error! ${response.status} - ${errorText}`);
                }
                const data = await response.json();
                console.log("Test Backend - Backend response data:", data);
                let msg = "后端通讯成功！";
                if(data?.cards?.length > 0) msg += ` (后端返回 ${data.cards.length} 张牌)`;
                else if(data?.message) msg += ` 后端消息: ${data.message}`;
                safeDisplayMessage(msg, false);
            } catch (error) {
                console.error("Test Backend - 通讯测试捕获到错误:", error);
                safeDisplayMessage(`后端通讯测试失败: ${error.message}`, true);
            }
        });
         console.log("callBackendButton listener attached.");
    } else console.error("callBackendButton element NOT found!");


    initializeGame();
    initializeSortable();
});
