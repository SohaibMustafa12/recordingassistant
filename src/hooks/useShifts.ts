import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shift } from '../types/database';

export function useShifts(serverId: string | null) {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch open shift
  const fetchActiveShift = async () => {
    if (!serverId) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('server_id', serverId)
      .eq('user_id', user.id)
      .is('end_time', null)
      .maybeSingle();

    if (!error) setActiveShift(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchActiveShift();
  }, [serverId]);

  // Clock In
  const clockIn = async () => {
    if (!serverId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('shifts')
      .insert({
        server_id: serverId,
        user_id: user.id,
        status: 'active'
      })
      .select()
      .single();

    if (!error && data) setActiveShift(data);
  };

  // Toggle Break / Resume
  const toggleBreak = async () => {
    if (!activeShift) return;
    const newStatus = activeShift.status === 'active' ? 'on_break' : 'active';

    const { data, error } = await supabase
      .from('shifts')
      .update({ status: newStatus })
      .eq('id', activeShift.id)
      .select()
      .single();

    if (!error && data) setActiveShift(data);
  };

  // Clock Out
  const clockOut = async () => {
    if (!activeShift) return;

    const { error } = await supabase
      .from('shifts')
      .update({ status: 'completed' })
      .eq('id', activeShift.id);

    if (!error) setActiveShift(null);
  };

  return { activeShift, loading, clockIn, toggleBreak, clockOut };
}