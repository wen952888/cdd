// frontend/js/app.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('App DOM Loaded. Initializing...');

    // 1. 初始化视图状态 (确保所有视图先隐藏)
    initViews();

    // 2. 绑定认证相关的事件监听器
    const regBtn = document.getElementById('registerButton');
    const loginBtn = document.getElementById('loginButton');
    const logoutBtn = document.getElementById('logoutButton');

    // 确保元素存在再绑定事件，避免早期null错误
    if (regBtn) regBtn.addEventListener('click', handleRegister);
    else console.warn('Register button not found');

    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    else console.warn('Login button not found');

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    else console.warn('Logout button not found');

    // 3. 检查用户当前的登录状态 (这将决定初始显示的视图)
    checkAuthStatusOnLoad(); // 这个函数内部会调用 switchToView

    // --- 后续阶段将在这里添加大厅和房间的逻辑 ---
    console.log('App initialized.');
});
