// 資料庫配置
const db = new Gun({
    peers: ['http://localhost:8765/gun'] // 本地開發用，生產環境需要更改
});

// 核心模組
import { TimeTracker } from './modules/TimeTracker.js';
import { ProgressTracker } from './modules/ProgressTracker.js';
import { MotivationSystem } from './modules/MotivationSystem.js';
import { SocialSystem } from './modules/SocialSystem.js';

// 應用程式主類
class App {
    constructor() {
        this.timeTracker = new TimeTracker(db);
        this.progressTracker = new ProgressTracker(db);
        this.motivationSystem = new MotivationSystem(db);
        this.socialSystem = new SocialSystem(db);
        
        this.init();
    }

    async init() {
        try {
            await this.initializeComponents();
            this.setupEventListeners();
            console.log('應用程式初始化成功');
        } catch (error) {
            console.error('應用程式初始化失敗:', error);
        }
    }

    async initializeComponents() {
        // 初始化各個模組
        await Promise.all([
            this.timeTracker.init(),
            this.progressTracker.init(),
            this.motivationSystem.init(),
            this.socialSystem.init()
        ]);
    }

    setupEventListeners() {
        // 設置事件監聽器
        window.addEventListener('unload', () => {
            // 保存狀態
            this.timeTracker.saveState();
            this.progressTracker.saveState();
        });
    }
}

// 當 DOM 載入完成後初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});