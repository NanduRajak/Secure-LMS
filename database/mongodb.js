import mongoose from "mongoose";

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000;

class DatabaseConnection {
  constructor() {
    this.retryCount = 0;
    this.isConnected = false;

    // config mongoose
    mongoose.set("strictQuerry", true);
    mongoose.connection.on("connected", () => {
      console.log("MONGODB CONNECTED SUCCESSFULLY");
      this.isConnected = true;
    });
    mongoose.connection.on("error", () => {
      console.log("MONGODB connection ERROR");
      this.isConnected = false;
    });
    mongoose.connection.on("disconnected", () => {
      console.log("MONGODB DISCONNECTED");
      this.isConnected = false;
    });
  }

  async connect() {
    if (process.env.MONGODB_URL) {
      throw new Error("MongoDB URL is not defined in env variables");
    }

    const connectionOptions = {
      userUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      family: 4, //  use IPv4
    };

    if (process.env.TEST_ONE === "Zorosenpai") {
      mongoose.set("debug", true);
    }

    await mongoose.connect(process.env.MONGODB_URL, connectionOptions);
    this.retryCount = 0;
  }

  async handleConnectError() {}
}
