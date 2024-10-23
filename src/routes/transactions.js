import express from "express";
import mongoose from "mongoose";
import { TransactionModel } from "../models/Transaction.js";
import { CategoryModel } from "../models/Category.js";

const router = express.Router();

// Get all transactions
router.get("/", async (req, res) => {
  try {
    const result = await TransactionModel.find({}).populate("category");

    res.status(200).json({
      transactions: result,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// Create a new transaction
router.post("/", async (req, res) => {
  const category = new CategoryModel({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.category.name,
    type: req.body.category.type,
  });
  const responseCate = await category.save();
  const transaction = new TransactionModel({
    _id: new mongoose.Types.ObjectId(),
    type: req.body.type,
    amount: req.body.amount,
    description: req.body.description,
    category: responseCate._id,
    date: req.body.date || new Date(),
  });

  try {
    const result = await transaction.save();
    res.status(201).json({
      createdTransaction: {
        type: result.type,
        amount: result.amount,
        description: result.description,
        category: result.category,
        date: result.date,
        _id: result._id,
      },
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get a transaction by ID
router.get("/:tid", async (req, res) => {
  try {
    const result = await TransactionModel.findById(req.params.tid).populate(
      "category"
    );
    if (!result) {
      return res
        .status(404)
        .json({ message: "Transaction not found -->Invalid ID" });
    }

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put("/:transactionId", async (req, res) => {
  try {
    const transaction = await TransactionModel.findById(
      req.params.transactionId
    );

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (req.body.category) {
      const category = await CategoryModel.findByIdAndUpdate(
        transaction.category,
        {
          name: req.body.category.name,
          type: req.body.category.type,
        },
        { new: true }
      );

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
    }

    const updatedTransaction = await TransactionModel.findByIdAndUpdate(
      req.params.transactionId,
      {
        type: req.body.type,
        amount: req.body.amount,
        description: req.body.description,
        date: req.body.date,
      },
      { new: true }
    ).populate("category");

    if (!updatedTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json(updatedTransaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a transaction
router.delete("/:transactionId", async (req, res) => {
  try {
    const result = await TransactionModel.findByIdAndDelete(
      req.params.transactionId
    );

    if (!result) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get transaction summary
router.get("/summary/all", async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;

    // Build query conditions
    let query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (category) {
      query.category = new mongoose.Types.ObjectId(category);
    }

    const transactions = await TransactionModel.find(query).populate(
      "category",
      "name type"
    );

    const result = {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
    };

    // Process transactions
    transactions.forEach((transaction) => {
      if (transaction.type === "income") {
        result.totalIncome += transaction.amount;
      } else if (transaction.type === "expense") {
        result.totalExpenses += transaction.amount;
      }
    });

    result.balance = result.totalIncome - result.totalExpenses;
    res.status(200).json(result);
  } catch (err) {
    console.error("Error in /summary/all:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as transactionRouter };
