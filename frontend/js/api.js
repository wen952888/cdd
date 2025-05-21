// frontend/js/api.js

// IMPORTANT: Replace this with your actual backend API URL on Serv00
const API_BASE_URL = 'https://YOUR_SERV00_USERNAME.serv00.net/path/to/backend/api/';
// Example: const API_BASE_URL = 'https://myuser.serv00.net/bigtwo_api/api/';


async function request(endpoint, method = 'GET', data = null) {
    const url = API_BASE_URL + endpoint;
    const options = {
        method,
        headers: {
            // 'Content-Type' is not needed for GET or HEAD requests if no body.
            // For POST with JSON, it's crucial.
        },
    };

    if (data) {
        if (method === 'POST' || method === 'PUT') {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(data);
        } else if (method === 'GET') {
            // For GET, append data as query parameters
            // This part is not strictly necessary if your GET requests don't send complex data
            // and you construct the URL with query params directly in Api methods.
            // const params = new URLSearchParams(data);
            // url += '?' + params.toString();
        }
    }

    try {
        const response = await fetch(url, options);
        const responseData = await response.json(); // Try to parse JSON regardless of status for error messages

        if (!response.ok) {
            console.error('API Error Response:', responseData);
            throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
        }
        return responseData;
    } catch (error) {
        console.error('API Fetch Error:', error);
        // UI.displayError(error.message || 'Network error or server unavailable.'); // Handled by caller usually
        throw error;
    }
}

const Api = {
    createGame: (playerName) => request('create_game.php', 'POST', { playerName }),
    joinGame: (gameId, playerName) => request('join_game.php', 'POST', { gameId, playerName }),
    getGameState: (gameId, playerId) => request(`get_state.php?gameId=${gameId}&playerId=${playerId}`), // GET request
    playCards: (gameId, playerId, cards) => request('play_card.php', 'POST', { gameId, playerId, cards }),
    passTurn: (gameId, playerId) => request('pass_turn.php', 'POST', { gameId, playerId }),
};
