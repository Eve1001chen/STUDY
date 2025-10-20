export class UIController {
    constructor(timeTracker, progressTracker, motivationSystem, dataSync) {
        this.timeTracker = timeTracker;
        this.progressTracker = progressTracker;
        this.motivationSystem = motivationSystem;
        this.dataSync = dataSync;
        
        // 計時器更新間隔
        this.timerInterval = null;
        
        // UI元素快取
        this.elements = {
            timer: {
                hours: document.getElementById('hours'),
                minutes: document.getElementById('minutes'),
                seconds: document.getElementById('seconds'),
                startBtn: document.getElementById('start-timer'),
                pauseBtn: document.getElementById('pause-timer'),
                stopBtn: document.getElementById('stop-timer')
            },
            level: {
                title: document.getElementById('level-title'),
                progress: document.getElementById('level-progress'),
                points: document.getElementById('total-points')
            },
            form: document.getElementById('study-progress-form'),
            syncStatus: document.getElementById('sync-status'),
            streakCount: document.getElementById('streak-count'),
            streakBonus: document.getElementById('streak-bonus'),
            achievements: document.getElementById('achievements'),
            dailySummary: document.getElementById('daily-summary'),
            studyTrends: document.getElementById('study-trends'),
            currentChallenge: document.getElementById('current-challenge')
        };

        // 綁定事件處理程序
        this.bindEvents();
    }

    init() {
        this.updateTimerDisplay(0);
        this.updateSyncStatus();
        this.loadUserProgress();
        this.setupCharts();
        this.loadAchievements();
        this.loadWeeklyChallenge();
    }

    bindEvents() {
        // 計時器控制
        this.elements.timer.startBtn.addEventListener('click', () => this.startTimer());
        this.elements.timer.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.elements.timer.stopBtn.addEventListener('click', () => this.stopTimer());

        // 表單提交
        this.elements.form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // 範圍選擇器更新
        document.getElementById('difficulty').addEventListener('input', (e) => {
            document.getElementById('difficulty-value').textContent = e.target.value;
        });
        document.getElementById('comprehension').addEventListener('input', (e) => {
            document.getElementById('comprehension-value').textContent = e.target.value;
        });
    }

    startTimer() {
        this.timeTracker.startTimer();
        this.elements.timer.startBtn.disabled = true;
        this.elements.timer.pauseBtn.disabled = false;
        this.elements.timer.stopBtn.disabled = false;

        // 開始定期更新顯示
        this.timerInterval = setInterval(() => {
            this.updateTimerDisplay(this.timeTracker.getCurrentStudyTime());
        }, 1000);
    }

    pauseTimer() {
        this.timeTracker.pauseTimer();
        this.elements.timer.startBtn.disabled = false;
        this.elements.timer.pauseBtn.disabled = true;

        // 停止更新顯示
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    stopTimer() {
        const duration = this.timeTracker.getCurrentStudyTime();
        this.timeTracker.pauseTimer();
        this.elements.timer.startBtn.disabled = false;
        this.elements.timer.pauseBtn.disabled = true;
        this.elements.timer.stopBtn.disabled = true;
        
        // 停止更新顯示
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // 重置計時器顯示
        this.updateTimerDisplay(0);
        
        if (duration > 0) {
            // 開啟記錄表單並預填時間
            this.openStudyRecordForm(duration);
        }
    }

    openStudyRecordForm(duration) {
        // 計算時間
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        
        // 顯示表單
        this.elements.form.style.display = 'block';
        
        // 添加學習時間提示
        const timeInfo = document.createElement('div');
        timeInfo.className = 'time-info';
        timeInfo.innerHTML = `學習時間：${hours}小時${minutes}分鐘`;
        this.elements.form.insertBefore(timeInfo, this.elements.form.firstChild);
    }

    updateTimerDisplay(seconds) {
        if (typeof seconds !== 'number' || isNaN(seconds)) {
            console.error('Invalid seconds value:', seconds);
            seconds = 0;
        }

        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        
        if (this.elements.timer.hours && 
            this.elements.timer.minutes && 
            this.elements.timer.seconds) {
            
            this.elements.timer.hours.textContent = h.toString().padStart(2, '0');
            this.elements.timer.minutes.textContent = m.toString().padStart(2, '0');
            this.elements.timer.seconds.textContent = s.toString().padStart(2, '0');
        } else {
            console.error('Timer elements not found');
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = {
            subject: document.getElementById('subject').value,
            topic: document.getElementById('topic').value,
            difficulty: parseInt(document.getElementById('difficulty').value),
            comprehension: parseInt(document.getElementById('comprehension').value),
            notes: document.getElementById('notes').value,
            duration: this.timeTracker.getCurrentStudyTime()
        };

        try {
            // 記錄學習進度
            await this.progressTracker.recordProgress(formData);
            
            // 計算並添加積分
            const points = await this.motivationSystem.calculatePointsWithBonus(formData);
            await this.motivationSystem.addPoints(points);
            
            // 更新UI
            this.updateUserProgress();
            this.showSuccessMessage('學習記錄已保存！獲得 ' + points + ' 點積分');
            
            // 重置表單
            e.target.reset();
        } catch (error) {
            console.error('保存學習記錄失敗:', error);
            this.showErrorMessage('保存失敗，請稍後再試');
        }
    }

    async updateUserProgress() {
        // 更新等級和積分
        const points = await this.motivationSystem.getCurrentPoints();
        const level = this.motivationSystem.calculateLevel(points);
        
        this.elements.level.title.textContent = level.title;
        this.elements.level.points.textContent = points;
        this.elements.level.progress.style.width = 
            ((points - level.pointsNeeded) / (level.nextLevelPoints - level.pointsNeeded) * 100) + '%';

        // 更新連續學習天數
        const streak = await this.motivationSystem.calculateStudyStreak();
        this.elements.streakCount.textContent = streak;
        this.elements.streakBonus.textContent = 
            Math.min(streak * this.motivationSystem.config.streakBonus * 100, 
                    this.motivationSystem.config.maxStreakBonus * 100);

        // 更新統計圖表
        this.updateCharts();
    }

    setupCharts() {
        // 設置學習趨勢圖表
        this.trendChart = new Chart(
            document.createElement('canvas').getContext('2d'),
            {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: '學習時間 (小時)',
                        data: [],
                        borderColor: '#4CAF50',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            }
        );
        
        this.elements.studyTrends.appendChild(this.trendChart.canvas);
    }

    async updateCharts() {
        // 更新學習趨勢
        const trends = await this.progressTracker.getStudyTrends(7);
        this.trendChart.data.labels = trends.map(t => t.date);
        this.trendChart.data.datasets[0].data = trends.map(t => t.totalTime / 3600);
        this.trendChart.update();
    }

    showSuccessMessage(message) {
        // 實現提示訊息顯示邏輯
        alert(message); // 可以改為更友善的提示UI
    }

    showErrorMessage(message) {
        // 實現錯誤訊息顯示邏輯
        alert(message); // 可以改為更友善的提示UI
    }

    updateSyncStatus() {
        const status = this.dataSync.getSyncStatus();
        this.elements.syncStatus.className = status.isOnline ? 'status-online' : 'status-offline';
        this.elements.syncStatus.innerHTML = `
            <i class="fas ${status.isOnline ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            同步狀態: ${status.isOnline ? '在線' : '離線'} | 節點數: ${status.peersCount}
        `;
    }
}