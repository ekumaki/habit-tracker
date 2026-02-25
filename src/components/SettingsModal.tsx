import { useState, useRef, useEffect } from 'react';
import { exportAllData, importAllData, resetAllData } from '../db';
import pkg from '../../package.json';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDataChange: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    onDataChange,
}) => {
    const [resetState, setResetState] = useState<'initial' | 'confirm'>('initial');
    const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) {
            setImportStatus(null);
            setResetState('initial');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleExport = async () => {
        const data = await exportAllData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `habit-tracker-backup-${date}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            const result = await importAllData(content);
            if (result.success) {
                setImportStatus({ type: 'success', message: 'データを正常にインポートしました。' });
                await onDataChange();
            } else {
                setImportStatus({ type: 'error', message: `インポートに失敗しました: ${result.error}` });
            }
        };
        reader.readAsText(file);
    };

    const handleReset = async () => {
        if (resetState === 'initial') {
            setResetState('confirm');
        } else {
            await resetAllData();
            await onDataChange();
            setResetState('initial');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity">
            <div className="bg-dark-card w-full max-w-sm rounded-2xl shadow-2xl p-6 transform transition-all scale-100 border border-slate-700">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-primary">設定</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Backup Section */}
                    <section>
                        <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">データの管理</h4>
                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={handleExport}
                                className="w-full flex items-center justify-between p-4 bg-dark-bg hover:bg-slate-800 border border-slate-700 rounded-xl transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                    </div>
                                    <span className="text-white font-medium">エクスポート</span>
                                </div>
                                <span className="text-slate-500 text-xs text-right">JSON形式で保存</span>
                            </button>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center justify-between p-4 bg-dark-bg hover:bg-slate-800 border border-slate-700 rounded-xl transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                    </div>
                                    <span className="text-white font-medium">インポート</span>
                                </div>
                                <span className="text-slate-500 text-xs text-right">ファイルを読み込む</span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImport}
                                accept=".json"
                                className="hidden"
                            />
                        </div>
                        {importStatus && (
                            <p className={`mt-3 text-sm ${importStatus.type === 'success' ? 'text-emerald-400' : 'text-danger'} animate-pulse`}>
                                {importStatus.message}
                            </p>
                        )}
                    </section>

                    {/* Danger Zone */}
                    <section>
                        <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">危険な操作</h4>
                        <button
                            onClick={handleReset}
                            className="w-full flex items-center gap-3 p-4 bg-dark-bg hover:bg-red-500/10 border border-slate-700 hover:border-red-500/30 text-slate-300 hover:text-red-400 rounded-xl transition-all group"
                        >
                            <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </div>
                            <span className="font-medium">全てのデータを削除</span>
                        </button>
                    </section>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-800 text-center">
                    <p className="text-xs text-slate-500 mb-1">習慣トラッカー</p>
                    <p className="text-sm font-bold text-slate-400">v{pkg.version}</p>
                </div>
            </div>

            {/* Confirmation Overlay (Reset) */}
            {resetState === 'confirm' && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 rounded-2xl">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-danger/20 text-danger rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">データを完全に削除しますか？</h4>
                        <p className="text-slate-400 text-sm mb-6">この操作は取り消せません。習慣と過去のすべての記録が失われます。</p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleReset}
                                className="w-full py-3 bg-danger hover:bg-red-600 text-white font-bold rounded-xl transition-all"
                            >
                                消去を実行する
                            </button>
                            <button
                                onClick={() => setResetState('initial')}
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
                            >
                                キャンセル
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
