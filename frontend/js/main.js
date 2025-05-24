// frontend/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Views
    const mainMenuVw = document.getElementById('main-menu-view');
    const roomVw = document.getElementById('room-view');
    const gameVw = document.getElementById('game-view');

    // Auth Elements & Game Options in Main Menu
    const authTitle = document.getElementById('auth-title');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-btn');
    const registerUsernameInput = document.getElementById('register-username');
    const registerPasswordInput = document.getElementById('register-password');
    const registerConfirmPasswordInput = document.getElementById('register-confirm-password');
    const registerBtn = document.getElementById('register-btn');
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');
    const menuMessageArea = document.getElementById('menu-message-area');
    const gameOptionsDiv = document.getElementById('game-options');
    const welcomeMessageElement = document.getElementById('welcome-message');
    const roomTypeButtons = document.querySelectorAll('.room-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // Room View Elements
    const roomTitleElement = document.getElementById('room-title');
    const currentRoomIdDisplayElement = document.getElementById('current-room-id-display');
    const roomTypeDisplayElement = document.getElementById('room-type-display');
    const roomBaseScoreDisplayElement = document.getElementById('room-base-score-display');
    const playerListUl = document.getElementById('player-list');
    const startGameFromRoomBtn = document.getElementById('start-game-from-room-btn');
    const leaveRoomBtn = document.getElementById('leave-room-btn');
    const roomMessageArea = document.getElementById('room-message-area');

    // Game View Elements
    const dealButton = document.getElementById('deal-button');
    // const sortHandButton = document.getElementById('sort-hand-button'); // Removed, auto-sort on deal
    const aiReferenceButton = document.getElementById('ai-reference-button');
    const aiAutoplayButton = document.getElementById('ai-autoplay-button');
    const confirmOrganizationButton = document.getElementById('confirm-organization-button');
    const compareButton = document.getElementById('compare-button');
    const callBackendButton = document.getElementById('call-backend-button');
    const backToRoomBtn = document.getElementById('back-to-room-btn');
    const initialAndMiddleHandElement = document.getElementById('player-hand');
    const topRowElement = document.getElementById('player-top-row');
    const bottomRowElement = document.getElementById('player-bottom-row');
    const middleHandHeader = document.getElementById('middle-hand-header');
    const topEvalTextElement = document.getElementById('top-eval-text');
    // middleEvalTextElement is the span inside middleHandHeader
    const bottomEvalTextElement = document.getElementById('bottom-eval-text');
    const aiReferenceDisplayElement = document.getElementById('ai-reference-display');
    const aiTopRefElement = document.getElementById('ai-top-ref');
    const aiMiddleRefElement = document.getElementById('ai-middle-ref');
    const aiBottomRefElement = document.getElementById('ai-bottom-ref');
    const gameRoomInfoElement = document.getElementById('game-room-info');
    const gameUserInfoElement = document.getElementById('game-user-info');
    const scoreArea = document.getElementById('score-area');
    const aiRoundSelectorDiv = document.getElementById('ai-round-selector');

    const API_BASE_URL = 'https://wenge.cloudns.ch/backend/';
    let playerFullHandSource = [];
    let aiPlayers = []; // Stores AI player data if needed for display or logic
    let playerOrganizedHand = { top: [], middle: [], bottom: [] };
    let currentView = mainMenuVw;
    let currentRoomId = null;
    let currentRoomType = null;
    let currentRoomBaseScore = 0;
    let loggedInUser = null;
    let currentUserTotalScore = 0;
    let sortableInstances = {};
    const MAX_SORTABLE_INIT_ATTEMPTS = 10, SORTABLE_INIT_DELAY = 200;
    let sortableInitializationAttempts = 0;
    let isAIAutoplaying = false, aiAutoplayRoundsLeft = 0;
    const AI_AUTOPLAY_DELAY_MS = 1200;
    const USER_STORAGE_KEY = 'thirteenWaterLoggedInUser';

    const safeDisplayMessage = (area, msg, isErr = false) => { if(area){area.textContent=msg; area.className='message-area'; if(isErr)area.classList.add('error'); else if(msg.toLowerCase().includes("成功")||msg.toLowerCase().includes("完成")||msg.toLowerCase().includes("欢迎")) area.classList.add('info');} else console.warn("Message area not found for:", msg);};
    const safeDisplayMenuMessage = (msg,isErr=false)=>safeDisplayMessage(menuMessageArea,msg,isErr);
    const safeDisplayRoomMessage = (msg,isErr=false)=>safeDisplayMessage(roomMessageArea,msg,isErr);
    const safeDisplayGameMessage = (msg,isErr=false)=>safeDisplayMessage(document.getElementById('message-area'),msg,isErr);
    const safeDisplayScore = (gameScoreText, totalScoreVal) => { if(scoreArea){let txt=gameScoreText||"";if(typeof totalScoreVal!=='undefined')txt=`总积分: ${totalScoreVal}`+(gameScoreText?` (${gameScoreText})`:"");scoreArea.textContent=txt;}else console.warn("Score area element not found.");};

    function switchView(viewToShow) {
        console.log("Attempting to switch view to:", viewToShow ? viewToShow.id : "null");
        [mainMenuVw, roomVw, gameVw].forEach(v => v && v.classList.remove('active-view'));
        if (viewToShow) {
            viewToShow.classList.add('active-view');
            currentView = viewToShow;
        } else {
            console.error("switchView: viewToShow is null or undefined, defaulting to main menu.");
            if(mainMenuVw) mainMenuVw.classList.add('active-view'); // Fallback
            currentView = mainMenuVw;
        }
    }

    function showAuthForm(formToShow) {
        if(loginForm)loginForm.classList.remove('active-auth-form');
        if(registerForm)registerForm.classList.remove('active-auth-form');
        if(gameOptionsDiv)gameOptionsDiv.style.display='none';
        if(formToShow)formToShow.classList.add('active-auth-form');
        if(authTitle)authTitle.textContent=formToShow===loginForm?"用户登录":"用户注册";
        safeDisplayMenuMessage('');
    }

    function showGameOptionsUI() {
        if(loginForm)loginForm.classList.remove('active-auth-form');
        if(registerForm)registerForm.classList.remove('active-auth-form');
        if(gameOptionsDiv)gameOptionsDiv.style.display='block';
        if(authTitle)authTitle.textContent="游戏大厅";
        if(welcomeMessageElement && loggedInUser)welcomeMessageElement.textContent=`欢迎, ${loggedInUser}!`;
        else if(welcomeMessageElement)welcomeMessageElement.textContent="游戏大厅";
        safeDisplayMenuMessage('');
    }

    function initializeSortable() {
        if (typeof Sortable === 'undefined') {
            sortableInitializationAttempts++;
            if (sortableInitializationAttempts < MAX_SORTABLE_INIT_ATTEMPTS) setTimeout(initializeSortable, SORTABLE_INIT_DELAY);
            else { console.error("SortableJS failed!"); safeDisplayGameMessage("错误：拖拽功能加载失败。", true); } return;
        }
        const opts = { group: 'thirteen-water-cards-group', animation: 150, ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', dragClass: 'sortable-drag',
            onEnd: (evt) => { updateHandModelFromDOM(evt.from, evt.from.dataset.rowName); if (evt.to !== evt.from) updateHandModelFromDOM(evt.to, evt.to.dataset.rowName); displayCurrentArrangementState(); checkAllCardsOrganized(); },
            onMove: (evt) => { const to = evt.to, lim = parseInt(to.dataset.rowLimit); return !(lim && to !== evt.from && to.children.length >= lim); },
            onAdd: (evt) => { const to = evt.to, from = evt.from, lim = parseInt(to.dataset.rowLimit); if (lim && to.children.length > lim) { Sortable.utils.select(evt.item).remove(); from.appendChild(evt.item); safeDisplayGameMessage(`${to.dataset.rowName === 'top' ? '头' : '尾'}道已满!`, true); updateHandModelFromDOM(from, from.dataset.rowName); if (to !== from) updateHandModelFromDOM(to, to.dataset.rowName); displayCurrentArrangementState(); }}
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
        const evalF = typeof evaluateHand === "function" ? evaluateHand : () => ({message: "评价逻辑缺失"});
        if(topEvalTextElement) topEvalTextElement.textContent = topC.length > 0 ? ` (${(topC.length===3 ? evalF(topC).message : '...') || '...'})` : '';
        if(bottomEvalTextElement) bottomEvalTextElement.textContent = botC.length > 0 ? ` (${(botC.length===5 ? evalF(botC).message : '...') || '...'})` : '';
        if (middleHandHeader) {
            const spanEvalElement = document.getElementById('middle-eval-text');
            if (spanEvalElement) {
                if (midReady) { middleHandHeader.childNodes[0].nodeValue = `中道 (5张): `; spanEvalElement.textContent = ` (${evalF(midCSource).message || '...'})`; initialAndMiddleHandElement.classList.add('is-middle-row-style'); }
                else { middleHandHeader.childNodes[0].nodeValue = `我的手牌 / 中道 (剩余牌): `; spanEvalElement.textContent = midCSource.length > 0 ? ` (共${midCSource.length}张)` : ''; initialAndMiddleHandElement.classList.remove('is-middle-row-style'); }
            }
        }
        if(typeof checkDaoshuiForUI === "function") checkDaoshuiForUI(midCSource); else console.warn("checkDaoshuiForUI is not defined");
    }

    function checkDaoshuiForUI(midC) {
        const topC = playerOrganizedHand.top, botC = playerOrganizedHand.bottom;
        if(typeof evaluateHand !== "function" || typeof checkDaoshui !== "function") { safeDisplayGameMessage("牌型逻辑缺失。", true); return; }
        if (topC.length===3 && botC.length===5 && midC.length===5) {
            const tE=evaluateHand(topC), mE=evaluateHand(midC), bE=evaluateHand(botC);
            const isDS = checkDaoshui(tE,mE,bE);
            [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el => el && (isDS ? el.classList.add('daoshui-warning') : el.classList.remove('daoshui-warning')));
            if(isDS) safeDisplayGameMessage("警告: 检测到倒水！", true);
            else if (confirmOrganizationButton && confirmOrganizationButton.disabled && !checkAllCardsOrganized(true)) safeDisplayGameMessage("请继续理牌...", false);
        } else [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el => el && el.classList.remove('daoshui-warning'));
    }

    function checkAllCardsOrganized(silent = false) {
        if(!initialAndMiddleHandElement || !playerOrganizedHand.top || !playerOrganizedHand.bottom) return false; // Guard against nulls
        const midCount = initialAndMiddleHandElement.children.length;
        const topOK = playerOrganizedHand.top.length === 3, botOK = playerOrganizedHand.bottom.length === 5, midOK = midCount === 5;
        const allSet = topOK && botOK && midOK;
        if(confirmOrganizationButton) confirmOrganizationButton.disabled = !allSet;
        if(allSet && !silent) safeDisplayGameMessage("牌型已分配，请确认。", false);
        return allSet;
    }

    function resetGameTable() {
        playerFullHandSource = []; playerOrganizedHand = {top:[],middle:[],bottom:[]}; aiPlayers = [];
        [topRowElement,bottomRowElement].forEach(el => el && (el.innerHTML = ''));
        if(initialAndMiddleHandElement) initialAndMiddleHandElement.innerHTML='<p>等待发牌...</p>';
        [topEvalTextElement,bottomEvalTextElement].forEach(el => el && (el.textContent=''));
        const h3MidHeader = document.getElementById('middle-hand-header'); const spanMidEval = document.getElementById('middle-eval-text');
        if(h3MidHeader && spanMidEval) { h3MidHeader.childNodes[0].nodeValue = `我的手牌 / 中道 (剩余牌): `; spanMidEval.textContent = ''; }
        [topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el => el && el.classList.remove('daoshui-warning','is-middle-row-style'));
        [aiReferenceButton, aiAutoplayButton, confirmOrganizationButton, compareButton].forEach(btn => btn && (btn.style.display='none'));
        if(confirmOrganizationButton) confirmOrganizationButton.disabled=true;
        if(aiReferenceDisplayElement) aiReferenceDisplayElement.style.display = 'none';
        for(let i=1; i<=3; i++){ const aiTop=document.getElementById(`ai${i}-top-cards`),aiMid=document.getElementById(`ai${i}-middle-cards`),aiBot=document.getElementById(`ai${i}-bottom-cards`),aiEval=document.querySelector(`#ai-player-${i} .ai-hand-eval`); if(aiTop)aiTop.textContent="---"; if(aiMid)aiMid.textContent="-----"; if(aiBot)aiBot.textContent="-----"; if(aiEval)aiEval.textContent="(待摆牌)"; }
    }

    function initializeApp() { if(!attemptAutoLogin()){showAuthForm(loginForm);switchView(mainMenuVw);} initializeSortable(); console.log("Application fully initialized."); }
    function attemptAutoLogin(){const sU=localStorage.getItem(USER_STORAGE_KEY);if(sU){try{const uD=JSON.parse(sU);if(uD?.phone){loggedInUser=uD.phone;currentUserTotalScore=uD.score||0;showGameOptionsUI();switchView(mainMenuVw);safeDisplayScore("欢迎回来！",currentUserTotalScore);return!0;}}catch(e){console.error("Error parsing stored user:",e);localStorage.removeItem(USER_STORAGE_KEY);}}return!1;}
    function resetAppToMainMenu(){loggedInUser=null;currentRoomId=null;currentUserTotalScore=0;currentRoomType=null;currentRoomBaseScore=0;localStorage.removeItem(USER_STORAGE_KEY);if(document.getElementById('room-id-input'))document.getElementById('room-id-input').value='';if(playerListUl)playerListUl.innerHTML='';safeDisplayScore("",undefined);showAuthForm(loginForm);switchView(mainMenuVw);console.log("App reset to main menu.");}
    function initializeGameUI(){resetGameTable();safeDisplayGameMessage("请点击“发牌”开始或等待游戏开始。",!1);if(dealButton){dealButton.style.display='inline-block';dealButton.disabled=!1;dealButton.textContent="发牌";}if(gameRoomInfoElement)gameRoomInfoElement.textContent=`房间: ${currentRoomId||"N/A"} (${currentRoomType==='practice'?'试玩':currentRoomBaseScore+'分'})`;if(gameUserInfoElement)gameUserInfoElement.textContent=`玩家: ${loggedInUser||"访客"}`;safeDisplayScore("",currentUserTotalScore);}

    if(loginBtn)loginBtn.addEventListener('click',async()=>{const u=loginUsernameInput.value.trim(),p=loginPasswordInput.value.trim();if(!u||!p){safeDisplayMenuMessage("手机号和密码不能为空！",!0);return}safeDisplayMenuMessage("登录中...",!1);try{const r=await fetch(`${API_BASE_URL}login_user.php`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})}),d=await r.json();if(r.ok&&d.success){loggedInUser=d.username;currentUserTotalScore=d.score||0;localStorage.setItem(USER_STORAGE_KEY,JSON.stringify({phone:loggedInUser,score:currentUserTotalScore}));safeDisplayMenuMessage("登录成功！",!1);safeDisplayScore("",currentUserTotalScore);showGameOptionsUI();}else safeDisplayMenuMessage(d.message||"登录失败。",!0);}catch(e){console.error("Login error:",e);safeDisplayMenuMessage(`登录错误: ${e.message}`,!0);}});
    if(registerBtn)registerBtn.addEventListener('click',async()=>{const p=registerUsernameInput.value.trim(),s=registerPasswordInput.value.trim(),c=registerConfirmPasswordInput.value.trim();if(!p||!s||!c){safeDisplayMenuMessage("所有字段不能为空！",!0);return}if(s!==c){safeDisplayMenuMessage("两次密码不匹配！",!0);return}if(s.length<6){safeDisplayMenuMessage("密码至少6位！",!0);return}safeDisplayMenuMessage("注册中...",!1);try{const r=await fetch(`${API_BASE_URL}register_user.php`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:p,password:s})}),d=await r.json();if(r.ok&&d.success){loggedInUser=p;currentUserTotalScore=0;localStorage.setItem(USER_STORAGE_KEY,JSON.stringify({phone:loggedInUser,score:currentUserTotalScore}));safeDisplayMenuMessage(d.message||"注册成功！",!1);safeDisplayScore("",currentUserTotalScore);showGameOptionsUI();}else safeDisplayMenuMessage(d.message||"注册失败。",!0);}catch(e){console.error("Reg error:",e);safeDisplayMenuMessage(`注册错误: ${e.message}`,!0);}});
    if(showRegisterLink)showRegisterLink.addEventListener('click',(e)=>{e.preventDefault();showAuthForm(registerForm);});
    if(showLoginLink)showLoginLink.addEventListener('click',(e)=>{e.preventDefault();showAuthForm(loginForm);});
    if(logoutBtn)logoutBtn.addEventListener('click',resetAppToMainMenu);

    console.log("Found roomTypeButtons:", roomTypeButtons ? roomTypeButtons.length : 0);
    if (roomTypeButtons) roomTypeButtons.forEach((button,index)=>{console.log(`Attaching listener to room btn ${index}:`,button.textContent);button.addEventListener('click',()=>{console.log("Room btn clicked:",button.textContent);if(!loggedInUser){safeDisplayMenuMessage("请先登录！",!0);return;}const t=button.dataset.roomType,s=parseInt(button.dataset.baseScore)||0;currentRoomType=t;currentRoomBaseScore=s;currentRoomId=`${t.toUpperCase()}_${s}_`+Math.random().toString(16).slice(2,7).toUpperCase();if(roomTitleElement)roomTitleElement.textContent=`房间: ${currentRoomId}`;if(currentRoomIdDisplayElement)currentRoomIdDisplayElement.textContent=currentRoomId;if(roomTypeDisplayElement)roomTypeDisplayElement.textContent=t==='practice'?'试玩':`${s}分场`;if(roomBaseScoreDisplayElement)roomBaseScoreDisplayElement.textContent=t==='practice'?'无':s;if(playerListUl){playerListUl.innerHTML=`<li>${loggedInUser}(您)</li>`;if(t==='practice'||t==='score'){for(let i=1;i<=3;i++)playerListUl.innerHTML+=`<li>AI对手${i}</li>`;}}safeDisplayRoomMessage(t==='practice'?"进入试玩房...":`进入${s}分房...`,!1);switchView(roomVw);if(t==='practice'||t==='score')setTimeout(()=>{if(startGameFromRoomBtn)startGameFromRoomBtn.click();else console.error("Start game button not found for auto-start")},200);});});
    if(startGameFromRoomBtn)startGameFromRoomBtn.addEventListener('click',()=>{console.log("Start Game From Room clicked");safeDisplayRoomMessage("",!1);switchView(gameVw);if(typeof initializeGameUI==="function")initializeGameUI();else console.error("initializeGameUI missing!");if(dealButton)setTimeout(()=>dealButton.click(),50);});
    if(leaveRoomBtn)leaveRoomBtn.addEventListener('click',()=>{currentRoomId=null;safeDisplayRoomMessage("",!1);if(playerListUl)playerListUl.innerHTML='';loggedInUser?showGameOptionsUI():showAuthForm(loginForm);switchView(mainMenuVw);});
    if(backToRoomBtn)backToRoomBtn.addEventListener('click',()=>{if(isAIAutoplaying){isAIAutoplaying=!1;aiAutoplayRoundsLeft=0;safeDisplayGameMessage("AI托管中止",!1);[dealButton,aiAutoplayButton,aiReferenceButton].forEach(b=>b&&(b.disabled=!1));}if(playerListUl&&loggedInUser)playerListUl.innerHTML=`<li>${loggedInUser}</li>`;if(roomTitleElement&¤tRoomId)roomTitleElement.textContent=`房间: ${currentRoomId}`;else if(roomTitleElement)roomTitleElement.textContent="房间";switchView(roomVw);});

    dealButton.addEventListener('click',async()=>{console.log("Game Deal Btn Clicked");resetGameTable();safeDisplayGameMessage("发牌中...",!1);if(dealButton)dealButton.disabled=!0;try{const r=await fetch(`${API_BASE_URL}deal_cards.php`);if(!r.ok)throw new Error(`发牌请求错: ${r.status}`);const d=await r.json();if(!d||!Array.isArray(d.cards)||d.cards.length!==13)throw new Error("牌数据无效");playerFullHandSource=d.cards.map(c=>({...c,id:(c.rank||'X')+(c.suitKey||'Y')+Math.random().toString(16).slice(2,7)}));let s=typeof evaluateThirteenCardSpecial==="function"?evaluateThirteenCardSpecial(playerFullHandSource):null;if(s){safeDisplayGameMessage(`特殊牌型: ${s.message}!`,!1);initialAndMiddleHandElement.innerHTML='';const pFHSourceSorted=typeof sortHandCardsForDisplay==="function"?sortHandCardsForDisplay(playerFullHandSource):playerFullHandSource;pFHSourceSorted.forEach(c=>{if(typeof renderCard==="function")initialAndMiddleHandElement.appendChild(renderCard(c,!0))});[aiReferenceButton,aiAutoplayButton,confirmOrganizationButton,compareButton].forEach(b=>b&&(b.style.display='none'));if(dealButton){dealButton.disabled=!1;dealButton.textContent="下一局";}}else{initialAndMiddleHandElement.innerHTML='';const sHand=typeof sortHandCardsForDisplay==="function"?sortHandCardsForDisplay(playerFullHandSource):playerFullHandSource;sHand.forEach(c=>{if(typeof renderCard==="function")initialAndMiddleHandElement.appendChild(renderCard(c,!0))});playerOrganizedHand={top:[],middle:[],bottom:[]};if(topRowElement)topRowElement.innerHTML='';if(bottomRowElement)bottomRowElement.innerHTML='';displayCurrentArrangementState();safeDisplayGameMessage("手牌已自动整理，请摆牌。",!1);[aiReferenceButton,aiAutoplayButton,confirmOrganizationButton].forEach(b=>b&&(b.style.display='inline-block'));if(confirmOrganizationButton)confirmOrganizationButton.disabled=!0;if(compareButton)compareButton.style.display='none';if(dealButton)dealButton.textContent="重新发牌";}aiPlayers=[];for(let i=0;i<3;i++){document.querySelector(`#ai-player-${i+1} .ai-hand-eval`).textContent="(已拿牌)";}}catch(e){console.error("发牌错误:",e);safeDisplayGameMessage(`发牌出错: ${e.message}`,!0);if(dealButton)dealButton.disabled=!1;}});
    if(aiReferenceButton)aiReferenceButton.addEventListener('click',()=>{safeDisplayGameMessage("AI参考功能建设中...",!0);if(aiReferenceDisplayElement)aiReferenceDisplayElement.style.display='block';if(aiTopRefElement)aiTopRefElement.textContent="AI思考中...";if(aiMiddleRefElement)aiMiddleRefElement.textContent="AI思考中...";if(aiBottomRefElement)aiBottomRefElement.textContent="AI思考中...";if(playerFullHandSource?.length===13&&typeof getAIRandomValidArrangement==="function"&&typeof renderCard==="function"){setTimeout(()=>{const arr=getAIRandomValidArrangement([...playerFullHandSource]);if(arr?.top&&arr?.middle&&arr?.bottom){const rAR=(el,cs)=>{if(el){el.innerHTML='';const sCs=typeof sortHandCardsForDisplay==="function"?sortHandCardsForDisplay(cs):cs;sCs.forEach(c=>el.appendChild(renderCard(c,!0)));}};rAR(aiTopRefElement,arr.top);rAR(aiMiddleRefElement,arr.middle);rAR(aiBottomRefElement,arr.bottom);safeDisplayGameMessage("AI已提供参考。",!1);}else{if(aiTopRefElement)aiTopRefElement.textContent="AI未能生成";safeDisplayGameMessage("AI未能生成参考。",!0);}},500);}else{if(aiTopRefElement)aiTopRefElement.textContent="无手牌或AI逻辑缺失";safeDisplayGameMessage("AI参考需先发牌。",!0);}});
    if(aiAutoplayButton)aiAutoplayButton.addEventListener('click',()=>{if(isAIAutoplaying){isAIAutoplaying=!1;aiAutoplayRoundsLeft=0;safeDisplayGameMessage("AI托管已中止",!1);[dealButton,aiAutoplayButton,aiReferenceButton].forEach(b=>b&&(b.disabled=!1));hideAIRoundSelector();}else{showAIRoundSelector();}});
    function showAIRoundSelector(){if(!aiRoundSelectorDiv)return;let bHTML='<h4>选择AI托管局数：</h4>';[3,5,10].forEach(r=>{bHTML+=`<button class="ai-round-option" data-rounds="${r}">${r} 局</button>`});bHTML+='<button id="cancel-ai-autoplay-popup">取消</button>';aiRoundSelectorDiv.innerHTML=bHTML;aiRoundSelectorDiv.style.display='flex';aiRoundSelectorDiv.onclick=(e)=>{if(e.target.classList.contains('ai-round-option')){const r=parseInt(e.target.dataset.rounds);hideAIRoundSelector();startAIAutoplay(r);}else if(e.target.id==='cancel-ai-autoplay-popup')hideAIRoundSelector();};[dealButton,aiReferenceButton,aiAutoplayButton,confirmOrganizationButton,compareButton,callBackendButton].forEach(b=>b&&(b.disabled=!0));}
    function hideAIRoundSelector(){if(aiRoundSelectorDiv)aiRoundSelectorDiv.style.display='none';if(!isAIAutoplaying){[dealButton,aiReferenceButton,aiAutoplayButton,callBackendButton].forEach(b=>b&&(b.disabled=!1));}}
    function startAIAutoplay(r){if(r<=0)return;isAIAutoplaying=!0;aiAutoplayRoundsLeft=r;safeDisplayGameMessage(`AI托管开始，共${aiAutoplayRoundsLeft}局。`,!1);[dealButton,aiReferenceButton,aiAutoplayButton,confirmOrganizationButton,compareButton,callBackendButton].forEach(b=>b&&(b.disabled=!0));aiAutoplayNextRound();}
    async function aiAutoplayNextRound(){if(!isAIAutoplaying||aiAutoplayRoundsLeft<=0){isAIAutoplaying=!1;safeDisplayGameMessage("AI托管结束。",!1);[dealButton,aiReferenceButton,aiAutoplayButton,callBackendButton].forEach(b=>b&&(b.disabled=!1));initializeGameUI();return;}safeDisplayGameMessage(`AI托管: 第${aiAutoplayRoundsLeft}局开始...`,!1);if(dealButton)dealButton.disabled=!0;await simulateDealForAI();if(playerFullHandSource.length===13){let sH=typeof evaluateThirteenCardSpecial==="function"?evaluateThirteenCardSpecial(playerFullHandSource):null;if(sH){safeDisplayGameMessage(`AI检测到特殊牌型: ${sH.message}!`,!1);initialAndMiddleHandElement.innerHTML='';const sHCards=typeof sortHandCardsForDisplay==="function"?sortHandCardsForDisplay(playerFullHandSource):playerFullHandSource;sHCards.forEach(c=>initialAndMiddleHandElement.appendChild(renderCard(c,!0)));}else{safeDisplayGameMessage("AI摆牌中...",!1);await new Promise(r=>setTimeout(r,AI_AUTOPLAY_DELAY_MS/3));const arr=typeof getAIRandomValidArrangement==="function"?getAIRandomValidArrangement(playerFullHandSource):null;if(arr?.top&&arr?.middle&&arr?.bottom){[topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(e=>e.innerHTML='');arr.top.forEach(c=>topRowElement.appendChild(renderCard(c,!0)));arr.middle.forEach(c=>initialAndMiddleHandElement.appendChild(renderCard(c,!0)));arr.bottom.forEach(c=>bottomRowElement.appendChild(renderCard(c,!0)));playerOrganizedHand={top:arr.top,middle:arr.middle,bottom:arr.bottom};displayCurrentArrangementState();safeDisplayGameMessage("AI已摆牌,模拟比牌...",!1);await new Promise(r=>setTimeout(r,AI_AUTOPLAY_DELAY_MS/3));console.log("AI Round completed. Score would be calculated here.");safeDisplayScore(`AI局 ${aiAutoplayRoundsLeft} 模拟得分: ${Math.floor(Math.random()*10)-5}`,currentUserTotalScore);}else{safeDisplayGameMessage("AI未能成功摆牌。",!0);}}}else{safeDisplayGameMessage("AI托管:发牌失败,中止。",!0);isAIAutoplaying=!1;}aiAutoplayRoundsLeft--;if(aiAutoplayRoundsLeft>0){await new Promise(r=>setTimeout(r,AI_AUTOPLAY_DELAY_MS));aiAutoplayNextRound();}else{isAIAutoplaying=!1;safeDisplayGameMessage("AI托管完成。",!1);[dealButton,aiReferenceButton,aiAutoplayButton,callBackendButton].forEach(b=>b&&(b.disabled=!1));initializeGameUI();}}
    async function simulateDealForAI(){try{const r=await fetch(`${API_BASE_URL}deal_cards.php`);if(!r.ok)throw new Error('AI Deal: Backend fetch failed');const d=await r.json();if(!d||!Array.isArray(d.cards)||d.cards.length!==13)throw new Error('AI Deal: Invalid card data');playerFullHandSource=d.cards.map(c=>{const sI=(typeof SUITS_DATA!=="undefined"&&SUITS_DATA[c.suitKey])||{dC:'?',cSC:'unk',fNP:'unk'};return{rank:c.rank,suitKey:c.suitKey,dSC:sI.displayChar,cSC:sI.cssClass,id:(c.rank||'X')+(c.suitKey||'Y')+Math.random().toString(36).slice(2,7)}}).filter(c=>c.rank&&c.suitKey);console.log("AI: Cards dealt for AI round.");}catch(e){console.error("AI simulateDeal error:",e);playerFullHandSource=[];safeDisplayGameMessage(`AI发牌错误: ${e.message}`,!0);}}
    if(confirmOrganizationButton)confirmOrganizationButton.addEventListener('click',()=>{console.log("Confirm Org clicked");playerOrganizedHand.middle=Array.from(initialAndMiddleHandElement.children).map(d=>d.cardData).filter(Boolean);if(playerOrganizedHand.top.length!==3||playerOrganizedHand.middle.length!==5||playerOrganizedHand.bottom.length!==5){safeDisplayGameMessage(`牌数错!头${playerOrganizedHand.top.length}/3,中${playerOrganizedHand.middle.length}/5,尾${playerOrganizedHand.bottom.length}/5.`,!0);return;}const eF=typeof evaluateHand==="function"?evaluateHand:()=>({message:"N/A"}),tE=eF(playerOrganizedHand.top),mE=eF(playerOrganizedHand.middle),bE=eF(playerOrganizedHand.bottom);const hMH=document.getElementById('middle-hand-header'),sME=document.getElementById('middle-eval-text');if(hMH&&sME){hMH.childNodes[0].nodeValue=`中道 (5张): `;sME.textContent=` (${mE.message||'未知'})`;initialAndMiddleHandElement.classList.add('is-middle-row-style');}if(typeof checkDaoshui==="function"&&checkDaoshui(tE,mE,bE)){safeDisplayGameMessage("警告:倒水!",!0);[topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el=>el&&el.classList.add('daoshui-warning'));}else{safeDisplayGameMessage("理牌完成,可比牌。",!1);[topRowElement,initialAndMiddleHandElement,bottomRowElement].forEach(el=>el&&el.classList.remove('daoshui-warning'));}[confirmOrganizationButton,aiReferenceButton,aiAutoplayButton].forEach(b=>b&&(b.style.display='none'));if(compareButton){compareButton.style.display='inline-block';compareButton.disabled=!1;}});
    if(compareButton)compareButton.addEventListener('click',async()=>{console.log("Compare clicked");safeDisplayGameMessage("比牌中...",!1);if(compareButton)compareButton.disabled=!0;if(playerOrganizedHand.middle.length!==5)playerOrganizedHand.middle=Array.from(initialAndMiddleHandElement.children).map(d=>d.cardData).filter(Boolean);const pLoad={top:playerOrganizedHand.top.map(c=>({rank:c.rank,suitKey:c.suitKey})),middle:playerOrganizedHand.middle.map(c=>({rank:c.rank,suitKey:c.suitKey})),bottom:playerOrganizedHand.bottom.map(c=>({rank:c.rank,suitKey:c.suitKey})),currentUserPhone:loggedInUser};if(pLoad.top.length!==3||pLoad.middle.length!==5||pLoad.bottom.length!==5){safeDisplayGameMessage("错误:提交牌数不对",!0);if(compareButton)compareButton.style.display='none';if(dealButton)dealButton.disabled=!1;return;}try{const res=await fetch(`${API_BASE_URL}submit_hand.php`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pLoad)});if(!res.ok)throw new Error(`比牌请求失败: ${res.status} ${await res.text()}`);const rst=await res.json();console.log("比牌结果:",rst);if(rst.success){let msg=`服务器: ${rst.message||'完成.'}`;if(rst.daoshui)msg+=" (您倒水了!)";safeDisplayGameMessage(msg,rst.daoshui);if(typeof rst.new_total_score!=="undefined"){currentUserTotalScore=rst.new_total_score;safeDisplayScore(`本局 ${rst.score_change>=0?'+':''}${rst.score_change}`,currentUserTotalScore);}}else safeDisplayGameMessage(`服务器比牌错误: ${rst.message||'失败.'}`,!0);}catch(err){console.error("比牌错误:",err);safeDisplayGameMessage(`比牌出错: ${err.message}`,!0);}finally{if(dealButton){dealButton.disabled=!1;dealButton.textContent="下一局";}if(compareButton)compareButton.style.display='none';[aiReferenceButton,aiAutoplayButton,confirmOrganizationButton].forEach(b=>b&&(b.style.display='inline-block'));}});
    if(callBackendButton){callBackendButton.addEventListener('click',async()=>{safeDisplayGameMessage("测试后端...",!1);try{const tE=`${API_BASE_URL}deal_cards.php`;const resp=await fetch(tE);if(!resp.ok)throw new Error(`HTTP错误! ${resp.status}`);const dat=await resp.json();let m="后端通讯成功!";if(dat?.cards?.length>0)m+=` (返${dat.cards.length}张牌)`;else if(dat?.message)m+=` 后端消息: ${dat.message}`;safeDisplayGameMessage(m,!1);}catch(e){console.error("测试后端错误:",e);safeDisplayGameMessage(`测试后端失败: ${e.message}`,!0);}});console.log("callBackendButton listener attached.");}else console.error("callBackendButton NOT found!");

    initializeApp();
});
