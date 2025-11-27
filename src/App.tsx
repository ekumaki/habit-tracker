import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  type Habit,
  type Record,
  getHabits,
  addHabit,
  updateHabit,
  deleteHabit,
  getAllRecords,
  toggleRecord,
  calculateGlobalStreak
} from './db';
import { CalendarView } from './components/CalendarView';
import { HabitList } from './components/HabitList';
import { GlobalStats } from './components/GlobalStats';
import { HabitModal } from './components/HabitModal';

function App() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [globalStreak, setGlobalStreak] = useState({ current: 0, isRunning: false });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const loadData = async () => {
    try {
      const [loadedHabits, loadedRecords] = await Promise.all([
        getHabits(),
        getAllRecords()
      ]);
      setHabits(loadedHabits);
      setRecords(loadedRecords);

      const streak = await calculateGlobalStreak(loadedHabits, loadedRecords);
      setGlobalStreak(streak);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddHabit = async (name: string, startDate: string) => {
    if (editingHabit) {
      await updateHabit({ ...editingHabit, name, startDate });
    } else {
      await addHabit(name, startDate);
    }
    await loadData();
  };

  const handleDeleteHabit = async (id: string) => {
    await deleteHabit(id);
    await loadData();
  };

  const handleToggleRecord = async (habit: Habit) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    await toggleRecord(habit.id, dateStr);
    await loadData();
  };

  const handleReorder = async (newHabits: Habit[]) => {
    setHabits(newHabits); // Optimistic update
    for (const habit of newHabits) {
      await updateHabit(habit);
    }
    // No need to reload data here as we updated local state, 
    // but strictly speaking we should to ensure DB consistency.
    // Let's reload silently.
    loadData();
  };

  const openModal = (habit: Habit | null = null) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text pb-20">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">

        {/* Header */}
        <header className="p-6 flex items-center justify-between sticky top-0 bg-dark-bg/80 backdrop-blur-md z-10">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-400 bg-clip-text text-transparent">
            習慣トラッカー
          </h1>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="text-[13px] font-bold bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full transition-colors text-primary"
          >
            今日へ戻る
          </button>
        </header>

        <main className="flex-1 px-4">
          <GlobalStats streak={globalStreak.current} isRunning={globalStreak.isRunning} />

          <CalendarView
            habits={habits}
            records={records}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{format(selectedDate, 'M月d日 (E)', { locale: ja })}</span>
              <span className="text-slate-300 text-sm font-normal">の記録</span>
            </h2>

            <button
              onClick={() => openModal(null)}
              className="bg-primary hover:bg-emerald-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg shadow-primary/20 transition-all flex items-center gap-1"
            >
              <span>+</span> 習慣を追加
            </button>
          </div>

          {habits.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="mb-4">習慣がまだ登録されていません</p>
              <p className="text-sm">「習慣を追加」ボタンから始めましょう！</p>
            </div>
          ) : (
            <HabitList
              habits={habits}
              records={records}
              selectedDate={selectedDate}
              onToggle={handleToggleRecord}
              onEdit={openModal}
              onReorder={handleReorder}
            />
          )}
        </main>
      </div>

      <HabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddHabit}
        onDelete={handleDeleteHabit}
        editingHabit={editingHabit}
      />
    </div>
  );
}

export default App;
