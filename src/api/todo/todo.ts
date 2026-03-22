import { supabase } from '@/lib/supabase'
import type { TodoTable, TodoItem, CreateTodoDTO, UpdateTodoDTO, TaskRecord, CreateTaskRecordDTO } from '@/types/todo'
import { REVERSE_TODO_TYPE_MAP } from '@/types/todo'

const TABLE_NAME = 'tasks'
const RECORDS_TABLE = 'task_records'

// Helper to convert DB row to UI TodoItem
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
  async getTodos() {
    const today = new Date().toISOString().split('T')[0]
    
    // We join with task_records to see if the habit was completed today
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(`
        *,
        today_record:task_records(id, record_date, is_success)
      `)
      .neq('is_deleted', true)
      // 修改这里：不再强制要求关联到 task_records 才能查出主表数据
      // 因为待办、紧急任务并没有每天预生成的记录
      // 我们在前端处理：如果是习惯，且有今天预生成的记录，才会显示在前端的"今天习惯列表"里
      .order('created_at', { ascending: false })
      
    if (error) throw error
    
    // 手动过滤掉今天不需要打卡的习惯
    // 逻辑：如果是习惯类型，必须有今天的 record_date 关联记录（说明符合 repeat_pattern）才展示
    const filteredData = (data as any[]).filter(row => {
      const isHabit = row.type === 0 || row.type === 1;
      if (isHabit) {
        // 如果是习惯，检查今天是否有预生成的记录
        const hasTodayRecord = row.today_record && row.today_record.some((r: any) => r.record_date === today);
        return hasTodayRecord;
      }
      return true; // 非习惯类型直接展示
    });

    return filteredData.map(mapToTodoItem)
  },

  async getTodoById(id: number) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .neq('is_deleted', true)
      .single()
      
    if (error) throw error
    return mapToTodoItem(data as TodoTable)
  },

  async getTodosByType(type: number) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('type', type)
      .neq('is_deleted', true)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    return (data as TodoTable[]).map(mapToTodoItem)
  },

  async getTodosByLabel(label: string) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('label', label)
      .neq('is_deleted', true)
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
    
    // 如果新增的是习惯，判断今天是否需要打卡，如果需要，立即插入初始记录
    const task = data as TodoTable;
    if (task.type === 0 || task.type === 1) {
      const todayDate = new Date();
      let todayDow = todayDate.getDay(); // 0-6, 0 is Sunday
      if (todayDow === 0) todayDow = 7; // Map Sunday to 7 to match frontend

      let shouldInsertToday = false;
      const pattern = task.repeat_pattern;
      
      if (!pattern || (Array.isArray(pattern) && pattern.includes(0))) {
        shouldInsertToday = true; // 每天
      } else if (Array.isArray(pattern) && pattern.includes(todayDow)) {
        shouldInsertToday = true; // 包含今天
      }

      if (shouldInsertToday) {
        const todayStr = todayDate.toISOString().split('T')[0];
        const initialSuccess = task.type === 0 ? true : false;
        
        await supabase.from(RECORDS_TABLE).insert([{
          task_id: task.id,
          record_date: todayStr,
          is_success: initialSuccess
        }]);
      }
    }
    
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
      .update({ current_value: progress })
      .eq('id', id)
      .select()
      .single()
      
    if (error) throw error

    // Record the progress update in task_records
    const today = new Date().toISOString().split('T')[0]
    await supabase.from(RECORDS_TABLE).upsert({
      task_id: id,
      record_date: today,
      value: progress,
      is_success: true,
      note: 'Progress updated'
    }, { onConflict: 'task_id, record_date' })

    return mapToTodoItem(data as TodoTable)
  },

  async toggleTodoComplete(id: number) {
    const { data: current, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('is_completed')
      .eq('id', id)
      .single()
      
    if (fetchError) throw fetchError
    
    const newCompleted = !current.is_completed
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        is_completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null
      })
      .eq('id', id)
      .select()
      .single()
      
    if (error) throw error

    // Record the completion status in task_records
    const today = new Date().toISOString().split('T')[0]
    if (newCompleted) {
      await supabase.from(RECORDS_TABLE).upsert({
        task_id: id,
        record_date: today,
        is_success: true,
        note: 'Task completed'
      }, { onConflict: 'task_id, record_date' })
    } else {
      // If unmarked as completed, remove today's record if it exists
      await supabase.from(RECORDS_TABLE)
        .delete()
        .eq('task_id', id)
        .eq('record_date', today)
    }

    return mapToTodoItem(data as TodoTable)
  },
  
  async toggleHabitRecord(id: number, isSuccess: boolean = true) {
    const today = new Date().toISOString().split('T')[0]
    
    // Check if record exists for today
    const { data: existingRecord, error: fetchError } = await supabase
      .from(RECORDS_TABLE)
      .select('id, is_success')
      .eq('task_id', id)
      .eq('record_date', today)
      .maybeSingle()
      
    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError
    
    if (existingRecord) {
      // Record exists (it should, due to cron job)
      // Toggle the success state
      const newStatus = !existingRecord.is_success;
      
      // Update streak days based on habit type BEFORE updating the record
      const { data: currentTask, error: currentTaskError } = await supabase.from(TABLE_NAME).select('type, streak_days').eq('id', id).single()
      if (currentTaskError) throw currentTaskError;

      let newStreak = currentTask?.streak_days || 0;
      
      if (currentTask) {
        if (currentTask.type === 1) {
          // 正向习惯: true 增加，false 减少
          if (newStatus) {
            newStreak += 1;
          } else if (newStreak > 0) {
            newStreak -= 1;
          }
        } else if (currentTask.type === 0) {
          // 反向习惯: false(破戒) 直接清零，true(恢复) 给1（因为它是当天有效的标志，实际天数靠cron累加）
          if (!newStatus) {
            newStreak = 0;
          } else {
             // 允许用户手滑点错后恢复，我们简单重置为1（或者不改，等第二天加，这里为了UI反馈先恢复为至少0）
            // 真实情况如果需要完美回退历史天数比较复杂，通常这里只是简单的纠正
          }
        }
        
        const { error: updateStreakError } = await supabase.from(TABLE_NAME).update({ streak_days: newStreak }).eq('id', id)
        if (updateStreakError) throw updateStreakError;
      }

      const { error: updateError } = await supabase
        .from(RECORDS_TABLE)
        .update({ 
          is_success: newStatus, 
          completed_at: newStatus ? new Date().toISOString() : null
        })
        .eq('id', existingRecord.id)
        
      if (updateError) {
        console.error('Update record error:', updateError)
        throw updateError
      }
      
      return newStatus // Return the new status
    } else {
      // Fallback: If cron didn't run, create it manually
      // Get the type of the habit to know what the default is_success should be
      const { data: currentTask, error: currentTaskError } = await supabase.from(TABLE_NAME).select('type, streak_days').eq('id', id).single()
      if (currentTaskError) throw currentTaskError;

      const isNegativeHabit = currentTask.type === 0;

      // 如果 cron 没有跑，我们这里其实是用户第一次点击
      // 如果是反向习惯，点击代表破戒(is_success=false)
      // 如果是正向习惯，点击代表打卡成功(is_success=true)
      const initialSuccess = isNegativeHabit ? false : true;

      const newRecord: CreateTaskRecordDTO = {
        task_id: id,
        record_date: today,
        is_success: initialSuccess,
      }
      
      const { error: insertError } = await supabase
        .from(RECORDS_TABLE)
        .insert([newRecord])
        
      if (insertError) {
        console.error('Insert fallback record error:', insertError)
        throw insertError
      }
      
      // Update streak up
      let newStreak = currentTask.streak_days || 0;
      if (isNegativeHabit) {
        newStreak = 0; // 反向习惯点击破戒，清零
      } else {
        newStreak += 1; // 正向习惯点击打卡，加一
      }

      const { error: updateStreakError } = await supabase.from(TABLE_NAME).update({ streak_days: newStreak }).eq('id', id)
      if (updateStreakError) {
        console.error('Update streak fallback error:', updateStreakError)
        throw updateStreakError;
      }
      
      return initialSuccess // Return the new status
    }
  },

  async incrementHabitDays(id: number) {
    const { data: current, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('streak_days')
      .eq('id', id)
      .single()
      
    if (fetchError) throw fetchError
    
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({ streak_days: (current.streak_days || 0) + 1 })
      .eq('id', id)
      .select()
      .single()
      
    if (error) throw error
    return mapToTodoItem(data as TodoTable)
  },

  async deleteTodo(id: number) {
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({ is_deleted: true })
      .eq('id', id)
      
    if (error) throw error
    return true
  },

  async getTaskRecordsByTaskId(taskId: number) {
    const { data, error } = await supabase
      .from(RECORDS_TABLE)
      .select('*')
      .eq('task_id', taskId)
      .order('record_date', { ascending: true })
      
    if (error) throw error
    return data as TaskRecord[]
  },

  async getHabitsWithRecords(startDate: string, endDate: string) {
    const { data: habits, error: habitsError } = await supabase
      .from(TABLE_NAME)
      .select('id, title, type')
      .in('type', [0, 1])
      .neq('is_deleted', true)

    if (habitsError) throw habitsError

    const habitIds = habits.map((h: any) => h.id)
    if (habitIds.length === 0) return []

    const { data: records, error: recordsError } = await supabase
      .from(RECORDS_TABLE)
      .select('task_id, is_success')
      .in('task_id', habitIds)
      .gte('record_date', startDate)
      .lte('record_date', endDate)
      .eq('is_success', true)

    if (recordsError) throw recordsError

    return habits.map((habit: any) => {
      const count = records.filter((r: any) => r.task_id === habit.id).length
      return {
        id: habit.id,
        title: habit.title,
        type: habit.type,
        streak_days: count
      }
    })
  },

  async getRecentCompletedRecords(days: number) {
    const d = new Date()
    d.setDate(d.getDate() - days)
    const startDate = d.toISOString()

    const { data, error } = await supabase
      .from(RECORDS_TABLE)
      .select('created_at')
      .eq('is_success', true)
      .gte('created_at', startDate)

    if (error) throw error
    return data as { created_at: string }[]
  }
}
