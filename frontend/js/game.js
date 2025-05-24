// frontend/js/game.js

// --- Constants for Card Data, Types, and Image Paths ---
const SUITS_DATA = { SPADES: { displayChar: "♠", cssClass: "spades", fileNamePart: "spades", sortOrder: 4 }, HEARTS: { displayChar: "♥", cssClass: "hearts", fileNamePart: "hearts", sortOrder: 3 }, CLUBS: { displayChar: "♣", cssClass: "clubs", fileNamePart: "clubs", sortOrder: 2 }, DIAMONDS: { displayChar: "♦", cssClass: "diamonds", fileNamePart: "diamonds", sortOrder: 1 }};
const RANKS_LOGIC_DISPLAY = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const RANK_FILENAME_PART = {"A":"ace","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9","10":"10","J":"jack","Q":"queen","K":"king"};
const RANK_VALUES = {"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"10":10,"J":11,"Q":12,"K":13,"A":14};
const HAND_TYPES = {HIGH_CARD:0,PAIR:1,TWO_PAIR:2,THREE_OF_A_KIND:3,STRAIGHT:4,FLUSH:5,FULL_HOUSE:6,FOUR_OF_A_KIND:7,STRAIGHT_FLUSH:8,THIRTEEN_CARDS_SPECIAL_BASE:100,SIX_PAIRS_PLUS:101,THREE_FLUSHES_THIRTEEN:102,THREE_STRAIGHTS_THIRTEEN:103,ALL_SMALL:104,ALL_BIG:105,SAME_COLOR:106,THREE_SETS_OF_TRIPS:107,FIVE_PAIRS_AND_TRIPS:108,TWELVE_ROYALS:109,DRAGON:110,ROYAL_DRAGON:111};
const HAND_TYPE_MESSAGES = {[HAND_TYPES.HIGH_CARD]:"乌龙",[HAND_TYPES.PAIR]:"对子",[HAND_TYPES.TWO_PAIR]:"两对",[HAND_TYPES.THREE_OF_A_KIND]:"三条",[HAND_TYPES.STRAIGHT]:"顺子",[HAND_TYPES.FLUSH]:"同花",[HAND_TYPES.FULL_HOUSE]:"葫芦",[HAND_TYPES.FOUR_OF_A_KIND]:"铁支",[HAND_TYPES.STRAIGHT_FLUSH]:"同花顺",[HAND_TYPES.SIX_PAIRS_PLUS]:"六对半",[HAND_TYPES.THREE_FLUSHES_THIRTEEN]:"三同花（特殊）",[HAND_TYPES.THREE_STRAIGHTS_THIRTEEN]:"三顺子（特殊）",[HAND_TYPES.ALL_SMALL]:"全小",[HAND_TYPES.ALL_BIG]:"全大",[HAND_TYPES.SAME_COLOR]:"凑一色",[HAND_TYPES.THREE_SETS_OF_TRIPS]:"三套三条",[HAND_TYPES.FIVE_PAIRS_AND_TRIPS]:"五对三条",[HAND_TYPES.TWELVE_ROYALS]:"十二皇族",[HAND_TYPES.DRAGON]:"一条龙",[HAND_TYPES.ROYAL_DRAGON]:"至尊清龙"};
const CARD_IMAGE_PATH_PREFIX = 'images/cards/';
const CARD_IMAGE_EXTENSION = '.png';
const UNKNOWN_CARD_FILENAME = `unknown${CARD_IMAGE_EXTENSION}`;

// --- Image Path Generation ---
function getCardImageFilename(card){if(typeof RANK_FILENAME_PART==='undefined'||typeof SUITS_DATA==='undefined'||typeof CARD_IMAGE_EXTENSION==='undefined'||typeof UNKNOWN_CARD_FILENAME==='undefined'){console.error("FATAL: getCardImageFilename constants missing.");return 'error_constants.png';}if(!card||typeof card.rank!=='string'||typeof card.suitKey!=='string'){return UNKNOWN_CARD_FILENAME;}const rK=card.rank.toUpperCase();const rP=RANK_FILENAME_PART[rK];const sI=SUITS_DATA[card.suitKey];const sP=sI?sI.fileNamePart:null;if(!rP){return `unknown_rank_${card.rank.toLowerCase()}${CARD_IMAGE_EXTENSION}`;}if(!sP){return `unknown_suit_${card.suitKey.toLowerCase()}${CARD_IMAGE_EXTENSION}`;}return `${rP}_of_${sP}${CARD_IMAGE_EXTENSION}`;}
function getCardImagePath(card){if(typeof CARD_IMAGE_PATH_PREFIX!=='string'||typeof UNKNOWN_CARD_FILENAME!=='string'){console.error("FATAL: getCardImagePath constants missing.");return 'error_prefix/path.png';}const fN=getCardImageFilename(card);if(typeof fN!=='string'||fN.trim()===""){return CARD_IMAGE_PATH_PREFIX+UNKNOWN_CARD_FILENAME;}return CARD_IMAGE_PATH_PREFIX+fN;}
function getCardBackImagePath(){if(typeof CARD_IMAGE_PATH_PREFIX!=='string'||typeof CARD_IMAGE_EXTENSION!=='string'){return 'error_prefix/back.png';}return CARD_IMAGE_PATH_PREFIX+'back'+CARD_IMAGE_EXTENSION;}

// --- Card Utility Functions ---
function getRankValue(card,aceAsOne=false){if(!card?.rank)return 0;const rU=card.rank.toUpperCase();if(aceAsOne&&rU==="A")return 1;return RANK_VALUES[rU]||0;}
function sortHandCardsForDisplay(cards){if(!Array.isArray(cards))return[];return[...cards].sort((a,b)=>{const rA=getRankValue(a),rB=getRankValue(b);if(rA!==rB)return rB-rA;const sA=SUITS_DATA[a.suitKey]?.sortOrder||0,sB=SUITS_DATA[b.suitKey]?.sortOrder||0;return sB-sA;});}
function sortCardsByRankValue(cards,aceAsOne=false,ascending=false){if(!Array.isArray(cards))return[];return[...cards].sort((a,b)=>(getRankValue(a,aceAsOne)-getRankValue(b,aceAsOne))*(ascending?1:-1));}

// --- Special 13-Card Hand Evaluation ---
function evaluateThirteenCardSpecial(thirteenCards) {
    if (!thirteenCards || thirteenCards.length !== 13) return null;
    const cards = sortCardsByRankValue(thirteenCards, false, false); // Ace high general sort
    const ranks = cards.map(c => getRankValue(c));
    const suits = cards.map(c => c.suitKey);
    const rankCounts = {}; ranks.forEach(rank => rankCounts[rank] = (rankCounts[rank] || 0) + 1);
    const countsOfRanks = Object.values(rankCounts);

    // Example: Dragon (A-2 straight)
    const isDragonSeq = "14,13,12,11,10,9,8,7,6,5,4,3,2";
    if (ranks.join(',') === isDragonSeq) {
        if (new Set(suits).size === 1) return { type: HAND_TYPES.ROYAL_DRAGON, message: HAND_TYPE_MESSAGES[HAND_TYPES.ROYAL_DRAGON], ranks, originalCards: thirteenCards, isSpecial: true };
        return { type: HAND_TYPES.DRAGON, message: HAND_TYPE_MESSAGES[HAND_TYPES.DRAGON], ranks, originalCards: thirteenCards, isSpecial: true };
    }
    // Example: Six Pairs Plus
    if (countsOfRanks.filter(c => c === 2).length === 6 && countsOfRanks.filter(c => c === 1).length === 1) {
        return { type: HAND_TYPES.SIX_PAIRS_PLUS, message: HAND_TYPE_MESSAGES[HAND_TYPES.SIX_PAIRS_PLUS], ranks, originalCards: thirteenCards, isSpecial: true };
    }
    // !!! ADD MORE SPECIAL HAND CHECKS HERE based on your rules (Twelve Royals, Same Color, All Big/Small etc.) !!!
    // console.warn("evaluateThirteenCardSpecial needs more specific implementations for all special hands.");
    return null;
}

// --- Evaluate a single Dui (3 or 5 cards) ---
// This is a more detailed implementation than a simple placeholder.
// However, YOU MUST TEST AND REFINE THIS THOROUGHLY based on precise poker rules.
function evaluateHand(cards) {
    if(!cards||!Array.isArray(cards)||(cards.length!==3&&cards.length!==5)){return{type:HAND_TYPES.HIGH_CARD,message:"无效牌数",ranks:[],originalCards:cards,isSpecial:false};}
    if(cards.some(c=>!c||typeof c.rank==='undefined'||typeof c.suitKey==='undefined')){return{type:HAND_TYPES.HIGH_CARD,message:"牌数据错误",ranks:[],originalCards:cards,isSpecial:false};}
    const n=cards.length; const sR=sortCardsByRankValue(cards,false,false); const pR=sR.map(c=>getRankValue(c)); const sS=cards.map(c=>c.suitKey); const iF=(n===5||(n===3 && HAND_TYPES.FLUSH > HAND_TYPES.STRAIGHT))&&new Set(sS).size===1; let iS=false; let sHCr=0;
    if(n===5||n===3){const rFSaL=cards.map(c=>getRankValue(c,true)).sort((a,b)=>a-b);const uRFS=[...new Set(rFSaL)];if(uRFS.length>=n){if(uRFS[0]===1&&uRFS[1]===2&&uRFS[n-1]===n){let iWS=true;for(let i=0;i<n;i++){if(uRFS[i]!==i+1){iWS=false;break;}}if(iWS){iS=true;sHCr=n;}}if(!iS){const uAHd=[...new Set(pR)].sort((a,b)=>b-a);for(let i=0;i<=uAHd.length-n;i++){let iSq=true;for(let j=0;j<n-1;j++){if(uAHd[i+j]!==uAHd[i+j+1]+1){iSq=false;break;}}if(iSq){iS=true;sHCr=uAHd[i];break;}}}}}
    const rC={};pR.forEach(r=>rC[r]=(rC[r]||0)+1);const cS=Object.values(rC).sort((a,b)=>b-a);const dRS=Object.keys(rC).map(Number).sort((a,b)=>b-a);let hT=HAND_TYPES.HIGH_CARD;let rFC=[...pR];let sHI={};
    if(n===5){if(iF&&iS){hT=HAND_TYPES.STRAIGHT_FLUSH;sHI.highCardRank=sHCr;rFC=sHCr===5?[5,4,3,2,1]:pR.filter(r=>r<=sHCr&&r>sHCr-5).sort((a,b)=>b-a);}else if(cS[0]===4){hT=HAND_TYPES.FOUR_OF_A_KIND;sHI.quadRank=dRS.find(r=>rC[r]===4);sHI.kicker=dRS.find(r=>rC[r]===1);rFC=[sHI.quadRank,sHI.kicker].filter(r=>r!==undefined);}else if(cS[0]===3&&cS[1]===2){hT=HAND_TYPES.FULL_HOUSE;sHI.threeRank=dRS.find(r=>rC[r]===3);sHI.pairRank=dRS.find(r=>rC[r]===2);rFC=[sHI.threeRank,sHI.pairRank];}else if(iF){hT=HAND_TYPES.FLUSH;rFC=pR;}else if(iS){hT=HAND_TYPES.STRAIGHT;sHI.highCardRank=sHCr;rFC=sHCr===5?[5,4,3,2,1]:pR.filter(r=>r<=sHCr&&r>sHCr-5).sort((a,b)=>b-a);}else if(cS[0]===3){hT=HAND_TYPES.THREE_OF_A_KIND;sHI.threeRank=dRS.find(r=>rC[r]===3);sHI.kickers=pR.filter(r=>r!==sHI.threeRank).sort((a,b)=>b-a).slice(0,2);rFC=[sHI.threeRank,...sHI.kickers];}else if(cS[0]===2&&cS[1]===2){hT=HAND_TYPES.TWO_PAIR;const pS=dRS.filter(r=>rC[r]===2).sort((a,b)=>b-a);sHI.highPair=pS[0];sHI.lowPair=pS[1];sHI.kicker=dRS.find(r=>rC[r]===1);rFC=[sHI.highPair,sHI.lowPair,sHI.kicker].filter(r=>r!==undefined);}else if(cS[0]===2){hT=HAND_TYPES.PAIR;sHI.pairRank=dRS.find(r=>rC[r]===2);sHI.kickers=pR.filter(r=>r!==sHI.pairRank).sort((a,b)=>b-a).slice(0,3);rFC=[sHI.pairRank,...sHI.kickers];}}
    else if(n===3){if(cS[0]===3){hT=HAND_TYPES.THREE_OF_A_KIND;sHI.threeRank=pR[0];rFC=[sHI.threeRank];}else if(cS[0]===2){hT=HAND_TYPES.PAIR;sHI.pairRank=dRS.find(r=>rC[r]===2);sHI.kicker=dRS.find(r=>rC[r]===1);rFC=[sHI.pairRank,sHI.kicker].filter(r=>r!==undefined);} /* Standard 13-water head typically does not count 3-card flushes or straights. Add if your rules differ. if (iF && n===3 && HAND_TYPES.FLUSH > hT) { hT = HAND_TYPES.FLUSH; rFC = pR; } if (iS && n===3 && HAND_TYPES.STRAIGHT > hT) { hT = HAND_TYPES.STRAIGHT; sHI.highCardRank = sHCr; rFC = sHCr === 3 ? [3,2,1] : pR.filter(r=>r<=sHCr && r > sHCr-3).sort((a,b)=>b-a);}*/}
    return{type:hT,ranks:rFC.filter(r=>r!==undefined&&r!==null),message:HAND_TYPE_MESSAGES[hT]||"未知牌型",originalCards:cards,isSpecial:false,...sHI};
}

function compareHandInfos(h1,h2){if(!h1||!h2||typeof h1.type==='undefined'||typeof h2.type==='undefined')return 0;const s1=h1.isSpecial||h1.type>=HAND_TYPES.THIRTEEN_CARDS_SPECIAL_BASE,s2=h2.isSpecial||h2.type>=HAND_TYPES.THIRTEEN_CARDS_SPECIAL_BASE;if(s1&&!s2)return 1;if(!s1&&s2)return -1;if(h1.type!==h2.type)return h1.type>h2.type?1:-1;switch(h1.type){case HAND_TYPES.STRAIGHT_FLUSH:case HAND_TYPES.STRAIGHT:return h1.highCardRank>h2.highCardRank?1:(h1.highCardRank<h2.highCardRank?-1:0);case HAND_TYPES.FOUR_OF_A_KIND:if(h1.quadRank!==h2.quadRank)return h1.quadRank>h2.quadRank?1:-1;return(h1.kicker||0)>(h2.kicker||0)?1:((h1.kicker||0)<(h2.kicker||0)?-1:0);case HAND_TYPES.FULL_HOUSE:if(h1.threeRank!==h2.threeRank)return h1.threeRank>h2.threeRank?1:-1;return h1.pairRank>h2.pairRank?1:(h1.pairRank<h2.pairRank?-1:0);case HAND_TYPES.FLUSH:case HAND_TYPES.HIGH_CARD:for(let i=0;i<Math.min(h1.ranks.length,h2.ranks.length);i++){if(h1.ranks[i]!==h2.ranks[i])return h1.ranks[i]>h2.ranks[i]?1:-1;}return 0;case HAND_TYPES.THREE_OF_A_KIND:if(h1.threeRank!==h2.threeRank)return h1.threeRank>h2.threeRank?1:-1;if(h1.originalCards.length===5&&h1.kickers&&h2.kickers){for(let i=0;i<Math.min(h1.kickers.length,h2.kickers.length);i++){if(h1.kickers[i]!==h2.kickers[i])return h1.kickers[i]>h2.kickers[i]?1:-1;}}return 0;case HAND_TYPES.TWO_PAIR:if(h1.highPair!==h2.highPair)return h1.highPair>h2.highPair?1:-1;if(h1.lowPair!==h2.lowPair)return h1.lowPair>h2.lowPair?1:-1;return(h1.kicker||0)>(h2.kicker||0)?1:((h1.kicker||0)<(h2.kicker||0)?-1:0);case HAND_TYPES.PAIR:if(h1.pairRank!==h2.pairRank)return h1.pairRank>h2.pairRank?1:-1;const k1=h1.originalCards.length===5?h1.kickers:(h1.kicker!==undefined?[h1.kicker]:[]);const k2=h2.originalCards.length===5?h2.kickers:(h2.kicker!==undefined?[h2.kicker]:[]);if(k1&&k2){for(let i=0;i<Math.min(k1.length,k2.length);i++){if(k1[i]!==k2[i])return k1[i]>k2[i]?1:-1;}}return 0;default:return 0;}}
function checkDaoshui(top,middle,bottom){if(!top||!middle||!bottom||top.isSpecial||middle.isSpecial||bottom.isSpecial){return true;}if(compareHandInfos(top,middle)>0){return true;}if(compareHandInfos(middle,bottom)>0){return true;}return false;}
