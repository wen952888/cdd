// frontend/js/ui.js
const UI = {
    playerNameInput: document.getElementById('playerName'),
    gameIdInput: document.getElementById('gameIdInput'),
    createGameBtn: document.getElementById('createGameBtn'),
    joinGameBtn: document.getElementById('joinGameBtn'),

    statusText: document.getElementById('statusText'),
    gameIdDisplay: document.getElementById('gameIdDisplay'),
    playerIdDisplay: document.getElementById('playerIdDisplay'),
    currentPlayerNameDisplay: document.getElementById('currentPlayerName'),

    playerCardsDisplay: document.getElementById('player-cards-display'),
    playedCardsDisplay: document.getElementById('played-cards-display'),
    otherPlayersArea: document.getElementById('other-players-area'),

    playCardsBtn: document.getElementById('playCardsBtn'),
    passBtn: document.getElementById('passBtn'),

    selectedCards: [], // Array to store selected card IDs (e.g., "SA", "H2")

    init: function() {
        // Event listeners for buttons are set in game.js
    },

    getSuitSymbol: function(suitInitial) {
        const symbols = { 'S': '♠', 'H': '♥', 'D': '♦', 'C': '♣' };
        return symbols[suitInitial.toUpperCase()] || suitInitial;
    },

    getRankDisplay: function(rank) {
        // Could map 'T' to 10, 'J' to J, etc. if desired
        return rank;
    },

    renderPlayerHand: function(cards = []) { // cards = [{id: "SA", suit: "S", rank: "A"}, ...]
        this.playerCardsDisplay.innerHTML = '';
        this.selectedCards = []; // Clear selections when hand re-renders
        cards.sort((a, b) => { // Simple sort for display, backend has authoritative sort
            const rankOrder = "3456789TJQKA2";
            const suitOrder = "DCSH"; // Diamonds, Clubs, Spades, Hearts (Big Two typical)
            if (rankOrder.indexOf(a.rank) === rankOrder.indexOf(b.rank)) {
                return suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
            }
            return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
        });

        cards.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card');
            cardDiv.dataset.cardId = card.id; // e.g., "SA"
            cardDiv.textContent = `${this.getRankDisplay(card.rank)}${this.getSuitSymbol(card.suit)}`;
            cardDiv.addEventListener('click', () => this.toggleCardSelection(cardDiv, card.id));
            this.playerCardsDisplay.appendChild(cardDiv);
        });
    },

    toggleCardSelection: function(cardDiv, cardId) {
        cardDiv.classList.toggle('selected');
        if (this.selectedCards.includes(cardId)) {
            this.selectedCards = this.selectedCards.filter(id => id !== cardId);
        } else {
            this.selectedCards.push(cardId);
        }
        console.log('Selected cards:', this.selectedCards);
    },

    clearSelections: function() {
        this.selectedCards = [];
        document.querySelectorAll('#player-cards-display .card.selected').forEach(el => {
            el.classList.remove('selected');
        });
    },

    renderTable: function(playedCards = []) { // playedCards = [{id: "SA", suit: "S", rank: "A"}, ...]
        this.playedCardsDisplay.innerHTML = '';
        if (playedCards.length > 0) {
            playedCards.forEach(card => {
                const cardDiv = document.createElement('div');
                cardDiv.classList.add('card', 'on-table');
                cardDiv.textContent = `${this.getRankDisplay(card.rank)}${this.getSuitSymbol(card.suit)}`;
                this.playedCardsDisplay.appendChild(cardDiv);
            });
        } else {
            this.playedCardsDisplay.textContent = 'Table is clear.';
        }
    },

    renderOtherPlayers(playersData = []) { // [{name: "P2", cardCount: 13, isCurrent: false}, ...]
        this.otherPlayersArea.innerHTML = '<h2>Other Players</h2>';
        if (playersData.length === 0) {
            this.otherPlayersArea.innerHTML += '<p>No other players yet.</p>';
            return;
        }
        playersData.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.classList.add('other-player');
            let html = `<p><strong>${player.name}</strong> (${player.isCurrent ? "Playing" : "Waiting"})</p>`;
            html += `<p>Cards: ${player.cardCount}</p>`;
            // You could render empty card backs for a visual representation
            // const handDiv = document.createElement('div');
            // handDiv.classList.add('other-player-hand');
            // for(let i=0; i < player.cardCount; i++) {
            //     const cardBack = document.createElement('div');
            //     cardBack.classList.add('card');
            //     cardBack.textContent = '?';
            //     handDiv.appendChild(cardBack);
            // }
            // playerDiv.appendChild(handDiv);
            playerDiv.innerHTML = html;
            this.otherPlayersArea.appendChild(playerDiv);
        });
    },

    updateGameInfo: function(message) {
        this.statusText.textContent = message;
    },

    displayError: function(message) {
        this.statusText.textContent = `Error: ${message}`;
        alert(`Error: ${message}`); // Simple alert for now
    },

    setGameUIDetails: function(gameId, playerId) {
        this.gameIdDisplay.textContent = gameId || '-';
        this.playerIdDisplay.textContent = playerId || '-';
        if (gameId) {
            this.playerNameInput.disabled = true;
            this.gameIdInput.disabled = true;
            this.createGameBtn.disabled = true;
            this.joinGameBtn.disabled = true;
        }
    },

    setCurrentPlayer: function(playerName) {
        this.currentPlayerNameDisplay.textContent = playerName || '-';
    },

    enableActionButtons: function(canPlay) {
        this.playCardsBtn.disabled = !canPlay;
        this.passBtn.disabled = !canPlay;
    },

    showWinner: function(winnerName) {
        this.updateGameInfo(`${winnerName} has won the game!`);
        this.enableActionButtons(false); // Disable buttons
        // Could add a "New Game" button or similar
    }
};
