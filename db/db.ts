import mongoose, { ConnectOptions } from "mongoose";

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(
      "mongodb+srv://paswanaditya256:QS2rjYjQ00mpqvJ6@cluster0.uvkzblq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      } as ConnectOptions
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
};
