import { TimeTracker } from '../modules/TimeTracker';

describe('TimeTracker', () => {
    let timeTracker;
    let mockDb;
    
    beforeEach(() => {
        jest.useFakeTimers();
        mockDb = {
            get: jest.fn().mockReturnThis(),
            put: jest.fn(),
            on: jest.fn()
        };
        timeTracker = new TimeTracker(mockDb);
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    test('should initialize with zero study time', () => {
        expect(timeTracker.getCurrentStudyTime()).toBe(0);
        expect(timeTracker.getTodayStudyTime()).toBe(0);
    });

    test('should start timer correctly', () => {
        timeTracker.startTimer();
        expect(timeTracker.isRunning()).toBe(true);
        
        // 模擬時間經過
        jest.advanceTimersByTime(5000);
        expect(timeTracker.getCurrentStudyTime()).toBe(5);
    });

    test('should pause timer correctly', () => {
        timeTracker.startTimer();
        jest.advanceTimersByTime(3000);
        timeTracker.pauseTimer();
        
        expect(timeTracker.isRunning()).toBe(false);
        expect(timeTracker.getCurrentStudyTime()).toBe(3);
        
        // 確認暫停後時間不會繼續增加
        jest.advanceTimersByTime(2000);
        expect(timeTracker.getCurrentStudyTime()).toBe(3);
    });

    test('should resume timer correctly', () => {
        timeTracker.startTimer();
        jest.advanceTimersByTime(3000);
        timeTracker.pauseTimer();
        timeTracker.startTimer();
        jest.advanceTimersByTime(2000);
        
        expect(timeTracker.getCurrentStudyTime()).toBe(5);
    });

    test('should save study time to database', () => {
        timeTracker.startTimer();
        jest.advanceTimersByTime(5000);
        timeTracker.pauseTimer();
        
        expect(mockDb.put).toHaveBeenCalledWith(
            expect.objectContaining({
                time: 5,
                date: expect.any(String)
            })
        );
    });

    test('should load previous study time from database', async () => {
        const mockTime = {
            time: 100,
            date: new Date().toISOString().split('T')[0]
        };
        
        mockDb.get.mockImplementation(() => ({
            once: (cb) => cb(mockTime)
        }));
        
        await timeTracker.init();
        expect(timeTracker.getTodayStudyTime()).toBe(100);
    });

    test('should reset daily timer at midnight', () => {
        timeTracker.startTimer();
        jest.advanceTimersByTime(3000);
        
        // 模擬日期變更
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        jest.setSystemTime(tomorrow);
        
        expect(timeTracker.getTodayStudyTime()).toBe(0);
        expect(timeTracker.getCurrentStudyTime()).toBe(0);
    });

    test('should handle study sessions correctly', () => {
        const session = timeTracker.startNewSession('數學');
        expect(session.subject).toBe('數學');
        expect(session.startTime).toBeDefined();
        
        jest.advanceTimersByTime(3600000); // 1小時
        const stats = timeTracker.endCurrentSession();
        
        expect(stats.duration).toBe(3600);
        expect(stats.subject).toBe('數學');
    });
});