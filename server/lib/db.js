// import mongoose from "mongoose";

// export const connectDB = async ()=>{
// try{
//     mongoose.connection.on("connected",()=>console.log('Database Connected'));
//     await mongoose.connect(`${process.env.MONGODB_URI}`)
// }catch(error){
// console.log(error);
// }
// }


import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env");
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1); // 🔥 STOP server if DB fails
  }
};
