// frontend/js/game.js
const Game = {
    gameId: null,
    playerId: null,
    playerName: '',
    isMyTurn: false,
    pollingIntervalId: null,
    gameState: null, // Store the latest full game state from server

    init: function() {
        UI.createGameBtn.addEventListener('click', () => this.handleCreateGame());
        UI.joinGameBtn.addEventListener('click', () => this.handleJoinGame());
        UI.playCardsBtn.addEventListener('click', () => this.handlePlayCards());
        UI.passBtn.addEventListener('click', () => this.handlePassTurn());
    },

    getPlayerName: function() {
        this.playerName = UI.playerNameInput.value.trim();
        if (!this.playerName) {
            UI.displayError('Please enter your name.');
            return false;
        }
        return true;
    },

    handleCreateGame: async function() {
        if (!this.getPlayerName()) return;

        try {
            UI.updateGameInfo('Creating game...');
            const data = await Api.createGame(this.playerName);
            if (data.success) {
                this.gameId = data.gameId;
                this.playerId = data.playerId;
                UI.setGameUIDetails(this.gameId, this.playerId);
                UI.updateGameInfo(`Game created! ID: ${this.gameId}. Waiting for players...`);
                this.startPolling();
            } else {
                UI.displayError(data.message || 'Failed to create game.');
            }
        } catch (error) {
            UI.displayError(error.message || 'Error creating game.');
        }
    },

    handleJoinGame: async function() {
        if (!this.getPlayerName()) return;
        const gameIdToJoin = UI.gameIdInput.value.trim();
        if (!gameIdToJoin) {
            UI.displayError('Please enter a Game ID to join.');
            return;
        }

        try {
            UI.updateGameInfo('Joining game...');
            const data = await Api.joinGame(gameIdToJoin, this.playerName);
            if (data.success) {
                this.gameId = data.gameId; // Should be same as gameIdToJoin
                this.playerId = data.playerId;
                UI.setGameUIDetails(this.gameId, this.playerId);
                UI.updateGameInfo(`Joined game ID: ${this.gameId}. Waiting for game to start...`);
                this.startPolling();
            } else {
                UI.displayError(data.message || 'Failed to join game.');
            }
        } catch (error) {
            UI.displayError(error.message || 'Error joining game.');
        }
    },

    startPolling: function() {
        if (this.pollingIntervalId) clearInterval(this.pollingIntervalId);
        this.fetchGameState(); // Fetch immediately once
        this.pollingIntervalId = setInterval(() => this.fetchGameState(), 3000); // Poll every 3 seconds
    },

    stopPolling: function() {
        if (this.pollingIntervalId) {
            clearInterval(this.pollingIntervalId);
            this.pollingIntervalId = null;
        }
    },

    fetchGameState: async function() {
        if (!this.gameId || !this.playerId) return;

        try {
            const state = await Api.getGameState(this.gameId, this.playerId);
            if (state.success) {
                this.gameState = state.data;
                this.updateUIFromState(state.data);
            } else {
                UI.displayError(state.message || 'Failed to get game state.');
                if (state.errorType === 'GAME_NOT_FOUND' || state.errorType === 'PLAYER_NOT_IN_GAME') {
                    this.stopPolling(); // Stop polling if game/player is invalid
                    // Reset UI or guide user
                }
            }
        } catch (error) {
            UI.displayError(error.message || 'Error fetching game state.');
            // Potentially stop polling on certain errors
        }
    },

    updateUIFromState: function(state) {
        UI.renderPlayerHand(state.playerHand || []);
        UI.renderTable(state.lastPlayedCardsInfo ? state.lastPlayedCardsInfo.cards : []);
        UI.renderOtherPlayers(state.otherPlayers || []);
        UI.setCurrentPlayer(state.currentPlayerName || '-');

        this.isMyTurn = state.currentPlayerId === this.playerId;
        UI.enableActionButtons(this.isMyTurn && state.status === 'playing');

        let statusMessage = `Status: ${state.status}. `;
        if (state.status === 'waiting' && state.playersCount < 4) {
             statusMessage += `${state.playersCount}/4 players. Waiting for more...`;
        } else if (state.status === 'playing') {
            statusMessage += this.isMyTurn ? "It's your turn!" : `Waiting for ${state.currentPlayerName}.`;
        } else if (state.status === 'finished') {
            UI.showWinner(state.winnerName);
            this.stopPolling();
            return; // No further UI updates needed for actions
        }
        if (state.message) { // General game message from backend
            statusMessage += ` ${state.message}`;
        }
        UI.updateGameInfo(statusMessage);
    },

    handlePlayCards: async function() {
        if (!this.isMyTurn || UI.selectedCards.length === 0) {
            UI.displayError("It's not your turn or no cards selected.");
            return;
        }

        try {
            const cardsToPlay = UI.selectedCards; // These are card IDs like "SA"
            UI.updateGameInfo('Playing cards...');
            const result = await Api.playCards(this.gameId, this.playerId, cardsToPlay);
            if (result.success) {
                UI.updateGameInfo(result.message || 'Cards played.');
                UI.clearSelections(); // Clear selected cards in UI
                // The game state will be updated by the next poll, or we can fetch immediately
                this.fetchGameState();
            } else {
                UI.displayError(result.message || 'Invalid play.');
            }
        } catch (error) {
            UI.displayError(error.message || 'Error playing cards.');
        }
    },

    handlePassTurn: async function() {
        if (!this.isMyTurn) {
            UI.displayError("It's not your turn.");
            return;
        }

        try {
            UI.updateGameInfo('Passing turn...');
            const result = await Api.passTurn(this.gameId, this.playerId);
            if (result.success) {
                UI.updateGameInfo(result.message || 'Turn passed.');
                // The game state will be updated by the next poll, or we can fetch immediately
                this.fetchGameState();
            } else {
                UI.displayError(result.message || 'Failed to pass turn.');
            }
        } catch (error) {
            UI.displayError(error.message || 'Error passing turn.');
        }
    }
};
