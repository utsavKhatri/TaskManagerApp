import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useQuery,
  InfiniteData,
  QueryKey,
} from '@tanstack/react-query';
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  NewTask,
  UpdateTask,
  updateTaskPositions,
  TASKS_PAGE_LIMIT,
  fetchUserTaskDateBounds,
} from '../../../api/tasks';
import { Task } from '../../../api/tasks';
import {
  dayKeyToStartIso,
  dayKeyToEndIso,
  isValidDayKey,
} from '../utils/taskDateFilter';
import type { TaskDateRange } from '../utils/taskDateFilter';

export const tasksFilterKey = (range: TaskDateRange | null) =>
  range == null ? 'all' : `${range.start}_${range.end}`;

type TasksInfiniteData = InfiniteData<Task[]>;

const TASKS_ROOT_KEY = ['tasks'] as const;

/** Optimistic create ids removed before the server responds — skip reconcile and clean up if create completes later. */
const abortedOptimisticCreateIds = new Set<string>();

function isTasksInfiniteData(data: unknown): data is TasksInfiniteData {
  return (
    !!data &&
    typeof data === 'object' &&
    'pages' in data &&
    Array.isArray((data as TasksInfiniteData).pages)
  );
}

function repaginate(flat: Task[], limit: number): Task[][] {
  if (flat.length === 0) return [[]];
  const pages: Task[][] = [];
  for (let i = 0; i < flat.length; i += limit) {
    pages.push(flat.slice(i, i + limit));
  }
  return pages;
}

/** Whether a task belongs in a cached list for this query key (date filter). */
function taskMatchesTasksQuery(queryKey: QueryKey, task: Task): boolean {
  const suffix = queryKey[1];
  if (suffix === 'all' || typeof suffix !== 'string') return true;
  const idx = suffix.indexOf('_');
  if (idx === -1) return true;
  const startDay = suffix.slice(0, idx);
  const endDay = suffix.slice(idx + 1);
  if (!isValidDayKey(startDay) || !isValidDayKey(endDay)) return true;
  const t = new Date(task.created_at).getTime();
  const lo = new Date(dayKeyToStartIso(startDay)).getTime();
  const hi = new Date(dayKeyToEndIso(endDay)).getTime();
  return t >= lo && t <= hi;
}

function snapshotTaskCaches(
  queryClient: ReturnType<typeof useQueryClient>,
): [QueryKey, TasksInfiniteData | undefined][] {
  return queryClient.getQueriesData<TasksInfiniteData>({ queryKey: TASKS_ROOT_KEY });
}

function restoreSnapshot(
  queryClient: ReturnType<typeof useQueryClient>,
  entries: [QueryKey, TasksInfiniteData | undefined][],
) {
  entries.forEach(([key, data]) => {
    queryClient.setQueryData(key, data);
  });
}

function setAllTaskCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (
    data: TasksInfiniteData,
    queryKey: QueryKey,
  ) => TasksInfiniteData | undefined,
) {
  const entries = queryClient.getQueriesData<TasksInfiniteData>({
    queryKey: TASKS_ROOT_KEY,
  });
  entries.forEach(([queryKey, old]) => {
    if (!old || !isTasksInfiniteData(old)) return;
    const next = updater(old, queryKey);
    if (next !== undefined) {
      queryClient.setQueryData<TasksInfiniteData>(queryKey, next);
    }
  });
}

/** Replace temp optimistic id with server task; fix pagination. */
function reconcileCreateSuccess(
  queryClient: ReturnType<typeof useQueryClient>,
  tempId: string,
  serverTask: Task,
) {
  setAllTaskCaches(queryClient, (old, queryKey) => {
    const flat = old.pages.flat().filter(t => t.id !== tempId && t.id !== serverTask.id);
    const nextFlat = taskMatchesTasksQuery(queryKey, serverTask)
      ? [...flat, serverTask].sort((a, b) => a.position - b.position)
      : flat;
    const pages = repaginate(nextFlat, TASKS_PAGE_LIMIT);
    return {
      pages,
      pageParams: pages.map((_, i) => i),
    };
  });
}

function patchTaskInCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  taskId: string,
  patch: Partial<Task>,
  serverTask?: Task,
) {
  const merged = serverTask;
  setAllTaskCaches(queryClient, old => ({
    ...old,
    pages: old.pages.map(page =>
      page.map(t => {
        if (t.id !== taskId) return t;
        return merged ? merged : { ...t, ...patch };
      }),
    ),
  }));
}

function removeTaskFromCaches(queryClient: ReturnType<typeof useQueryClient>, taskId: string) {
  setAllTaskCaches(queryClient, old => {
    const flat = old.pages.flat().filter(t => t.id !== taskId);
    const pages = repaginate(flat, TASKS_PAGE_LIMIT);
    return {
      pages,
      pageParams: pages.map((_, i) => i),
    };
  });
}

function applyPositionUpdates(
  old: TasksInfiniteData,
  updates: { id: string; position: number }[],
): TasksInfiniteData {
  const pos = new Map(updates.map(u => [u.id, u.position]));
  const flat = [...old.pages.flat()];
  const sorted = flat.sort((a, b) => {
    const pa = pos.get(a.id);
    const pb = pos.get(b.id);
    if (pa !== undefined && pb !== undefined) return pa - pb;
    if (pa !== undefined) return -1;
    if (pb !== undefined) return 1;
    return a.position - b.position;
  });
  const remapped = sorted.map(t => {
    const p = pos.get(t.id);
    return p !== undefined ? { ...t, position: p } : t;
  });
  const pages = repaginate(remapped, TASKS_PAGE_LIMIT);
  return {
    pages,
    pageParams: pages.map((_, i) => i),
  };
}

const invalidateDateBounds = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['task-date-bounds'] });
};

const markTasksStaleNoRefetch = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: TASKS_ROOT_KEY, refetchType: 'none' });
};

export const useTasks = (dateRange: TaskDateRange | null) => {
  const filterKey = tasksFilterKey(dateRange);
  return useInfiniteQuery({
    queryKey: ['tasks', filterKey],
    queryFn: ({ pageParam = 0 }) =>
      fetchTasks({
        pageParam,
        limit: TASKS_PAGE_LIMIT,
        ...(dateRange
          ? {
              createdFrom: dayKeyToStartIso(dateRange.start),
              createdTo: dayKeyToEndIso(dateRange.end),
            }
          : {}),
      }),
    initialPageParam: 0,
    maxPages: 6,
    staleTime: 60 * 1000,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < TASKS_PAGE_LIMIT) return undefined;
      return allPages.length;
    },
  });
};

export const useTaskDateBounds = () =>
  useQuery({
    queryKey: ['task-date-bounds'],
    queryFn: fetchUserTaskDateBounds,
    staleTime: 5 * 60 * 1000,
  });

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newTask: NewTask) => createTask(newTask),
    onMutate: async newTask => {
      await queryClient.cancelQueries({ queryKey: TASKS_ROOT_KEY });
      const previous = snapshotTaskCaches(queryClient);
      const tempId = `temp-${Date.now()}`;
      const optimisticTask: Task = {
        id: tempId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
        user_id: newTask.user_id,
        title: newTask.title,
        description: newTask.description ?? null,
        status: newTask.status || 'pending',
        prioriy: newTask.prioriy || 'medium',
        category_id: newTask.category_id ?? null,
        position: 0,
      };

      setAllTaskCaches(queryClient, (old, queryKey) => {
        if (!taskMatchesTasksQuery(queryKey, optimisticTask)) return old;
        const flat = old.pages.flat().map(t => ({
          ...t,
          position: t.position + 1,
        }));
        const nextFlat = [optimisticTask, ...flat].sort((a, b) => a.position - b.position);
        const pages = repaginate(nextFlat, TASKS_PAGE_LIMIT);
        return { pages, pageParams: pages.map((_, i) => i) };
      });

      return { previous, tempId };
    },
    onSuccess: (serverTask, _vars, ctx) => {
      if (ctx?.tempId && abortedOptimisticCreateIds.has(ctx.tempId)) {
        abortedOptimisticCreateIds.delete(ctx.tempId);
        void deleteTask(serverTask.id);
        invalidateDateBounds(queryClient);
        markTasksStaleNoRefetch(queryClient);
        return;
      }
      if (ctx?.tempId) {
        reconcileCreateSuccess(queryClient, ctx.tempId, serverTask);
      }
      invalidateDateBounds(queryClient);
      markTasksStaleNoRefetch(queryClient);
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.tempId) abortedOptimisticCreateIds.delete(ctx.tempId);
      if (ctx?.previous) restoreSnapshot(queryClient, ctx.previous);
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updatedTask: UpdateTask) => updateTask(updatedTask),
    onMutate: async updatedTask => {
      await queryClient.cancelQueries({ queryKey: TASKS_ROOT_KEY });
      const previous = snapshotTaskCaches(queryClient);
      if (!updatedTask.id) return { previous };

      patchTaskInCaches(
        queryClient,
        updatedTask.id,
        updatedTask as Partial<Task>,
      );
      return { previous };
    },
    onSuccess: data => {
      patchTaskInCaches(queryClient, data.id, {}, data);
      invalidateDateBounds(queryClient);
      markTasksStaleNoRefetch(queryClient);
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) restoreSnapshot(queryClient, ctx.previous);
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      if (taskId.startsWith('temp-')) {
        abortedOptimisticCreateIds.add(taskId);
        return {} as Task;
      }
      return deleteTask(taskId);
    },
    onMutate: async taskId => {
      await queryClient.cancelQueries({ queryKey: TASKS_ROOT_KEY });
      const previous = snapshotTaskCaches(queryClient);
      removeTaskFromCaches(queryClient, taskId);
      return { previous };
    },
    onSuccess: () => {
      invalidateDateBounds(queryClient);
      markTasksStaleNoRefetch(queryClient);
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) restoreSnapshot(queryClient, ctx.previous);
    },
  });
};

export const useUpdateTaskPositions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: { id: string; position: number }[]) =>
      updateTaskPositions(updates),
    onMutate: async updates => {
      await queryClient.cancelQueries({ queryKey: TASKS_ROOT_KEY });
      const previous = snapshotTaskCaches(queryClient);
      setAllTaskCaches(queryClient, old => applyPositionUpdates(old, updates));
      return { previous };
    },
    onSuccess: () => {
      markTasksStaleNoRefetch(queryClient);
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) restoreSnapshot(queryClient, ctx.previous);
    },
  });
};
