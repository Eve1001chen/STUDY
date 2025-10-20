import { TimeTracker } from './modules/TimeTracker.js';
import { ProgressTracker } from './modules/ProgressTracker.js';
import { MotivationSystem } from './modules/MotivationSystem.js';
import { DataSync } from './modules/DataSync.js';
import { UIController } from './modules/UIController.js';

class App {
    constructor() {
        // 初始化資料庫連接
        this.db = new Gun({
            peers: [
                'http://localhost:8765/gun',
                'https://gun-matrix.herokuapp.com/gun'
            ],
            localStorage: false,
            radisk: true
        });

        // 初始化核心模組
        this.dataSync = new DataSync(this.db);
        this.timeTracker = new TimeTracker(this.db);
        this.progressTracker = new ProgressTracker(this.db);
        this.motivationSystem = new MotivationSystem(this.db);
        
        // 初始化 UI 控制器
        this.ui = new UIController(
            this.timeTracker,
            this.progressTracker,
            this.motivationSystem,
            this.dataSync
        );

        this.init();
    }

    async init() {
        try {
            // 初始化數據同步
            this.dataSync.init();
            
            // 初始化各模組
            await Promise.all([
                this.timeTracker.init(),
                this.progressTracker.init(),
                this.motivationSystem.init()
            ]);

            // 初始化 UI
            this.ui.init();

            console.log('應用程式初始化成功');
        } catch (error) {
            console.error('應用程式初始化失敗:', error);
        }
    }
}

// 當 DOM 載入完成後初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});