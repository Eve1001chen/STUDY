import { DataSync } from '../modules/DataSync';

describe('DataSync', () => {
    let dataSync;
    let mockDb;
    let eventHandlers;

    beforeEach(() => {
        eventHandlers = {};
        mockDb = {
            on: jest.fn((event, handler) => {
                eventHandlers[event] = handler;
            }),
            get: jest.fn(() => mockDb),
            put: jest.fn((data, _, callback) => {
                if (callback) callback();
                return mockDb;
            })
        };
        dataSync = new DataSync(mockDb);
    });

    test('should initialize with correct default values', () => {
        expect(dataSync.syncStatus.lastSync).toBeNull();
        expect(dataSync.syncStatus.isOnline).toBeFalsy();
        expect(dataSync.syncStatus.peers.size).toBe(0);
    });

    test('should handle peer connection correctly', () => {
        dataSync.init();
        eventHandlers.hi('peer1');
        
        const status = dataSync.getSyncStatus();
        expect(status.isOnline).toBeTruthy();
        expect(status.peersCount).toBe(1);
    });

    test('should handle peer disconnection correctly', () => {
        dataSync.init();
        eventHandlers.hi('peer1');
        eventHandlers.bye('peer1');
        
        const status = dataSync.getSyncStatus();
        expect(status.isOnline).toBeFalsy();
        expect(status.peersCount).toBe(0);
    });

    test('should update sync status on data put', () => {
        dataSync.init();
        eventHandlers.put({ some: 'data' });
        
        expect(dataSync.syncStatus.lastSync).not.toBeNull();
    });

    test('should force sync successfully', async () => {
        const result = await dataSync.forceSync();
        expect(result).toBeTruthy();
        expect(mockDb.put).toHaveBeenCalled();
    });
});