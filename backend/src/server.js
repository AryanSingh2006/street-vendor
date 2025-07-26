import app from "./app.js"
import connectDb from "./config/db.config.js"
import { PORT } from "./constants.js";

const startServer = async() => {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`Server is live on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.log("Error starting server:", error);
    process.exit(1);
  }
}

startServer();