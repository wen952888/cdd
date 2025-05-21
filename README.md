# HTML5 Big Two Game

A simple implementation of the card game Big Two (鋤大地) using:

*   **Frontend:** HTML, CSS, JavaScript (deployed on Cloudflare Pages)
*   **Backend:** PHP (deployed on Serv00)

## Setup

### Backend (Serv00)

1.  Upload the contents of the `backend/` directory to your Serv00 web space (e.g., into a subdirectory like `public_html/bigtwo_game_api/`).
2.  Edit `backend/includes/config.php` and set `ALLOWED_ORIGIN` to your Cloudflare Pages URL.
3.  Note the full URL to the `backend/api/` directory. This will be your `API_BASE_URL`.

### Frontend (Cloudflare Pages)

1.  Push the entire repository to GitHub.
2.  Connect your GitHub repository to Cloudflare Pages.
3.  Set the **Build output directory** to `frontend`.
4.  No build command is needed for this simple static site.
5.  After deployment, get your Cloudflare Pages URL (e.g., `https://your-project.pages.dev`).
6.  Edit `frontend/js/api.js` and update `API_BASE_URL` with the URL of your backend API on Serv00.
7.  Edit `frontend/js/api.js` and ensure the `API_BASE_URL` is correct.
8.  Commit and push the changes to `api.js`. Cloudflare Pages will redeploy.

### Game Logic Notes

The card playing validation logic in `backend/includes/game_logic.php` is highly simplified for this demonstration. A full Big Two implementation requires complex rule checking.

## How to Play (Simplified)

1.  Open the Cloudflare Pages URL in your browser.
2.  Enter a player name and click "Create Game" or "Join Game" with a Game ID.
3.  Up to 4 players can join. The game starts automatically when 4 players are in.
4.  Click cards to select them.
5.  Click "Play Selected Cards" or "Pass".
