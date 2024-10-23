import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { transactionRouter } from "./routes/transactions.js";
import categoryRoutes from "./routes/categories.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");
} catch (err) {
  console.error("MongoDB connection error:", err);
}

// Routes
app.use("/api/transactions", transactionRouter);
app.use("/api/categories", categoryRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

console.log(process.env.MONGODB_URI);
