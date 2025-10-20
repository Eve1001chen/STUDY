// 科目計時器管理
class SubjectTimer {
    constructor(subject) {
        this.subject = subject;
        this.time = 0;
        this.isRunning = false;
        this.intervalId = null;
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.intervalId = setInterval(() => {
                this.time++;
                this.updateDisplay();
            }, 1000);
        }
    }

    pause() {
        if (this.isRunning) {
            clearInterval(this.intervalId);
            this.isRunning = false;
        }
    }

    stop() {
        this.pause();
        this.saveTime();
        this.time = 0;
        this.updateDisplay();
    }

    updateDisplay() {
        const element = document.querySelector(`#timer-${this.subject}`);
        if (element) {
            const hours = Math.floor(this.time / 3600);
            const minutes = Math.floor((this.time % 3600) / 60);
            const seconds = this.time % 60;
            element.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }

    saveTime() {
        // 儲存學習時間到 GUN.js 資料庫
        const date = new Date().toISOString().split('T')[0];
        gun.get('studyTimes').get(date).get(this.subject).put(this.time);
    }
}

// 學習進度管理
class ProgressManager {
    constructor() {
        this.setupEventListeners();
        this.setupDropZone();
    }

    setupEventListeners() {
        // 標籤切換
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // 新增筆記按鈕
        document.getElementById('add-note').addEventListener('click', () => {
            this.createNewNote();
        });

        // 新增資源連結按鈕
        document.getElementById('add-link').addEventListener('click', () => {
            this.createNewLink();
        });
    }

    setupDropZone() {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');

        dropZone.addEventListener('click', () => fileInput.click());
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
    }

    handleFiles(files) {
        const subject = document.getElementById('file-subject').value;
        Array.from(files).forEach(file => {
            // 上傳檔案到雲端儲存
            this.uploadFile(file, subject);
        });
    }

    async uploadFile(file, subject) {
        try {
            // 這裡可以使用任何雲端儲存服務的 API
            // 例如：Firebase Storage, AWS S3 等
            const fileData = {
                name: file.name,
                subject: subject,
                uploadDate: new Date().toISOString(),
                size: file.size,
                type: file.type
            };

            // 儲存檔案資訊到 GUN.js
            gun.get('files').get(subject).set(fileData);
            
            // 更新檔案列表顯示
            this.updateFileList();
        } catch (error) {
            console.error('檔案上傳失敗:', error);
            alert('檔案上傳失敗，請稍後再試');
        }
    }

    switchTab(tabId) {
        // 切換標籤active狀態
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // 切換內容顯示
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}-content`);
        });
    }

    createNewNote() {
        const note = {
            id: Date.now(),
            title: '新筆記',
            content: '',
            subject: document.getElementById('file-subject').value,
            createdAt: new Date().toISOString()
        };

        // 儲存筆記到 GUN.js
        gun.get('notes').set(note);
        this.updateNoteList();
    }

    createNewLink() {
        const url = prompt('請輸入資源連結：');
        if (url) {
            const link = {
                id: Date.now(),
                url: url,
                title: prompt('請輸入連結標題：'),
                subject: document.getElementById('file-subject').value,
                createdAt: new Date().toISOString()
            };

            // 儲存連結到 GUN.js
            gun.get('links').set(link);
            this.updateResourceList();
        }
    }

    updateNoteList() {
        const noteList = document.getElementById('saved-notes');
        noteList.innerHTML = ''; // 清空現有列表

        // 從 GUN.js 讀取並顯示筆記
        gun.get('notes').map().on((note, id) => {
            if (note) {
                const noteElement = this.createNoteElement(note, id);
                noteList.appendChild(noteElement);
            }
        });
    }

    updateFileList() {
        const fileList = document.getElementById('uploaded-files');
        fileList.innerHTML = ''; // 清空現有列表

        // 從 GUN.js 讀取並顯示檔案
        gun.get('files').map().on((file, id) => {
            if (file) {
                const fileElement = this.createFileElement(file, id);
                fileList.appendChild(fileElement);
            }
        });
    }

    updateResourceList() {
        const resourceList = document.getElementById('saved-links');
        resourceList.innerHTML = ''; // 清空現有列表

        // 從 GUN.js 讀取並顯示資源連結
        gun.get('links').map().on((link, id) => {
            if (link) {
                const linkElement = this.createLinkElement(link, id);
                resourceList.appendChild(linkElement);
            }
        });
    }

    createNoteElement(note, id) {
        const div = document.createElement('div');
        div.className = 'note-item';
        div.innerHTML = `
            <div class="note-info">
                <h4>${note.title}</h4>
                <p>${note.subject} - ${new Date(note.createdAt).toLocaleDateString()}</p>
            </div>
            <div class="note-actions">
                <button onclick="editNote('${id}')" class="btn btn-sm btn-primary">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteNote('${id}')" class="btn btn-sm btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        return div;
    }

    createFileElement(file, id) {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.innerHTML = `
            <div class="file-info">
                <h4>${file.name}</h4>
                <p>${file.subject} - ${new Date(file.uploadDate).toLocaleDateString()}</p>
            </div>
            <div class="file-actions">
                <button onclick="downloadFile('${id}')" class="btn btn-sm btn-primary">
                    <i class="fas fa-download"></i>
                </button>
                <button onclick="deleteFile('${id}')" class="btn btn-sm btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        return div;
    }

    createLinkElement(link, id) {
        const div = document.createElement('div');
        div.className = 'resource-item';
        div.innerHTML = `
            <div class="link-info">
                <h4>${link.title}</h4>
                <p>${link.subject} - ${new Date(link.createdAt).toLocaleDateString()}</p>
            </div>
            <div class="link-actions">
                <a href="${link.url}" target="_blank" class="btn btn-sm btn-primary">
                    <i class="fas fa-external-link-alt"></i>
                </a>
                <button onclick="deleteLink('${id}')" class="btn btn-sm btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        return div;
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    const subjects = ['國文', '英文', '數學', '物理', '化學', '生物', '地科', '地理', '歷史', '公民'];
    const timers = {};

    // 創建科目計時器
    const subjectGrid = document.getElementById('subject-timers');
    subjects.forEach(subject => {
        const timerElement = document.createElement('div');
        timerElement.className = 'subject-timer';
        timerElement.innerHTML = `
            <h3>${subject}</h3>
            <div class="timer-display" id="timer-${subject}">00:00:00</div>
            <div class="timer-controls">
                <button onclick="startTimer('${subject}')" class="btn btn-primary btn-sm">
                    <i class="fas fa-play"></i>
                </button>
                <button onclick="pauseTimer('${subject}')" class="btn btn-secondary btn-sm">
                    <i class="fas fa-pause"></i>
                </button>
                <button onclick="stopTimer('${subject}')" class="btn btn-danger btn-sm">
                    <i class="fas fa-stop"></i>
                </button>
            </div>
        `;
        subjectGrid.appendChild(timerElement);
        timers[subject] = new SubjectTimer(subject);
    });

    // 初始化學習進度管理器
    const progressManager = new ProgressManager();

    // 將 timers 對象設為全局變數
    window.timers = timers;
});

// 全局計時器控制函數
window.startTimer = (subject) => window.timers[subject].start();
window.pauseTimer = (subject) => window.timers[subject].pause();
window.stopTimer = (subject) => window.timers[subject].stop();