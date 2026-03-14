export type TodoCategory = 'urgent' | 'positive_habit' | 'todo' | 'progress' | 'negative_habit';

export const TODO_TYPE_MAP: Record<TodoCategory, number> = {
  urgent: 4,
  positive_habit: 1, // 1 is positive habit, 0 is negative habit (both map to habit category)
  negative_habit: 0, // 1 is positive habit, 0 is negative habit (both map to habit category)
  todo: 2,
  progress: 3
};

export const REVERSE_TODO_TYPE_MAP: Record<number, TodoCategory> = {
  0: 'negative_habit',
  1: 'positive_habit',
  2: 'todo',
  3: 'progress',
  4: 'urgent'
};

export interface TodoTable {
  id: number;
  created_at: string;
  if_delete?: boolean;
  title: string;
  desc?: string;
  type: number;
  if_use?: boolean;
  deadline?: string;
  max?: number;
  progress?: number;
  unit?: string;
  if_complete?: boolean;
  days?: number;
  label?: string;
}

// Frontend interface that extends the DB table but adds helper fields
export interface TodoItem extends TodoTable {
  // Computed helpers for UI convenience
  category: TodoCategory;
  
  // Mapping old fields to new schema for backward compatibility in UI components
  // These are optional because we should migrate to using the TodoTable fields directly
  is_completed?: boolean; // Maps to if_complete
  current_count?: number; // Maps to progress
  target_count?: number;  // Maps to max
  progress_percentage?: number; // Calculated from progress/max * 100
}

export interface CreateTodoDTO {
  type: number;
  title: string;
  if_complete?: boolean;
  progress?: number;
  max?: number;
  // Optional new fields
  desc?: string;
  deadline?: string;
  unit?: string;
  if_use?: boolean;
  days?: number;
  label?: string;
}

export interface UpdateTodoDTO {
  type?: number;
  title?: string;
  if_complete?: boolean;
  progress?: number;
  max?: number;
  if_delete?: boolean;
  desc?: string;
  deadline?: string;
  unit?: string;
  if_use?: boolean;
  days?: number;
  label?: string;
}
