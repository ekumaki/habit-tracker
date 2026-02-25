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
import { SettingsModal } from './components/SettingsModal';

import { useRegisterSW } from 'virtual:pwa-register/react';

function App() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [globalStreak, setGlobalStreak] = useState({ current: 0, isRunning: false });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // PWA Update Logic
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error);
    },
  });

  // Check for updates when app becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('App became visible, checking for updates...');
        updateServiceWorker(); // This triggers a check. If new SW found, needRefresh becomes true.
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [updateServiceWorker]);

  // Apply update if needed and modal is closed
  useEffect(() => {
    if (needRefresh && !isModalOpen && !isSettingsOpen) {
      console.log('Update available and modal is closed. Updating...');
      updateServiceWorker(true);
      setNeedRefresh(false);
    }
  }, [needRefresh, isModalOpen, isSettingsOpen, updateServiceWorker, setNeedRefresh]);

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
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
            title="設定"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </header>

        <main className="flex-1 px-4">
          <GlobalStats streak={globalStreak.current} isRunning={globalStreak.isRunning} />

          <CalendarView
            habits={habits}
            records={records}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onGoToToday={() => setSelectedDate(new Date())}
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

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDataChange={loadData}
      />
    </div>
  );
}

export default App;
