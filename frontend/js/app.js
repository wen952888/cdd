// frontend/js/app.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('App DOM Loaded. Initializing...');
    initViews(); // 先隐藏所有视图

    // 绑定认证相关的事件监听器
    const regBtn = document.getElementById('registerButton');
    const loginBtn = document.getElementById('loginButton');
    const logoutBtn = document.getElementById('logoutButton');

    if (regBtn) regBtn.addEventListener('click', handleRegister);
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // 检查用户当前的登录状态
    checkAuthStatusOnLoad();

    // --- 后续阶段将在这里添加大厅和房间的逻辑 ---
    console.log('App initialized.');
});
