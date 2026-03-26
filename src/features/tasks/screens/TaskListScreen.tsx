import React, { useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Text,
  Pressable,
} from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetInfo } from '@react-native-community/netinfo';
import { useAuth } from '../../../hooks/useAuth';
import { TaskFormBottomSheet } from '../components/TaskFormBottomSheet';
import { TaskDetailBottomSheet } from '../components/TaskDetailBottomSheet';
import { TaskListHeader } from '../components/TaskListHeader';
import { TaskDateFilterModal } from '../components/TaskDateFilterModal';
import { TaskFab } from '../components/TaskFab';
import { EmptyTaskList } from '../components/EmptyTaskList';
import { spacing, typography, useTheme } from '../../../theme';
import { Task } from '../../../api/tasks';
import { useTaskList } from '../hooks/useTaskList';
import { TaskListControls } from '../components/TaskListControls';
import { SwipeableTaskItem } from '../components/SwipeableTaskItem';
import { TaskSkeleton } from '../components/TaskSkeleton';

// Stable no-op function to prevent unnecessary re-renders when drag is disabled
const NO_OP = () => {};

// Estimated item height for getItemLayout (compact cards + margin)
const ITEM_HEIGHT = 88;

export const TaskListScreen = () => {
  const { signOut } = useAuth();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false && netInfo.type !== 'unknown';

  const {
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
    handleSubmitTask,
    handleToggleStatus,
    handleDelete,
    handleOpenEdit,
    onRefresh,
    handleDragEnd,
    isMutating,
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
  } = useTaskList();

  const listEmpty = useMemo(
    () => (
      <EmptyTaskList variant={taskDateRange ? 'filtered' : 'default'} />
    ),
    [taskDateRange],
  );

  // Memoized renderItem for search results (non-draggable)
  const renderSearchItem = useCallback(
    ({ item }: { item: Task }) => (
      <SwipeableTaskItem
        item={item}
        drag={NO_OP}
        isActive={false}
        onToggle={handleToggleStatus}
        onDelete={handleDelete}
        onEdit={handleOpenEdit}
        disableScaleDecorator
        disabled={isOffline}
      />
    ),
    [handleToggleStatus, handleDelete, handleOpenEdit, isOffline],
  );

  const renderDraggableItem = useCallback(
    ({
      item,
      drag,
      isActive,
    }: {
      item: Task;
      drag: () => void;
      isActive: boolean;
    }) => (
      <SwipeableTaskItem
        item={item}
        drag={drag}
        isActive={isActive}
        onToggle={handleToggleStatus}
        onDelete={handleDelete}
        onEdit={handleOpenEdit}
        disabled={isOffline}
      />
    ),
    [handleToggleStatus, handleDelete, handleOpenEdit, isOffline],
  );

  // Footer component for pagination loading
  const ListFooter = isFetchingNextPage ? (
    <ActivityIndicator
      size="small"
      color={colors.accent}
      style={styles.loaderMargin}
    />
  ) : null;

  // getItemLayout for performance boost
  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          paddingTop: insets.top,
        },
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <View
        style={[
          styles.headerZone,
          { borderBottomColor: colors.border },
        ]}
      >
        <TaskListHeader
          dateBadgeLabel={dateBadgeLabel}
          onOpenDateFilter={openDateFilter}
          onSignOut={signOut}
        />
        <TaskListControls
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </View>

      {isLoading ? (
        <TaskSkeleton />
      ) : error ? (
        <Pressable
          onPress={onRefresh}
          accessibilityRole="button"
          accessibilityLabel="Error loading tasks. Double tap to try again."
          style={styles.errorPressable}
        >
          <Text style={[styles.errorText, { color: colors.error }]}>
            Something went wrong loading tasks.
          </Text>
          <Text style={[styles.errorHint, { color: colors.textSecondary }]}>
            Tap to retry
          </Text>
        </Pressable>
      ) : isSearching ? (
        // Use FlashList for search results (virtualized, no drag)
        <FlashList
          data={orderedTasks}
          keyExtractor={item => item.id}
          renderItem={renderSearchItem}
          getItemType={item => item.status}
          drawDistance={420}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom: insets.bottom + 100,
            },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={listEmpty}
        />
      ) : (
        // Use DraggableFlatList for normal view
        <DraggableFlatList
          data={orderedTasks}
          onDragEnd={handleDragEnd}
          keyExtractor={item => item.id}
          renderItem={renderDraggableItem}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom: insets.bottom + 100,
            },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={listEmpty}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={ListFooter}
          windowSize={11}
          removeClippedSubviews
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          getItemLayout={getItemLayout}
        />
      )}

      <TaskFab onPress={handleOpenCreate} bottomInset={insets.bottom} disabled={isOffline} />

      <TaskDetailBottomSheet
        visible={isModalVisible && !!detailTask}
        task={detailTask}
        onClose={handleCloseModal}
      />
      <TaskFormBottomSheet
        visible={isModalVisible && !detailTask}
        onClose={handleCloseModal}
        onSubmit={handleSubmitTask}
        initialData={editingTask}
        loading={isMutating}
      />

      <TaskDateFilterModal
        visible={isDateFilterModalVisible}
        onClose={closeDateFilter}
        appliedRange={taskDateRange}
        dataBounds={taskDateBounds}
        onApply={applyTaskDateFilter}
        onClear={clearTaskDateFilter}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerZone: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.m,
    flexGrow: 1,
  },
  errorPressable: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.l,
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    ...typography.body,
    fontWeight: '600',
  },
  errorHint: {
    textAlign: 'center',
    marginTop: spacing.s,
    ...typography.caption,
  },
  loaderMargin: {
    marginVertical: 20,
  },
});
