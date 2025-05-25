// frontend/js/main.js
document.addEventListener('DOMContentLoaded', async () => {
    // 确保 UI 元素从 ui.js 初始化
    if (typeof initializeUiElements === "function") {
        initializeUiElements(); // 调用 ui.js 的初始化函数
    } else {
        console.error("CRITICAL: initializeUiElements function from ui.js is not defined! UI will not work correctly.");
        alert("关键错误：UI初始化失败。请刷新页面。(错误: UI_INIT_MISSING)");
        return;
    }

    // --- 自动测试后端通讯 ---
    const API_BASE_URL = 'https://wenge.cloudns.ch/backend/';
    
    const safeDisplayMessage = (msg, isErr = false) => {
        if (typeof displayMessage === "function") {
            displayMessage(msg, isErr);
        } else {
            isErr ? console.error(msg) : console.log(msg);
        }
    };

    try {
        console.log("--- 自动后端通讯测试开始 ---");
        safeDisplayMessage("正在自动测试后端通讯...", false);
        const testEndpoint = `${API_BASE_URL}deal_cards.php`;
        const response = await fetch(testEndpoint);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP 错误! ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        let msg = "自动后端通讯测试成功！";
        if(data && data.message) msg += ` 后端消息: ${data.message}`;
        else if (data && data.cards && data.cards.length > 0) msg += ` (后端返回 ${data.cards.length} 张牌)`;
        safeDisplayMessage(msg, false);
        console.log("--- 自动后端通讯测试结束 ---", data);
    } catch (error) {
        console.error("自动后端通讯测试捕获到错误:", error);
        safeDisplayMessage(`自动后端通讯测试失败: ${error.message}`, true);
    }
    // --- 自动测试后端通讯结束 ---


    // DOM Elements
    const dealButton = document.getElementById('deal-button');
    const confirmOrganizationButton = document.getElementById('confirm-organization-button');
    const compareButton = document.getElementById('compare-button');
    const lobbyButton = document.getElementById('lobby-button');
    const pointsButton = document.getElementById('points-button');
    const aiReferenceButton = document.getElementById('ai-reference-button');
    const aiTakeoverButton = document.getElementById('ai-takeover-button');
    const aiTakeoverModal = document.getElementById('ai-takeover-modal');

    const initialAndMiddleHandElement = document.getElementById('player-hand');
    const topRowElement = document.getElementById('player-top-row');
    const bottomRowElement = document.getElementById('player-bottom-row');
    const middleHandHeader = document.getElementById('middle-hand-header');
    const topEvalTextElement = document.getElementById('top-eval-text');
    const middleEvalTextElement = document.getElementById('middle-eval-text');
    const bottomEvalTextElement = document.getElementById('bottom-eval-text');

    // 日志检查获取到的元素
    console.log("DOM Element Check after getElementById:");
    console.log({ dealButton, confirmOrganizationButton, compareButton, lobbyButton, pointsButton, aiReferenceButton, aiTakeoverButton, aiTakeoverModal, initialAndMiddleHandElement, topRowElement, bottomRowElement, middleHandHeader, topEvalTextElement, middleEvalTextElement, bottomEvalTextElement });


    let playerFullHandSource = [];
    let playerOrganizedHand = { top: [], middle: [], bottom: [] };
    let sortableInstances = {};
    const MAX_SORTABLE_INIT_ATTEMPTS = 10, SORTABLE_INIT_DELAY = 200;
    let sortableInitializationAttempts = 0;
    let isAiTakeoverActive = false;
    let aiTakeoverRoundsLeft = 0;


    function initializeSortable() {
        if (typeof Sortable === 'undefined') {
            sortableInitializationAttempts++;
            if (sortableInitializationAttempts < MAX_SORTABLE_INIT_ATTEMPTS) {
                setTimeout(initializeSortable, SORTABLE_INIT_DELAY);
            } else {
                console.error("SortableJS 加载失败!");
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
                displayCurrentArrangementState(); 
                checkAllCardsOrganized();
            },
            onMove: function (evt) {
                if (isAiTakeoverActive) return false;
                const toEl = evt.to;
                if (!toEl) return true; // Should not happen if Sortable is setup correctly
                const limit = parseInt(toEl.dataset.rowLimit);
                if (limit && toEl !== evt.from && toEl.children.length >= limit) return false;
                return true;
            },
            onAdd: function(evt) {
                const toEl = evt.to;
                const fromEl = evt.from;
                if (!toEl || !fromEl) return; // Safety check

                const limit = parseInt(toEl.dataset.rowLimit);
                if (limit && toEl.children.length > limit) {
                    // This check might be redundant if onMove already prevents it,
                    // but SortableJS can sometimes be tricky with rapid movements.
                    Sortable.utils.select(evt.item).parentNode.removeChild(evt.item); 
                    fromEl.appendChild(evt.item);
                    safeDisplayMessage(`${toEl.dataset.rowName === 'top' ? '头' : (toEl.dataset.rowName === 'bottom' ? '尾' : '中')}道已满! 卡片已退回。`, true);
                    // Ensure models are updated after reverting
                    updateHandModelFromDOM(fromEl, fromEl.dataset.rowName);
                    // No need to update 'toEl' model here as the card was reverted.
                    displayCurrentArrangementState();
                }
            }
        };
        if(initialAndMiddleHandElement) sortableInstances.initial_middle = new Sortable(initialAndMiddleHandElement, {...commonSortableOptions, sort: true, group: {name: sharedGroupName, pull: true, put: true}});
        else console.error("Sortable: initialAndMiddleHandElement is null");
        if(topRowElement) sortableInstances.top = new Sortable(topRowElement, {...commonSortableOptions, sort: true, group: {name: sharedGroupName, pull: true, put: true}});
        else console.error("Sortable: topRowElement is null");
        if(bottomRowElement) sortableInstances.bottom = new Sortable(bottomRowElement, {...commonSortableOptions, sort: true, group: {name: sharedGroupName, pull: true, put: true}});
        else console.error("Sortable: bottomRowElement is null");
    }

    function updateHandModelFromDOM(rowEl, rowName) {
        if (!rowEl || !rowName) return;
        const cards = Array.from(rowEl.children).map(div => div.cardData).filter(Boolean);
        if (rowName === 'top') playerOrganizedHand.top = cards;
        else if (rowName === 'bottom') playerOrganizedHand.bottom = cards;
        // playerOrganizedHand.middle is updated from initialAndMiddleHandElement on confirm/compare
    }

    function displayCurrentArrangementState(isAIOrganizing = false) {
        const topC = playerOrganizedHand.top || [];
        const botC = playerOrganizedHand.bottom || [];
        let midCSource = [];

        if (isAIOrganizing && playerOrganizedHand.middle && playerOrganizedHand.middle.length === 5) {
            midCSource = playerOrganizedHand.middle;
        } else if (initialAndMiddleHandElement) {
            midCSource = Array.from(initialAndMiddleHandElement.children).map(div => div.cardData).filter(Boolean);
        } else {
            console.warn("displayCurrentArrangementState: initialAndMiddleHandElement is null, cannot get middle cards from DOM.");
        }
        
        const midReady = topC.length === 3 && botC.length === 5 && midCSource.length === 5;
        const evalFunc = typeof evaluateHand === "function" ? evaluateHand : () => ({message: "评价逻辑缺失"});

        if(topEvalTextElement) topEvalTextElement.textContent = topC.length > 0 ? ` (${(topC.length===3 ? evalFunc(topC).message : '未完成') || '未完成'})` : '';
        else console.warn("displayCurrentArrangementState: topEvalTextElement is null");

        if(bottomEvalTextElement) bottomEvalTextElement.textContent = botC.length > 0 ? ` (${(botC.length===5 ? evalFunc(botC).message : '未完成') || '未完成'})` : '';
        else console.warn("displayCurrentArrangementState: bottomEvalTextElement is null");


        if (middleHandHeader) { 
            const h3TitleElement = document.getElementById('middle-hand-header'); // Already middleHandHeader, but for consistency
            const spanEvalElement = document.getElementById('middle-eval-text'); 
            if (h3TitleElement && spanEvalElement) { // Ensure both exist
                if (midReady) {
                    h3TitleElement.childNodes[0].nodeValue = `中道 (5张): `; 
                    spanEvalElement.textContent = ` (${evalFunc(midCSource).message || '计算中...'})`;
                    if(initialAndMiddleHandElement) initialAndMiddleHandElement.classList.add('is-middle-row-style');
                } else {
                    h3TitleElement.childNodes[0].nodeValue = `我的手牌 / 中道 (剩余牌): `;
                    const displayCount = midCSource.length;
                    spanEvalElement.textContent = displayCount > 0 ? ` (共${displayCount}张)` : '';
                    if(initialAndMiddleHandElement) initialAndMiddleHandElement.classList.remove('is-middle-row-style');
                }
            } else {
                if (!h3TitleElement) console.warn("displayCurrentArrangementState: middle-hand-header (H3) is null");
                if (!spanEvalElement) console.warn("displayCurrentArrangementState: middle-eval-text (SPAN) is null");
            }
        } else console.warn("displayCurrentArrangementState: middleHandHeader (H3's parent div) is null");
        
        if(typeof checkDaoshuiForUI === "function") checkDaoshuiForUI(midCSource);
    }

    function checkDaoshuiForUI(midC) {
        if (!midC) return; // midC could be undefined if elements are missing
        const topC = playerOrganizedHand.top || [];
        const botC = playerOrganizedHand.bottom || [];
        if(typeof evaluateHand !== "function" || typeof checkDaoshui !== "function") return;

        if (topC.length===3 && botC.length===5 && midC.length===5) {
            const tE=evaluateHand(topC), mE=evaluateHand(midC), bE=evaluateHand(botC);
            const isDS = checkDaoshui(tE,mE,bE);
            
            const elementsToWarn = [topRowElement, initialAndMiddleHandElement, bottomRowElement];
            elementsToWarn.forEach(el => {
                if (el) { // Check if element exists before adding/removing class
                    isDS ? el.classList.add('daoshui-warning') : el.classList.remove('daoshui-warning');
                }
            });
            if(isDS) safeDisplayMessage("警告: 检测到倒水！", true);
        } else {
            const elementsToClearWarn = [topRowElement, initialAndMiddleHandElement, bottomRowElement];
             elementsToClearWarn.forEach(el => {
                if (el) el.classList.remove('daoshui-warning');
            });
        }
    }

    function checkAllCardsOrganized(silent = false) {
        let midCSource = [];
        if (initialAndMiddleHandElement) {
            midCSource = Array.from(initialAndMiddleHandElement.children).map(div => div.cardData).filter(Boolean);
        } else if (!isAiTakeoverActive){ // Only warn if not AI takeover and element is missing
            console.warn("checkAllCardsOrganized: initialAndMiddleHandElement is null.");
        }

        const midHandToCheck = isAiTakeoverActive && playerOrganizedHand.middle ? playerOrganizedHand.middle : midCSource;
        const topOK = playerOrganizedHand.top ? playerOrganizedHand.top.length === 3 : false;
        const botOK = playerOrganizedHand.bottom ? playerOrganizedHand.bottom.length === 5 : false;
        const midOK = midHandToCheck ? midHandToCheck.length === 5 : false;
        const allSet = topOK && botOK && midOK;

        if (confirmOrganizationButton) {
            confirmOrganizationButton.disabled = !allSet || isAiTakeoverActive || aiTakeoverRoundsLeft > 0;
        }
        if(allSet && !silent && !isAiTakeoverActive) safeDisplayMessage("牌型已分配，请确认。", false);
        return allSet;
    }
    
    function renderHandToDOM(organizedHand, targetPlayerOrganizedHandModel = true) {
        if (!organizedHand || typeof renderCard !== 'function') {
            console.error("renderHandToDOM: 无效的参数", {organizedHand, renderCardExists: typeof renderCard === 'function'});
            return;
        }
        if (!topRowElement || !initialAndMiddleHandElement || !bottomRowElement) {
            console.error("renderHandToDOM: 一个或多个牌区元素未找到!", {topRowElement, initialAndMiddleHandElement, bottomRowElement});
            return;
        }
        topRowElement.innerHTML = '';
        (organizedHand.top || []).forEach(card => topRowElement.appendChild(renderCard(card, true)));
    
        initialAndMiddleHandElement.innerHTML = '';
        (organizedHand.middle || []).forEach(card => initialAndMiddleHandElement.appendChild(renderCard(card, true)));
    
        bottomRowElement.innerHTML = '';
        (organizedHand.bottom || []).forEach(card => bottomRowElement.appendChild(renderCard(card, true)));
    
        if (targetPlayerOrganizedHandModel) {
            playerOrganizedHand.top = [...(organizedHand.top || [])];
            playerOrganizedHand.middle = [...(organizedHand.middle || [])];
            playerOrganizedHand.bottom = [...(organizedHand.bottom || [])];
        }
        displayCurrentArrangementState(false); // AI/manual摆放后，中道牌都在DOM里显示
        checkAllCardsOrganized();
    }
    

    function initializeGame() {
        console.log("调用 initializeGame");
        playerFullHandSource = [];
        playerOrganizedHand = {top:[], middle:[], bottom:[]};
        enableDragAndDrop(true); 

        const elementsToClear = [topRowElement, initialAndMiddleHandElement, bottomRowElement];
        elementsToClear.forEach(el => {
            if (el) {
                el.innerHTML = '';
                el.classList.remove('daoshui-warning', 'is-middle-row-style');
            } else {
                // Get the ID of the element if possible for better logging
                const elId = Object.keys({topRowElement, initialAndMiddleHandElement, bottomRowElement}).find(key => eval(key) === el);
                console.warn(`initializeGame: 元素 ${elId || '未知牌区'} 为 null，无法清空。`);
            }
        });
        
        if(initialAndMiddleHandElement) {
            initialAndMiddleHandElement.innerHTML='<p>点击 "发牌" 开始</p>';
        } else {
            console.error("initializeGame: initialAndMiddleHandElement 为 null! 无法设置初始文本。");
        }
        
        const evalTextElements = [topEvalTextElement, middleEvalTextElement, bottomEvalTextElement];
        evalTextElements.forEach(el => {
            if (el) el.textContent='';
            // else console.warn("initializeGame: 一个牌型评估文本元素为null。"); // Might be too noisy if logged every time
        });

        if(middleHandHeader && middleHandHeader.childNodes.length > 0 && middleHandHeader.childNodes[0].nodeValue !== undefined) {
            const h3TitleElement = document.getElementById('middle-hand-header'); // This is the H3
            const spanEvalElement = document.getElementById('middle-eval-text'); // This is the SPAN inside H3
            if (h3TitleElement && h3TitleElement.childNodes.length > 0 && h3TitleElement.childNodes[0].nodeType === Node.TEXT_NODE) {
                 h3TitleElement.childNodes[0].nodeValue = `我的手牌 / 中道 (剩余牌): `;
            } else if (h3TitleElement) {
                 console.warn("initializeGame: middle-hand-header H3 结构不符合预期或无文本节点。");
            }
            if (spanEvalElement) {
                spanEvalElement.textContent = '';
            }
        } else if (middleHandHeader) {
             console.warn("initializeGame: middleHandHeader (H3的父级div) 结构不符合预期。");
        }


        safeDisplayMessage("点击“发牌”开始。", false);
        if(typeof displayScore === "function") displayScore("得分: --");
        
        if (dealButton) dealButton.disabled = false; else console.error("initializeGame: dealButton is null");
        if (confirmOrganizationButton) {
            confirmOrganizationButton.style.display = 'none';
            confirmOrganizationButton.disabled = true;
        } else console.error("initializeGame: confirmOrganizationButton is null");
        
        if (compareButton) {
            compareButton.style.display = 'none';
            compareButton.disabled = true;
        } else console.error("initializeGame: compareButton is null");
        
        if (aiReferenceButton) aiReferenceButton.disabled = true;
        if (aiTakeoverButton) {
            aiTakeoverButton.disabled = true;
            if (aiTakeoverRoundsLeft === 0) {
                 isAiTakeoverActive = false;
                 aiTakeoverButton.textContent = "AI托管";
            }
        }
        console.log("游戏已初始化。");
    }

    dealButton.addEventListener('click', async () => {
        console.log("--- 发牌按钮点击 ---");
        if (aiTakeoverRoundsLeft > 0) {
            aiTakeoverRoundsLeft--;
            isAiTakeoverActive = true;
            safeDisplayMessage(`AI托管剩余 ${aiTakeoverRoundsLeft + 1} 局。发牌中...`, false);
        } else {
            isAiTakeoverActive = false;
            if (aiTakeoverButton) aiTakeoverButton.textContent = "AI托管";
        }
        
        playerFullHandSource = [];
        playerOrganizedHand = {top:[], middle:[], bottom:[]};
        enableDragAndDrop(!isAiTakeoverActive);

        const elementsToReset = [
            {el: topRowElement, name: 'topRowElement'}, 
            {el: initialAndMiddleHandElement, name: 'initialAndMiddleHandElement'}, 
            {el: bottomRowElement, name: 'bottomRowElement'}
        ];
        elementsToReset.forEach(item => {
            if (item.el) {
                item.el.innerHTML = '';
                item.el.classList.remove('daoshui-warning', 'is-middle-row-style');
            } else {
                console.error(`发牌重置错误: ${item.name} 为 null。`);
            }
        });
         if(initialAndMiddleHandElement) {
            initialAndMiddleHandElement.innerHTML='<p>发牌中...</p>';
         } else {
             // This is a critical failure for dealing cards
             safeDisplayMessage("致命错误: 核心牌区丢失，无法发牌!", true);
             if(dealButton) dealButton.disabled = false; // Allow retry if it was a temp issue
             return;
         }
        
        const evalTextElementsToClear = [topEvalTextElement, middleEvalTextElement, bottomEvalTextElement];
        evalTextElementsToClear.forEach(el => {
            if (el) el.textContent='';
        });

        if (dealButton) dealButton.disabled = true;
        if (aiReferenceButton) aiReferenceButton.disabled = true;
        if (aiTakeoverButton && !isAiTakeoverActive) aiTakeoverButton.disabled = true;
        if (confirmOrganizationButton) confirmOrganizationButton.style.display = 'none';
        if (compareButton) compareButton.style.display = 'none';

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
                    id: (cardFromServer.rank || 'X') + (cardFromServer.suitKey || 'Y') + Math.random().toString(36).substring(2, 9)
                };
            }).filter(card => card.rank && card.suitKey);

            if (typeof sortCardsByRank === "function") {
                playerFullHandSource = sortCardsByRank(playerFullHandSource); // 修正了之前的拼写错误
            }

            if (initialAndMiddleHandElement) {
                initialAndMiddleHandElement.innerHTML=''; // 清空 "发牌中..."
                playerFullHandSource.forEach(card => {
                    if (card && typeof renderCard === "function") {
                         initialAndMiddleHandElement.appendChild(renderCard(card, true));
                    } else {
                        console.error("渲染牌错误: card 或 renderCard 无效", card);
                    }
                });
            } else {
                 console.error("错误: initialAndMiddleHandElement 在渲染牌时为 null。游戏无法继续。");
                 safeDisplayMessage("致命错误: 核心牌区丢失，无法显示牌!", true);
                 return; // Stop further execution for this deal
            }
            displayCurrentArrangementState(); 

            if (isAiTakeoverActive) {
                safeDisplayMessage("AI正在理牌...", false);
                if (confirmOrganizationButton) confirmOrganizationButton.disabled = true;
                if (typeof getAITakeoverOrganization === 'function') {
                    const aiBestHand = getAITakeoverOrganization([...playerFullHandSource]);
                    if (aiBestHand) {
                        renderHandToDOM(aiBestHand, true);
                        safeDisplayMessage("AI已完成理牌。准备自动比牌...", false);
                        if (compareButton) {
                            compareButton.disabled = false;
                            setTimeout(() => {
                                if (isAiTakeoverActive && compareButton && !compareButton.disabled) compareButton.click();
                            }, 1500); 
                        }
                    } else {
                        safeDisplayMessage("AI理牌失败，请手动操作或取消托管。", true);
                        enableDragAndDrop(true);
                    }
                } else { safeDisplayMessage("AI托管核心组件缺失", true); enableDragAndDrop(true); }
            } else {
                safeDisplayMessage("请理牌。", false);
                if (confirmOrganizationButton) {
                    confirmOrganizationButton.style.display = 'inline-block';
                    confirmOrganizationButton.disabled = false;
                }
                if (aiReferenceButton) aiReferenceButton.disabled = false;
                if (aiTakeoverButton) aiTakeoverButton.disabled = false;
            }

        } catch(err) {
            console.error("发牌流程中捕获到错误:", err); 
            safeDisplayMessage(`发牌错误: ${err.message}`,true);
            if (dealButton) dealButton.disabled = false; 
            if (confirmOrganizationButton) confirmOrganizationButton.style.display = 'none';
            isAiTakeoverActive = false; aiTakeoverRoundsLeft = 0;
            if (aiTakeoverButton) aiTakeoverButton.textContent = "AI托管";
            enableDragAndDrop(true);
        }
    });

    if (confirmOrganizationButton) {
        confirmOrganizationButton.addEventListener('click', () => {
            if (isAiTakeoverActive) return;
             if (!initialAndMiddleHandElement) {
                safeDisplayMessage("错误：中央牌区丢失，无法确认理牌。", true);
                return;
            }
            playerOrganizedHand.middle = Array.from(initialAndMiddleHandElement.children).map(d=>d.cardData).filter(Boolean);
            
            if(!playerOrganizedHand.top || !playerOrganizedHand.middle || !playerOrganizedHand.bottom || // Ensure arrays exist
               playerOrganizedHand.top.length!==3 || playerOrganizedHand.middle.length!==5 || playerOrganizedHand.bottom.length!==5) {
                safeDisplayMessage(`牌数错误！头${playerOrganizedHand.top?.length || 0}/3, 中${playerOrganizedHand.middle?.length || 0}/5, 尾${playerOrganizedHand.bottom?.length || 0}/5.`,true); return;
            }
            const evalFunc = typeof evaluateHand === "function" ? evaluateHand : () => ({message:"N/A"});
            const tE=evalFunc(playerOrganizedHand.top), mE=evalFunc(playerOrganizedHand.middle), bE=evalFunc(playerOrganizedHand.bottom);

            if (middleHandHeader) {
                const h3TitleElement = document.getElementById('middle-hand-header');
                const spanEvalElement = document.getElementById('middle-eval-text');
                if(h3TitleElement && spanEvalElement && h3TitleElement.childNodes.length > 0) {
                    h3TitleElement.childNodes[0].nodeValue =`中道 (5张): `;
                    spanEvalElement.textContent=` (${mE.message||'未知'})`;
                    if(initialAndMiddleHandElement) initialAndMiddleHandElement.classList.add('is-middle-row-style');
                }
            }


            if(typeof checkDaoshui==="function" && checkDaoshui(tE,mE,bE)){
                safeDisplayMessage("警告: 倒水！",true);
                [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el=> { if(el) el.classList.add('daoshui-warning');});
            } else {
                safeDisplayMessage("理牌完成，可比牌。",false);
                [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el=> { if(el) el.classList.remove('daoshui-warning');});
            }
            confirmOrganizationButton.style.display = 'none'; 
            if (compareButton) {
                compareButton.style.display = 'inline-block';
                compareButton.disabled = false;
            }
            if (aiReferenceButton) aiReferenceButton.disabled = true;
            if (aiTakeoverButton) aiTakeoverButton.disabled = true;
        });
    } else { console.error("confirmOrganizationButton is null, event listener not added."); }


    if (compareButton) {
        compareButton.addEventListener('click', async () => {
            console.log("--- 比牌按钮点击 ---");
            safeDisplayMessage("提交比牌中...",false); 
            compareButton.disabled = true;

            if (!isAiTakeoverActive && initialAndMiddleHandElement) {
                playerOrganizedHand.middle = Array.from(initialAndMiddleHandElement.children).map(d => d.cardData).filter(Boolean);
            } else if (!isAiTakeoverActive && !initialAndMiddleHandElement) {
                 safeDisplayMessage("错误：中央牌区丢失，无法比牌。", true);
                 compareButton.disabled = false; // Re-enable if error
                 return;
            }
        
            if(!playerOrganizedHand.top || !playerOrganizedHand.middle || !playerOrganizedHand.bottom ||
               playerOrganizedHand.top.length!==3 || playerOrganizedHand.middle.length!==5 || playerOrganizedHand.bottom.length!==5){
                safeDisplayMessage("错误:提交的牌不完整。",true);
                if (dealButton) dealButton.disabled = false;
                compareButton.style.display = 'none';
                if (confirmOrganizationButton && !isAiTakeoverActive) {
                    confirmOrganizationButton.style.display = 'inline-block';
                    confirmOrganizationButton.disabled = !(playerFullHandSource && playerFullHandSource.length === 13); 
                }
                return;
            }

            const pL={
                top:playerOrganizedHand.top.map(c=>({rank:c.rank,suitKey:c.suitKey})), 
                middle:playerOrganizedHand.middle.map(c=>({rank:c.rank,suitKey:c.suitKey})), 
                bottom:playerOrganizedHand.bottom.map(c=>({rank:c.rank,suitKey:c.suitKey}))
            };
            
            try {
                const res = await fetch(`${API_BASE_URL}submit_hand.php`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pL)});
                if(!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`比牌请求失败: ${res.status} ${errorText}`);
                }
                const rst = await res.json(); 
                if(rst.success){ let msg=`服务器: ${rst.message||'完成.'}`; if(rst.daoshui)msg+=" (倒水)"; safeDisplayMessage(msg,rst.daoshui); }
                else safeDisplayMessage(`服务器错误: ${rst.message||'失败.'}`,true);
                if(typeof displayScore==="function"&&typeof rst.score!=="undefined")displayScore(`得分: ${rst.score}`);
            
            } catch(err){
                console.error("比牌错误:",err); safeDisplayMessage(`错误: ${err.message}`,true);
            
            } finally { 
                if (dealButton) dealButton.disabled = false; 
                compareButton.style.display = 'none'; 
                
                if (aiTakeoverRoundsLeft > 0) {
                    safeDisplayMessage(`AI托管：准备开始下一局 (剩余${aiTakeoverRoundsLeft}局)...`, false);
                    setTimeout(() => { if(dealButton) dealButton.click(); }, 2000);
                } else {
                    isAiTakeoverActive = false;
                    if (aiTakeoverButton) {
                        aiTakeoverButton.textContent = "AI托管";
                        aiTakeoverButton.disabled = true; // 等待下一次发牌启用
                    }
                    if (aiReferenceButton) aiReferenceButton.disabled = true; // 等待下一次发牌启用
                    
                    // 只有当AI托管完全结束后，才调用initializeGame彻底重置
                    // 避免在多局托管中间重置了AI状态
                    if (aiTakeoverRoundsLeft <= 0 && isAiTakeoverActive === false) { // Double check isAiTakeoverActive
                         console.log("比牌后，AI托管结束，调用initializeGame");
                         initializeGame();
                    } else if (aiTakeoverRoundsLeft <=0 && !isAiTakeoverActive) { // 非AI托管的正常结束
                         console.log("比牌后，非AI托管，调用initializeGame");
                         initializeGame();
                    }
                }
            }
        });
    } else { console.error("compareButton is null, event listener not added.");}


    if (aiReferenceButton) {
        aiReferenceButton.addEventListener('click', () => {
            console.log("--- AI 参考按钮点击 ---");
            if (isAiTakeoverActive) { safeDisplayMessage("AI已托管，无需参考。", false); return; }
            if (!playerFullHandSource || playerFullHandSource.length !== 13) { safeDisplayMessage("请先发牌。", true); return; }
            
            if (typeof generateAIReferenceSuggestions !== 'function' || typeof getNextAIReference !== 'function') {
                safeDisplayMessage("AI参考功能组件缺失。", true); return;
            }
            
            if (typeof aiReferenceSuggestions === 'undefined' || aiReferenceSuggestions.length === 0) {
                 safeDisplayMessage("AI正在生成多种参考牌型...", false);
                 generateAIReferenceSuggestions([...playerFullHandSource], 3);
                 if (typeof aiReferenceSuggestions === 'undefined' || aiReferenceSuggestions.length === 0) {
                     safeDisplayMessage("AI未能生成参考建议。", true); return;
                 }
            }

            const suggestion = getNextAIReference();
            if (suggestion) {
                renderHandToDOM(suggestion, false); // false: 不更新 playerOrganizedHand 模型
                const topMsg = evaluateHand(suggestion.top).message;
                const midMsg = evaluateHand(suggestion.middle).message;
                const botMsg = evaluateHand(suggestion.bottom).message;
                const currentDisplayIndex = (typeof currentSuggestionIndex !== 'undefined' ? currentSuggestionIndex : aiReferenceSuggestions.length);
                safeDisplayMessage(`AI参考 #${currentDisplayIndex}: 头(${topMsg}), 中(${midMsg}), 尾(${botMsg})。再次点击查看其他。`, false);
            } else {
                safeDisplayMessage("没有更多AI参考建议了或无法生成。", true);
                if (typeof aiReferenceSuggestions !== 'undefined') aiReferenceSuggestions = [];
            }
        });
    }  else { console.error("aiReferenceButton is null, event listener not added.");}

    if (aiTakeoverButton) {
        aiTakeoverButton.addEventListener('click', () => {
            console.log("--- AI 托管按钮点击 ---");
            if (isAiTakeoverActive) {
                isAiTakeoverActive = false;
                aiTakeoverRoundsLeft = 0;
                aiTakeoverButton.textContent = "AI托管";
                enableDragAndDrop(true);
                safeDisplayMessage("AI托管已取消。", false);
                if(confirmOrganizationButton) confirmOrganizationButton.disabled = !(playerFullHandSource && playerFullHandSource.length === 13 && !checkAllCardsOrganized(true));
                return;
            }

            if (!playerFullHandSource || playerFullHandSource.length !== 13) { safeDisplayMessage("请先发牌。", true); return; }
            if (aiTakeoverModal) aiTakeoverModal.style.display = 'block';
            else console.error("aiTakeoverModal is null, cannot display.");
        });
    }  else { console.error("aiTakeoverButton is null, event listener not added.");}

    if (aiTakeoverModal) {
        aiTakeoverModal.addEventListener('click', (event) => {
            const targetButton = event.target.closest('button');
            if (targetButton && targetButton.dataset.rounds) {
                const rounds = parseInt(targetButton.dataset.rounds);
                aiTakeoverModal.style.display = 'none';

                if (rounds > 0) {
                    isAiTakeoverActive = true;
                    aiTakeoverRoundsLeft = rounds -1; 
                    if(aiTakeoverButton) aiTakeoverButton.textContent = `取消托管 (${rounds}局)`;
                    safeDisplayMessage(`AI已托管 ${rounds} 局。AI正在理牌...`, false);
                    enableDragAndDrop(false);
                    if (confirmOrganizationButton) confirmOrganizationButton.disabled = true;

                    if (typeof getAITakeoverOrganization === 'function') {
                        const aiBestHand = getAITakeoverOrganization([...playerFullHandSource]);
                        if (aiBestHand) {
                            renderHandToDOM(aiBestHand, true);
                            safeDisplayMessage("AI已完成理牌。准备自动比牌...", false);
                             if (compareButton) {
                                compareButton.disabled = false;
                                setTimeout(() => {
                                    if (isAiTakeoverActive && compareButton && !compareButton.disabled) compareButton.click();
                                }, 1500); 
                            }
                        } else {
                            safeDisplayMessage("AI理牌失败，请手动操作或取消托管。", true);
                            enableDragAndDrop(true);
                        }
                    } else { safeDisplayMessage("AI托管核心功能未实现。", true); enableDragAndDrop(true);}
                } else {
                    safeDisplayMessage("AI托管已取消选择。", false);
                }
            }
        });
    } else { console.error("aiTakeoverModal is null, event listener not added."); }
    
    function enableDragAndDrop(enable) {
        for (const key in sortableInstances) {
            if (sortableInstances[key] && typeof sortableInstances[key].option === 'function') {
                sortableInstances[key].option('disabled', !enable);
            }
        }
        const cardElements = document.querySelectorAll('.card-css');
        cardElements.forEach(cardEl => {
            cardEl.style.cursor = enable ? 'grab' : 'not-allowed';
        });
    }

    if (lobbyButton) {
        lobbyButton.addEventListener('click', () => { safeDisplayMessage("大厅功能暂未实现。", false); });
    } else { console.error("lobbyButton is null, event listener not added."); }

    if (pointsButton) {
        pointsButton.addEventListener('click', () => { safeDisplayMessage("积分查看功能暂未实现。", false); });
    } else { console.error("pointsButton is null, event listener not added."); }

    initializeGame();
    initializeSortable();
});
