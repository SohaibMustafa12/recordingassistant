export type ServerRole = 'owner' | 'admin' | 'staff' | 'member';
export type ShiftStatus = 'active' | 'on_break' | 'completed';
export type LoaStatus = 'pending' | 'approved' | 'denied' | 'expired';
export type InfractionType = 'warn' | 'strike' | 'ban' | 'demote';

export interface Server {
  id: string;
  guild_id: string;
  name: string;
  icon_url?: string;
  owner_id: string;
  created_at: string;
}

export interface ServerMember {
  id: string;
  server_id: string;
  user_id: string;
  role: ServerRole;
  department_id?: string;
  username: string;
  avatar_url?: string;
}

export interface Shift {
  id: string;
  server_id: string;
  user_id: string;
  department_id?: string;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  status: ShiftStatus;
  break_started_at?: string;
  break_seconds: number;
  notes?: string;
}

export interface LOA {
  id: string;
  server_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: LoaStatus;
  review_comment?: string;
}