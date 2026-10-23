export type Role = 'user' | 'admin';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  role: Role;
  created_at: string;
}

export interface Charity {
  id: string;
  name: string;
  description: string;
  category: string;
  logo_url: string | null;
  website_url: string | null;
  active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired';
  price_cents: number;
  started_at: string;
  renews_at: string;
  created_at: string;
}

export interface GolfScore {
  id: string;
  user_id: string;
  course_name: string;
  score: number;
  par: number;
  date_played: string;
  notes: string;
  created_at: string;
}

export interface CharitySelection {
  id: string;
  user_id: string;
  charity_id: string;
  contribution_pct: number;
  created_at: string;
  updated_at: string;
  charity?: Charity;
}

export interface Draw {
  id: string;
  label: string;
  draw_month: string;
  status: 'open' | 'closed' | 'completed';
  jackpot_cents: number;
  winning_numbers: number[];
  rolled_over_from: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface DrawEntry {
  id: string;
  user_id: string;
  draw_id: string;
  numbers: number[];
  created_at: string;
}

export interface Winner {
  id: string;
  draw_id: string;
  user_id: string;
  entry_id: string;
  matches: 3 | 4 | 5;
  prize_cents: number;
  proof_url: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  payout_status: 'pending' | 'paid' | 'failed';
  created_at: string;
  reviewed_at: string | null;
  profile?: Profile;
  draw?: Draw;
  entry?: DrawEntry;
}
