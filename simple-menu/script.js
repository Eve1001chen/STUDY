// 顯示指定的畫面
function showScreen(screenId) {
    // 隱藏所有畫面
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });

    // 顯示指定的畫面
    const targetScreen = document.getElementById(screenId);
    targetScreen.classList.add('active');
}

// 添加鍵盤事件監聽器（按 ESC 返回主選單）
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        showScreen('main-menu');
    }
});