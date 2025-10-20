export class MotivationSystem {
    constructor(db) {
        this.db = db;
        this.currentDate = new Date().toISOString().split('T')[0];
        
        // 基礎設定
        this.config = {
            basePointsPerHour: 60,
            difficultyMultiplier: 0.1, // 每增加一級難度增加10%積分
            streakBonus: 0.05, // 每天連續學習增加5%積分
            maxStreakBonus: 0.5, // 最高50%連續學習獎勵
            comprehensionMultiplier: 0.05 // 每級理解度增加5%積分
        };

        // 等級設定
        this.levels = [
            { level: 1, title: '學習新手', pointsNeeded: 0 },
            { level: 2, title: '勤奮學子', pointsNeeded: 500 },
            { level: 3, title: '知識探索者', pointsNeeded: 1000 },
            { level: 4, title: '學術達人', pointsNeeded: 2000 },
            { level: 5, title: '智慧大師', pointsNeeded: 4000 }
        ];

        // 成就系統設定
        this.achievements = {
            STUDY_TIME: [
                { id: 'time_1', title: '學習起步', description: '累計學習1小時', threshold: 3600, points: 10 },
                { id: 'time_2', title: '持之以恆', description: '累計學習10小時', threshold: 36000, points: 50 },
                { id: 'time_3', title: '學習達人', description: '累計學習50小時', threshold: 180000, points: 200 }
            ],
            STREAK: [
                { id: 'streak_1', title: '堅持不懈', description: '連續學習3天', threshold: 3, points: 30 },
                { id: 'streak_2', title: '持續向上', description: '連續學習7天', threshold: 7, points: 100 },
                { id: 'streak_3', title: '學習戰士', description: '連續學習30天', threshold: 30, points: 500 }
            ]
        };
    }

    calculatePoints(studyRecord) {
        const { duration, difficulty = 3, comprehension = 3 } = studyRecord;
        const hours = duration / 3600;
        
        // 基礎分數
        let points = hours * this.config.basePointsPerHour;
        
        // 難度加成
        const difficultyBonus = 1 + (difficulty - 3) * this.config.difficultyMultiplier;
        points *= difficultyBonus;
        
        // 理解度加成
        const comprehensionBonus = 1 + (comprehension - 3) * this.config.comprehensionMultiplier;
        points *= comprehensionBonus;
        
        return Math.round(points);
    }

    async calculatePointsWithBonus(studyRecord) {
        const basePoints = this.calculatePoints(studyRecord);
        const streak = await this.calculateStudyStreak();
        
        // 計算連續學習獎勵
        const streakBonus = Math.min(
            streak * this.config.streakBonus,
            this.config.maxStreakBonus
        );
        
        return Math.round(basePoints * (1 + streakBonus));
    }

    calculateLevel(points) {
        let currentLevel = this.levels[0];
        
        for (const level of this.levels) {
            if (points >= level.pointsNeeded) {
                currentLevel = level;
            } else {
                break;
            }
        }
        
        const nextLevel = this.levels[currentLevel.level] || this.levels[this.levels.length - 1];
        return {
            ...currentLevel,
            nextLevelPoints: nextLevel.pointsNeeded
        };
    }

    async checkAndAwardAchievement(milestone) {
        const { type, value } = milestone;
        const achievements = this.achievements[type] || [];
        
        for (const achievement of achievements) {
            if (value >= achievement.threshold) {
                const awarded = await this.hasAchievement(achievement.id);
                if (!awarded) {
                    await this.awardAchievement(achievement);
                    return achievement;
                }
            }
        }
        
        return null;
    }

    async hasAchievement(achievementId) {
        return new Promise((resolve) => {
            this.db.get('achievements')
                .get(achievementId)
                .once((data) => {
                    resolve(!!data);
                });
        });
    }

    async awardAchievement(achievement) {
        await this.db.get('achievements')
            .get(achievement.id)
            .put({
                ...achievement,
                awardedAt: Date.now()
            });

        // 添加積分獎勵
        await this.addPoints(achievement.points);
    }

    async calculateStudyStreak() {
        return new Promise((resolve) => {
            let streak = 0;
            let lastDate = this.currentDate;
            
            this.db.get('studyTime')
                .map((data) => {
                    if (!data || data.duration < 1800) return; // 至少學習30分鐘才計入
                    
                    const diff = this.daysBetween(lastDate, data.date);
                    if (diff === 1) {
                        streak++;
                        lastDate = data.date;
                    } else if (diff > 1) {
                        return; // 中斷連續記錄
                    }
                });

            setTimeout(() => resolve(streak), 100);
        });
    }

    async addPoints(points) {
        const currentPoints = await this.getCurrentPoints();
        await this.db.get('points').put(currentPoints + points);
    }

    async getCurrentPoints() {
        return new Promise((resolve) => {
            this.db.get('points').once((points) => {
                resolve(points || 0);
            });
        });
    }

    daysBetween(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return Math.round((d1 - d2) / (1000 * 60 * 60 * 24));
    }
}