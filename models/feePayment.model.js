import mongoose from "mongoose";

// Yeh ASLI transaction hai - ek specific Student ne kab, kitna, kaise pay kiya
const feePaymentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    feeStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeStructure",
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMode: {
      type: String,
      enum: ["cash", "card", "upi", "netbanking"],
      required: true,
    },
    transactionId: {
      type: String,
      trim: true, // online payment ka reference number
    },
    // har payment ke saath ek unique Receipt Number - isi se student apna "Fee Receipt" (downloadable image) dekh/download kar sakta hai.
    receiptNo: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

feePaymentSchema.index({ receiptNo: 1 }, { unique: true, sparse: true });

const FeePayment = mongoose.model("FeePayment", feePaymentSchema);
export default FeePayment;
