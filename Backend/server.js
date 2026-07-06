import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import { notFound, errorHandler } from "./middleware/errorHandler";

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
    allowedHeaders: ["Content-Type", "Autorization"],
};