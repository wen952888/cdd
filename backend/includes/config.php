<?php
// backend/includes/config.php

// IMPORTANT: Replace with your Cloudflare Pages URL for CORS
// const ALLOWED_ORIGIN = 'https://your-project-name.pages.dev';
const ALLOWED_ORIGIN = 'https://YOUR_CLOUDFLARE_PAGES_URL.pages.dev'; // E.g. https://my-bigtwo.pages.dev
// For local development, you might use:
// const ALLOWED_ORIGIN = 'http://localhost:8000'; // Or whatever your local dev server runs on
// Or for very open testing (NOT FOR PRODUCTION):
// const ALLOWED_ORIGIN = '*';


// --- CORS and JSON Headers ---
// Ensure this is only set if the origin is allowed
if (isset($_SERVER['HTTP_ORIGIN'])) {
    // Check if the origin is the one you want to allow
    if ($_SERVER['HTTP_ORIGIN'] == ALLOWED_ORIGIN || ALLOWED_ORIGIN == '*') {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header("Access-Control-Allow-Credentials: true"); // If you plan to use cookies/sessions across domains
    }
} else {
    // If no origin, and you want to allow direct access or from same origin.
    // Or, if strict, you might deny if no origin or not matching.
    // For simplicity here, if ALLOWED_ORIGIN is '*', we allow it.
    if (ALLOWED_ORIGIN == '*') {
         header("Access-Control-Allow-Origin: *");
    }
}

header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    // If you need to set specific headers for OPTIONS response for your setup
    // header("Access-Control-Max-Age: 86400"); // Cache preflight for 1 day
    exit(0);
}

// --- Session ---
// Using PHP's default session handling. For production, consider database-backed sessions.
if (session_status() == PHP_SESSION_NONE) {
    // Configure session cookie parameters for security if needed
    /*
    session_set_cookie_params([
        'lifetime' => 0, // Session cookie lasts until browser closes
        'path' => '/',
        'domain' => '', // Set your domain if needed, tricky with localhost or different dev/prod domains
        'secure' => isset($_SERVER['HTTPS']), // Send cookie only over HTTPS
        'httponly' => true, // Prevent JavaScript access to session cookie
        'samesite' => 'Lax' // Or 'Strict' or 'None' (None requires Secure attribute)
    ]);
    */
    session_start();
}

// --- Error Reporting (for development) ---
// error_reporting(E_ALL);
// ini_set('display_errors', 1);

// --- Game Constants ---
define('MAX_PLAYERS', 4);
define('CARDS_PER_PLAYER', 13); // 52 cards / 4 players
