// frontend/js/main.js
document.addEventListener('DOMContentLoaded', async () => {
    // ... (顶部的 UI 初始化和自动后端测试不变) ...

    // DOM Elements
    const dealButton = document.getElementById('deal-button');
    const confirmOrganizationButton = document.getElementById('confirm-organization-button');
    const compareButton = document.getElementById('compare-button');
    const lobbyButton = document.getElementById('lobby-button');
    const pointsButton = document.getElementById('points-button');
    const aiReferenceButton = document.getElementById('ai-reference-button');
    const aiTakeoverButton = document.getElementById('ai-takeover-button');
    const aiTakeoverModal = document.getElementById('ai-takeover-modal'); // 新增

    const initialAndMiddleHandElement = document.getElementById('player-hand');
    const topRowElement = document.getElementById('player-top-row');
    const bottomRowElement = document.getElementById('player-bottom-row');
    // ... (其他元素引用不变) ...

    const API_BASE_URL = 'https://wenge.cloudns.ch/backend/';
    let playerFullHandSource = [];
    let playerOrganizedHand = { top: [], middle: [], bottom: [] }; // 这是玩家/AI实际摆放的模型
    let sortableInstances = {};
    // ... (sortable 初始化相关变量不变) ...

    let isAiTakeoverActive = false;
    let aiTakeoverRoundsLeft = 0; // AI剩余托管局数

    // Helper safeDisplayMessage (如果还没移到顶部，确保它在这里)
    // const safeDisplayMessage = (msg, isErr = false) => { ... };


    // --- SortableJS 初始化 ---
    // ... (initializeSortable 函数不变, 但 onMove 要检查 isAiTakeoverActive) ...
    // 在 onMove 中: if (isAiTakeoverActive || (isAiReferencing && !allowDragDuringReference) ) return false;

    // --- DOM 与 模型同步 ---
    // ... (updateHandModelFromDOM 函数不变) ...

    // --- UI更新函数 ---
    // ... (displayCurrentArrangementState, checkDaoshuiForUI, checkAllCardsOrganized 基本不变)
    // checkAllCardsOrganized 需要考虑 aiTakeoverRoundsLeft > 0 时禁用手动确认

    function renderHandToDOM(organizedHand, targetPlayerOrganizedHandModel = true) {
        if (!organizedHand || typeof renderCard !== 'function') {
            console.error("renderHandToDOM: 无效的参数");
            return;
        }
    
        topRowElement.innerHTML = '';
        organizedHand.top.forEach(card => topRowElement.appendChild(renderCard(card, true)));
    
        initialAndMiddleHandElement.innerHTML = ''; // 清空中墩/初始区
        organizedHand.middle.forEach(card => initialAndMiddleHandElement.appendChild(renderCard(card, true)));
    
        bottomRowElement.innerHTML = '';
        organizedHand.bottom.forEach(card => bottomRowElement.appendChild(renderCard(card, true)));
    
        if (targetPlayerOrganizedHandModel) {
            playerOrganizedHand.top = [...organizedHand.top];
            playerOrganizedHand.middle = [...organizedHand.middle];
            playerOrganizedHand.bottom = [...organizedHand.bottom];
        }
    
        displayCurrentArrangementState(false); // AI参考摆放后，中道牌在DOM里
        checkAllCardsOrganized();
    }
    

    function initializeGame() {
        playerFullHandSource = [];
        playerOrganizedHand = {top:[], middle:[], bottom:[]};
        
        // AI托管局数不在此处重置，除非是游戏完全重启或玩家手动取消所有托管
        // isAiTakeoverActive = false; 
        // aiTakeoverRoundsLeft = 0;
        // if (aiTakeoverButton) aiTakeoverButton.textContent = "AI托管";

        enableDragAndDrop(true); 

        [topRowElement, initialAndMiddleHandElement, bottomRowElement].forEach(el => {
            if (el) {
                el.innerHTML = '';
                el.classList.remove('daoshui-warning', 'is-middle-row-style');
            }
        });
        if(initialAndMiddleHandElement) initialAndMiddleHandElement.innerHTML='<p>点击 "发牌" 开始</p>';
        
        // ... (其他UI重置不变) ...
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
        // AI按钮初始状态
        if (aiReferenceButton) aiReferenceButton.disabled = true;
        if (aiTakeoverButton) {
            aiTakeoverButton.disabled = true;
            // 如果上一局是托管结束，恢复按钮文字
            if (aiTakeoverRoundsLeft === 0) {
                 isAiTakeoverActive = false;
                 aiTakeoverButton.textContent = "AI托管";
            }
        }
        console.log("游戏已初始化 (部分AI状态保留)。");
    }

    // --- 发牌按钮事件 ---
    dealButton.addEventListener('click', async () => {
        console.log("--- 发牌按钮点击 ---");
        // initializeGame 会重置大部分状态，但保留AI托管局数
        if (aiTakeoverRoundsLeft > 0) {
            aiTakeoverRoundsLeft--;
            isAiTakeoverActive = true; // 继续托管
            safeDisplayMessage(`AI托管剩余 ${aiTakeoverRoundsLeft + 1} 局。发牌中...`, false);
        } else {
            isAiTakeoverActive = false; // 确保非托管状态
            if (aiTakeoverButton) aiTakeoverButton.textContent = "AI托管";
            initializeGame(); // 完全重置（除了AI局数可能不清零，取决于设计）
            safeDisplayMessage("发牌中...", false);
        }

        if (dealButton) dealButton.disabled = true;
        if (aiReferenceButton) aiReferenceButton.disabled = true;
        if (aiTakeoverButton && !isAiTakeoverActive) aiTakeoverButton.disabled = true; // 非托管时禁用


        try {
            // ... (发牌逻辑不变，获取 playerFullHandSource) ...
            const res = await fetch(`${API_BASE_URL}deal_cards.php`);
            if(!res.ok) throw new Error(`发牌失败: ${res.status} ${await res.text()}`);
            const data = await res.json();
            if(!data || !Array.isArray(data.cards) || data.cards.length!==13) throw new Error("牌数据错误。");
            playerFullHandSource = data.cards.map(cardFromServer => ({ /* ... card object ... */ id: Math.random().toString(36).substring(2,9) })).filter(Boolean); // 确保有ID
            playerFullHandSource = data.cards.map(cardFromServer => {
                const suitInfo = (typeof SUITS_DATA !== "undefined" && SUITS_DATA[cardFromServer.suitKey]) || { displayChar: '?', cssClass: 'unknown', fileNamePart: 'unknown' };
                return {
                    rank: cardFromServer.rank, suitKey: cardFromServer.suitKey,
                    displaySuitChar: suitInfo.displayChar, suitCssClass: suitInfo.cssClass,
                    id: (cardFromServer.rank || 'X') + (cardFromServer.suitKey || 'Y') + Math.random().toString(36).substring(2, 7)
                };
            }).filter(card => card.rank && card.suitKey);


            if (typeof sortCardsByRank === "function") {
                playerFullHandSource = sortCardsByRank(playerFullHandSource); 
            }

            initialAndMiddleHandElement.innerHTML='';
            playerFullHandSource.forEach(card => {
                if (card && typeof renderCard === "function") initialAndMiddleHandElement.appendChild(renderCard(card, true));
            });
            // 清空已摆放的牌道模型，因为是新手牌
            playerOrganizedHand = {top:[], middle:[], bottom:[]};
            topRowElement.innerHTML = '';
            bottomRowElement.innerHTML = '';

            displayCurrentArrangementState(); 

            if (isAiTakeoverActive) {
                safeDisplayMessage("AI正在理牌...", false);
                enableDragAndDrop(false);
                if (confirmOrganizationButton) confirmOrganizationButton.disabled = true;
                if (typeof getAITakeoverOrganization === 'function') {
                    const aiBestHand = getAITakeoverOrganization([...playerFullHandSource]);
                    if (aiBestHand) {
                        renderHandToDOM(aiBestHand, true); // AI摆牌并更新playerOrganizedHand
                        safeDisplayMessage("AI已完成理牌。等待比牌...", false);
                        // AI托管时自动比牌
                        if (compareButton) {
                            compareButton.disabled = false;
                            setTimeout(() => { // 延迟一点让玩家看到牌
                                if (isAiTakeoverActive && !compareButton.disabled) compareButton.click();
                            }, 1500); 
                        }
                    } else {
                        safeDisplayMessage("AI理牌失败，请手动操作。", true);
                        isAiTakeoverActive = false; // 发生错误，取消托管
                        aiTakeoverRoundsLeft = 0;
                        if (aiTakeoverButton) aiTakeoverButton.textContent = "AI托管";
                        enableDragAndDrop(true);
                        if (confirmOrganizationButton) confirmOrganizationButton.style.display='inline-block';
                    }
                }
            } else {
                safeDisplayMessage("请理牌。", false);
                if (confirmOrganizationButton) confirmOrganizationButton.style.display = 'inline-block';
                if (aiReferenceButton) aiReferenceButton.disabled = false;
                if (aiTakeoverButton) aiTakeoverButton.disabled = false;
            }

        } catch(err) {
            // ... (错误处理) ...
            console.error("发牌错误:", err); safeDisplayMessage(`错误: ${err.message}`,true);
            if (dealButton) dealButton.disabled = false; 
            if (confirmOrganizationButton) confirmOrganizationButton.style.display = 'none';
            isAiTakeoverActive = false; aiTakeoverRoundsLeft = 0; // 出错则重置AI
            if (aiTakeoverButton) aiTakeoverButton.textContent = "AI托管";
        }
    });

    // --- 确认理牌按钮事件 ---
    confirmOrganizationButton.addEventListener('click', () => {
        if (isAiTakeoverActive) return; // AI托管时此按钮无效
        // ... (基本逻辑不变，但要确保中道牌从DOM获取) ...
        playerOrganizedHand.middle = Array.from(initialAndMiddleHandElement.children).map(d=>d.cardData).filter(Boolean);
        
        // ... (牌数检查、牌型评估、倒水检查) ...
        if(playerOrganizedHand.top.length!==3 || playerOrganizedHand.middle.length!==5 || playerOrganizedHand.bottom.length!==5) { /*...*/ return; }
        const tE=evaluateHand(playerOrganizedHand.top), mE=evaluateHand(playerOrganizedHand.middle), bE=evaluateHand(playerOrganizedHand.bottom);
        // ...
        if(typeof checkDaoshui==="function" && checkDaoshui(tE,mE,bE)){ /*倒水处理*/ } else { /*正常处理*/ }

        if (confirmOrganizationButton) confirmOrganizationButton.style.display = 'none'; 
        if (compareButton) {
            compareButton.style.display = 'inline-block';
            compareButton.disabled = false;
        }
        if (aiReferenceButton) aiReferenceButton.disabled = true;
        if (aiTakeoverButton) aiTakeoverButton.disabled = true;
    });

    // --- 比牌按钮事件 ---
    compareButton.addEventListener('click', async () => {
        // ... (基本逻辑不变，但中道牌的获取需要考虑AI托管) ...
        if (!isAiTakeoverActive) { // 非AI托管时，从中墩DOM获取牌
            playerOrganizedHand.middle = Array.from(initialAndMiddleHandElement.children).map(d=>d.cardData).filter(Boolean);
        } // AI托管时，playerOrganizedHand.middle 应该已经是AI摆好的

        // ... (牌数检查、构建payload、fetch请求、结果处理) ...
        // ...
        finally { 
            if (dealButton) dealButton.disabled = false; 
            if (compareButton) compareButton.style.display = 'none'; 
            
            if (aiTakeoverRoundsLeft > 0) {
                // 如果还在托管期，自动开始下一局
                safeDisplayMessage(`AI托管：准备开始下一局 (剩余${aiTakeoverRoundsLeft}局)...`, false);
                setTimeout(() => dealButton.click(), 2000); // 延迟后自动发牌
            } else {
                isAiTakeoverActive = false; // 托管结束
                if (aiTakeoverButton) {
                    aiTakeoverButton.textContent = "AI托管";
                    aiTakeoverButton.disabled = true; // 比牌后禁用，直到下次发牌
                }
                if (aiReferenceButton) aiReferenceButton.disabled = true; // 比牌后禁用
            }
        }
    });


    // --- AI 参考按钮 ---
    if (aiReferenceButton) {
        aiReferenceButton.addEventListener('click', () => {
            console.log("--- AI 参考按钮点击 ---");
            if (isAiTakeoverActive) { /* ... */ return; }
            if (playerFullHandSource.length !== 13) { /* ... */ return; }
            
            if (typeof generateAIReferenceSuggestions !== 'function' || typeof getNextAIReference !== 'function') {
                safeDisplayMessage("AI参考功能组件缺失。", true); return;
            }
            
            // 如果是第一次点击或建议列表为空，则生成
            if (aiReferenceSuggestions.length === 0) {
                 safeDisplayMessage("AI正在生成多种参考牌型...", false);
                 generateAIReferenceSuggestions([...playerFullHandSource], 3); // 生成3个建议
                 if (aiReferenceSuggestions.length === 0) {
                     safeDisplayMessage("AI未能生成参考建议。", true); return;
                 }
            }

            const suggestion = getNextAIReference();
            if (suggestion) {
                // AI参考直接摆牌到界面，但不更新 playerOrganizedHand 模型
                renderHandToDOM(suggestion, false); // false表示不更新主模型
                const topMsg = evaluateHand(suggestion.top).message;
                const midMsg = evaluateHand(suggestion.middle).message;
                const botMsg = evaluateHand(suggestion.bottom).message;
                safeDisplayMessage(`AI参考 #${currentSuggestionIndex || aiReferenceSuggestions.length}: 头(${topMsg}), 中(${midMsg}), 尾(${botMsg})。再次点击查看其他。`, false);
            } else {
                safeDisplayMessage("没有更多AI参考建议了或无法生成。", true);
                aiReferenceSuggestions = []; // 清空以便下次重新生成
            }
        });
    }

    // --- AI 托管按钮 ---
    if (aiTakeoverButton) {
        aiTakeoverButton.addEventListener('click', () => {
            console.log("--- AI 托管按钮点击 ---");
            if (isAiTakeoverActive) { // 如果当前已托管，则点击是取消
                isAiTakeoverActive = false;
                aiTakeoverRoundsLeft = 0;
                aiTakeoverButton.textContent = "AI托管";
                enableDragAndDrop(true);
                safeDisplayMessage("AI托管已取消。", false);
                // 可选：将牌放回中间让玩家整理
                // ...
                return;
            }

            if (playerFullHandSource.length !== 13) {
                safeDisplayMessage("请先发牌。", true); return;
            }
            aiTakeoverModal.style.display = 'block'; // 显示模态框
        });
    }

    // --- AI 托管模态框事件处理 ---
    if (aiTakeoverModal) {
        aiTakeoverModal.addEventListener('click', (event) => {
            if (event.target.tagName === 'BUTTON') {
                const rounds = parseInt(event.target.dataset.rounds);
                aiTakeoverModal.style.display = 'none'; // 关闭模态框

                if (rounds > 0) {
                    isAiTakeoverActive = true;
                    aiTakeoverRoundsLeft = rounds -1; // 当前局也算，所以-1
                    aiTakeoverButton.textContent = `取消托管 (${rounds}局)`;
                    safeDisplayMessage(`AI已托管 ${rounds} 局。AI正在理牌...`, false);
                    enableDragAndDrop(false);
                    if (confirmOrganizationButton) confirmOrganizationButton.disabled = true;

                    // AI托管立即摆牌
                    if (typeof getAITakeoverOrganization === 'function') {
                        const aiBestHand = getAITakeoverOrganization([...playerFullHandSource]);
                        if (aiBestHand) {
                            renderHandToDOM(aiBestHand, true); // AI摆牌并更新playerOrganizedHand
                            safeDisplayMessage("AI已完成理牌。准备自动比牌...", false);
                             if (compareButton) {
                                compareButton.disabled = false;
                                setTimeout(() => { // 延迟一点让玩家看到牌
                                    if (isAiTakeoverActive && !compareButton.disabled) compareButton.click();
                                }, 1500); 
                            }
                        } else {
                            safeDisplayMessage("AI理牌失败，请手动操作。", true);
                            isAiTakeoverActive = false; aiTakeoverRoundsLeft = 0;
                            aiTakeoverButton.textContent = "AI托管";
                            enableDragAndDrop(true);
                        }
                    } else { /* ... 功能未实现处理 ... */ }
                } else {
                    safeDisplayMessage("AI托管已取消选择。", false);
                }
            }
        });
    }
    
    function enableDragAndDrop(enable) {
        // ... (函数内容不变) ...
    }

    // ... (Lobby, Points按钮事件不变) ...

    initializeGame();
    initializeSortable();
});
