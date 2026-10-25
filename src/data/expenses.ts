import { supabase } from '../lib/supabase';
import { toYmd } from '../utils/date';

export type Expense = {
  id: string;
  /** 'YYYY-MM-DD' */
  spentOn: string;
  amount: number;
  name: string;
  /** data/category 의 CategoryId */
  category: string;
};

type Row = { id: string; spent_on: string; amount: number; name: string; category: string };

/** from ~ to (양끝 포함) 사이의 내 지출. 최신순. */
export async function fetchExpenses(from: Date, to: Date): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('id, spent_on, amount, name, category')
    .gte('spent_on', toYmd(from))
    .lte('spent_on', toYmd(to))
    .order('spent_on', { ascending: false })
    .order('created_at', { ascending: false })
    .returns<Row[]>();

  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    spentOn: r.spent_on,
    amount: r.amount,
    name: r.name,
    category: r.category,
  }));
}

export async function addExpense(input: { date: Date; amount: number; name: string; category: string }) {
  // user_id 는 DB 기본값(auth.uid())이 채운다
  const { error } = await supabase.from('expenses').insert({
    spent_on: toYmd(input.date),
    amount: input.amount,
    name: input.name,
    category: input.category,
  });
  if (error) throw error;
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}