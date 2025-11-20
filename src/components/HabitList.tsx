import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { type Habit, type Record, calculateHabitStreak } from '../db';
import { format } from 'date-fns';
import clsx from 'clsx';

interface HabitListProps {
    habits: Habit[];
    records: Record[];
    selectedDate: Date;
    onToggle: (habit: Habit) => Promise<void>;
    onEdit: (habit: Habit) => void;
    onReorder: (newHabits: Habit[]) => Promise<void>;
}

export const HabitList: React.FC<HabitListProps> = ({
    habits,
    records,
    selectedDate,
    onToggle,
    onEdit,
    onReorder
}) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(habits);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update order index
        const updatedItems = items.map((item, index) => ({
            ...item,
            order: index
        }));

        onReorder(updatedItems);
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="habits">
                {(provided) => (
                    <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-3 pb-24" // Padding for bottom
                    >
                        {habits.map((habit, index) => {
                            const isCompleted = records.some(r => r.habitId === habit.id && r.date === dateStr);
                            const streak = calculateHabitStreak(habit.id, records);

                            return (
                                <Draggable key={habit.id} draggableId={habit.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={clsx(
                                                "bg-dark-card rounded-xl px-4 py-2 flex items-center justify-between shadow-md transition-all group touch-manipulation",
                                                snapshot.isDragging && "shadow-2xl ring-2 ring-primary z-50 opacity-90"
                                            )}
                                        >
                                            <div className="flex items-center gap-4 flex-1">


                                                {/* Edit Button */}
                                                <button
                                                    onClick={(e) => {
                                                        // Prevent drag start when clicking button
                                                        // e.stopPropagation(); // Not strictly needed for dnd but good practice if issues arise
                                                        onEdit(habit);
                                                    }}
                                                    className="text-slate-300 hover:text-primary transition-colors p-1"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={clsx(
                                                        "text-lg font-medium truncate transition-colors",
                                                        isCompleted ? "text-slate-500 line-through" : "text-white"
                                                    )}>
                                                        {habit.name}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[13px] text-slate-300">継続:</span>
                                                        <span className={clsx(
                                                            "text-sm font-bold",
                                                            streak > 0 ? "text-secondary" : "text-slate-600"
                                                        )}>
                                                            {streak}日
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Checkbox */}
                                            <button
                                                onClick={() => onToggle(habit)}
                                                disabled={!isToday && dateStr > format(new Date(), 'yyyy-MM-dd')} // Disable future
                                                className={clsx(
                                                    "w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ml-4",
                                                    isCompleted
                                                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/30"
                                                        : "border-slate-600 hover:border-primary/50 bg-slate-800/50"
                                                )}
                                            >
                                                {isCompleted && (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </Draggable>
                            );
                        })}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
};
