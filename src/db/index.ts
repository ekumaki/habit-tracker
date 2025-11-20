import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { format, subDays } from 'date-fns';

export interface Habit {
    id: string;
    name: string;
    order: number;
    createdAt: Date;
}

export interface Record {
    id: string; // composite key: date_habitId
    habitId: string;
    date: string; // YYYY-MM-DD
    completed: boolean;
}

interface HabitTrackerDB extends DBSchema {
    habits: {
        key: string;
        value: Habit;
        indexes: { 'by-order': number };
    };
    records: {
        key: string;
        value: Record;
        indexes: { 'by-habit': string; 'by-date': string };
    };
}

const DB_NAME = 'habit-tracker-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<HabitTrackerDB>>;

export const initDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<HabitTrackerDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                const habitStore = db.createObjectStore('habits', { keyPath: 'id' });
                habitStore.createIndex('by-order', 'order');

                const recordStore = db.createObjectStore('records', { keyPath: 'id' });
                recordStore.createIndex('by-habit', 'habitId');
                recordStore.createIndex('by-date', 'date');
            },
        });
    }
    return dbPromise;
};

export const addHabit = async (name: string) => {
    const db = await initDB();
    const habits = await db.getAll('habits');
    const order = habits.length;
    const uuidv4 = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    const id = uuidv4();
    const newHabit: Habit = {
        id,
        name,
        order,
        createdAt: new Date(),
    };
    await db.add('habits', newHabit);
    return newHabit;
};

export const getHabits = async () => {
    const db = await initDB();
    return db.getAllFromIndex('habits', 'by-order');
};

export const updateHabit = async (habit: Habit) => {
    const db = await initDB();
    await db.put('habits', habit);
};

export const deleteHabit = async (id: string) => {
    const db = await initDB();
    const tx = db.transaction(['habits', 'records'], 'readwrite');
    await tx.objectStore('habits').delete(id);

    // Delete associated records
    const recordIndex = tx.objectStore('records').index('by-habit');
    let cursor = await recordIndex.openCursor(IDBKeyRange.only(id));
    while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
    }
    await tx.done;
};

export const toggleRecord = async (habitId: string, date: string) => {
    const db = await initDB();
    const id = `${date}_${habitId}`;
    const record = await db.get('records', id);

    if (record) {
        await db.delete('records', id);
        return false; // Not completed
    } else {
        await db.add('records', {
            id,
            habitId,
            date,
            completed: true,
        });
        return true; // Completed
    }
};

export const getRecords = async (startDate: string, endDate: string) => {
    const db = await initDB();
    const records = await db.getAllFromIndex('records', 'by-date', IDBKeyRange.bound(startDate, endDate));
    return records;
};

export const getAllRecords = async () => {
    const db = await initDB();
    return db.getAll('records');
}

// --- Logic from Prototype ---

export const calculateGlobalStreak = async (habits: Habit[], records: Record[]) => {
    if (habits.length === 0) return { current: 0, isRunning: false };

    // Group records by date
    const dailyRecords: { [date: string]: { [habitId: string]: boolean } } = {};
    records.forEach(r => {
        if (!dailyRecords[r.date]) dailyRecords[r.date] = {};
        dailyRecords[r.date][r.habitId] = r.completed;
    });

    let currentStreak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    const todayStr = format(checkDate, 'yyyy-MM-dd');
    const todayRecords = dailyRecords[todayStr] || {};
    const isTodayFullyCompleted = habits.every(habit => todayRecords[habit.id] === true);
    // const isTodayRecorded = !!dailyRecords[todayStr]; 
    // Prototype logic: "isTodayRecorded = dailyRecords.hasOwnProperty(todayStr)"
    // But in our DB, records only exist if completed.
    // So if isTodayFullyCompleted is true, then records exist.

    let isRunning = false;

    if (isTodayFullyCompleted) {
        currentStreak = 1;
        isRunning = true;
        checkDate = subDays(checkDate, 1);
    } else {
        // Today not fully completed. Check yesterday.
        checkDate = subDays(checkDate, 1);
    }

    // Check past days
    for (let i = 0; i < 365 * 5; i++) {
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        const dayRecords = dailyRecords[dateStr];

        // If no records at all for this day, and we are looking for FULL completion,
        // then it's definitely not fully completed (unless 0 habits, but we handled that).
        // However, prototype logic breaks if "past unrecorded day".
        // "if (!dailyRecords.hasOwnProperty(dateStr)) break;"
        // In our case, if no records exist for a date, dailyRecords[dateStr] is undefined.

        if (!dayRecords) {
            break;
        }

        const isFullyCompleted = habits.every(habit => dayRecords[habit.id] === true);

        if (isFullyCompleted) {
            currentStreak++;
            isRunning = true;
        } else {
            break;
        }
        checkDate = subDays(checkDate, 1);
    }

    return { current: currentStreak, isRunning };
};

export const calculateHabitStreak = (habitId: string, records: Record[]) => {
    let streak = 0;
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    // Filter records for this habit and sort descending by date
    const habitRecords = records
        .filter(r => r.habitId === habitId)
        .sort((a, b) => b.date.localeCompare(a.date));

    const todayRecord = habitRecords.find(r => r.date === todayStr);
    const isTodayCompleted = !!todayRecord;

    let dateCursor = new Date(today);
    dateCursor.setHours(0, 0, 0, 0);

    if (isTodayCompleted) {
        streak = 1;
        dateCursor = subDays(dateCursor, 1);
    }

    for (let i = 0; i < 365 * 5; i++) {
        const dateStr = format(dateCursor, 'yyyy-MM-dd');

        // Stop if future (shouldn't happen with subDays)

        const record = habitRecords.find(r => r.date === dateStr);

        if (record) {
            streak++;
        } else {
            // Break if no record for this day
            // Note: Prototype logic had a check "if (dateStr < todayStr) break;"
            // which basically means if we miss a day in the past, streak ends.
            if (dateStr < todayStr) {
                break;
            }
        }

        dateCursor = subDays(dateCursor, 1);
    }
    return streak;
};

export const getAchievementSymbol = (date: Date, habits: Habit[], records: Record[]) => {
    if (habits.length === 0) return { symbol: '', color: 'text-gray-500', title: '習慣なし' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate > today) {
        return { symbol: '', color: 'text-gray-500', title: '' };
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const dayRecords = records.filter(r => r.date === dateStr);

    // Filter habits that existed on this date?
    // Prototype doesn't do this, it uses current habits. We'll stick to prototype logic for simplicity.
    // "allHabits.forEach..."

    let completedCount = 0;
    habits.forEach(habit => {
        if (dayRecords.some(r => r.habitId === habit.id)) {
            completedCount++;
        }
    });

    const totalCount = habits.length;
    const completionRate = (completedCount / totalCount) * 100;

    if (totalCount === 0) return { symbol: '', color: 'text-gray-500', title: '記録なし' };

    if (completionRate === 100) {
        return { symbol: '◎', color: 'text-primary', title: '完全達成' };
    } else if (completionRate > 0) {
        return { symbol: '△', color: 'text-warning', title: '一部達成' };
    } else if (completionRate === 0) {
        // If date is today or past, and 0%, it's X.
        // But if it's future, it should be blank?
        // Prototype: "if (completionRate === 0) return X"
        // But it also checks "if (totalCount === 0) return Blank"

        // Let's return X for 0% to match prototype visual
        return { symbol: '×', color: 'text-danger', title: '全て未達成' };
    }
    return { symbol: '', color: 'text-gray-500', title: '記録なし' };
};
