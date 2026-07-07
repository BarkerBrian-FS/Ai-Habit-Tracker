import HabitLog from "../models/HabitLog.js";
import Habit from "../models/Habit.js";
import {
    todayKey,
    last90Days,
    lastNDays,
    calcStreak,
} from "../utils/dateHelpers.js"

export const markComplete = async (req, res) => {
    try {
        const { habitId, date } = req.body;
        const completedDate = date || todayKey();
        const habit = await Habit.findOne({
            _id: habitId,
            userId: req.user._id,
        });
        if(!habit) return res.status(404).json({ message: "Habit not found" });

        const log = await HabitLog.findOneAndUpdate(
            { userId: req.user._id, habitId, completedDate },
            { $setOnInsert: { userId: req.user._id, habitId, completedDate }},
            { upsert: true, new: true }
        );
        res.status(201).json(log);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const unmarkComplete = async (req, res) => {
    try {
        const { habitId, date } = req.body;
        const completedDate = date || todayKey();
        await HabitLog.findOneAndDelete({
            userId: req.user._id,
            habitId,
            completedDate,
        });
        res.json({ message: "Unmarked" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getToday = async (req, res) => {
    try {
        const logs = await HabitLog.findOne({
            userId: req.user._id,
            completedDate: todayKey(),
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getRange = async (req, res) => {
    try {
        const { start, end } = req.query;
        const logs = await HabitLog.find({
            userId: req.user._id,
            completedDate: { $gte: start, $lte: end },
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getHeatMap = async (req, res) => {
    try {
        const days = last90Days();
        const logs = await HabitLog.find({
            userId: req.user._id,
            completedDate: { $gte: days[0], $lte: days[days.length-1] },
        })
        const counts = {};
        for(const d of days) counts[d] = 0;
        for(const l of logs) counts[l.completedDate] = (counts[l.completedDate] || 0) + 1;
        const data = days.map((d) => ({ date: d, count: counts[d] || 0 }));
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};