import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import clsx from 'clsx';
import type { Habit } from '../db';

interface HabitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, startDate: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    editingHabit: Habit | null;
}

export const HabitModal: React.FC<HabitModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    editingHabit,
}) => {
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [deleteState, setDeleteState] = useState<'initial' | 'confirm'>('initial');

    useEffect(() => {
        if (isOpen) {
            setName(editingHabit ? editingHabit.name : '');
            setStartDate(editingHabit?.startDate || format(editingHabit?.createdAt || new Date(), 'yyyy-MM-dd'));
            setDeleteState('initial');
        }
    }, [isOpen, editingHabit]);

    useEffect(() => {
        if (isOpen) {
            // Lock scroll for both html and body
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            // Fix height to prevent rubber-band effect
            document.documentElement.style.height = '100%';
            document.body.style.height = '100%';
        } else {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            document.documentElement.style.height = '';
            document.body.style.height = '';
        }
        return () => {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            document.documentElement.style.height = '';
            document.body.style.height = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name.trim()) return;
        if (!name.trim()) return;
        await onSave(name.trim(), startDate);
        onClose();
    };

    const handleDeleteClick = async () => {
        if (!editingHabit) return;

        if (deleteState === 'initial') {
            setDeleteState('confirm');
        } else {
            await onDelete(editingHabit.id);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity">
            <div className="bg-dark-card w-full max-w-sm rounded-2xl shadow-2xl p-6 transform transition-all scale-100">
                <h3 className="text-xl font-bold mb-4 text-primary">
                    {editingHabit ? '習慣の編集' : '習慣の追加'}
                </h3>

                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="習慣名を入力 (例: 読書 30分)"
                        disabled={deleteState === 'confirm'}
                        className={clsx(
                            "w-full bg-dark-bg border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none mb-6 transition-colors",
                            deleteState === 'confirm' && "opacity-50 cursor-not-allowed"
                        )}
                        autoFocus
                    />

                    <div className="mb-6">
                        <label className="block text-slate-400 text-sm font-bold mb-2">
                            開始日
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-dark-bg border border-slate-700 rounded-xl p-4 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                        />
                    </div>

                    {deleteState === 'confirm' && (
                        <p className="text-sm text-danger mb-4 font-medium animate-pulse">
                            本当に削除しますか？過去の記録も全て削除されます。
                        </p>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors font-medium"
                        >
                            キャンセル
                        </button>

                        {editingHabit && (
                            <button
                                type="button"
                                onClick={handleDeleteClick}
                                className={clsx(
                                    "px-4 py-2 rounded-lg text-white transition-colors font-medium",
                                    deleteState === 'confirm'
                                        ? "bg-danger hover:bg-red-600"
                                        : "bg-slate-700 hover:bg-red-500/20 hover:text-red-400"
                                )}
                            >
                                {deleteState === 'confirm' ? '削除を実行' : '削除'}
                            </button>
                        )}

                        {deleteState !== 'confirm' && (
                            <button
                                type="submit"
                                disabled={!name.trim()}
                                className="px-6 py-2 bg-primary hover:bg-emerald-600 text-white rounded-lg font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                保存
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};
