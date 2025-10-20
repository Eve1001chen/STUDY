export class TimeTracker {
    constructor(db) {
        this.db = db;
        this.currentTime = 0;
        this.todayStudyTime = 0;
        this.isActive = false;
        this.timer = null;
        this.currentSession = null;
        this.lastSaveDate = new Date().toISOString().split('T')[0];
        
        // 每分鐘同步一次數據
        setInterval(() => this.syncProgress(), 60000);
        
        // 午夜重置計時器
        this.setupMidnightReset();
    }

    async init() {
        // 載入今日的學習時間
        return new Promise((resolve) => {
            this.db.get('studyTime')
                .get(this.lastSaveDate)
                .once((data) => {
                    if (data) {
                        this.todayStudyTime = data.time;
                    }
                    resolve();
                });
        });
    }

    getCurrentStudyTime() {
        return this.currentTime;
    }

    getTodayStudyTime() {
        return this.todayStudyTime;
    }

    startTimer() {
        if (!this.isActive) {
            this.isActive = true;
            this.timer = setInterval(() => {
                this.currentTime += 1;
                this.todayStudyTime += 1;
                this.syncProgress();
            }, 1000);
        }
    }

    pauseTimer() {
        if (this.isActive) {
            this.isActive = false;
            clearInterval(this.timer);
            this.timer = null;
            this.syncProgress();
        }
    }

    isRunning() {
        return this.isActive;
    }

    syncProgress() {
        const currentDate = new Date().toISOString().split('T')[0];
        
        // 如果日期改變，重置計時器
        if (currentDate !== this.lastSaveDate) {
            this.resetDailyTimer();
        }

        // 保存學習時間
        this.db.get('studyTime').get(currentDate).put({
            time: this.todayStudyTime,
            lastUpdate: Date.now(),
            date: currentDate
        });
    }

    setupMidnightReset() {
        const now = new Date();
        const night = new Date(now);
        night.setDate(night.getDate() + 1);
        night.setHours(0, 0, 0, 0);
        
        setTimeout(() => {
            this.resetDailyTimer();
            // 設置下一個午夜的重置
            this.setupMidnightReset();
        }, night.getTime() - now.getTime());
    }

    resetDailyTimer() {
        this.currentTime = 0;
        this.todayStudyTime = 0;
        this.lastSaveDate = new Date().toISOString().split('T')[0];
        if (this.isActive) {
            this.pauseTimer();
        }
    }
}