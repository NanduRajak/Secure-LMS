import Razorpay from "razorpay";
import crypto from "crypto";
import { Course } from "../models/course.js";
import { CoursePurchase, coursePurchase } from "../models/coursePurchase.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// create order
export const createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.id;
    const { courseId } = req.body;

    const course = Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    const newPurchase = new CoursePurchase({
      course: courseId,
      user: userId,
      amount: course.price,
      status: "pending",
    });

    const options = {
      amount: course.price * 100,
      currency: "INR",
      receipt: `course_${courseId}`,
      notes: {
        courseId: courseId,
        userId: userId,
      },
    };

    const order = await razorpay.orders.create(options);

    newPurchase.paymentId = order.id;
    await newPurchase.save();
    res.status(200).json({
      success: true,
      order,
      course: {
        name: course.title,
        description: course.discription,
      },
    });
  } catch (error) {
    throw new Error("Opps...! Order not placed please try again", error);
  }
};

// verify payment
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthenticate = expectedSignature === razorpay_signature;
    if (!isAuthenticate) {
      return res.status(400).json({ message: "Payment verification failed" });
    }
    const purchase = await CoursePurchase.findOne({
      paymentId: razorpay_payment_id,
    });
    if (!purchase) {
      return res
        .status(400)
        .json({ message: "Purchase failed please try again" });
    }
    purchase.status = "completed";
    await purchase.save();

    res.status(200).json({
      success: true,
      message: "Payment verification completed",
      courseId: purchase.courseId,
    });
  } catch (error) {
    throw new Error(
      "Payment verification is not completed, please try again!",
      error
    );
  }
};
