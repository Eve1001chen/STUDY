import { MotivationSystem } from '../modules/MotivationSystem';

describe('MotivationSystem', () => {
    let motivationSystem;
    let mockDb;

    beforeEach(() => {
        mockDb = {
            get: jest.fn().mockReturnThis(),
            put: jest.fn(),
            on: jest.fn(),
            map: jest.fn()
        };
        motivationSystem = new MotivationSystem(mockDb);
    });

    test('should calculate points based on study time and difficulty', () => {
        const studyRecord = {
            duration: 3600, // 1小時
            difficulty: 4,
            comprehension: 3,
            subject: '數學'
        };

        const points = motivationSystem.calculatePoints(studyRecord);
        // 基礎分數(60) * 難度係數(1.3) = 78點
        expect(points).toBe(78);
    });

    test('should award achievement for study milestones', async () => {
        const milestone = {
            type: 'STUDY_TIME',
            value: 3600,
            subject: '數學'
        };

        const achievement = await motivationSystem.checkAndAwardAchievement(milestone);
        expect(achievement).toEqual(expect.objectContaining({
            title: expect.any(String),
            description: expect.any(String),
            points: expect.any(Number)
        }));
    });

    test('should calculate study streak correctly', async () => {
        const mockStudyData = [
            { date: '2025-10-19', duration: 3600 },
            { date: '2025-10-18', duration: 2400 },
            { date: '2025-10-17', duration: 1800 }
        ];

        mockDb.get.mockImplementation(() => ({
            map: (cb) => mockStudyData.forEach(data => cb(data))
        }));

        const streak = await motivationSystem.calculateStudyStreak();
        expect(streak).toBe(3);
    });

    test('should generate level based on accumulated points', () => {
        const points = 1500;
        const level = motivationSystem.calculateLevel(points);
        expect(level).toEqual(expect.objectContaining({
            level: expect.any(Number),
            title: expect.any(String),
            nextLevelPoints: expect.any(Number)
        }));
    });

    test('should award bonus points for consistency', async () => {
        const studyRecord = {
            duration: 3600,
            difficulty: 3,
            subject: '數學'
        };

        const mockStreak = 5; // 5天連續學習
        jest.spyOn(motivationSystem, 'calculateStudyStreak').mockResolvedValue(mockStreak);

        const points = await motivationSystem.calculatePointsWithBonus(studyRecord);
        // 基礎分數 * (1 + 連續學習獎勵)
        expect(points).toBeGreaterThan(motivationSystem.calculatePoints(studyRecord));
    });

    test('should handle weekly challenges', async () => {
        const challenge = {
            subject: '數學',
            targetHours: 10,
            difficulty: 3,
            reward: 100
        };

        await motivationSystem.startWeeklyChallenge(challenge);
        const progress = await motivationSystem.getWeeklyChallengeProgress();
        
        expect(progress).toEqual(expect.objectContaining({
            challenge,
            currentHours: expect.any(Number),
            completed: expect.any(Boolean)
        }));
    });

    test('should maintain fairness in point distribution', async () => {
        const easyStudy = {
            duration: 3600,
            difficulty: 1,
            comprehension: 5,
            subject: '數學'
        };

        const hardStudy = {
            duration: 3600,
            difficulty: 5,
            comprehension: 3,
            subject: '數學'
        };

        const easyPoints = motivationSystem.calculatePoints(easyStudy);
        const hardPoints = motivationSystem.calculatePoints(hardStudy);

        // 確保難度較高的學習獲得更多積分
        expect(hardPoints).toBeGreaterThan(easyPoints);
    });
});