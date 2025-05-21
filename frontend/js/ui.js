// frontend/js/ui.js

const views = {
    auth: document.getElementById('auth-view'),
    lobby: document.getElementById('lobby-view'),
    room: document.getElementById('room-view')
    // game: document.getElementById('game-view') // 如果游戏界面和房间等待是分开的
};

let currentViewId = null;

function switchToView(viewId) {
    if (currentViewId === viewId && views[viewId] && !views[viewId].classList.contains('hidden')) {
        return; // Already on this view
    }
    console.log(`Switching to view: ${viewId}`);
    for (const id in views) {
        if (views[id]) {
            views[id].classList.add('hidden');
        }
    }
    if (views[viewId]) {
        views[viewId].classList.remove('hidden');
        currentViewId = viewId;
    } else {
        console.error(`View with id "${viewId}" not found.`);
    }
}

// 初始化时，先隐藏所有视图，等待 auth.js 判断状态
function initViews() {
    for (const id in views) {
        if (views[id]) views[id].classList.add('hidden');
    }
}
