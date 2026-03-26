import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Alert } from 'react-native';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../hooks/useAuth';
import {
  useTasks,
  useTaskDateBounds,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useUpdateTaskPositions,
} from './useTasks';
import { Task } from '../../../api/tasks';
import {
  formatTaskDateBadge,
  type TaskDateRange,
} from '../utils/taskDateFilter';

export const useTaskList = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [taskDateRange, setTaskDateRange] = useState<TaskDateRange | null>(
    null,
  );
  const [isDateFilterModalVisible, setDateFilterModalVisible] = useState(false);
  const { data: taskDateBounds } = useTaskDateBounds();

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTasks(taskDateRange);

  const dateBadgeLabel = useMemo(
    () => formatTaskDateBadge(taskDateRange),
    [taskDateRange],
  );

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const updateTaskPositionsMutation = useUpdateTaskPositions();

  // Flatten pages for consumption and deduplicate by ID to prevent "Duplicate Key" errors
  // which can occur when items shift between pages during background refetches.
  const tasks = React.useMemo(() => {
    const allTasks = data?.pages.flat() || [];
    const seen = new Set<string>();
    return allTasks.filter(t => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [data]);

  // Modal: create/edit form vs read-only completed detail
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const normalizedQuery = debouncedSearchQuery.trim().toLowerCase();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 220);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Processed tasks: O(n) partitioning instead of O(n log n) sort.
  const processedTasks = React.useMemo(() => {
    if (!tasks.length) return [];

    const pending: Task[] = [];
    const completed: Task[] = [];

    for (const t of tasks) {
      if (
        normalizedQuery.length > 0 &&
        !t.title.toLowerCase().includes(normalizedQuery)
      ) {
        continue;
      }
      if (t.status === 'completed') {
        completed.push(t);
      } else {
        pending.push(t);
      }
    }

    return [...pending, ...completed];
  }, [tasks, normalizedQuery]);

  // Local state for DraggableFlatList to prevent jitter
  const [orderedTasks, setOrderedTasks] = useState<Task[]>([]);

  React.useEffect(() => {
    setOrderedTasks(processedTasks);
  }, [processedTasks]);

  const handleOpenCreate = useCallback(() => {
    setEditingTask(null);
    setDetailTask(null);
    setIsModalVisible(true);
  }, []);

  const handleOpenEdit = useCallback((task: Task) => {
    if (task.status === 'completed') {
      setDetailTask(task);
      setEditingTask(null);
    } else {
      setEditingTask(task);
      setDetailTask(null);
    }
    setIsModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setEditingTask(null);
    setDetailTask(null);
  }, []);

  const handleSubmitTask = useCallback(
    async (
      title: string,
      description: string,
      categoryId: string | null,
    ) => {
      if (!user) return;

      if (editingTask) {
        updateTaskMutation.mutate(
          {
            id: editingTask.id,
            title,
            description,
            category_id: categoryId,
          },
          {
            onSuccess: () => {
              showToast('Task updated successfully', 'success');
              handleCloseModal();
            },
            onError: err => showToast(err.message, 'error'),
          },
        );
      } else {
        createTaskMutation.mutate(
          {
            title,
            description,
            user_id: user.id,
            status: 'pending',
            prioriy: 'medium',
            category_id: categoryId,
          },
          {
            onSuccess: () => {
              showToast('Task created successfully', 'success');
              handleCloseModal();
            },
            onError: err => showToast(err.message, 'error'),
          },
        );
      }
    },
    [
      user,
      editingTask,
      updateTaskMutation,
      createTaskMutation,
      showToast,
      handleCloseModal,
    ],
  );

  const handleToggleStatus = useCallback(
    (task: Task) => {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      updateTaskMutation.mutate({ id: task.id, status: newStatus });
    },
    [updateTaskMutation],
  );

  const handleDelete = useCallback(
    (taskId: string) => {
      Alert.alert('Delete Task', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTaskMutation.mutate(taskId),
        },
      ]);
    },
    [deleteTaskMutation],
  );

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const openDateFilter = useCallback(() => {
    setDateFilterModalVisible(true);
  }, []);

  const closeDateFilter = useCallback(() => {
    setDateFilterModalVisible(false);
  }, []);

  const applyTaskDateFilter = useCallback((range: TaskDateRange) => {
    setTaskDateRange(range);
    setDateFilterModalVisible(false);
  }, []);

  const clearTaskDateFilter = useCallback(() => {
    setTaskDateRange(null);
    setDateFilterModalVisible(false);
  }, []);

  const handleDragEnd = useCallback(
    ({ data: currentTasks }: { data: Task[] }) => {
      // 1. Update local state immediately
      setOrderedTasks(currentTasks);

      // 2. Calculate updates
      const updates: { id: string; position: number }[] = [];

      currentTasks.forEach((task, index) => {
        if (task.position !== index) {
          updates.push({ id: task.id, position: index });
        }
      });

      // 3. Sync with server
      if (updates.length > 0) {
        updateTaskPositionsMutation.mutate(updates);
      }
    },
    [updateTaskPositionsMutation],
  );

  return {
    tasks,
    isLoading,
    error,
    isRefetching,
    searchQuery,
    setSearchQuery,
    isModalVisible,
    handleOpenCreate,
    handleCloseModal,
    editingTask,
    detailTask,
    handleOpenEdit,
    handleSubmitTask,
    handleToggleStatus,
    handleDelete,
    onRefresh,
    handleDragEnd,
    isMutating: createTaskMutation.isPending || updateTaskMutation.isPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    orderedTasks,
    taskDateRange,
    taskDateBounds,
    dateBadgeLabel,
    isDateFilterModalVisible,
    openDateFilter,
    closeDateFilter,
    applyTaskDateFilter,
    clearTaskDateFilter,
  };
};
