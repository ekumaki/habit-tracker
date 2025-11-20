import { useState, useMemo, useEffect } from 'react';
import {
    format,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    startOfMonth,
    endOfMonth,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    addWeeks,
    subWeeks
} from 'date-fns';
import { ja } from 'date-fns/locale';
import clsx from 'clsx';
import { type Habit, type Record, getAchievementSymbol } from '../db';

interface CalendarViewProps {
    habits: Habit[];
    records: Record[];
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
}

type ViewMode = 'week' | 'month';

export const CalendarView: React.FC<CalendarViewProps> = ({
    habits,
    records,
    selectedDate,
    onDateSelect
}) => {
    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        setCurrentDate(selectedDate);
    }, [selectedDate]);

    const days = useMemo(() => {
        let start, end;
        if (viewMode === 'week') {
            start = startOfWeek(currentDate, { weekStartsOn: 0 });
            end = endOfWeek(currentDate, { weekStartsOn: 0 });
        } else {
            start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
            end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
        }
        return eachDayOfInterval({ start, end });
    }, [viewMode, currentDate]);

    const handlePrev = () => {
        setCurrentDate(prev => viewMode === 'week' ? subWeeks(prev, 1) : subMonths(prev, 1));
    };

    const handleNext = () => {
        setCurrentDate(prev => viewMode === 'week' ? addWeeks(prev, 1) : addMonths(prev, 1));
    };

    const toggleView = () => {
        setViewMode(prev => prev === 'week' ? 'month' : 'week');
        setCurrentDate(new Date()); // Reset to today when switching for simplicity
    };

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4 px-2">
                <button onClick={handlePrev} className="p-2 text-slate-400 hover:text-white transition-colors">
                    &lt;
                </button>

                <div
                    className="flex items-center gap-3 cursor-pointer bg-slate-800/50 hover:bg-slate-800 px-4 py-2 rounded-xl transition-all border border-slate-700 hover:border-slate-600"
                    onClick={toggleView}
                >
                    <span className="text-lg font-bold text-white">
                        {format(currentDate, 'yyyy年M月', { locale: ja })}
                    </span>
                    <span className="text-[13px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-md">
                        {viewMode === 'week' ? '月表示へ' : '週表示へ'}
                    </span>
                </div>

                <button onClick={handleNext} className="p-2 text-slate-400 hover:text-white transition-colors">
                    &gt;
                </button>
            </div>

            <div className="bg-dark-card rounded-2xl p-4 shadow-lg">
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['日', '月', '火', '水', '木', '金', '土'].map(d => (
                        <div key={d} className="text-center text-[13px] font-bold text-slate-300 py-1">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {days.map(day => {
                        const { symbol, color } = getAchievementSymbol(day, habits, records);
                        const isSelected = isSameDay(day, selectedDate);
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isToday = isSameDay(day, new Date());

                        // In month view, dim days outside current month
                        const isDimmed = viewMode === 'month' && !isCurrentMonth;

                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => onDateSelect(day)}
                                className={clsx(
                                    "aspect-square flex flex-col items-center justify-center rounded-xl transition-all relative",
                                    isDimmed ? "opacity-20" : "opacity-100",
                                    isSelected ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-slate-700/50",
                                    isToday && !isSelected && "bg-slate-700/50"
                                )}
                            >
                                <span className={clsx(
                                    "text-[13px] mb-0.5",
                                    isToday ? "text-primary font-bold" : "text-slate-300"
                                )}>
                                    {format(day, 'd')}
                                </span>
                                <span className={clsx("text-sm font-bold leading-none", color)}>
                                    {symbol || '\u00A0'}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
