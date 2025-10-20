import { ProgressTracker } from '../modules/ProgressTracker';

describe('ProgressTracker', () => {
    let progressTracker;
    let mockDb;

    beforeEach(() => {
        mockDb = {
            get: jest.fn().mockReturnThis(),
            put: jest.fn(),
            on: jest.fn(),
            once: jest.fn(),
            map: jest.fn()
        };
        progressTracker = new ProgressTracker(mockDb);
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    test('should record study progress correctly', async () => {
        const progress = {
            subject: '數學',
            topic: '微積分',
            duration: 3600,
            difficulty: 4,
            comprehension: 3,
            notes: '今天學習了導數的概念'
        };

        await progressTracker.recordProgress(progress);
        expect(mockDb.put).toHaveBeenCalledWith(
            expect.objectContaining({
                ...progress,
                timestamp: expect.any(Number),
                date: expect.any(String)
            })
        );
    });

    test('should get daily summary correctly', async () => {
        const mockData = {
            '數學': { totalTime: 3600, sessions: 2 },
            '物理': { totalTime: 1800, sessions: 1 }
        };

        mockDb.get.mockImplementation(() => ({
            map: (cb) => {
                cb({
                    subject: '數學',
                    duration: 2000,
                    timestamp: Date.now()
                });
                cb({
                    subject: '數學',
                    duration: 1600,
                    timestamp: Date.now()
                });
                cb({
                    subject: '物理',
                    duration: 1800,
                    timestamp: Date.now()
                });
            }
        }));

        const summary = await progressTracker.getDailySummary();
        expect(summary['數學'].totalTime).toBe(3600);
        expect(summary['數學'].sessions).toBe(2);
        expect(summary['物理'].totalTime).toBe(1800);
    });

    test('should calculate study trends correctly', async () => {
        const today = new Date();
        const mockData = [
            { date: today.toISOString().split('T')[0], totalTime: 3600 },
            { date: new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0], totalTime: 2800 },
            { date: new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0], totalTime: 4000 }
        ];

        mockDb.get.mockImplementation(() => ({
            map: (cb) => mockData.forEach(data => cb(data))
        }));

        const trends = await progressTracker.getStudyTrends(7);
        expect(trends.length).toBe(7);
        expect(trends[0].totalTime).toBe(3600);
    });

    test('should track learning milestones', async () => {
        const milestone = {
            subject: '數學',
            achievement: '完成微積分第一章',
            description: '已經掌握基本的導數概念',
            difficulty: 4
        };

        await progressTracker.addMilestone(milestone);
        expect(mockDb.put).toHaveBeenCalledWith(
            expect.objectContaining({
                ...milestone,
                timestamp: expect.any(Number),
                id: expect.any(String)
            })
        );
    });

    test('should generate performance analytics', async () => {
        mockDb.get.mockImplementation(() => ({
            map: (cb) => {
                cb({
                    subject: '數學',
                    duration: 3600,
                    difficulty: 4,
                    comprehension: 3,
                    timestamp: Date.now()
                });
            }
        }));

        const analytics = await progressTracker.getPerformanceAnalytics();
        expect(analytics).toHaveProperty('averageComprehension');
        expect(analytics).toHaveProperty('totalStudyTime');
        expect(analytics).toHaveProperty('subjectDistribution');
    });
});