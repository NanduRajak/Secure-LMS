import mongoose from "mongoose";

// Course Schema
const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      maxlength: [100, "Title length is too long"],
    },
    description: {
      type: String,
      required: [true, "Course description is required"],
    },
    category: {
      type: String,
      required: [true, "Course category is required"],
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    price: {
      type: Number,
      required: [true, "Course price is required"],
      min: [0, "Price cannot be negative"],
    },
    thumbnail: {
      type: String,
      required: [true, "Course thumbnail is required"],
    },
    lectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture",
      },
    ],
    instructors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Course instructor is required"],
      },
    ],
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Additional fields for rating calculations
    totalRatings: {
      type: Number,
      default: 0,
    },
    ratingSum: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Rating Schema
const ratingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course reference is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    review: {
      type: String,
      maxlength: [500, "Review cannot exceed 500 characters"],
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate ratings from same user for same course
ratingSchema.index({ user: 1, course: 1 }, { unique: true });

// Virtual field for average rating
courseSchema.virtual("averageRating").get(function () {
  if (this.totalRatings === 0) return 0;
  return Math.round((this.ratingSum / this.totalRatings) * 10) / 10; // Round to 1 decimal place
});

// Virtual field for rating breakdown
courseSchema.virtual("ratingBreakdown", {
  ref: "Rating",
  localField: "_id",
  foreignField: "course",
});

// Static method to calculate and update average rating
courseSchema.statics.updateAverageRating = async function (courseId) {
  const Rating = mongoose.model("Rating");

  const stats = await Rating.aggregate([
    { $match: { course: courseId } },
    {
      $group: {
        _id: null,
        totalRatings: { $sum: 1 },
        avgRating: { $avg: "$rating" },
        ratingSum: { $sum: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await this.findByIdAndUpdate(courseId, {
      totalRatings: stats[0].totalRatings,
      ratingSum: stats[0].ratingSum,
    });
  } else {
    await this.findByIdAndUpdate(courseId, {
      totalRatings: 0,
      ratingSum: 0,
    });
  }
};

// Middleware to update course rating when a rating is saved
ratingSchema.post("save", async function () {
  const Course = mongoose.model("Course");
  await Course.updateAverageRating(this.course);
});

// Middleware to update course rating when a rating is removed
ratingSchema.post("deleteOne", { document: true }, async function () {
  const Course = mongoose.model("Course");
  await Course.updateAverageRating(this.course);
});

// Total lectures
courseSchema.pre("save", function (next) {
  if (this.lecture) {
    this.totalLectures = this.lectures.length;
  }
  next();
});

export const Course = mongoose.model("Course", courseSchema);
