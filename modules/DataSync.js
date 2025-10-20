export class DataSync {
    constructor(db) {
        this.db = db;
        this.syncStatus = {
            lastSync: null,
            isOnline: false,
            peers: new Set()
        };
    }

    // 初始化數據同步
    init() {
        this.setupConnectionHandlers();
        this.setupDataSync();
    }

    // 設置連接處理程序
    setupConnectionHandlers() {
        this.db.on('hi', peer => {
            this.syncStatus.peers.add(peer);
            this.syncStatus.isOnline = true;
            console.log('Peer connected:', peer);
        });

        this.db.on('bye', peer => {
            this.syncStatus.peers.delete(peer);
            this.syncStatus.isOnline = this.syncStatus.peers.size > 0;
            console.log('Peer disconnected:', peer);
        });
    }

    // 設置數據同步機制
    setupDataSync() {
        this.db.on('put', (data) => {
            this.syncStatus.lastSync = Date.now();
            console.log('Data synced:', data);
        });
    }

    // 獲取同步狀態
    getSyncStatus() {
        return {
            ...this.syncStatus,
            peersCount: this.syncStatus.peers.size
        };
    }

    // 強制同步數據
    async forceSync() {
        return new Promise((resolve) => {
            this.db.get('sync').put({
                timestamp: Date.now()
            }, null, () => {
                resolve(true);
            });
        });
    }
}