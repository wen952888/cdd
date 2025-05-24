// frontend/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dealButton = document.getElementById('deal-button');
    const sortHandButton = document.getElementById('sort-hand-button');
    const aiReferenceButton = document.getElementById('ai-reference-button'); // NEW
    const aiAutoplayButton = document.getElementById('ai-autoplay-button');   // NEW
    const confirmOrganizationButton = document.getElementById('confirm-organization-button');
    const compareButton = document.getElementById('compare-button');
    const callBackendButton = document.getElementById('call-backend-button');
    const initialAndMiddleHandElement = document.getElementById('player-hand');
    const topRowElement = document.getElementById('player-top-row');
    const bottomRowElement = document.getElementById('player-bottom-row');
    const middleHandHeader = document.getElementById('middle-hand-header');
    const topEvalTextElement = document.getElementById('top-eval-text');
    const middleEvalTextElement = document.getElementById('middle-eval-text');
    const bottomEvalTextElement = document.getElementById('bottom-eval-text');

    // AI Reference Display Elements (Optional)
    const aiReferenceDisplayElement = document.getElementById('ai-reference-display');
    const aiTopRefElement = document.getElementById('ai-top-ref');
    const aiMiddleRefElement = document.getElementById('ai-middle-ref');
    const aiBottomRefElement = document.getElementById('ai-bottom-ref');


    const API_BASE_URL = 'https://wenge.cloudns.ch/backend/';
    let playerFullHandSource = []; // Original 13 cards from server
    let playerOrganizedHand = { top: [], middle: [], bottom: [] };
    let sortableInstances = {};
    // ... (MAX_SORTABLE_INIT_ATTEMPTS, etc. remain the same) ...

    const safeDisplayMessage = (msg, isErr = false) => { /* ... (same as before) ... */ };
    function initializeSortable() { /* ... (Same as previous complete version) ... */ }
    function updateHandModelFromDOM(rowEl, rowName) { /* ... (Same as previous) ... */ }
    function displayCurrentArrangementState() { /* ... (Same as previous) ... */ }
    function checkDaoshuiForUI(midC) { /* ... (Same as previous) ... */ }
    function checkAllCardsOrganized(silent = false) { /* ... (Same as previous) ... */ }
    // (Ensure full implementations of the above functions are present from previous versions)

    function initializeGame() {
        // ... (existing initializeGame logic from previous full version) ...
        if (sortHandButton) sortHandButton.style.display = 'none';
        if (aiReferenceButton) aiReferenceButton.style.display = 'none'; // HIDE AI BUTTONS
        if (aiAutoplayButton) aiAutoplayButton.style.display = 'none';  // HIDE AI BUTTONS
        if (aiReferenceDisplayElement) aiReferenceDisplayElement.style.display = 'none'; // Hide AI ref display

        // ... (rest of initializeGame from previous full version) ...
        console.log("Game Initialized.");
    }


    dealButton.addEventListener('click', async () => {
        // ... (existing dealButton logic from previous full version) ...
        try {
            // ... (fetch and map cards) ...
            playerFullHandSource = data.cards.map(cardFromServer => { /* ... */ }).filter(Boolean);
            // ... (populate initialAndMiddleHandElement) ...

            displayCurrentArrangementState();
            safeDisplayMessage("请理牌！", false);
            if (sortHandButton) sortHandButton.style.display = 'inline-block';
            if (aiReferenceButton) aiReferenceButton.style.display = 'inline-block'; // SHOW AI BUTTONS
            if (aiAutoplayButton) aiAutoplayButton.style.display = 'inline-block';  // SHOW AI BUTTONS
            if (confirmOrganizationButton) confirmOrganizationButton.style.display = 'inline-block';
            if (aiReferenceDisplayElement) aiReferenceDisplayElement.style.display = 'none';


        } catch (error) {
            // ... (error handling) ...
            if (sortHandButton) sortHandButton.style.display = 'none';
            if (aiReferenceButton) aiReferenceButton.style.display = 'none';
            if (aiAutoplayButton) aiAutoplayButton.style.display = 'none';
        }
    });

    if (sortHandButton) { sortHandButton.addEventListener('click', () => { /* ... (Same as previous) ... */ }); }

    // --- NEW: AI Button Event Listeners ---
    if (aiReferenceButton) {
        aiReferenceButton.addEventListener('click', async () => {
            console.log("--- AI Reference Button Clicked ---");
            if (playerFullHandSource.length !== 13) {
                safeDisplayMessage("请先发牌获得完整手牌后再使用AI参考。", true);
                return;
            }
            safeDisplayMessage("正在向AI请求参考牌型...", false);
            aiReferenceButton.disabled = true;
            aiAutoplayButton.disabled = true;

            try {
                // Send only rank and suitKey, or whatever backend AI needs
                const handForAI = playerFullHandSource.map(c => ({ rank: c.rank, suitKey: c.suitKey }));
                const response = await fetch(`${API_BASE_URL}ai_thirteen_water.php`, { // NEW BACKEND ENDPOINT
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ hand: handForAI, action: 'getReference' })
                });

                if (!response.ok) throw new Error(`AI参考请求失败: ${response.status} ${await response.text()}`);
                const aiResult = await response.json();

                if (aiResult.success && aiResult.organizedHand) {
                    console.log("AI Reference Received:", aiResult.organizedHand);
                    safeDisplayMessage("AI参考牌型已生成。", false);
                    // Display the AI reference
                    if (aiReferenceDisplayElement && aiTopRefElement && aiMiddleRefElement && aiBottomRefElement) {
                        const formatCardsForDisplay = (cardsArray) => cardsArray.map(c => `${c.rank}${SUITS_DATA[c.suitKey]?.displayChar || '?'}`).join(' ');
                        aiTopRefElement.textContent = formatCardsForDisplay(aiResult.organizedHand.top);
                        aiMiddleRefElement.textContent = formatCardsForDisplay(aiResult.organizedHand.middle);
                        aiBottomRefElement.textContent = formatCardsForDisplay(aiResult.organizedHand.bottom);
                        aiReferenceDisplayElement.style.display = 'block';
                    }
                } else {
                    throw new Error(aiResult.message || "AI未能提供有效参考。");
                }
            } catch (error) {
                console.error("AI参考错误:", error);
                safeDisplayMessage(`AI参考失败: ${error.message}`, true);
                if (aiReferenceDisplayElement) aiReferenceDisplayElement.style.display = 'none';
            } finally {
                aiReferenceButton.disabled = false;
                aiAutoplayButton.disabled = false;
            }
        });
    }

    if (aiAutoplayButton) {
        aiAutoplayButton.addEventListener('click', async () => {
            console.log("--- AI Autoplay Button Clicked ---");
            if (playerFullHandSource.length !== 13) {
                safeDisplayMessage("请先发牌获得完整手牌后再使用AI托管。", true);
                return;
            }
            safeDisplayMessage("AI正在为您摆牌...", false);
            aiAutoplayButton.disabled = true;
            aiReferenceButton.disabled = true;
            if (aiReferenceDisplayElement) aiReferenceDisplayElement.style.display = 'none';


            try {
                const handForAI = playerFullHandSource.map(c => ({ rank: c.rank, suitKey: c.suitKey }));
                const response = await fetch(`${API_BASE_URL}ai_thirteen_water.php`, { // NEW BACKEND ENDPOINT
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ hand: handForAI, action: 'getBestMove' }) // Or a generic 'getArrangement'
                });

                if (!response.ok) throw new Error(`AI托管请求失败: ${response.status} ${await response.text()}`);
                const aiResult = await response.json();

                if (aiResult.success && aiResult.organizedHand) {
                    console.log("AI Autoplay Hand Received:", aiResult.organizedHand);
                    // Clear existing rows
                    topRowElement.innerHTML = '';
                    initialAndMiddleHandElement.innerHTML = ''; // This will become the middle row
                    bottomRowElement.innerHTML = '';

                    // Populate rows based on AI result
                    // Important: AI must return card objects that match what renderCard expects,
                    // or we need to map them from playerFullHandSource based on AI's selection.
                    // Assuming AI returns arrays of card objects {rank, suitKey, ...} that are part of playerFullHandSource

                    const populateRow = (rowElement, aiCards) => {
                        aiCards.forEach(aiCardRef => {
                            // Find the full card object from playerFullHandSource to ensure all data is present for renderCard
                            const fullCard = playerFullHandSource.find(c => c.rank === aiCardRef.rank && c.suitKey === aiCardRef.suitKey);
                            if (fullCard && typeof renderCard === 'function') {
                                rowElement.appendChild(renderCard(fullCard, true));
                            } else {
                                console.warn("Could not find full card for AI card ref or renderCard missing:", aiCardRef);
                            }
                        });
                    };

                    populateRow(topRowElement, aiResult.organizedHand.top);
                    populateRow(initialAndMiddleHandElement, aiResult.organizedHand.middle); // Middle cards go to #player-hand
                    populateRow(bottomRowElement, aiResult.organizedHand.bottom);

                    // Update internal models after DOM manipulation
                    updateHandModelFromDOM(topRowElement, 'top');
                    updateHandModelFromDOM(bottomRowElement, 'bottom');
                    // Middle hand model will be updated on confirm, or update it now if needed:
                    // playerOrganizedHand.middle = aiResult.organizedHand.middle.map(aiCardRef => playerFullHandSource.find(c => c.rank === aiCardRef.rank && c.suitKey === aiCardRef.suitKey)).filter(Boolean);


                    displayCurrentArrangementState(); // Update evaluations
                    checkAllCardsOrganized();         // Enable confirm button
                    safeDisplayMessage("AI已完成摆牌。请确认或比牌。", false);
                } else {
                    throw new Error(aiResult.message || "AI未能完成摆牌。");
                }
            } catch (error) {
                console.error("AI托管错误:", error);
                safeDisplayMessage(`AI托管失败: ${error.message}`, true);
                 // Optionally, restore playerFullHandSource to initialAndMiddleHandElement if autoplay fails badly
                initialAndMiddleHandElement.innerHTML = '';
                playerFullHandSource.forEach(card => {
                    if (card && typeof renderCard === 'function') initialAndMiddleHandElement.appendChild(renderCard(card, true));
                });
                updateHandModelFromDOM(topRowElement, 'top'); // Clear top/bottom models
                updateHandModelFromDOM(bottomRowElement, 'bottom');
                displayCurrentArrangementState();
            } finally {
                aiAutoplayButton.disabled = false;
                aiReferenceButton.disabled = false;
            }
        });
    }

    // ... (confirmOrganizationButton, compareButton, callBackendButton listeners - no changes from previous full version)
    // (Full SortableJS initialization, updateHandModelFromDOM, displayCurrentArrangementState, etc. should be present)
    // (Make sure to include the full, working code for all other functions and event listeners from the previous main.js)

    initializeGame();
    initializeSortable();
});
