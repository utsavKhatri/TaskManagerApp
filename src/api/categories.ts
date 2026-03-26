import { supabase } from './supabase';
import { Database } from '../types/database';

export type Category = Database['public']['Tables']['categories']['Row'];
export type NewCategory = Database['public']['Tables']['categories']['Insert'];
export type UpdateCategory =
  Database['public']['Tables']['categories']['Update'];

export const fetchCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as Category[];
};

export const createCategory = async (category: NewCategory) => {
  const { data, error } = await supabase
    .from('categories')
    .insert(category as any)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Category;
};

export const deleteCategory = async (categoryId: string) => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);

  if (error) {
    throw new Error(error.message);
  }
};
