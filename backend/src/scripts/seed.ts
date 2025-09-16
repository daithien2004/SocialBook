import { config } from 'dotenv';
config();
import mongoose from 'mongoose';
import { UserSchema } from '../users/schemas/user.schema';
import * as bcrypt from 'bcryptjs';

async function seed() {
  const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/socialbook';
  await mongoose.connect(MONGO);
  const User = mongoose.model('User', UserSchema);
  const exist = await User.findOne({ email: 'admin@example.com' });
  if (!exist) {
    const pwd = await bcrypt.hash('password123', 12);
    await User.create({
      email: 'admin@example.com',
      password: pwd,
      fullName: 'Admin',
    });
    console.log('Admin created: admin@example.com / password123');
  } else {
    console.log('Admin already exists');
  }
  process.exit(0);
}

seed();

// package.json scripts: "seed": "ts-node -r tsconfig-paths/register src/scripts/seed.ts"
