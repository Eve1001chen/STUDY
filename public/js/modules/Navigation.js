class Navigation {
    constructor() {
        this.currentScreen = 'main-menu';
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 主選單項目點擊
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const targetScreen = item.dataset.screen;
                this.navigateTo(targetScreen);
            });
        });

        // 返回按鈕點擊
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetScreen = btn.dataset.target;
                this.navigateTo(targetScreen);
            });
        });
    }

    navigateTo(screenId) {
        // 隱藏當前畫面
        document.getElementById(this.currentScreen).classList.remove('active');
        
        // 顯示目標畫面
        const targetScreen = document.getElementById(screenId);
        targetScreen.classList.add('active');
        
        // 更新當前畫面
        this.currentScreen = screenId;

        // 觸發畫面切換事件
        const event = new CustomEvent('screenChanged', {
            detail: { screen: screenId }
        });
        document.dispatchEvent(event);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.navigation = new Navigation();
});