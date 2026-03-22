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
  is_deleted?: boolean;
  title: string;
  description?: string;
  type: number;
  is_active?: boolean;
  deadline?: string;
  target_value?: number;
  current_value?: number;
  unit?: string;
  is_completed?: boolean;
  completed_at?: string;
  streak_days?: number;
  label?: string;
  scheduled_start_time?: string;
  estimated_duration?: number;
  priority?: number;
  urgency_score?: number;
  updated_at?: string;
  user_id?: string;
  repeat_pattern?: any; // any to accommodate the PostgreSQL array string '{0}' format
}

// Frontend interface that extends the DB table but adds helper fields
export interface TodoItem extends TodoTable {
  // Computed helpers for UI convenience
  category: TodoCategory;
  progress_percentage?: number; // Calculated from current_value/target_value * 100
}

export interface CreateTodoDTO {
  type: number;
  title: string;
  is_completed?: boolean;
  current_value?: number;
  target_value?: number;
  description?: string;
  deadline?: string;
  unit?: string;
  is_active?: boolean;
  streak_days?: number;
  label?: string;
  scheduled_start_time?: string;
  estimated_duration?: number;
  priority?: number;
  urgency_score?: number;
  repeat_pattern?: any;
}

export interface UpdateTodoDTO {
  type?: number;
  title?: string;
  is_completed?: boolean;
  completed_at?: string | null;
  current_value?: number;
  target_value?: number;
  is_deleted?: boolean;
  description?: string;
  deadline?: string;
  unit?: string;
  is_active?: boolean;
  streak_days?: number;
  label?: string;
  scheduled_start_time?: string;
  estimated_duration?: number;
  priority?: number;
  urgency_score?: number;
  repeat_pattern?: any;
}

export interface TaskRecord {
  id: number;
  task_id: number;
  record_date: string;
  completed_at: string;
  duration?: number;
  value?: number;
  note?: string;
  is_success?: boolean;
  created_at: string;
}

export interface CreateTaskRecordDTO {
  task_id: number;
  record_date: string;
  duration?: number;
  value?: number;
  note?: string;
  is_success?: boolean;
}
