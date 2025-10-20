// 資料庫配置
const db = new Gun({
    peers: [
        'http://localhost:8765/gun', // 本地開發用
        'https://gun-matrix.herokuapp.com/gun' // 備用公共伺服器
    ],
    localStorage: false, // 禁用本地存儲，使用 IndexedDB
    radisk: true // 使用 RadiskDB 進行持久化存儲
});

// 核心模組
import { TimeTracker } from './modules/TimeTracker.js';
import { ProgressTracker } from './modules/ProgressTracker.js';
import { MotivationSystem } from './modules/MotivationSystem.js';
import { SocialSystem } from './modules/SocialSystem.js';
import { DataSync } from './modules/DataSync.js';

// 應用程式主類
class App {
    constructor() {
        this.dataSync = new DataSync(db);
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
        // 初始化數據同步
        this.dataSync.init();
        
        // 初始化各個模組
        await Promise.all([
            this.timeTracker.init(),
            this.progressTracker.init(),
            this.motivationSystem.init(),
            this.socialSystem.init()
        ]);

        // 監控同步狀態
        setInterval(() => {
            const syncStatus = this.dataSync.getSyncStatus();
            this.updateSyncStatusUI(syncStatus);
        }, 5000);
    }

    updateSyncStatusUI(status) {
        const statusElement = document.getElementById('sync-status');
        if (statusElement) {
            statusElement.textContent = `同步狀態: ${status.isOnline ? '在線' : '離線'} | 節點數: ${status.peersCount}`;
            statusElement.className = status.isOnline ? 'status-online' : 'status-offline';
        }
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