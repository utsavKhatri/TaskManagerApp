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
import { useTaskScreenLayout } from '../hooks/useTaskScreenLayout';

// Stable no-op function to prevent unnecessary re-renders when drag is disabled
const NO_OP = () => {};

export const TaskListScreen = () => {
  const { signOut } = useAuth();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const layout = useTaskScreenLayout();
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
          horizontalPadding={layout.horizontalPadding}
          titleFontSize={layout.headerTitleSize}
          titleLineHeight={layout.headerTitleLineHeight}
        />
        <TaskListControls
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          horizontalPadding={layout.horizontalPadding}
        />
      </View>

      {isLoading ? (
        <TaskSkeleton horizontalPadding={layout.horizontalPadding} />
      ) : error ? (
        <Pressable
          onPress={onRefresh}
          accessibilityRole="button"
          accessibilityLabel="Error loading tasks. Double tap to try again."
          style={[
            styles.errorPressable,
            { paddingHorizontal: layout.horizontalPadding },
          ]}
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
          style={
            layout.isTablet
              ? {
                  maxWidth: layout.maxListContentWidth,
                  width: '100%',
                  alignSelf: 'center',
                }
              : undefined
          }
          drawDistance={layout.flashListDrawDistance}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingHorizontal: layout.horizontalPadding,
              paddingBottom: insets.bottom + layout.listBottomExtra,
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
          style={layout.isTablet ? { maxWidth: layout.maxListContentWidth, width: '100%', alignSelf: 'center' } : undefined}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingHorizontal: layout.horizontalPadding,
              paddingBottom: insets.bottom + layout.listBottomExtra,
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
          initialNumToRender={10}
          maxToRenderPerBatch={10}
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
    paddingTop: spacing.m,
    flexGrow: 1,
  },
  errorPressable: {
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
