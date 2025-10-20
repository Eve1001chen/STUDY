export class ProgressTracker {
    constructor(db) {
        this.db = db;
        this.currentDate = new Date().toISOString().split('T')[0];
    }

    async init() {
        // 初始化數據結構
        await this.ensureDataStructure();
    }

    async ensureDataStructure() {
        return new Promise((resolve) => {
            this.db.get('progress').once((data) => {
                if (!data) {
                    this.db.get('progress').put({
                        records: {},
                        milestones: {},
                        analytics: {}
                    });
                }
                resolve();
            });
        });
    }

    async recordProgress(progress) {
        const record = {
            ...progress,
            timestamp: Date.now(),
            date: this.currentDate,
            id: Math.random().toString(36).substr(2, 9)
        };

        await this.db.get('progress')
            .get('records')
            .get(this.currentDate)
            .put(record);

        await this.updateAnalytics(record);
        return record;
    }

    async getDailySummary(date = this.currentDate) {
        return new Promise((resolve) => {
            const summary = {};
            this.db.get('progress')
                .get('records')
                .get(date)
                .map((record) => {
                    if (!record) return;
                    
                    if (!summary[record.subject]) {
                        summary[record.subject] = {
                            totalTime: 0,
                            sessions: 0,
                            averageDifficulty: 0,
                            averageComprehension: 0
                        };
                    }

                    const subjectData = summary[record.subject];
                    subjectData.totalTime += record.duration;
                    subjectData.sessions += 1;
                    subjectData.averageDifficulty = 
                        (subjectData.averageDifficulty * (subjectData.sessions - 1) + record.difficulty) / subjectData.sessions;
                    subjectData.averageComprehension = 
                        (subjectData.averageComprehension * (subjectData.sessions - 1) + record.comprehension) / subjectData.sessions;
                });

            setTimeout(() => resolve(summary), 100);
        });
    }

    async getStudyTrends(days = 7) {
        const trends = [];
        const endDate = new Date();
        
        for (let i = 0; i < days; i++) {
            const date = new Date(endDate);
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            const summary = await this.getDailySummary(dateString);
            
            const totalTime = Object.values(summary).reduce((acc, curr) => acc + curr.totalTime, 0);
            trends.unshift({
                date: dateString,
                totalTime,
                summary
            });
        }

        return trends;
    }

    async getPerformanceAnalytics() {
        return new Promise((resolve) => {
            const analytics = {
                totalStudyTime: 0,
                averageComprehension: 0,
                subjectDistribution: {},
                difficultyDistribution: {},
                weeklyProgress: [],
                recentMilestones: []
            };

            let totalRecords = 0;

            this.db.get('progress')
                .get('records')
                .map((record) => {
                    if (!record) return;

                    analytics.totalStudyTime += record.duration;
                    analytics.averageComprehension += record.comprehension;
                    totalRecords++;

                    if (!analytics.subjectDistribution[record.subject]) {
                        analytics.subjectDistribution[record.subject] = 0;
                    }
                    analytics.subjectDistribution[record.subject] += record.duration;

                    if (!analytics.difficultyDistribution[record.difficulty]) {
                        analytics.difficultyDistribution[record.difficulty] = 0;
                    }
                    analytics.difficultyDistribution[record.difficulty]++;
                });

            if (totalRecords > 0) {
                analytics.averageComprehension /= totalRecords;
            }

            setTimeout(() => resolve(analytics), 100);
        });
    }

    async updateAnalytics(record) {
        const analytics = await this.getPerformanceAnalytics();
        await this.db.get('progress')
            .get('analytics')
            .put(analytics);
    }
}