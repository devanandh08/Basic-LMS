import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      isConnected = false;
      return false;
    }

    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log(`[Basic LMS] MongoDB Connected: ${conn.connection.host}`);
    isConnected = true;
    return true;
  } catch (error) {
    console.log(`[Basic LMS] Database runtime ready in local store mode.`);
    isConnected = false;
    return false;
  }
};

export const isDbConnected = () => isConnected && mongoose.connection.readyState === 1;
