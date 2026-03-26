import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useQuery,
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
import { fetchCategories } from '../../../api/categories';
import { Task } from '../../../api/tasks';
import {
  dayKeyToStartIso,
  dayKeyToEndIso,
} from '../utils/taskDateFilter';
import type { TaskDateRange } from '../utils/taskDateFilter';

const ALL_TASKS_KEY = ['tasks', 'all'] as const;

export const tasksFilterKey = (range: TaskDateRange | null) =>
  range == null ? 'all' : `${range.start}_${range.end}`;

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
    staleTime: 30 * 1000,
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

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
};

const invalidateTaskQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['tasks'] });
  queryClient.invalidateQueries({ queryKey: ['task-date-bounds'] });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newTask: NewTask) => createTask(newTask),
    onMutate: async newTask => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      const previousTasks = queryClient.getQueryData<{
        pages: Task[][];
        pageParams: number[];
      }>(ALL_TASKS_KEY);

      if (previousTasks) {
        const optimisticTask: Task = {
          id: 'temp-' + Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_deleted: false,
          user_id: newTask.user_id,
          title: newTask.title,
          description: newTask.description || null,
          status: newTask.status || 'pending',
          prioriy: newTask.prioriy || 'medium',
          category_id: newTask.category_id || null,
          position: 0,
        };

        queryClient.setQueryData(ALL_TASKS_KEY, (old: any) => {
          if (!old) return { pages: [[optimisticTask]], pageParams: [0] };
          const newPages = [...old.pages];
          if (newPages.length > 0) {
            newPages[0] = [optimisticTask, ...newPages[0]];
          } else {
            newPages[0] = [optimisticTask];
          }
          return { ...old, pages: newPages };
        });
      }

      return { previousTasks };
    },
    onError: (err, newTodo, context) => {
      console.error('Create Task Error:', err);
      if (context?.previousTasks !== undefined) {
        queryClient.setQueryData(ALL_TASKS_KEY, context.previousTasks);
      }
    },
    onSettled: () => {
      invalidateTaskQueries(queryClient);
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updatedTask: UpdateTask) => updateTask(updatedTask),
    onMutate: async updatedTask => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<{
        pages: Task[][];
        pageParams: number[];
      }>(ALL_TASKS_KEY);

      if (previousTasks) {
        queryClient.setQueryData(ALL_TASKS_KEY, (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: Task[]) =>
              page.map(task =>
                task.id === updatedTask.id ? { ...task, ...updatedTask } : task,
              ),
            ),
          };
        });
      }

      return { previousTasks };
    },
    onError: (err, newTodo, context) => {
      console.error('Update Task Error:', err);
      if (context?.previousTasks !== undefined) {
        queryClient.setQueryData(ALL_TASKS_KEY, context.previousTasks);
      }
    },
    onSettled: () => {
      invalidateTaskQueries(queryClient);
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onMutate: async taskId => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<{
        pages: Task[][];
        pageParams: number[];
      }>(ALL_TASKS_KEY);

      if (previousTasks) {
        queryClient.setQueryData(ALL_TASKS_KEY, (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: Task[]) =>
              page.filter(task => task.id !== taskId),
            ),
          };
        });
      }

      return { previousTasks };
    },
    onError: (err, newTodo, context) => {
      console.error('Delete Task Error:', err);
      if (context?.previousTasks !== undefined) {
        queryClient.setQueryData(ALL_TASKS_KEY, context.previousTasks);
      }
    },
    onSettled: () => {
      invalidateTaskQueries(queryClient);
    },
  });
};

export const useUpdateTaskPositions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: { id: string; position: number }[]) =>
      updateTaskPositions(updates),
    onMutate: async updates => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<{
        pages: Task[][];
        pageParams: number[];
      }>(ALL_TASKS_KEY);

      if (previousTasks) {
        queryClient.setQueryData(ALL_TASKS_KEY, (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: Task[]) =>
              page.map(task => {
                const update = updates.find(u => u.id === task.id);
                return update ? { ...task, position: update.position } : task;
              }),
            ),
          };
        });
      }

      return { previousTasks };
    },
    onError: (err, newTodo, context) => {
      console.error('Update Position Error:', err);
      if (context?.previousTasks !== undefined) {
        queryClient.setQueryData(ALL_TASKS_KEY, context.previousTasks);
      }
    },
    onSettled: () => {
      invalidateTaskQueries(queryClient);
    },
  });
};
