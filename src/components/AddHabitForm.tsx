import React, { useState } from 'react';
import clsx from 'clsx';

interface AddHabitFormProps {
    onAdd: (name: string) => Promise<void>;
}

export const AddHabitForm: React.FC<AddHabitFormProps> = ({ onAdd }) => {
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onAdd(name.trim());
            setName('');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card mb-6">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="新しい習慣を入力..."
                    className="input-field"
                    disabled={isSubmitting}
                />
                <button
                    type="submit"
                    disabled={!name.trim() || isSubmitting}
                    className={clsx(
                        "btn-primary whitespace-nowrap",
                        (!name.trim() || isSubmitting) && "opacity-50 cursor-not-allowed"
                    )}
                >
                    追加
                </button>
            </div>
        </form>
    );
};
