class YPTTimer {
    constructor() {
        this.currentSubject = '';
        this.time = 0;
        this.isRunning = false;
        this.intervalId = null;
        this.todayStats = {};
        this.initializeElements();
        this.setupEventListeners();
        this.loadTodayStats();
    }

    initializeElements() {
        this.elements = {
            subjectSelector: document.getElementById('subject-selector'),
            currentSubjectDisplay: document.getElementById('current-subject-display'),
            hours: document.getElementById('hours'),
            minutes: document.getElementById('minutes'),
            seconds: document.getElementById('seconds'),
            startBtn: document.getElementById('start-timer'),
            pauseBtn: document.getElementById('pause-timer'),
            stopBtn: document.getElementById('stop-timer'),
            todayTotal: document.getElementById('today-total-time'),
            subjectBreakdown: document.getElementById('subject-breakdown')
        };
    }

    setupEventListeners() {
        this.elements.subjectSelector.addEventListener('change', () => {
            this.currentSubject = this.elements.subjectSelector.value;
            this.elements.currentSubjectDisplay.textContent = 
                this.currentSubject || '準備開始學習';
        });

        this.elements.startBtn.addEventListener('click', () => this.start());
        this.elements.pauseBtn.addEventListener('click', () => this.pause());
        this.elements.stopBtn.addEventListener('click', () => this.stop());
    }

    start() {
        if (!this.currentSubject) {
            alert('請先選擇科目！');
            return;
        }

        if (!this.isRunning) {
            this.isRunning = true;
            this.intervalId = setInterval(() => {
                this.time++;
                this.updateDisplay();
            }, 1000);

            this.elements.startBtn.disabled = true;
            this.elements.pauseBtn.disabled = false;
            this.elements.stopBtn.disabled = false;
            this.elements.subjectSelector.disabled = true;
        }
    }

    pause() {
        if (this.isRunning) {
            clearInterval(this.intervalId);
            this.isRunning = false;
            this.elements.startBtn.disabled = false;
            this.elements.pauseBtn.disabled = true;
        }
    }

    stop() {
        this.pause();
        this.saveTime();
        this.time = 0;
        this.updateDisplay();
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;
        this.elements.subjectSelector.disabled = false;
        this.loadTodayStats();
    }

    updateDisplay() {
        const hours = Math.floor(this.time / 3600);
        const minutes = Math.floor((this.time % 3600) / 60);
        const seconds = this.time % 60;

        this.elements.hours.textContent = String(hours).padStart(2, '0');
        this.elements.minutes.textContent = String(minutes).padStart(2, '0');
        this.elements.seconds.textContent = String(seconds).padStart(2, '0');
    }

    saveTime() {
        const today = new Date().toISOString().split('T')[0];
        const currentTime = this.todayStats[this.currentSubject] || 0;
        this.todayStats[this.currentSubject] = currentTime + this.time;

        // 儲存到 GUN.js
        gun.get('studyRecords').get(today).get(this.currentSubject).put(
            this.todayStats[this.currentSubject]
        );

        this.updateTodayStats();
    }

    loadTodayStats() {
        const today = new Date().toISOString().split('T')[0];
        gun.get('studyRecords').get(today).once((data) => {
            this.todayStats = data || {};
            this.updateTodayStats();
        });
    }

    updateTodayStats() {
        // 更新總時間
        const totalSeconds = Object.values(this.todayStats).reduce((a, b) => a + b, 0);
        const totalHours = Math.floor(totalSeconds / 3600);
        const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
        const remainingSeconds = totalSeconds % 60;

        this.elements.todayTotal.textContent = 
            `${String(totalHours).padStart(2, '0')}:${String(totalMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;

        // 更新科目統計
        this.elements.subjectBreakdown.innerHTML = '';
        Object.entries(this.todayStats).forEach(([subject, seconds]) => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            
            const div = document.createElement('div');
            div.className = 'subject-stat';
            div.innerHTML = `
                <div class="subject-name">${subject}</div>
                <div class="subject-time">${hours}時${minutes}分</div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${(seconds / totalSeconds * 100) || 0}%"></div>
                </div>
            `;
            this.elements.subjectBreakdown.appendChild(div);
        });
    }
}

class StudyCalendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.initializeElements();
        this.setupEventListeners();
        this.renderCalendar();
        this.loadDailyRecord();
    }

    initializeElements() {
        this.elements = {
            currentMonth: document.getElementById('current-month'),
            calendarDays: document.getElementById('calendar-days'),
            prevMonth: document.getElementById('prev-month'),
            nextMonth: document.getElementById('next-month'),
            recordDate: document.getElementById('record-date'),
            dailySubjectRecords: document.getElementById('daily-subject-records'),
            dailyNote: document.getElementById('daily-note'),
            saveNote: document.getElementById('save-note')
        };
    }

    setupEventListeners() {
        this.elements.prevMonth.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        this.elements.nextMonth.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        this.elements.saveNote.addEventListener('click', () => {
            this.saveDailyNote();
        });
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        this.elements.currentMonth.textContent = 
            `${year}年 ${String(month + 1).padStart(2, '0')}月`;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay();
        const totalDays = lastDay.getDate();

        this.elements.calendarDays.innerHTML = '';
        
        // 填充前置空白日期
        for (let i = 0; i < startDay; i++) {
            const div = document.createElement('div');
            div.className = 'calendar-day empty';
            this.elements.calendarDays.appendChild(div);
        }

        // 生成日期格
        for (let day = 1; day <= totalDays; day++) {
            const div = document.createElement('div');
            div.className = 'calendar-day';
            div.textContent = day;

            const currentDateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // 檢查是否有學習記錄
            gun.get('studyRecords').get(currentDateString).once((data) => {
                if (data) {
                    div.classList.add('has-record');
                }
            });

            // 檢查是否為選中日期
            if (this.selectedDate.getFullYear() === year &&
                this.selectedDate.getMonth() === month &&
                this.selectedDate.getDate() === day) {
                div.classList.add('active');
            }

            div.addEventListener('click', () => {
                this.selectedDate = new Date(year, month, day);
                this.loadDailyRecord();
                
                // 更新活動狀態
                document.querySelectorAll('.calendar-day').forEach(el => {
                    el.classList.remove('active');
                });
                div.classList.add('active');
            });

            this.elements.calendarDays.appendChild(div);
        }
    }

    loadDailyRecord() {
        const dateString = this.selectedDate.toISOString().split('T')[0];
        this.elements.recordDate.textContent = 
            `${this.selectedDate.getFullYear()}年${this.selectedDate.getMonth() + 1}月${this.selectedDate.getDate()}日`;

        // 載入學習記錄
        gun.get('studyRecords').get(dateString).once((data) => {
            this.elements.dailySubjectRecords.innerHTML = '';
            
            if (data) {
                Object.entries(data).forEach(([subject, seconds]) => {
                    const hours = Math.floor(seconds / 3600);
                    const minutes = Math.floor((seconds % 3600) / 60);
                    
                    const div = document.createElement('div');
                    div.className = 'subject-record';
                    div.innerHTML = `
                        <div class="subject-name">${subject}</div>
                        <div class="study-time">${hours}時${minutes}分</div>
                    `;
                    this.elements.dailySubjectRecords.appendChild(div);
                });
            }
        });

        // 載入筆記
        gun.get('studyNotes').get(dateString).once((note) => {
            this.elements.dailyNote.value = note || '';
        });
    }

    saveDailyNote() {
        const dateString = this.selectedDate.toISOString().split('T')[0];
        const note = this.elements.dailyNote.value;
        
        gun.get('studyNotes').get(dateString).put(note);
        alert('筆記已儲存！');
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.yptTimer = new YPTTimer();
    window.studyCalendar = new StudyCalendar();
});