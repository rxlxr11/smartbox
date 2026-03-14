import { supabase } from '@/lib/supabase'
import type { TodoTable, TodoItem, CreateTodoDTO, UpdateTodoDTO } from '@/types/todo'
import { REVERSE_TODO_TYPE_MAP } from '@/types/todo'

const TABLE_NAME = 'todo_table'

// Helper to convert DB row to UI TodoItem
const mapToTodoItem = (row: TodoTable): TodoItem => {
  const category = REVERSE_TODO_TYPE_MAP[row.type ?? 2] || 'todo'
  
  // Calculate progress percentage
  let progressPct = 0
  if (row.max && row.max > 0) {
    progressPct = Math.round(((row.progress || 0) / row.max) * 100)
  }

  return {
    ...row,
    category,
    // Map back to UI properties for compatibility
    is_completed: row.if_complete,
    current_count: row.progress || 0,
    target_count: row.max || 0,
    progress_percentage: progressPct
  }
}

export const todoApi = {
  async getTodos() {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .neq('if_delete', true)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    return (data as TodoTable[]).map(mapToTodoItem)
  },

  async getTodoById(id: number) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .neq('if_delete', true)
      .single()
      
    if (error) throw error
    return mapToTodoItem(data as TodoTable)
  },

  async getTodosByType(type: number) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('type', type)
      .neq('if_delete', true)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    return (data as TodoTable[]).map(mapToTodoItem)
  },

  async getTodosByLabel(label: string) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('label', label)
      .neq('if_delete', true)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    return (data as TodoTable[]).map(mapToTodoItem)
  },

  async addTodo(todo: CreateTodoDTO) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([todo])
      .select()
      .single()
      
    if (error) throw error
    return mapToTodoItem(data as TodoTable)
  },

  async updateTodo(id: number, updates: UpdateTodoDTO) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq('id', id)
      .select()
      .single()
      
    if (error) throw error
    return mapToTodoItem(data as TodoTable)
  },

  async updateTodoProgress(id: number, progress: number) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({ progress })
      .eq('id', id)
      .select()
      .single()
      
    if (error) throw error
    return mapToTodoItem(data as TodoTable)
  },

  async toggleTodoComplete(id: number) {
    const { data: current, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('if_complete')
      .eq('id', id)
      .single()
      
    if (fetchError) throw fetchError
    
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({ if_complete: !current.if_complete })
      .eq('id', id)
      .select()
      .single()
      
    if (error) throw error
    return mapToTodoItem(data as TodoTable)
  },

  async incrementHabitDays(id: number) {
    const { data: current, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('days')
      .eq('id', id)
      .single()
      
    if (fetchError) throw fetchError
    
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({ days: (current.days || 0) + 1 })
      .eq('id', id)
      .select()
      .single()
      
    if (error) throw error
    return mapToTodoItem(data as TodoTable)
  },

  async deleteTodo(id: number) {
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({ if_delete: true })
      .eq('id', id)
      
    if (error) throw error
    return true
  }
}
