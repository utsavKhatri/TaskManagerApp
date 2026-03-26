import { format } from 'date-fns';
import { supabase } from './supabase';
import { Database } from '../types/database';

export type Task = Database['public']['Tables']['tasks']['Row'] & {
  category?: Database['public']['Tables']['categories']['Row'] | null;
};
export type NewTask = Database['public']['Tables']['tasks']['Insert'];
export type UpdateTask = Database['public']['Tables']['tasks']['Update'];

export const TASKS_PAGE_LIMIT = 20;

export type TaskCreatedBounds = { min: string | null; max: string | null };

export const fetchUserTaskDateBounds = async (): Promise<TaskCreatedBounds> => {
  const [minRes, maxRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('created_at')
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('tasks')
      .select('created_at')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (minRes.error) throw new Error(minRes.error.message);
  if (maxRes.error) throw new Error(maxRes.error.message);

  const minIso = minRes.data?.created_at ?? null;
  const maxIso = maxRes.data?.created_at ?? null;

  return {
    min: minIso ? format(new Date(minIso), 'yyyy-MM-dd') : null,
    max: maxIso ? format(new Date(maxIso), 'yyyy-MM-dd') : null,
  };
};

export const fetchTasks = async ({
  pageParam = 0,
  limit = TASKS_PAGE_LIMIT,
  createdFrom,
  createdTo,
}: {
  pageParam?: number;
  limit?: number;
  /** Inclusive lower bound on `created_at` (ISO string) */
  createdFrom?: string;
  /** Inclusive upper bound on `created_at` (ISO string) */
  createdTo?: string;
}) => {
  const from = pageParam * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('tasks')
    .select(
      `
      id,
      title,
      description,
      status,
      prioriy,
      position,
      created_at,
      user_id,
      category_id,
      is_deleted,
      category:categories(id, name, color, icon)
    `,
    )
    .eq('is_deleted', false);

  if (createdFrom) query = query.gte('created_at', createdFrom);
  if (createdTo) query = query.lte('created_at', createdTo);

  const { data, error } = await query
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as Task[];
};

export const updateTaskPositions = async (
  updates: { id: string; position: number }[],
) => {
  const { data, error } = await supabase.rpc('update_task_positions', {
    updates,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const updateTaskPosition = async (id: string, position: number) => {
  const { data, error } = await supabase
    .from('tasks')
    .update({ position } as any)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Task;
};

export const createTask = async (task: NewTask) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task as any)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Task;
};

export const updateTask = async (task: UpdateTask) => {
  if (!task.id) throw new Error('Task ID is required for update');

  const { data, error } = await supabase
    .from('tasks')
    .update(task as any)
    .eq('id', task.id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Task;
};

export const deleteTask = async (taskId: string) => {
  const { data, error } = await supabase
    .from('tasks')
    .update({ is_deleted: true } as any)
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Task;
};
