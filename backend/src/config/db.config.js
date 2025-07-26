import mongoose from "mongoose";
import { MONGO_URI } from "../constants.js";

const connectDb = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log("Database is connected")
  }
  catch (err) {
    console.error(err);
    process.exit(1);
  }
}

export default connectDb;