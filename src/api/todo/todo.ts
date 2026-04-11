import { supabase } from '@/lib/supabase'
import type { TodoTable, TodoItem, CreateTodoDTO, UpdateTodoDTO, TaskRecord } from '@/types/todo'
import { REVERSE_TODO_TYPE_MAP } from '@/types/todo'

/**
 * 作用: 统一处理 rpc 的单行返回结果
 * 入参: data(unknown, rpc 返回值)
 * 返回: T，统一取单行结果；若 data 为数组则取第一项
 */
const getSingleRow = <T>(data: unknown): T => {
  if (Array.isArray(data)) {
    return (data[0] ?? null) as T
  }
  return data as T
}

/**
 * 作用: 将 rpc 返回值安全转换为布尔值
 * 入参: data(unknown, rpc 返回值)
 * 返回: boolean，兼容布尔/单元素数组/对象首字段布尔值
 */
const getBooleanResult = (data: unknown): boolean => {
  if (typeof data === 'boolean') return data
  if (Array.isArray(data)) return getBooleanResult(data[0])
  if (data && typeof data === 'object') {
    const value = Object.values(data)[0]
    if (typeof value === 'boolean') return value
  }
  return false
}

/**
 * 作用: 把数据库任务行映射成前端 TodoItem
 * 入参: row(TodoTable & { today_record?: TaskRecord[] })
 * 返回: TodoItem，补充 category/progress_percentage 并映射 is_completed
 */
const mapToTodoItem = (row: TodoTable & { today_record?: TaskRecord[] }): TodoItem => {
  const category = REVERSE_TODO_TYPE_MAP[row.type ?? 2] || 'todo'
  
  // Calculate progress percentage
  let progressPct = 0
  if (row.target_value && row.target_value > 0) {
    progressPct = Math.round(((row.current_value || 0) / row.target_value) * 100)
  }

  // Determine if task is completed today based on records
  let isCompletedToday = row.is_completed;
  if (category === 'positive_habit' && row.today_record && row.today_record.length > 0) {
    // 正向习惯，打卡记录为 true 才是完成了
    isCompletedToday = row.today_record[0].is_success === true;
  } else if (category === 'negative_habit' && row.today_record && row.today_record.length > 0) {
    // 反向习惯，打卡记录为 false 才代表在前端被用户点击过（破戒），在 UI 上应该呈现为已打钩的状态
    isCompletedToday = row.today_record[0].is_success === false;
  }

  return {
    ...row,
    category,
    progress_percentage: progressPct,
    is_completed: isCompletedToday
  }
}

export const todoApi = {
  /**
   * 作用: 获取首页任务列表（包含今日习惯打卡状态）
   * 入参: 无
   * 返回: Promise<TodoItem[]>，今日任务列表（习惯任务依赖 today_record）
   */
  async getTodos() {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase.rpc('todo_get_todos', {
      p_today: today,
    })

    if (error) throw error

    return ((data as Array<TodoTable & { today_record?: TaskRecord[] }>) || []).map(mapToTodoItem)
  },

  /**
   * 作用: 按任务 ID 获取单条任务详情
   * 入参: id(number, 任务ID)
   * 返回: Promise<TodoItem>，单个任务详情
   */
  async getTodoById(id: number) {
    const { data, error } = await supabase.rpc('todo_get_todo_by_id', {
      p_id: id,
    })

    if (error) throw error

    return mapToTodoItem(getSingleRow<TodoTable>(data))
  },

  /**
   * 作用: 按任务类型查询任务列表
   * 入参: type(number, 任务类型)
   * 返回: Promise<TodoItem[]>，指定类型任务列表
   */
  async getTodosByType(type: number) {
    const { data, error } = await supabase.rpc('todo_get_todos_by_type', {
      p_type: type,
    })

    if (error) throw error

    return ((data as TodoTable[]) || []).map(mapToTodoItem)
  },

  /**
   * 作用: 按标签查询任务列表
   * 入参: label(string, 标签)
   * 返回: Promise<TodoItem[]>，指定标签任务列表
   */
  async getTodosByLabel(label: string) {
    const { data, error } = await supabase.rpc('todo_get_todos_by_label', {
      p_label: label,
    })

    if (error) throw error

    return ((data as TodoTable[]) || []).map(mapToTodoItem)
  },

  /**
   * 作用: 创建任务，并处理习惯任务当日初始化记录
   * 入参: todo(CreateTodoDTO, 创建参数)
   * 返回: Promise<TodoItem>，创建后的任务
   */
  async addTodo(todo: CreateTodoDTO) {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase.rpc('todo_add', {
      p_todo: todo,
      p_today: today,
    })

    if (error) throw error

    return mapToTodoItem(getSingleRow<TodoTable>(data))
  },

  /**
   * 作用: 更新指定任务的字段
   * 入参: id(number, 任务ID), updates(UpdateTodoDTO, 更新字段)
   * 返回: Promise<TodoItem>，更新后的任务
   */
  async updateTodo(id: number, updates: UpdateTodoDTO) {
    const { data, error } = await supabase.rpc('todo_update', {
      p_id: id,
      p_updates: updates,
    })

    if (error) throw error

    return mapToTodoItem(getSingleRow<TodoTable>(data))
  },

  /**
   * 作用: 更新进度类任务当前进度，并同步当日进度记录
   * 入参: id(number, 任务ID), progress(number, 最新进度)
   * 返回: Promise<TodoItem>，更新进度后的任务
   */
  async updateTodoProgress(id: number, progress: number) {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase.rpc('todo_update_progress', {
      p_id: id,
      p_progress: progress,
      p_today: today,
    })

    if (error) throw error

    return mapToTodoItem(getSingleRow<TodoTable>(data))
  },

  /**
   * 作用: 切换普通任务完成状态，并同步当日打卡记录
   * 入参: id(number, 任务ID)
   * 返回: Promise<TodoItem>，切换完成状态后的任务
   */
  async toggleTodoComplete(id: number) {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase.rpc('todo_toggle_complete', {
      p_id: id,
      p_today: today,
    })

    if (error) throw error

    return mapToTodoItem(getSingleRow<TodoTable>(data))
  },
  
  /**
   * 作用: 切换习惯任务当日打卡状态，并更新 streak_days
   * 入参: id(number, 任务ID), isSuccess(boolean, 预留参数)
   * 返回: Promise<boolean>，习惯当日记录切换后的 is_success 状态
   */
  async toggleHabitRecord(id: number, isSuccess: boolean = true) {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase.rpc('todo_toggle_habit_record', {
      p_id: id,
      p_today: today,
      p_is_success: isSuccess,
    })

    if (error) throw error

    return getBooleanResult(data)
  },

  /**
   * 作用: 手动增加习惯任务连续天数
   * 入参: id(number, 任务ID)
   * 返回: Promise<TodoItem>，连续天数 +1 后的任务
   */
  async incrementHabitDays(id: number) {
    const { data, error } = await supabase.rpc('todo_increment_habit_days', {
      p_id: id,
    })

    if (error) throw error

    return mapToTodoItem(getSingleRow<TodoTable>(data))
  },

  /**
   * 作用: 软删除任务（标记 is_deleted=true）
   * 入参: id(number, 任务ID)
   * 返回: Promise<boolean>，软删除是否成功
   */
  async deleteTodo(id: number) {
    const { data, error } = await supabase.rpc('todo_delete', {
      p_id: id,
    })

    if (error) throw error

    return getBooleanResult(data)
  },

  /**
   * 作用: 获取指定任务全部打卡记录（时间升序）
   * 入参: taskId(number, 任务ID)
   * 返回: Promise<TaskRecord[]>，该任务的全部记录
   */
  async getTaskRecordsByTaskId(taskId: number) {
    const { data, error } = await supabase.rpc('todo_get_task_records_by_task_id', {
      p_task_id: taskId,
    })

    if (error) throw error

    return (data as TaskRecord[]) || []
  },

  /**
   * 作用: 统计习惯任务在指定区间内的成功打卡次数
   * 入参: startDate(string), endDate(string)
   * 返回: Promise<Array<{ id; title; type; streak_days }>>，习惯区间统计
   */
  async getHabitsWithRecords(startDate: string, endDate: string) {
    const { data, error } = await supabase.rpc('todo_get_habits_with_records', {
      p_start_date: startDate,
      p_end_date: endDate,
    })

    if (error) throw error

    return (data as Array<{ id: number; title: string; type: number; streak_days: number }>) || []
  },

  /**
   * 作用: 获取最近 N 天的成功记录时间，用于图表统计
   * 入参: days(number, 最近天数)
   * 返回: Promise<Array<{ created_at: string }>>，最近完成记录时间列表
   */
  async getRecentCompletedRecords(days: number) {
    const { data, error } = await supabase.rpc('todo_get_recent_completed_records', {
      p_days: days,
    })

    if (error) throw error

    return (data as { created_at: string }[]) || []
  }
}
