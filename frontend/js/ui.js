// frontend/js/ui.js

let currentViewId = null; // 用来追踪当前显示的视图的ID (例如 'auth', 'lobby', 'room')

/**
 * 切换到指定的视图。
 * @param {string} viewIdKey 要切换到的视图的键名 ('auth', 'lobby', 'room')
 */
function switchToView(viewIdKey) {
    console.log(`UI: Attempting to switch to view with key: ${viewIdKey}`);

    // 定义一个从键名到实际 HTML ID 的映射
    const viewIdMapping = {
        'auth': 'auth-view',
        'lobby': 'lobby-view',
        'room': 'room-view'
        // 如果将来有其他视图，在这里添加映射
    };

    const targetHtmlId = viewIdMapping[viewIdKey]; // 获取目标视图的 HTML ID

    if (!targetHtmlId) {
        console.error(`UI Error: No HTML ID mapping found for view key "${viewIdKey}".`);
        return;
    }

    // 动态获取所有需要控制的视图的 DOM 元素引用
    const authViewEl = document.getElementById('auth-view');
    const lobbyViewEl = document.getElementById('lobby-view');
    const roomViewEl = document.getElementById('room-view');

    const allViewElements = [authViewEl, lobbyViewEl, roomViewEl]; // 将所有视图元素放入数组
    const targetViewElement = document.getElementById(targetHtmlId); // 获取目标视图元素

    // 调试日志
    // console.log(`UI: HTML ID for key "${viewIdKey}" is "${targetHtmlId}"`);
    // console.log(`UI: Target element for "${targetHtmlId}":`, targetViewElement);

    if (currentViewId === viewIdKey && targetViewElement && !targetViewElement.classList.contains('hidden')) {
        // console.log(`UI: Already on view: ${viewIdKey}`);
        return;
    }

    // 隐藏所有已知的视图
    allViewElements.forEach(el => {
        if (el) { // 确保元素存在才操作
            el.classList.add('hidden');
        }
    });

    // 显示目标视图
    if (targetViewElement) {
        targetViewElement.classList.remove('hidden');
        currentViewId = viewIdKey; // 更新当前显示的视图的键名
        console.log(`UI: Successfully switched to view: ${viewIdKey} (HTML ID: ${targetHtmlId})`);
    } else {
        // 这个错误会在 HTML 中确实没有对应 ID 的元素时触发
        console.error(`UI Error: HTML Element with ID "${targetHtmlId}" (for view key "${viewIdKey}") not found in DOM.`);
    }
}

/**
 * 初始化视图，确保在应用加载时所有视图都被隐藏。
 */
function initViews() {
    console.log('UI: Initializing views (hiding all).');

    const authViewEl = document.getElementById('auth-view');
    const lobbyViewEl = document.getElementById('lobby-view');
    const roomViewEl = document.getElementById('room-view');

    if (authViewEl) authViewEl.classList.add('hidden');
    else console.warn("UI init: 'auth-view' element not found.");

    if (lobbyViewEl) lobbyViewEl.classList.add('hidden');
    else console.warn("UI init: 'lobby-view' element not found.");

    if (roomViewEl) roomViewEl.classList.add('hidden');
    else console.warn("UI init: 'room-view' element not found.");

    currentViewId = null;
}
