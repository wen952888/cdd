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
    const middleHandHeader = document.getElementById('middle-hand-header'); // The H3 element
    const topEvalTextElement = document.getElementById('top-eval-text');
    // middleEvalTextElement is a span *inside* middleHandHeader, so we get it after potential innerHTML changes
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
        if (typeof displayMessage === "function") displayMessage(msg, isErr);
        else isErr ? console.error(msg) : console.log(msg);
    };

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

    function checkDaoshuiForUI(midC) { /* ... (Full function from previous, using safeDisplayMessage) ... */ }
    function checkAllCardsOrganized(silent = false) { /* ... (Full function from previous, using safeDisplayMessage) ... */ }
    function initializeGame() { /* ... (Full function from previous, using safeDisplayMessage, ensure AI buttons/display hidden) ... */ }

    dealButton.addEventListener('click', async () => { /* ... (Full function from previous, using safeDisplayMessage, show AI/Sort buttons) ... */ });
    if (sortHandButton) sortHandButton.addEventListener('click', () => { /* ... (Full function from previous, using safeDisplayMessage) ... */ });
    if (aiReferenceButton) aiReferenceButton.addEventListener('click', () => { safeDisplayMessage("AI参考功能待实现", true); /* ... (show/hide display element) ... */ });
    if (aiAutoplayButton) aiAutoplayButton.addEventListener('click', () => { safeDisplayMessage("AI托管功能待实现", true); });
    confirmOrganizationButton.addEventListener('click', () => { /* ... (Full function from previous, using safeDisplayMessage) ... */ });
    compareButton.addEventListener('click', async () => { /* ... (Full function from previous, using safeDisplayMessage) ... */ });
    if (callBackendButton) callBackendButton.addEventListener('click', async () => { /* ... (Full function from previous, with detailed logging, using safeDisplayMessage) ... */ });

    initializeGame();
    initializeSortable();
});
