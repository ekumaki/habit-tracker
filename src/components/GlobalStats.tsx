import clsx from 'clsx';

interface GlobalStatsProps {
    streak: number;
    isRunning: boolean;
}

export const GlobalStats: React.FC<GlobalStatsProps> = ({ streak }) => {
    if (streak === 0) {
        return null;
    }

    return (
        <div
            className={clsx(
                "mb-6 px-6 py-3 rounded-2xl shadow-lg transition-all duration-300 text-center",
                "bg-primary text-white shadow-primary/20"
            )}
        >
            <p className="text-3xl font-extrabold tracking-tight">
                {streak}日 <span className="text-xl font-bold">継続中！</span>
            </p>
        </div>
    );
};
