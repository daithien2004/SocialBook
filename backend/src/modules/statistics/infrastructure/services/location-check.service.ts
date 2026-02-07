import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '@/src/modules/users/infrastructure/schemas/user.schema';
export class LocationCheckService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel('Chapter') private chapterModel: Model<any>,
        @InjectModel('Progress') private progressModel: Model<any>,
    ) { }

    async checkUserLocations() {
        const totalUsers = await this.userModel.countDocuments();
        const usersWithLocation = await this.userModel.countDocuments({
            location: { $ne: null, $nin: ['', 'null', 'undefined'] },
        });

        const sampleUsers = await this.userModel.find({
            location: { $ne: null, $nin: ['', 'null', 'undefined'] }
        }).limit(5).select('username location').lean();

        return {
            totalUsers,
            usersWithLocation,
            sampleUsers
        };
    }

    async seedLocations() {
        const locations = ['Vietnam', 'USA', 'Japan', 'Korea', 'UK', 'France', 'Germany'];
        const users = await this.userModel.find({
            $or: [{ location: null }, { location: '' }]
        });

        let updated = 0;
        for (const user of users) {
            const randomLocation = locations[Math.floor(Math.random() * locations.length)];
            await this.userModel.updateOne({ _id: user._id }, { location: randomLocation });
            updated++;
        }

        return { updated, message: `Seeded ${updated} users with random locations` };
    }

    async seedReadingHistory(days: number = 30) {
        const users = await this.userModel.find().limit(20);
        const chapters = await this.chapterModel.find().limit(50);

        if (users.length === 0 || chapters.length === 0) {
            return { message: "Not enough users or chapters to seed" };
        }

        let createdCount = 0;
        const now = new Date();

        // Generate data for the specified number of days
        for (let i = 0; i < days; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            // Random number of readings per day (5-15)
            const dailyReadings = Math.floor(Math.random() * 10) + 5;

            for (let j = 0; j < dailyReadings; j++) {
                const user = users[Math.floor(Math.random() * users.length)];
                const chapter = chapters[Math.floor(Math.random() * chapters.length)];

                // Random time spent (1-30 minutes)
                const timeSpent = Math.floor(Math.random() * 1800) + 60;

                // Random progress (10-100%)
                const progress = Math.floor(Math.random() * 90) + 10;
                const status = progress >= 80 ? 'completed' : 'reading';

                try {
                    // Use findOneAndUpdate with upsert to avoid duplicates
                    // Update existing or create new if not exists
                    await this.progressModel.findOneAndUpdate(
                        {
                            userId: user._id,
                            chapterId: chapter._id
                        },
                        {
                            $set: {
                                bookId: chapter.bookId,
                                progress,
                                timeSpent,
                                status,
                                lastReadAt: date
                            }
                        },
                        { upsert: true }
                    );
                    createdCount++;
                } catch (error) {
                    // Skip duplicates silently
                    continue;
                }
            }
        }

        return { createdCount, days, message: `Seeded ${createdCount} reading history records for ${days} days` };
    }
}
