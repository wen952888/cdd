// frontend/js/ui.js

let currentViewId = null;

/**
 * 切换到指定的视图。
 * @param {string} viewId 要切换到的视图的ID ('auth', 'lobby', 'room')
 */
function switchToView(viewId) {
    // 动态获取所有视图的 DOM 元素引用
    const viewElements = {
        auth: document.getElementById('auth-view'),
        lobby: document.getElementById('lobby-view'),
        room: document.getElementById('room-view')
        // 如果将来有其他视图，在这里添加
    };

    // 检查目标视图元素是否存在
    const targetViewElement = viewElements[viewId];

    // Debugging logs
    // console.log(`Attempting to switch to view: ${viewId}`);
    // console.log(`Element for 'auth-view':`, viewElements.auth);
    // console.log(`Element for 'lobby-view':`, viewElements.lobby);
    // console.log(`Element for 'room-view':`, viewElements.room);
    // console.log(`Target element for '${viewId}':`, targetViewElement);


    if (currentViewId === viewId && targetViewElement && !targetViewElement.classList.contains('hidden')) {
        // console.log(`Already on view: ${viewId}`);
        return; // 如果已经是当前视图且可见，则不执行任何操作
    }

    // 隐藏所有已知的视图
    for (const id in viewElements) {
        if (viewElements[id]) { // 确保元素存在才操作
            viewElements[id].classList.add('hidden');
        } else {
            // console.warn(`UI: Element for view '${id}' not found when trying to hide.`);
        }
    }

    // 显示目标视图
    if (targetViewElement) {
        targetViewElement.classList.remove('hidden');
        currentViewId = viewId;
        // console.log(`Successfully switched to view: ${viewId}`);
    } else {
        console.error(`UI Error: View element with id key "${viewId}" (maps to HTML id "${viewId}-view") not found in DOM or in viewElements mapping.`);
    }
}

/**
 * 初始化视图，确保在应用加载时所有视图都被隐藏。
 * 这个函数应该在 DOMContentLoaded之后，但在任何 switchToView 调用之前被调用。
 */
function initViews() {
    // console.log('UI: Initializing views (hiding all).');
    // 动态获取并隐藏
    const viewAuth = document.getElementById('auth-view');
    const viewLobby = document.getElementById('lobby-view');
    const viewRoom = document.getElementById('room-view');

    if (viewAuth) viewAuth.classList.add('hidden');
    if (viewLobby) viewLobby.classList.add('hidden');
    if (viewRoom) viewRoom.classList.add('hidden');

    currentViewId = null; // 重置当前视图ID
}
