// frontend/js/main.js

document.addEventListener('DOMContentLoaded', async () => { // 添加 async 使顶层 await 可用 (如果需要)
    // 确保 UI 元素从 ui.js 初始化
    if (typeof initializeUiElements === "function") {
        initializeUiElements();
    } else {
        console.error("CRITICAL: initializeUiElements function from ui.js is not defined! UI will not work correctly.");
        alert("关键错误：UI初始化失败。请刷新页面。(错误: UI_INIT_MISSING)");
        return;
    }

    // --- 自动测试后端通讯 ---
    // 将 API_BASE_URL 移到这里，因为它在自动测试中被使用
    const API_BASE_URL = 'https://wenge.cloudns.ch/backend/';
    
    // Helper to safely call displayMessage (也移到这里，因为自动测试会用到)
    const safeDisplayMessage = (msg, isErr = false) => {
        if (typeof displayMessage === "function") displayMessage(msg, isErr);
        else isErr ? console.error(msg) : console.log(msg);
    };

    try {
        console.log("--- 自动后端通讯测试开始 ---");
        safeDisplayMessage("正在自动测试后端通讯...", false);
        const testEndpoint = `${API_BASE_URL}deal_cards.php`; // 或者一个更简单的 ping 端点
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
    // const callBackendButton = document.getElementById('call-backend-button'); // 已移除
    const lobbyButton = document.getElementById('lobby-button');
    const pointsButton = document.getElementById('points-button');
    const aiReferenceButton = document.getElementById('ai-reference-button'); // 新增
    const aiTakeoverButton = document.getElementById('ai-takeover-button');   // 新增

    const initialAndMiddleHandElement = document.getElementById('player-hand');
    const topRowElement = document.getElementById('player-top-row');
    const bottomRowElement = document.getElementById('player-bottom-row');
    const middleHandHeader = document.getElementById('middle-hand-header');
    const topEvalTextElement = document.getElementById('top-eval-text');
    const middleEvalTextElement = document.getElementById('middle-eval-text');
    const bottomEvalTextElement = document.getElementById('bottom-eval-text');

    // API_BASE_URL 和 safeDisplayMessage 已移到上面

    let playerFullHandSource = [];
    let playerOrganizedHand = { top: [], middle: [], bottom: [] };
    let sortableInstances = {};
    const MAX_SORTABLE_INIT_ATTEMPTS = 10, SORTABLE_INIT_DELAY = 200;
    let sortableInitializationAttempts = 0;
    let isAiTakeoverActive = false; // AI托管状态


    function initializeSortable() {
        if (typeof Sortable === 'undefined') {
            sortableInitializationAttempts++;
            if (sortableInitializationAttempts < MAX_SORTABLE_INIT_ATTEMPTS) setTimeout(initializeSortable, SORTABLE_INIT_DELAY);
            else {
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
                displayCurrentArrangementState(); checkAllCardsOrganized();
            },
            onMove: function (evt) {
                if (isAiTakeoverActive) return false; // AI托管时禁止拖动
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
        // initial_middle (player-hand) 更新不需要在这里显式处理playerOrganizedHand.middle
        // 它会在确认理牌时或比牌前从DOM获取
    }

    function displayCurrentArrangementState(isAIOrganizing = false) { // 添加参数区分是否AI正在组织
        const topC = playerOrganizedHand.top, botC = playerOrganizedHand.bottom;
        // 如果是AI在组织牌，那么中道牌也应该从 playerOrganizedHand.middle 获取
        // 否则，中道牌依然从 player-hand DOM元素获取
        const midCSource = isAIOrganizing && playerOrganizedHand.middle.length === 5 ? 
                           playerOrganizedHand.middle : 
                           Array.from(initialAndMiddleHandElement.children).map(div => div.cardData).filter(Boolean);

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
                    const displayCount = isAIOrganizing && playerOrganizedHand.middle.length > 0 && playerOrganizedHand.middle.length !== 5 ? 
                                          0 : // AI 正在组织且中道牌未确定时，不显示数量，避免混淆
                                          midCSource.length;
                    spanEvalElement.textContent = displayCount > 0 ? ` (共${displayCount}张)` : '';
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
            // 移除这里的 "请继续理牌..."，避免与AI操作冲突
            // else if (confirmOrganizationButton.disabled && !checkAllCardsOrganized(true)) safeDisplayMessage("请继续理牌...", false);
        } else [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el => el && el.classList.remove('daoshui-warning'));
    }

    function checkAllCardsOrganized(silent = false) {
        const midCSource = Array.from(initialAndMiddleHandElement.children).map(div => div.cardData).filter(Boolean);
        // 当AI托管时，我们检查 playerOrganizedHand 模型，而不是DOM里的 middle hand
        const midHandToCheck = isAiTakeoverActive ? playerOrganizedHand.middle : midCSource;

        const topOK = playerOrganizedHand.top.length === 3;
        const botOK = playerOrganizedHand.bottom.length === 5;
        const midOK = midHandToCheck.length === 5;

        const allSet = topOK && botOK && midOK;

        if (confirmOrganizationButton) { // 确保按钮存在
            confirmOrganizationButton.disabled = !allSet || isAiTakeoverActive; // AI托管时也禁用
        }
        
        if(allSet && !silent && !isAiTakeoverActive) safeDisplayMessage("牌型已分配，请确认。", false);
        return allSet;
    }
    
    function renderOrganizedHandToDOM(organizedHand) {
        if (!organizedHand || typeof renderCard !== 'function') return;
    
        topRowElement.innerHTML = '';
        organizedHand.top.forEach(card => topRowElement.appendChild(renderCard(card, true)));
    
        // 对于中道，如果AI托管，我们清空 player-hand 并将牌放入 playerOrganizedHand.middle
        // 然后 displayCurrentArrangementState 会处理显示
        // 如果不是AI托管，牌已经在 player-hand 里了
        if (isAiTakeoverActive) {
            initialAndMiddleHandElement.innerHTML = ''; // AI托管时，初始区是空的，牌在模型里
        } else {
            // 如果AI刚刚提供参考，可能需要把牌放回 player-hand
            // 但此函数主要用于AI托管后的渲染
        }

        // 注意：AI托管时，playerOrganizedHand.middle 存中道牌
        // 而 player-hand (initialAndMiddleHandElement) 可能被用作临时区域或保持为空
        // 此处假设 playerOrganizedHand.middle 是AI组织的中道
        // 而 displayCurrentArrangementState 会根据 isAIOrganizing 参数正确显示中道
    
        bottomRowElement.innerHTML = '';
        organizedHand.bottom.forEach(card => bottomRowElement.appendChild(renderCard(card, true)));
    
        // 更新模型
        playerOrganizedHand.top = organizedHand.top;
        playerOrganizedHand.middle = organizedHand.middle; // AI托管的关键：更新模型
        playerOrganizedHand.bottom = organizedHand.bottom;
    
        displayCurrentArrangementState(isAiTakeoverActive); // 传递AI状态
        checkAllCardsOrganized();
    }


    function initializeGame() {
        playerFullHandSource = [];
        playerOrganizedHand = {top:[],middle:[],bottom:[]}; // 重置模型
        isAiTakeoverActive = false; // 重置AI托管状态
        if (aiTakeoverButton) aiTakeoverButton.textContent = "AI托管";
        enableDragAndDrop(true); // 确保拖拽可用

        [topRowElement, initialAndMiddleHandElement, bottomRowElement].forEach(el => {
            if (el) {
                el.innerHTML = ''; // 清空所有牌区
                el.classList.remove('daoshui-warning', 'is-middle-row-style');
            }
        });
        if(initialAndMiddleHandElement) initialAndMiddleHandElement.innerHTML='<p>点击 "发牌" 开始</p>'; // 特殊处理初始区
        
        [topEvalTextElement,middleEvalTextElement,bottomEvalTextElement].forEach(el => el && (el.textContent=''));

        const h3MidHeader = document.getElementById('middle-hand-header');
        const spanMidEval = document.getElementById('middle-eval-text');
        if(h3MidHeader && spanMidEval) {
            h3MidHeader.childNodes[0].nodeValue = `我的手牌 / 中道 (剩余牌): `;
            spanMidEval.textContent = '';
        }

        safeDisplayMessage("点击“发牌”开始。", false);
        if(typeof displayScore === "function") displayScore("得分: --");
        
        if (dealButton) dealButton.disabled = false;
        if (confirmOrganizationButton) {
            confirmOrganizationButton.style.display = 'none';
            confirmOrganizationButton.disabled = true;
        }
        if (compareButton) {
            compareButton.style.display = 'none';
            compareButton.disabled = true; // 确保比牌按钮初始禁用
        }
        if (aiReferenceButton) aiReferenceButton.disabled = true; // 初始禁用AI按钮
        if (aiTakeoverButton) aiTakeoverButton.disabled = true;  // 初始禁用AI按钮

        console.log("游戏已初始化。");
    }

    dealButton.addEventListener('click', async () => {
        console.log("--- 发牌按钮点击 ---");
        initializeGame(); // 会重置 isAiTakeoverActive
        safeDisplayMessage("发牌中...", false);
        if (dealButton) dealButton.disabled = true;
        if (aiReferenceButton) aiReferenceButton.disabled = true;
        if (aiTakeoverButton) aiTakeoverButton.disabled = true;

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

            if (typeof sortCardsByRank === "function") { // 使用更新后的函数名
                playerFullHandSource = sortCardsByRank(playerFullHandSource); 
            } else {
                console.warn("sortCardsByRank 函数未找到。牌不会自动排序。");
            }

            initialAndMiddleHandElement.innerHTML=''; // 清空 "点击发牌开始"
            playerFullHandSource.forEach(card => {
                if (card && typeof renderCard === "function") initialAndMiddleHandElement.appendChild(renderCard(card, true));
                else console.error("无法渲染牌:", card, "renderCard 可用:", typeof renderCard === "function");
            });
            displayCurrentArrangementState(); 
            safeDisplayMessage("请理牌。", false);
            if (confirmOrganizationButton) confirmOrganizationButton.style.display = 'inline-block';
            if (aiReferenceButton) aiReferenceButton.disabled = false; // 发牌后启用AI按钮
            if (aiTakeoverButton) aiTakeoverButton.disabled = false;  // 发牌后启用AI按钮

        } catch(err) {
            console.error("发牌错误:", err); safeDisplayMessage(`错误: ${err.message}`,true);
            if (dealButton) dealButton.disabled = false; 
            if (confirmOrganizationButton) confirmOrganizationButton.style.display = 'none';
        }
    });

    confirmOrganizationButton.addEventListener('click', () => {
        console.log("--- 确认理牌按钮点击 ---");
        // 从DOM获取中道牌，因为这是玩家手动理牌的确认
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
            // 倒水时通常不允许比牌，或者比牌按钮应该有特殊处理
        } else {
            safeDisplayMessage("理牌完成，可比牌。",false);
            [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el=>el&&el.classList.remove('daoshui-warning'));
        }
        if (confirmOrganizationButton) confirmOrganizationButton.style.display = 'none'; 
        if (compareButton) {
            compareButton.style.display = 'inline-block';
            compareButton.disabled = false; // 理牌完成后启用比牌按钮
        }
        if (aiReferenceButton) aiReferenceButton.disabled = true; // 理牌确认后禁用AI按钮
        if (aiTakeoverButton) aiTakeoverButton.disabled = true;  // 理牌确认后禁用AI按钮
    });

    compareButton.addEventListener('click', async () => {
        console.log("--- 比牌按钮点击 ---");
        safeDisplayMessage("提交比牌中...",false); 
        if (compareButton) compareButton.disabled = true;

        // 确保中道牌是最新的，特别是如果AI托管过
        if (isAiTakeoverActive) {
            // AI托管时，playerOrganizedHand.middle 应该是最终的中道
        } else {
             // 如果不是AI托管，或者AI参考后玩家又调整了，从DOM获取
            playerOrganizedHand.middle = Array.from(initialAndMiddleHandElement.children).map(d => d.cardData).filter(Boolean);
        }
       
        if(playerOrganizedHand.top.length!==3 || playerOrganizedHand.middle.length!==5 || playerOrganizedHand.bottom.length!==5){
            safeDisplayMessage("错误:提交的牌不完整。",true);
            // dealButton.disabled=false; // 允许重新开始
            // compareButton.style.display='none'; // 隐藏比牌按钮
            if (dealButton) dealButton.disabled = false;
            if (compareButton) compareButton.style.display = 'none'; // 隐藏比牌按钮
            if (confirmOrganizationButton && !isAiTakeoverActive) { // 如果不是AI托管，允许重新理牌
                 confirmOrganizationButton.style.display = 'inline-block';
                 confirmOrganizationButton.disabled = false; // 或根据牌是否完整来决定
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
            if(!res.ok) throw new Error(`比牌请求失败: ${res.status} ${await res.text()}`);
            const rst = await res.json(); 
            if(rst.success){ let msg=`服务器: ${rst.message||'完成.'}`; if(rst.daoshui)msg+=" (倒水)"; safeDisplayMessage(msg,rst.daoshui); }
            else safeDisplayMessage(`服务器错误: ${rst.message||'失败.'}`,true);
            if(typeof displayScore==="function"&&typeof rst.score!=="undefined")displayScore(`得分: ${rst.score}`);
        } catch(err){
            console.error("比牌错误:",err); safeDisplayMessage(`错误: ${err.message}`,true);
        } finally { 
            if (dealButton) dealButton.disabled = false; 
            if (compareButton) compareButton.style.display = 'none'; 
            // 比牌后，AI按钮也应禁用，直到下次发牌
            if (aiReferenceButton) aiReferenceButton.disabled = true;
            if (aiTakeoverButton) aiTakeoverButton.disabled = true;
        }
    });

    // AI 参考按钮
    if (aiReferenceButton) {
        aiReferenceButton.addEventListener('click', () => {
            console.log("--- AI 参考按钮点击 ---");
            if (isAiTakeoverActive) {
                safeDisplayMessage("AI已托管，无需参考。", false);
                return;
            }
            if (playerFullHandSource.length !== 13) {
                safeDisplayMessage("请先发牌。", true);
                return;
            }
            safeDisplayMessage("AI正在思考最佳牌型...", false);

            if (typeof getAIReferenceOrganization === 'function') {
                // AI参考逻辑：获取当前所有牌（包括已放在头尾道的）
                const currentCardsInTop = playerOrganizedHand.top;
                const currentCardsInBottom = playerOrganizedHand.bottom;
                const currentCardsInMiddleArea = Array.from(initialAndMiddleHandElement.children)
                                                 .map(div => div.cardData).filter(Boolean);
                const allCurrentPlayerCards = [...currentCardsInTop, ...currentCardsInMiddleArea, ...currentCardsInBottom];

                // 确保牌是13张且没有重复（简单检查）
                if (new Set(allCurrentPlayerCards.map(c => c.id)).size !== 13) {
                     console.warn("AI参考：牌不齐或有重复，使用初始手牌 playerFullHandSource");
                     const aiSuggestion = getAIReferenceOrganization([...playerFullHandSource]); // 使用副本
                     if (aiSuggestion) {
                        safeDisplayMessage(`AI建议: 头(${evaluateHand(aiSuggestion.top).message}), 中(${evaluateHand(aiSuggestion.middle).message}), 尾(${evaluateHand(aiSuggestion.bottom).message})。请自行摆放。`, false);
                        // 这里不直接摆放，只是提示
                     } else {
                        safeDisplayMessage("AI无法提供参考建议。", true);
                     }
                } else {
                    const aiSuggestion = getAIReferenceOrganization([...allCurrentPlayerCards]); // 使用副本
                    if (aiSuggestion) {
                        safeDisplayMessage(`AI建议: 头(${evaluateHand(aiSuggestion.top).message}), 中(${evaluateHand(aiSuggestion.middle).message}), 尾(${evaluateHand(aiSuggestion.bottom).message})。请自行摆放。`, false);
                    } else {
                        safeDisplayMessage("AI无法提供参考建议。", true);
                    }
                }
            } else {
                safeDisplayMessage("AI参考功能暂未实现。", true);
            }
        });
    }

    // AI 托管按钮
    if (aiTakeoverButton) {
        aiTakeoverButton.addEventListener('click', () => {
            console.log("--- AI 托管按钮点击 ---");
            if (playerFullHandSource.length !== 13 && !isAiTakeoverActive) { // 如果不是取消托管，则需要有牌
                safeDisplayMessage("请先发牌。", true);
                return;
            }

            isAiTakeoverActive = !isAiTakeoverActive; // 切换托管状态

            if (isAiTakeoverActive) {
                aiTakeoverButton.textContent = "取消托管";
                safeDisplayMessage("AI已托管。", false);
                enableDragAndDrop(false); // 禁用拖拽
                confirmOrganizationButton.disabled = true; // AI托管时禁用手动确认

                if (typeof getAITakeoverOrganization === 'function') {
                    // AI托管逻辑：获取当前所有牌，AI进行理牌并直接应用到界面
                    const currentCardsInTop = playerOrganizedHand.top;
                    const currentCardsInBottom = playerOrganizedHand.bottom;
                    const currentCardsInMiddleArea = Array.from(initialAndMiddleHandElement.children)
                                                     .map(div => div.cardData).filter(Boolean);
                    const allCurrentPlayerCards = [...currentCardsInTop, ...currentCardsInMiddleArea, ...currentCardsInBottom];
                    
                    let handToOrganize;
                    if (new Set(allCurrentPlayerCards.map(c=>c.id)).size === 13) {
                        handToOrganize = [...allCurrentPlayerCards];
                    } else {
                        console.warn("AI托管：当前牌区牌不完整，将使用初始手牌 playerFullHandSource");
                        handToOrganize = [...playerFullHandSource]; // 使用副本
                    }

                    const aiOrganizedHand = getAITakeoverOrganization(handToOrganize);
                    if (aiOrganizedHand) {
                        renderOrganizedHandToDOM(aiOrganizedHand); // AI结果渲染到DOM并更新模型
                        safeDisplayMessage("AI已完成理牌。", false);
                        // AI托管后，应该可以直接比牌或让AI自动比牌
                        if (compareButton) {
                            compareButton.disabled = false; // 允许比牌
                            // 可以考虑让AI自动点击比牌
                            // setTimeout(() => {
                            //     if (isAiTakeoverActive && !compareButton.disabled) compareButton.click();
                            // }, 1000);
                        }
                    } else {
                        safeDisplayMessage("AI无法完成理牌。", true);
                        isAiTakeoverActive = false; // 失败则取消托管
                        aiTakeoverButton.textContent = "AI托管";
                        enableDragAndDrop(true);
                    }
                } else {
                    safeDisplayMessage("AI托管功能暂未实现。", true);
                    isAiTakeoverActive = false; // 功能未实现则取消托管
                    aiTakeoverButton.textContent = "AI托管";
                    enableDragAndDrop(true);
                }
            } else {
                aiTakeoverButton.textContent = "AI托管";
                safeDisplayMessage("AI托管已取消，您可以手动理牌。", false);
                enableDragAndDrop(true); // 启用拖拽
                // 玩家取消托管后，可能需要重新整理牌区以反映模型和DOM的一致性
                // 例如，将 playerOrganizedHand 中的牌放回 initialAndMiddleHandElement
                // 但更简单的做法是让玩家自己重新拖动，或者在取消时重置牌到初始区
                // 为了简化，我们暂时让玩家自己调整或重新发牌
                // 或者，我们可以把 playerOrganizedHand 的牌重新渲染到 player-hand 区域
                initialAndMiddleHandElement.innerHTML = ''; // 清空
                const cardsToReturnToMiddle = [...playerOrganizedHand.top, ...playerOrganizedHand.middle, ...playerOrganizedHand.bottom];
                // 简单地把所有牌放回中间让玩家重新整理
                if (cardsToReturnToMiddle.length === 13) {
                    playerOrganizedHand = {top:[], middle:[], bottom:[]}; // 清空模型中的道
                    topRowElement.innerHTML = '';
                    bottomRowElement.innerHTML = '';
                    sortCardsByRank(cardsToReturnToMiddle).forEach(card => {
                        initialAndMiddleHandElement.appendChild(renderCard(card,true));
                    });
                } else { // 如果牌不齐，可能还是用 playerFullHandSource
                    initialAndMiddleHandElement.innerHTML = '';
                     sortCardsByRank(playerFullHandSource).forEach(card => {
                        initialAndMiddleHandElement.appendChild(renderCard(card,true));
                    });
                }
                displayCurrentArrangementState();
                checkAllCardsOrganized();
            }
        });
    }

    function enableDragAndDrop(enable) {
        for (const key in sortableInstances) {
            if (sortableInstances[key]) {
                sortableInstances[key].option('disabled', !enable);
            }
        }
        const cardElements = document.querySelectorAll('.card-css');
        cardElements.forEach(cardEl => {
            cardEl.style.cursor = enable ? 'grab' : 'not-allowed';
        });
    }


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

    initializeGame();
    initializeSortable();
});
