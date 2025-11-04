import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
        console.log("MongoDB connected");

    } catch (error) {
        console.log("DB connection error:", error);
        process.exit(1); 
    }
}