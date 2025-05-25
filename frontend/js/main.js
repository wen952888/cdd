// frontend/js/main.js
document.addEventListener('DOMContentLoaded', async () => {
    // 确保 UI 元素从 ui.js 初始化
    if (typeof initializeUiElements === "function") {
        initializeUiElements();
    } else {
        console.error("CRITICAL: initializeUiElements function from ui.js is not defined! UI will not work correctly.");
        alert("关键错误：UI初始化失败。请刷新页面。(错误: UI_INIT_MISSING)");
        return;
    }

    // --- 自动测试后端通讯 ---
    const API_BASE_URL = 'https://wenge.cloudns.ch/backend/';
    
    const safeDisplayMessage = (msg, isErr = false) => {
        if (typeof displayMessage === "function") displayMessage(msg, isErr);
        else isErr ? console.error(msg) : console.log(msg);
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
                if (isAiTakeoverActive) return false;
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

    function displayCurrentArrangementState(isAIOrganizing = false) {
        const topC = playerOrganizedHand.top, botC = playerOrganizedHand.bottom;
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
                                          0 : midCSource.length;
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
        } else [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el => el && el.classList.remove('daoshui-warning'));
    }

    function checkAllCardsOrganized(silent = false) {
        const midCSource = Array.from(initialAndMiddleHandElement.children).map(div => div.cardData).filter(Boolean);
        const midHandToCheck = isAiTakeoverActive ? playerOrganizedHand.middle : midCSource;
        const topOK = playerOrganizedHand.top.length === 3;
        const botOK = playerOrganizedHand.bottom.length === 5;
        const midOK = midHandToCheck.length === 5;
        const allSet = topOK && botOK && midOK;

        if (confirmOrganizationButton) {
            confirmOrganizationButton.disabled = !allSet || isAiTakeoverActive || aiTakeoverRoundsLeft > 0;
        }
        if(allSet && !silent && !isAiTakeoverActive) safeDisplayMessage("牌型已分配，请确认。", false);
        return allSet;
    }
    
    function renderHandToDOM(organizedHand, targetPlayerOrganizedHandModel = true) {
        if (!organizedHand || typeof renderCard !== 'function') {
            console.error("renderHandToDOM: 无效的参数");
            return;
        }
        if (!topRowElement || !initialAndMiddleHandElement || !bottomRowElement) {
            console.error("renderHandToDOM: 一个或多个牌区元素未找到!");
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
        displayCurrentArrangementState(false);
        checkAllCardsOrganized();
    }
    

    function initializeGame() {
        playerFullHandSource = [];
        playerOrganizedHand = {top:[], middle:[], bottom:[]};
        enableDragAndDrop(true); 

        [topRowElement, initialAndMiddleHandElement, bottomRowElement].forEach(el => {
            if (el) {
                el.innerHTML = '';
                el.classList.remove('daoshui-warning', 'is-middle-row-style');
            }
        });
        if(initialAndMiddleHandElement) initialAndMiddleHandElement.innerHTML='<p>点击 "发牌" 开始</p>';
        
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
            compareButton.disabled = true;
        }
        if (aiReferenceButton) aiReferenceButton.disabled = true;
        if (aiTakeoverButton) {
            aiTakeoverButton.disabled = true;
            if (aiTakeoverRoundsLeft === 0) { // 只有当托管完全结束时才重置状态
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
            // initializeGame(); // 不在这里调用，避免清空托管局数信息
             if (aiTakeoverButton) aiTakeoverButton.textContent = "AI托管"; // 确保按钮文字正确
        }
        // 在发牌开始时先进行必要的UI重置，而不是依赖initializeGame的全部重置
        playerFullHandSource = [];
        playerOrganizedHand = {top:[], middle:[], bottom:[]};
        enableDragAndDrop(!isAiTakeoverActive); // AI托管则禁用拖拽

        [topRowElement, initialAndMiddleHandElement, bottomRowElement].forEach(el => {
            if (el) {
                el.innerHTML = '';
                el.classList.remove('daoshui-warning', 'is-middle-row-style');
            }
        });
         if(initialAndMiddleHandElement) initialAndMiddleHandElement.innerHTML='<p>发牌中...</p>';
        [topEvalTextElement,middleEvalTextElement,bottomEvalTextElement].forEach(el => el && (el.textContent=''));


        if (dealButton) dealButton.disabled = true;
        if (aiReferenceButton) aiReferenceButton.disabled = true; // 发牌过程中禁用
        if (aiTakeoverButton && !isAiTakeoverActive) aiTakeoverButton.disabled = true; // 发牌过程中禁用
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
                    id: (cardFromServer.rank || 'X') + (cardFromServer.suitKey || 'Y') + Math.random().toString(36).substring(2, 9) // 确保唯一ID
                };
            }).filter(card => card.rank && card.suitKey);

            if (typeof sortCardsByRank === "function") {
                playerFullHandSource = sortCardsByRank(playerFullHandSource); 
            }

            initialAndMiddleHandElement.innerHTML='';
            playerFullHandSource.forEach(card => {
                if (card && typeof renderCard === "function") initialAndMiddleHandElement.appendChild(renderCard(card, true));
            });
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
                            compareButton.disabled = false; // AI摆好后启用比牌
                            setTimeout(() => {
                                if (isAiTakeoverActive && !compareButton.disabled) compareButton.click();
                            }, 1500); 
                        }
                    } else {
                        safeDisplayMessage("AI理牌失败，请手动操作或取消托管。", true);
                        // AI失败不应自动取消托管，给用户选择
                        // isAiTakeoverActive = false; aiTakeoverRoundsLeft = 0;
                        // if (aiTakeoverButton) aiTakeoverButton.textContent = "AI托管";
                        enableDragAndDrop(true); // 允许手动
                    }
                }
            } else {
                safeDisplayMessage("请理牌。", false);
                if (confirmOrganizationButton) {
                    confirmOrganizationButton.style.display = 'inline-block';
                    confirmOrganizationButton.disabled = false; // 手动模式下，理牌按钮初始可用
                }
                if (aiReferenceButton) aiReferenceButton.disabled = false;
                if (aiTakeoverButton) aiTakeoverButton.disabled = false;
            }

        } catch(err) {
            console.error("发牌错误:", err); safeDisplayMessage(`错误: ${err.message}`,true);
            if (dealButton) dealButton.disabled = false; 
            if (confirmOrganizationButton) confirmOrganizationButton.style.display = 'none';
            isAiTakeoverActive = false; aiTakeoverRoundsLeft = 0;
            if (aiTakeoverButton) aiTakeoverButton.textContent = "AI托管";
            enableDragAndDrop(true);
        }
    });

    confirmOrganizationButton.addEventListener('click', () => {
        if (isAiTakeoverActive) return;
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
            spanEvalEval.textContent=` (${mE.message||'未知'})`; // 修正变量名 spanEvalEval -> spanEvalElement
            initialAndMiddleHandElement.classList.add('is-middle-row-style');
        }

        if(typeof checkDaoshui==="function" && checkDaoshui(tE,mE,bE)){
            safeDisplayMessage("警告: 倒水！",true);
            [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el=>el&&el.classList.add('daoshui-warning'));
        } else {
            safeDisplayMessage("理牌完成，可比牌。",false);
            [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el=>el&&el.classList.remove('daoshui-warning'));
        }
        if (confirmOrganizationButton) confirmOrganizationButton.style.display = 'none'; 
        if (compareButton) {
            compareButton.style.display = 'inline-block';
            compareButton.disabled = false;
        }
        if (aiReferenceButton) aiReferenceButton.disabled = true;
        if (aiTakeoverButton) aiTakeoverButton.disabled = true;
    });

    compareButton.addEventListener('click', async () => {
        console.log("--- 比牌按钮点击 ---");
        safeDisplayMessage("提交比牌中...",false); 
        if (compareButton) compareButton.disabled = true;

        if (!isAiTakeoverActive) {
            playerOrganizedHand.middle = Array.from(initialAndMiddleHandElement.children).map(d => d.cardData).filter(Boolean);
        }
       
        if(playerOrganizedHand.top.length!==3 || playerOrganizedHand.middle.length!==5 || playerOrganizedHand.bottom.length!==5){
            safeDisplayMessage("错误:提交的牌不完整。",true);
            if (dealButton) dealButton.disabled = false;
            if (compareButton) compareButton.style.display = 'none';
            if (confirmOrganizationButton && !isAiTakeoverActive) {
                 confirmOrganizationButton.style.display = 'inline-block';
                 confirmOrganizationButton.disabled = !(playerFullHandSource.length === 13); 
            }
            return;
        }

        const pL={
            top:playerOrganizedHand.top.map(c=>({rank:c.rank,suitKey:c.suitKey})), 
            middle:playerOrganizedHand.middle.map(c=>({rank:c.rank,suitKey:c.suitKey})), 
            bottom:playerOrganizedHand.bottom.map(c=>({rank:c.rank,suitKey:c.suitKey}))
        };
        
        try { // 这个 try 块是必须的
            const res = await fetch(`${API_BASE_URL}submit_hand.php`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pL)});
            if(!res.ok) {
                 const errorText = await res.text(); // 获取错误文本以获得更多信息
                 throw new Error(`比牌请求失败: ${res.status} ${errorText}`);
            }
            const rst = await res.json(); 
            if(rst.success){ let msg=`服务器: ${rst.message||'完成.'}`; if(rst.daoshui)msg+=" (倒水)"; safeDisplayMessage(msg,rst.daoshui); }
            else safeDisplayMessage(`服务器错误: ${rst.message||'失败.'}`,true);
            if(typeof displayScore==="function"&&typeof rst.score!=="undefined")displayScore(`得分: ${rst.score}`);
        
        } catch(err){ // 这个 catch 块也是必须的
            console.error("比牌错误:",err); safeDisplayMessage(`错误: ${err.message}`,true);
        
        } finally { // finally 块是可选的，但如果使用，其前面的 try 或 catch 必须完整
            if (dealButton) dealButton.disabled = false; 
            if (compareButton) compareButton.style.display = 'none'; 
            
            if (aiTakeoverRoundsLeft > 0) {
                safeDisplayMessage(`AI托管：准备开始下一局 (剩余${aiTakeoverRoundsLeft}局)...`, false);
                setTimeout(() => { if(dealButton) dealButton.click(); }, 2000);
            } else {
                isAiTakeoverActive = false;
                if (aiTakeoverButton) {
                    aiTakeoverButton.textContent = "AI托管";
                    aiTakeoverButton.disabled = true;
                }
                if (aiReferenceButton) aiReferenceButton.disabled = true;
                // 游戏结束后，如果不是AI托管局数未完，则调用initializeGame重置大部分UI
                if (aiTakeoverRoundsLeft <= 0) {
                    initializeGame(); // 重置游戏状态以便开始全新的一局
                }
            }
        }
    });


    if (aiReferenceButton) {
        aiReferenceButton.addEventListener('click', () => {
            console.log("--- AI 参考按钮点击 ---");
            if (isAiTakeoverActive) { safeDisplayMessage("AI已托管，无需参考。", false); return; }
            if (playerFullHandSource.length !== 13) { safeDisplayMessage("请先发牌。", true); return; }
            
            if (typeof generateAIReferenceSuggestions !== 'function' || typeof getNextAIReference !== 'function') {
                safeDisplayMessage("AI参考功能组件缺失。", true); return;
            }
            
            if (typeof aiReferenceSuggestions === 'undefined' || aiReferenceSuggestions.length === 0) { // 检查 aiReferenceSuggestions 是否已定义
                 safeDisplayMessage("AI正在生成多种参考牌型...", false);
                 generateAIReferenceSuggestions([...playerFullHandSource], 3);
                 if (typeof aiReferenceSuggestions === 'undefined' || aiReferenceSuggestions.length === 0) {
                     safeDisplayMessage("AI未能生成参考建议。", true); return;
                 }
            }

            const suggestion = getNextAIReference();
            if (suggestion) {
                renderHandToDOM(suggestion, false);
                const topMsg = evaluateHand(suggestion.top).message;
                const midMsg = evaluateHand(suggestion.middle).message;
                const botMsg = evaluateHand(suggestion.bottom).message;
                const currentDisplayIndex = typeof currentSuggestionIndex !== 'undefined' ? currentSuggestionIndex : aiReferenceSuggestions.length;
                safeDisplayMessage(`AI参考 #${currentDisplayIndex}: 头(${topMsg}), 中(${midMsg}), 尾(${botMsg})。再次点击查看其他。`, false);
            } else {
                safeDisplayMessage("没有更多AI参考建议了或无法生成。", true);
                if (typeof aiReferenceSuggestions !== 'undefined') aiReferenceSuggestions = []; // 确保 aiReferenceSuggestions 已定义
            }
        });
    }

    if (aiTakeoverButton) {
        aiTakeoverButton.addEventListener('click', () => {
            console.log("--- AI 托管按钮点击 ---");
            if (isAiTakeoverActive) {
                isAiTakeoverActive = false;
                aiTakeoverRoundsLeft = 0;
                aiTakeoverButton.textContent = "AI托管";
                enableDragAndDrop(true);
                safeDisplayMessage("AI托管已取消。", false);
                if(confirmOrganizationButton) confirmOrganizationButton.disabled = !(playerFullHandSource.length === 13 && !checkAllCardsOrganized(true)); // 根据牌是否已完整摆放
                return;
            }

            if (playerFullHandSource.length !== 13) { safeDisplayMessage("请先发牌。", true); return; }
            if (aiTakeoverModal) aiTakeoverModal.style.display = 'block';
        });
    }

    if (aiTakeoverModal) {
        aiTakeoverModal.addEventListener('click', (event) => {
            const targetButton = event.target.closest('button'); // 确保点击的是按钮或按钮内部元素
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
                            // isAiTakeoverActive = false; aiTakeoverRoundsLeft = 0; // 不自动取消
                            // if(aiTakeoverButton) aiTakeoverButton.textContent = "AI托管";
                            enableDragAndDrop(true); // 允许手动
                        }
                    } else { safeDisplayMessage("AI托管核心功能未实现。", true); enableDragAndDrop(true);}
                } else {
                    safeDisplayMessage("AI托管已取消选择。", false);
                }
            }
        });
    }
    
    function enableDragAndDrop(enable) {
        for (const key in sortableInstances) {
            if (sortableInstances[key] && typeof sortableInstances[key].option === 'function') { // 增加检查
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
    } else { console.error("Lobby button element NOT found!"); }

    if (pointsButton) {
        pointsButton.addEventListener('click', () => { safeDisplayMessage("积分查看功能暂未实现。", false); });
    } else { console.error("Points button element NOT found!"); }

    initializeGame();
    initializeSortable();
});
