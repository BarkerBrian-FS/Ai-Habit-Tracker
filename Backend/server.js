import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import habitRoutes from "./routes/habits.routes.js";
import logRoutes from "./routes/logs.routes.js";
import aiRoutes from "./routes/ai.routes.js";

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "")
.split(",")
.map((s) => s.trim())
.filter(Boolean);

const corsOptions = {
    origin(origin, cb){
        //Allow requests with no origin (curl, same-origin, server to server)
        if(!origin) return cb(null, true);
        //Allow any localhost / 127.0.0.1 origin in development 
        if(/^http?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)){
            return cb(null, true);
        }
        //Allow anything explicitly list in CLIENT_URL (comma separated)
        if(allowedOrigins.includes(origin))return cb(null, true);
        return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

//Backend health route
app.get("/api/health", (req, res) => 
    res.json({ status: "ok", time: new Date().toISOString() })
);

//Authentication Routes 
app.use("/api/auth", authRoutes);

//habit routes
app.use("/api/habits", habitRoutes);

//Log Routes
app.use("/api/logs", logRoutes);

//Ai Routes
app.use("/api/ai", aiRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 8000;

connectDB().then(() => {
    app.listen(PORT, () => 
        console.log(`server running on http://localhost:${PORT}`)
    );
});