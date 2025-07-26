import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js"
import inventoryRoutes from "./routes/inventory.route.js"

const app = express();

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies
app.use(cors()); // Enable CORS(for the connecting with the frontend)


app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);

export default app;