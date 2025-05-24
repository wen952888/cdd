<?php
// backend/deal_cards.php
header("Access-Control-Allow-Origin: *"); header("Access-Control-Allow-Methods: GET, OPTIONS"); header("Access-Control-Allow-Headers: Content-Type, Authorization"); header("Content-Type: application/json; charset=UTF-8");
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(0); }
function createDeck() { $s=['SPADES','HEARTS','CLUBS','DIAMONDS']; $r=["A","2","3","4","5","6","7","8","9","10","J","Q","K"]; $d=[]; foreach($s as $sK){foreach($r as $rk){$d[]=['rank'=>$rk,'suitKey'=>$sK];}} return $d; }
$deck = createDeck(); shuffle($deck); $pC = array_slice($deck, 0, 13); echo json_encode(['cards' => $pC]); exit;
?>
