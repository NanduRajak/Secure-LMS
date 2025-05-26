import mongoose from "mongoose";

const coursePurchaseSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course referance is required"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User referance is required"],
    },
    amount: {
      type: Number,
      required: [true, "Purchase amount is required"],
      min: [0, "Amount must be non-negative"],
    },
    currency: {
      type: Number,
      required: [true, "Currency is required"],
      uppercase: true,
      default: "USD",
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ["Successfull", "Failed", "Pending", "Refunded"],
        message: "Plesase select a valid status",
      },
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
    },
    paymentId: {
      type: String,
      required: [true, "Payment Id is required"],
    },
    refundedId: {
      type: String,
    },
    refundedAmount: {
      type: Number,
      min: [0, "Refund amount must be non-negative"],
    },
    refundReason: {
      type: String,
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

coursePurchaseSchema.index({ user: 1, course: 1 });
coursePurchaseSchema.index({ status: 1 });
coursePurchaseSchema.index({ createdAt: -1 });

coursePurchaseSchema.virtual("isRefundable").get(function () {
  if (this.status !== "completed") return false;
  const refundPeriod = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return this.createdAt > refundPeriod;
});

// method to process refund

coursePurchaseSchema.methods.processRefund = async function (reason, amount) {
  this.status = "refunded";
  this.reason = reason;
  this.refundAmount = amount || this.amount;
  return this.save();
};

export const CoursePurchase = mongoose.model(
  "CoursePurchase",
  coursePurchaseSchema
);
