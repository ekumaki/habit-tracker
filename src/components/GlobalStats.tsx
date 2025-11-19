import clsx from 'clsx';

interface GlobalStatsProps {
    streak: number;
    isRunning: boolean;
}

export const GlobalStats: React.FC<GlobalStatsProps> = ({ streak }) => {
    return (
        <div
            className={clsx(
                "mb-6 p-6 rounded-2xl shadow-lg transition-all duration-300 text-center",
                streak > 0
                    ? "bg-primary text-white shadow-primary/20"
                    : "bg-dark-card border-2 border-warning text-warning shadow-none"
            )}
        >
            <p className="text-3xl font-extrabold tracking-tight">
                {streak}日 <span className="text-xl font-bold">{streak > 0 ? '継続中！' : '継続ならず...'}</span>
            </p>
        </div>
    );
};
