// frontend/js/game.js

// --- Constants for Card Data, Types, and Image Paths ---
const SUITS_DATA = {
    SPADES:   { displayChar: "♠", cssClass: "spades",   fileNamePart: "spades",   sortOrder: 4 }, // Higher sortOrder for stronger suit in tie-breaking display
    HEARTS:   { displayChar: "♥", cssClass: "hearts",   fileNamePart: "hearts",   sortOrder: 3 },
    CLUBS:    { displayChar: "♣", cssClass: "clubs",    fileNamePart: "clubs",    sortOrder: 2 },
    DIAMONDS: { displayChar: "♦", cssClass: "diamonds", fileNamePart: "diamonds", sortOrder: 1 }
};
const RANKS_LOGIC_DISPLAY = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const RANK_FILENAME_PART = {
    "A": "ace", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7",
    "8": "8", "9": "9", "10": "10", "J": "jack", "Q": "queen", "K": "king"
};
const RANK_VALUES = { // Ace is 14 for general comparison, 1 for A-5 straight
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
    "J": 11, "Q": 12, "K": 13, "A": 14
};
const HAND_TYPES = {
    HIGH_CARD: 0,        // 乌龙
    PAIR: 1,             // 对子
    TWO_PAIR: 2,         // 两对
    THREE_OF_A_KIND: 3,  // 三条
    STRAIGHT: 4,         // 顺子
    FLUSH: 5,            // 同花
    FULL_HOUSE: 6,       // 葫芦
    FOUR_OF_A_KIND: 7,   // 铁支 (四梅)
    STRAIGHT_FLUSH: 8,   // 同花顺
    // Special 13-card hands (免摆/报到)
    THIRTEEN_CARDS_SPECIAL_BASE: 100, // Base value for special hands
    SIX_PAIRS_PLUS: 101,          // 六对半
    // THREE_FLUSHES_THIRTEEN: 102,      // 三同花 (from 13 cards, if a special instant type)
    // THREE_STRAIGHTS_THIRTEEN: 103,    // 三顺子 (from 13 cards, if a special instant type)
    ALL_SMALL: 104,               // 全小 (e.g., 2-8)
    ALL_BIG: 105,                 // 全大 (e.g., 8-A)
    SAME_COLOR: 106,              // 凑一色 (全红或全黑)
    THREE_SETS_OF_TRIPS: 107,     // 三套三条 (e.g. AAA KKK QQQ + 4 singles)
    FIVE_PAIRS_AND_TRIPS: 108,    // 五对三条 (5 pairs + 1 three-of-a-kind)
    TWELVE_ROYALS: 109,           // 十二皇族
    DRAGON: 110,                  // 一条龙 (A-K sequential, mixed suits)
    ROYAL_DRAGON: 111,            // 至尊清龙 (A-K sequential flush) - Highest
};
const HAND_TYPE_MESSAGES = {
    [HAND_TYPES.HIGH_CARD]: "乌龙", [HAND_TYPES.PAIR]: "对子", [HAND_TYPES.TWO_PAIR]: "两对",
    [HAND_TYPES.THREE_OF_A_KIND]: "三条", [HAND_TYPES.STRAIGHT]: "顺子", [HAND_TYPES.FLUSH]: "同花",
    [HAND_TYPES.FULL_HOUSE]: "葫芦", [HAND_TYPES.FOUR_OF_A_KIND]: "铁支", [HAND_TYPES.STRAIGHT_FLUSH]: "同花顺",
    [HAND_TYPES.SIX_PAIRS_PLUS]: "六对半", [HAND_TYPES.THREE_FLUSHES_THIRTEEN]: "三同花（特殊）",
    [HAND_TYPES.THREE_STRAIGHTS_THIRTEEN]: "三顺子（特殊）", [HAND_TYPES.ALL_SMALL]: "全小",
    [HAND_TYPES.ALL_BIG]: "全大", [HAND_TYPES.SAME_COLOR]: "凑一色",
    [HAND_TYPES.THREE_SETS_OF_TRIPS]: "三套三条", [HAND_TYPES.FIVE_PAIRS_AND_TRIPS]: "五对三条",
    [HAND_TYPES.TWELVE_ROYALS]: "十二皇族", [HAND_TYPES.DRAGON]: "一条龙", [HAND_TYPES.ROYAL_DRAGON]: "至尊清龙",
};
const CARD_IMAGE_PATH_PREFIX = 'images/cards/';
const CARD_IMAGE_EXTENSION = '.png';
const UNKNOWN_CARD_FILENAME = `unknown${CARD_IMAGE_EXTENSION}`;

// --- Image Path Generation ---
function getCardImageFilename(card){if(typeof RANK_FILENAME_PART==='undefined'||typeof SUITS_DATA==='undefined'||typeof CARD_IMAGE_EXTENSION==='undefined'||typeof UNKNOWN_CARD_FILENAME==='undefined'){console.error("FATAL: getCardImageFilename constants missing.");return 'error_constants.png';}if(!card||typeof card.rank!=='string'||typeof card.suitKey!=='string'){return UNKNOWN_CARD_FILENAME;}const r=card.rank.toUpperCase(),R=RANK_FILENAME_PART[r],t=SUITS_DATA[card.suitKey],s=t?t.fileNamePart:null;return R?s?`${R}_of_${s}${CARD_IMAGE_EXTENSION}`:`unknown_suit_${card.suitKey.toLowerCase()}${CARD_IMAGE_EXTENSION}`:`unknown_rank_${c.rank.toLowerCase()}${CARD_IMAGE_EXTENSION}`;}
function getCardImagePath(c){if(typeof CARD_IMAGE_PATH_PREFIX!=='string'||typeof UNKNOWN_CARD_FILENAME!=='string'){console.error("FATAL: getCardImagePath constants missing.");return 'error_prefix/path.png';}const r=getCardImageFilename(c);return"string"!=typeof r||""===r.trim()?CARD_IMAGE_PATH_PREFIX+UNKNOWN_CARD_FILENAME:CARD_IMAGE_PATH_PREFIX+r}
function getCardBackImagePath(){return"string"!=typeof CARD_IMAGE_PATH_PREFIX||"string"!=typeof CARD_IMAGE_EXTENSION?"error_prefix/back.png":CARD_IMAGE_PATH_PREFIX+"back"+CARD_IMAGE_EXTENSION}

// --- Card Utility Functions ---
function getRankValue(c,r=!1){if(!c?.rank)return 0;const t=c.rank.toUpperCase();return r&&"A"===t?1:RANK_VALUES[t]||0}
function sortHandCardsForDisplay(c){return Array.isArray(c)?[...c].sort((c,r)=>{const t=getRankValue(c),e=getRankValue(r);if(t!==e)return e-t;const n=SUITS_DATA[c.suitKey]?.sortOrder||0,a=SUITS_DATA[r.suitKey]?.sortOrder||0;return a-n}):[]}
function sortCardsByRankValue(c,r=!1,t=!1){return Array.isArray(c)?[...c].sort((e,n)=>(getRankValue(e,r)-getRankValue(n,r))*(t?1:-1)):[]}
function k_combinations(s,k){if(k>s.length||k<=0)return[];if(k===s.length)return[s];if(k===1)return s.map(i=>[i]);let c=[];for(let i=0;i<s.length-k+1;i++){let h=s.slice(i,i+1);let t=k_combinations(s.slice(i+1),k-1);for(let j=0;j<t.length;j++)c.push(h.concat(t[j]));}return c;}


// --- Special 13-Card Hand Evaluation ---
function evaluateThirteenCardSpecial(thirteenCards) {
    if (!thirteenCards || thirteenCards.length !== 13) return null;
    const cards = [...thirteenCards]; // Work with a copy
    const sortedByRankValueAceHigh = sortCardsByRankValue(cards, false, false); // Ace=14, Descending
    const ranksAceHigh = sortedByRankValueAceHigh.map(c => getRankValue(c));
    const suits = cards.map(c => c.suitKey);

    const rankCounts = {};
    ranksAceHigh.forEach(r => rankCounts[r] = (rankCounts[r] || 0) + 1);
    const countsOfEachRankValue = Object.values(rankCounts); // Array of counts, e.g., [3, 2, 1, 1...]

    // 1. 至尊清龙 (Royal Dragon)
    const isDragonSequence = ranksAceHigh.every((rank, index, arr) => index === 0 ? rank === 14 : rank === arr[index-1] - 1) && ranksAceHigh[12] === 2; // A,K,Q...3,2
    if (isDragonSequence && new Set(suits).size === 1) {
        return { type: HAND_TYPES.ROYAL_DRAGON, message: HAND_TYPE_MESSAGES[HAND_TYPES.ROYAL_DRAGON], ranks: ranksAceHigh, originalCards: thirteenCards, isSpecial: true };
    }
    // 2. 一条龙 (Dragon)
    if (isDragonSequence) {
        return { type: HAND_TYPES.DRAGON, message: HAND_TYPE_MESSAGES[HAND_TYPES.DRAGON], ranks: ranksAceHigh, originalCards: thirteenCards, isSpecial: true };
    }
    // 3. 十二皇族 (Twelve Royals)
    const royalValues = [RANK_VALUES.J, RANK_VALUES.Q, RANK_VALUES.K, RANK_VALUES.A];
    if (ranksAceHigh.filter(r => royalValues.includes(r)).length === 12) {
        return { type: HAND_TYPES.TWELVE_ROYALS, message: HAND_TYPE_MESSAGES[HAND_TYPES.TWELVE_ROYALS], ranks: ranksAceHigh, originalCards: thirteenCards, isSpecial: true };
    }
    // 4. 三套三条 (THREE_SETS_OF_TRIPS) - three sets of 3-of-a-kind
    let numTripSets = 0; Object.values(rankCounts).forEach(count => { if (count === 3) numTripSets++; });
    if (numTripSets === 3) { // Exactly three 3-of-a-kinds (9 cards) + 4 other cards
        return { type: HAND_TYPES.THREE_SETS_OF_TRIPS, message: HAND_TYPE_MESSAGES[HAND_TYPES.THREE_SETS_OF_TRIPS], ranks: ranksAceHigh, originalCards: thirteenCards, isSpecial: true };
    }
    // 5. 五对三条 (Five Pairs and Three-of-a-Kind)
    if (countsOfEachRankValue.filter(c => c === 2).length === 5 && countsOfEachRankValue.filter(c => c === 3).length === 1) {
        return { type: HAND_TYPES.FIVE_PAIRS_AND_TRIPS, message: HAND_TYPE_MESSAGES[HAND_TYPES.FIVE_PAIRS_AND_TRIPS], ranks: ranksAceHigh, originalCards: thirteenCards, isSpecial: true };
    }
    // 6. 六对半 (Six Pairs Plus)
    if (countsOfEachRankValue.filter(c => c === 2).length === 6 && countsOfEachRankValue.filter(c => c === 1).length === 1) {
        return { type: HAND_TYPES.SIX_PAIRS_PLUS, message: HAND_TYPE_MESSAGES[HAND_TYPES.SIX_PAIRS_PLUS], ranks: ranksAceHigh, originalCards: thirteenCards, isSpecial: true };
    }
    // 7. 凑一色 (Same Color)
    const isAllRed = cards.every(c => SUITS_DATA[c.suitKey]?.fileNamePart === 'hearts' || SUITS_DATA[c.suitKey]?.fileNamePart === 'diamonds');
    const isAllBlack = cards.every(c => SUITS_DATA[c.suitKey]?.fileNamePart === 'spades' || SUITS_DATA[c.suitKey]?.fileNamePart === 'clubs');
    if (isAllRed || isAllBlack) {
        return { type: HAND_TYPES.SAME_COLOR, message: HAND_TYPE_MESSAGES[HAND_TYPES.SAME_COLOR], ranks: ranksAceHigh, originalCards: thirteenCards, isSpecial: true };
    }
    // 8. 全小 / 全大 (Define your ranges: e.g., Small 2-8, Big 9-A or 8-A)
    // Example: Small 2-8 (inclusive), Big 9-A (inclusive)
    const isAllSmallCards = ranksAceHigh.every(r => r >= RANK_VALUES["2"] && r <= RANK_VALUES["8"]);
    if (isAllSmallCards) return { type: HAND_TYPES.ALL_SMALL, message: HAND_TYPE_MESSAGES[HAND_TYPES.ALL_SMALL], ranks: ranksAceHigh, originalCards: thirteenCards, isSpecial: true };
    const isAllBigCards = ranksAceHigh.every(r => r >= RANK_VALUES["9"] && r <= RANK_VALUES.A);
    if (isAllBigCards) return { type: HAND_TYPES.ALL_BIG, message: HAND_TYPE_MESSAGES[HAND_TYPES.ALL_BIG], ranks: ranksAceHigh, originalCards: thirteenCards, isSpecial: true };

    // "三同花" and "三顺子" as 13-card immediate wins are complex and typically depend on specific rules
    // for how "potential" is defined. Usually, these are evaluated for arranged hands.
    // If you have simple definitions (e.g., 13 cards of only 3 suits for three flushes potential), add them.

    return null; // No special 13-card hand found
}

// --- CORE POKER HAND EVALUATION LOGIC (3 or 5 cards) ---
function evaluateHand(cards){if(!cards||!Array.isArray(cards)||(cards.length!==3&&cards.length!==5)){return{type:HAND_TYPES.HIGH_CARD,message:"无效牌数",ranks:[],originalCards:cards,isSpecial:false};}if(cards.some(c=>!c||typeof c.rank==='undefined'||typeof c.suitKey==='undefined')){return{type:HAND_TYPES.HIGH_CARD,message:"牌数据错误",ranks:[],originalCards:cards,isSpecial:false};}const n=cards.length;const sR=sortCardsByRankValue(cards,false,false);const pR=sR.map(c=>getRankValue(c));const sS=cards.map(c=>c.suitKey);const iF=(n===5||(n===3&&HAND_TYPES.FLUSH>HAND_TYPES.STRAIGHT))&&new Set(sS).size===1;let iS=false;let sHCr=0;if(n===5||n===3){const rFSaL=cards.map(c=>getRankValue(c,true)).sort((a,b)=>a-b);const uRFS=[...new Set(rFSaL)];if(uRFS.length>=n){if(uRFS[0]===1&&uRFS[1]===2&&uRFS[n-1]===n){let iWS=true;for(let i=0;i<n;i++){if(uRFS[i]!==i+1){iWS=false;break;}}if(iWS){iS=true;sHCr=n;}}if(!iS){const uAHd=[...new Set(pR)].sort((a,b)=>b-a);for(let i=0;i<=uAHd.length-n;i++){let iSq=true;for(let j=0;j<n-1;j++){if(uAHd[i+j]!==uAHd[i+j+1]+1){iSq=false;break;}}if(iSq){iS=true;sHCr=uAHd[i];break;}}}}}const rC={};pR.forEach(r=>rC[r]=(rC[r]||0)+1);const cS=Object.values(rC).sort((a,b)=>b-a);const dRS=Object.keys(rC).map(Number).sort((a,b)=>b-a);let hT=HAND_TYPES.HIGH_CARD;let rFC=[...pR];let sHI={};if(n===5){if(iF&&iS){hT=HAND_TYPES.STRAIGHT_FLUSH;sHI.highCardRank=sHCr;rFC=sHCr===5?[5,4,3,2,1]:pR.filter(r=>r<=sHCr&&r>sHCr-5).sort((a,b)=>b-a);}else if(cS[0]===4){hT=HAND_TYPES.FOUR_OF_A_KIND;sHI.quadRank=dRS.find(r=>rC[r]===4);sHI.kicker=dRS.find(r=>rC[r]===1);rFC=[sHI.quadRank,sHI.kicker].filter(r=>r!==undefined);}else if(cS[0]===3&&cS[1]===2){hT=HAND_TYPES.FULL_HOUSE;sHI.threeRank=dRS.find(r=>rC[r]===3);sHI.pairRank=dRS.find(r=>rC[r]===2);rFC=[sHI.threeRank,sHI.pairRank];}else if(iF){hT=HAND_TYPES.FLUSH;rFC=pR;}else if(iS){hT=HAND_TYPES.STRAIGHT;sHI.highCardRank=sHCr;rFC=sHCr===5?[5,4,3,2,1]:pR.filter(r=>r<=sHCr&&r>sHCr-5).sort((a,b)=>b-a);}else if(cS[0]===3){hT=HAND_TYPES.THREE_OF_A_KIND;sHI.threeRank=dRS.find(r=>rC[r]===3);sHI.kickers=pR.filter(r=>r!==sHI.threeRank).sort((a,b)=>b-a).slice(0,2);rFC=[sHI.threeRank,...sHI.kickers];}else if(cS[0]===2&&cS[1]===2){hT=HAND_TYPES.TWO_PAIR;const pS=dRS.filter(r=>rC[r]===2).sort((a,b)=>b-a);sHI.highPair=pS[0];sHI.lowPair=pS[1];sHI.kicker=dRS.find(r=>rC[r]===1);rFC=[sHI.highPair,sHI.lowPair,sHI.kicker].filter(r=>r!==undefined);}else if(cS[0]===2){hT=HAND_TYPES.PAIR;sHI.pairRank=dRS.find(r=>rC[r]===2);sHI.kickers=pR.filter(r=>r!==sHI.pairRank).sort((a,b)=>b-a).slice(0,3);rFC=[sHI.pairRank,...sHI.kickers];}}else if(n===3){if(cS[0]===3){hT=HAND_TYPES.THREE_OF_A_KIND;sHI.threeRank=pR[0];rFC=[sHI.threeRank];}else if(cS[0]===2){hT=HAND_TYPES.PAIR;sHI.pairRank=dRS.find(r=>rC[r]===2);sHI.kicker=dRS.find(r=>rC[r]===1);rFC=[sHI.pairRank,sHI.kicker].filter(r=>r!==undefined);}}return{type:hT,ranks:rFC.filter(r=>r!==undefined&&r!==null),message:HAND_TYPE_MESSAGES[hT]||"未知牌型",originalCards:cards,isSpecial:false,...sHI};}
function compareHandInfos(h1,h2){if(!h1||!h2||typeof h1.type==='undefined'||typeof h2.type==='undefined')return 0;const s1=h1.isSpecial||h1.type>=HAND_TYPES.THIRTEEN_CARDS_SPECIAL_BASE,s2=h2.isSpecial||h2.type>=HAND_TYPES.THIRTEEN_CARDS_SPECIAL_BASE;if(s1&&!s2)return 1;if(!s1&&s2)return -1;if(h1.type!==h2.type)return h1.type>h2.type?1:-1;switch(h1.type){case HAND_TYPES.STRAIGHT_FLUSH:case HAND_TYPES.STRAIGHT:return h1.highCardRank>h2.highCardRank?1:(h1.highCardRank<h2.highCardRank?-1:0);case HAND_TYPES.FOUR_OF_A_KIND:if(h1.quadRank!==h2.quadRank)return h1.quadRank>h2.quadRank?1:-1;return(h1.kicker||0)>(h2.kicker||0)?1:((h1.kicker||0)<(h2.kicker||0)?-1:0);case HAND_TYPES.FULL_HOUSE:if(h1.threeRank!==h2.threeRank)return h1.threeRank>h2.threeRank?1:-1;return h1.pairRank>h2.pairRank?1:(h1.pairRank<h2.pairRank?-1:0);case HAND_TYPES.FLUSH:case HAND_TYPES.HIGH_CARD:for(let i=0;i<Math.min(h1.ranks.length,h2.ranks.length);i++){if(h1.ranks[i]!==h2.ranks[i])return h1.ranks[i]>h2.ranks[i]?1:-1;}return 0;case HAND_TYPES.THREE_OF_A_KIND:if(h1.threeRank!==h2.threeRank)return h1.threeRank>h2.threeRank?1:-1;if(h1.originalCards.length===5&&h1.kickers&&h2.kickers){for(let i=0;i<Math.min(h1.kickers.length,h2.kickers.length);i++){if(h1.kickers[i]!==h2.kickers[i])return h1.kickers[i]>h2.kickers[i]?1:-1;}}return 0;case HAND_TYPES.TWO_PAIR:if(h1.highPair!==h2.highPair)return h1.highPair>h2.highPair?1:-1;if(h1.lowPair!==h2.lowPair)return h1.lowPair>h2.lowPair?1:-1;return(h1.kicker||0)>(h2.kicker||0)?1:((h1.kicker||0)<(h2.kicker||0)?-1:0);case HAND_TYPES.PAIR:if(h1.pairRank!==h2.pairRank)return h1.pairRank>h2.pairRank?1:-1;const k1=h1.originalCards.length===5?h1.kickers:(h1.kicker!==undefined?[h1.kicker]:[]);const k2=h2.originalCards.length===5?h2.kickers:(h2.kicker!==undefined?[h2.kicker]:[]);if(k1&&k2){for(let i=0;i<Math.min(k1.length,k2.length);i++){if(k1[i]!==k2[i])return k1[i]>k2[i]?1:-1;}}return 0;default:return 0;}}
function checkDaoshui(top,middle,bottom){if(!top||!middle||!bottom||top.isSpecial||middle.isSpecial||bottom.isSpecial){return true;}if(compareHandInfos(top,middle)>0){return true;}if(compareHandInfos(middle,bottom)>0){return true;}return false;}
function getAIRandomValidArrangement(thirteenCards) { if(!thirteenCards||thirteenCards.length!==13||typeof evaluateHand!=="function"||typeof checkDaoshui!=="function")return null;const sA=sortCardsByRankValue(thirteenCards,false,false);for(let i=0;i<50;i++){let cH=[...thirteenCards];if(i>0){for(let k=cH.length-1;k>0;k--){const l=Math.floor(Math.random()*(k+1));[cH[k],cH[l]]=[cH[l],cH[k]];}}const bT=cH.slice(0,5),mT=cH.slice(5,10),tT=cH.slice(10,13);const tE=evaluateHand(tT),mE=evaluateHand(mT),bE=evaluateHand(bT);if(!checkDaoshui(tE,mE,bE))return{top:tT,middle:mT,bottom:bT,topEval:tE,middleEval:mE,bottomEval:bE};}const topEval=evaluateHand(sA.slice(10,13)),middleEval=evaluateHand(sA.slice(5,10)),bottomEval=evaluateHand(sA.slice(0,5));return{top:sA.slice(10,13),middle:sA.slice(5,10),bottom:sA.slice(0,5),topEval,middleEval,bottomEval };}
