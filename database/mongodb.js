import mongoose from "mongoose";

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000;

class DatabaseConnection {
  constructor() {
    this.retryCount = 0;
    this.isConnected = false;
    this.handleDisconnection();

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

    process.on("SIGTERM", this.handleAppTermination.bind(this));
  }

  async connect() {
    try {
      if (!process.env.MONGODB_URL) {
        throw new Error("MongoDB URL is not defined in env variables");
      }

      const connectionOptions = {
        useNewUrlParser: true,
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
    } catch (err) {
      console.error(err.message);
      await this.handleConnectionError();
    }
  }

  async handleConnectionError() {
    if (this.retryCount < MAX_RETRIES) {
      this.retryCount++;
      await new Promise((resolve) =>
        setTimeout(() => {
          resolve;
        }, RETRY_INTERVAL)
      );
      return this.connect();
    } else {
      console.error(`Failed to connect to MONGODB after ${MAX_RETRY} attempts`);
      process.exit(1);
    }
  }

  async handleDisconnection() {
    if (!this.isConnected) {
      console.log("Attempting to reconnected to mongodb...");
      this.connect();
    }
  }

  async handleAppTermination() {
    try {
      await mongoose.connection.close();
      console.log("MongoDB connection closed through app termination");
    } catch (err) {
      console.error(err);
      process.exit(0);
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  }
}

// create a singleton instance
const dbConnection = new DatabaseConnection();

export default dbConnection.connect.bind(dbConnection);

export const getDBStatus = dbConnection.getConnectionStatus.bind(dbConnection);
