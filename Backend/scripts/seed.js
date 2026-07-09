import "dotenv/config";
import mongoose from "mongoose";
import { format, subDays } from "date-fns";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import AiInsight from "../models/AiInsight.js";

const EMAIL = "barker@gmail.com";
const PASSWORD = "test1234";
const NAME = "Brian Barker";

const HABITS = [
    {
        name: "Drink 2L of water",
        description: "Stay hydrated throughout the day",
        category: "Health",
        frequency: "daily",
        targetDays: 7,
        color: "#0ea5e9",
        icon: "💧",
        _streakProb: 0.95,
    },
    {
        name: "Morning run",
        description: "30 minute run in the morning",
        category: "Fitness",
        frequency: "daily",
        targetDays: 5,
        color: "#ef4444",
        icon: "🏃‍♂️",
        _streakProb: 0.7,
        _pattern: "weekdays",
        brokeAt: 20,
    },
    {
        name: "Read 30 minutes",
        description: "Fiction or non no phones",
        category: "Learning",
        frequency: "daily",
        targetDays: 7,
        color: "#6366f1",
        icon: "📚",
        _streakProb: 0.82,
    },
    {
        name: "Meditate",
        description: "10 minutes of breath-focused meditation",
        category: "Mindfulness",
        frequency: "daily",
        targetDays: 7,
        color: "#8b5cf6",
        icon: "🧘",
        _streakProb: 0.6,
    },
];

const todayKey = () => format(new Date(), "yyyy-MM-dd");

const buildLogs = (habit, totalDays = 90) => {
    const logs = [];
    const today = new Date();
    for(let i = 0; i < totalDays; i++){
        const d = subDays(today, i);
        const dow = d.getDay();
        const key = format(d, "yyyy-MM-dd");
        let p = habit._streakProb;

        if(habit._pattern === "weekdays"){
            if(dow === 0 || dow === 6) p *= 0.35;
        }
        if(habit._pattern === "dropoff"){
            if(i < 14) p *= 0.25;
        }
        if(habit._brokeAt && i >= habit._brokeAt - 2 && i <= habit._brokeAt + 2){
            continue;
        }

        const seed = Math.sin(i * 9301 + habit.name.length * 49297) * 233280;
        const rnd = seed - Math.floor(seed);
        if(rnd < p) logs.push({ completedDate: key });
    }

    return logs;
};

const run = async () => {
    await connectDB();

    let user = await User.findOne({ email: EMAIL });
    if(user){
        console.log(`Found existing user ${EMAIL} - clearing their data...`);
        await Habit.deleteMany({ userId: user._id });
        await HabitLog.deleteMany({ userId: user._id });
        await AiInsight.deleteMany({ userId: user._id });
        user.name = NAME;
        user.avatar = NAME.charAt(0).toUpperCase();
        user.morningMotivation = true;
        user.password = PASSWORD;
        await user.save();
    } else {
        user = await User.create({
            name: NAME,
            email: EMAIL,
            password: PASSWORD,
            avatar: NAME.charAt(0).toUpperCase(),
            morningMotivation: true,
        });
        console.log(`Created user ${EMAIL}`);
    }

    const createdHabits = [];
    for(let i = 0; i < HABITS.length; i++){
        const h = HABITS[i];
        const habit = await Habit.create({
            userId: user._id,
            name: h.name,
            description: h.description,
            category: h.category,
            frequency: h.frequency,
            color: h.color,
            icon: h.icon,
            order: i,
            createdAt: subDays(new Date(), 89),
            updatedAt: subDays(new Date(), 89),
        })
        habit.createdAt = subDays(new Date(), 89);
        await habit.save({ timestamps: false });
        createdHabits.push({ habit, config: h });
    }

    let totalLogs = 0;
    for(const { habit, config } of createdHabits){
        const logs = buildLogs(config);
        if(!logs.length) continue;
        const docs = logs.map((l) => ({
            userId: user._id,
            habitId: habit._id,
            completedDate: l.completedDate,
        }))
        await HabitLog.insertMany(docs, { ordered: false }).catch(() => {});
        totalLogs += docs.length;
    }

    const today = todayKey();
    const todayDoneHabits = createdHabits.slice(0,4).map((c) => c.habit);
    for(const h of todayDoneHabits){
        await HabitLog.updateOne(
            { userId: user._id, habitId: h._is, completedDate: today },
            { $setOnInsert: { userId: user._id, habitId: h._id, completedDate: today } },
            { upsert: true }
        );
    }

    console.log(`\n ✅ Seed Complete`)
    console.log(` User: ${EMAIL}`)
    console.log(` Password: ${PASSWORD}`)
    console.log(` Habits: ${createdHabits.length}`)
    console.log(` Logs: ${totalLogs}`)

    await mongoose.disconnect();
};

run().catch(async (err) => {
    console.error("Seed failed", err);
    await mongoose.disconnect();
    process.exit(1);
});