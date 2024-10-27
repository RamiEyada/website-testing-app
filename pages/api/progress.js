// pages/api/progress.js
import { getProgress } from "../../src/progressTracker";

export default function handler(req, res) {
    res.status(200).json({ progress: getProgress() });
}