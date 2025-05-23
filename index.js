import express, { json } from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import ExpressMongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
// import cookie from "cookie-parse";
import cors from "cors";

dotenv.config();
const app = express();
const PORT = process.env.PORT;

// Globalrate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: "Too many requests from same IP, please try again later!",
});

// security middleware

app.use("/api", limiter);
app.use(helmet());
app.use(hpp());
app.use(ExpressMongoSanitize());
// app.use(cookie());

// loggging middleware
if (process.env.TEST_ONE === "Zorosenpai") {
  app.use(morgan("dev"));
}

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status) ||
    (500).json({
      error: "error",
      message: "Global error" || 404,
      ...(process.env.TEST_ONE === "Zorosenpai" && { stack: err.stack }),
    });
});

// cors config
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:4000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "device-remember-token",
      "Access-Control-Allow-Origin",
      "Origin",
      "Accept",
    ],
  })
);

app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(
    `Youre server is running at port:${PORT} and ${process.env.TEST_ONE}`
  );
});
