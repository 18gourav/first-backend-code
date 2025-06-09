import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MongoDB_URI}/${DB_NAME}`);
        console.log(`Database connected to ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log('database is not connected', error);
        process.exit(1);
    }
};

export default connectDB; 