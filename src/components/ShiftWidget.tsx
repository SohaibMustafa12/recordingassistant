import React, { useState, useEffect } from 'react';
import { useShifts } from '../hooks/useShifts';

interface ShiftWidgetProps {
  serverId: string;
}

export const ShiftWidget: React.FC<ShiftWidgetProps> = ({ serverId }) => {
  const { activeShift, loading, clockIn, toggleBreak, clockOut } = useShifts(serverId);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!activeShift || activeShift.status === 'on_break') return;

    const timer = setInterval(() => {
      const start = new Date(activeShift.start_time).getTime();
      const now = new Date().getTime();
      const breakSecs = activeShift.break_seconds || 0;
      setSeconds(Math.max(0, Math.floor((now - start) / 1000) - breakSecs));
    }, 1000);

    return () => clearInterval(timer);
  }, [activeShift]);

  const formatTime = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  if (loading) {
    return <div className="p-4 bg-slate-800 text-slate-400 rounded-lg">Loading timer...</div>;
  }

  return (
    <div className="p-6 bg-slate-800 rounded-xl border border-slate-700 max-w-sm shadow-md text-white">
      <h3 className="text-lg font-bold mb-3">Staff Shift Control</h3>

      {!activeShift ? (
        <div>
          <p className="text-slate-400 text-sm mb-4">You are currently off shift.</p>
          <button
            onClick={clockIn}
            className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold rounded-lg transition"
          >
            Clock In
          </button>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              activeShift.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {activeShift.status === 'active' ? '● On Shift' : '⏸ On Break'}
            </span>
            <span className="text-xl font-mono font-bold text-sky-400">{formatTime(seconds)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={toggleBreak}
              className="py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold"
            >
              {activeShift.status === 'active' ? 'Take Break' : 'Resume'}
            </button>
            <button
              onClick={clockOut}
              className="py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-semibold"
            >
              Clock Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};