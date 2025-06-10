import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Middleware
// app.use is used for middleware in express
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}))

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public")); //used to serve static files like images, css, js, etc.
app.use(cookieParser());

// routes
import userRoutes from './routes/user.routes.js';


// routes implementation using middleware
app.use("/users", userRoutes);



export {app};