import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../api/supabase';

/**
 * Subscribes to Supabase Realtime for `public.tasks` rows belonging to the
 * signed-in user. When another device (or tab) changes data, React Query
 * refetches so this client stays in sync.
 *
 * Dashboard: Database → Replication → enable for `tasks` (and ensure RLS
 * allows `select` so clients only receive their rows).
 */
export function TasksRealtimeSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    const channelName = `tasks-changes:${userId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['task-date-bounds'] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return null;
}
