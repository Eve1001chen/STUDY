export class DataSync {
    constructor(db) {
        this.db = db;
        this.syncStatus = {
            lastSync: null,
            isOnline: false,
            peers: new Set()
        };
    }

    init() {
        this.setupConnectionHandlers();
        this.setupDataSync();
    }

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

    setupDataSync() {
        this.db.on('put', (data) => {
            this.syncStatus.lastSync = Date.now();
            console.log('Data synced:', data);
        });
    }

    getSyncStatus() {
        return {
            ...this.syncStatus,
            peersCount: this.syncStatus.peers.size
        };
    }

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