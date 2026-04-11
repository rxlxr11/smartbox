-- 函数: todo_parse_repeat_pattern
-- 作用: 解析 repeat_pattern 到 int[]，统一兼容前端不同格式
-- 入参: p_repeat(jsonb) - 支持 JSON 数组或 "{1,2}" 字符串
-- 返回: int[] - 解析后的重复周期数组
create or replace function public.todo_parse_repeat_pattern(p_repeat jsonb)
returns int[]
language plpgsql
immutable
as $$
declare
  v_text text;
begin
  if p_repeat is null then
    return null;
  end if;

  if jsonb_typeof(p_repeat) = 'array' then
    return array(
      select value::int
      from jsonb_array_elements_text(p_repeat) as value
    );
  end if;

  if jsonb_typeof(p_repeat) = 'string' then
    v_text := trim(both '"' from p_repeat::text);
    v_text := trim(both '{}' from v_text);

    if v_text = '' then
      return '{}'::int[];
    end if;

    return string_to_array(v_text, ',')::int[];
  end if;

  return null;
end;
$$;

-- 函数: todo_get_todos
-- 作用: 获取任务列表并附带当日打卡记录（today_record）
-- 入参: p_today(date, 默认 current_date) - 统计“今天”记录
-- 返回: setof jsonb - 任务列表（含 today_record，当日打卡数组）
create or replace function public.todo_get_todos(p_today date default current_date)
returns setof jsonb
language sql
security invoker
as $$
  with rows as (
    select
      t.*,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', tr.id,
            'record_date', tr.record_date,
            'is_success', tr.is_success
          )
          order by tr.record_date desc
        ) filter (where tr.id is not null),
        '[]'::jsonb
      ) as today_record
    from tasks t
    left join task_records tr
      on tr.task_id = t.id
      and tr.record_date = p_today
    where t.is_deleted is distinct from true
    group by t.id
  )
  select to_jsonb(r)
  from rows r
  where r.type not in (0, 1)
     or jsonb_array_length(r.today_record) > 0
  order by r.created_at desc;
$$;

-- 函数: todo_get_todo_by_id
-- 作用: 按任务 ID 获取一条未删除任务
-- 入参: p_id(bigint) - 任务 ID
-- 返回: setof tasks - 单个未删除任务（最多一条）
create or replace function public.todo_get_todo_by_id(p_id bigint)
returns setof tasks
language sql
security invoker
as $$
  select *
  from tasks
  where id = p_id
    and is_deleted is distinct from true
  limit 1;
$$;

-- 函数: todo_get_todos_by_type
-- 作用: 按任务类型获取任务列表
-- 入参: p_type(int) - 任务类型
-- 返回: setof tasks - 指定类型且未删除任务列表
create or replace function public.todo_get_todos_by_type(p_type int)
returns setof tasks
language sql
security invoker
as $$
  select *
  from tasks
  where type = p_type
    and is_deleted is distinct from true
  order by created_at desc;
$$;

-- 函数: todo_get_todos_by_label
-- 作用: 按标签获取任务列表
-- 入参: p_label(text) - 标签名
-- 返回: setof tasks - 指定标签且未删除任务列表
create or replace function public.todo_get_todos_by_label(p_label text)
returns setof tasks
language sql
security invoker
as $$
  select *
  from tasks
  where label = p_label
    and is_deleted is distinct from true
  order by created_at desc;
$$;

-- 函数: todo_add
-- 作用: 创建任务，并在满足规则时初始化当日习惯记录/进度记录
-- 入参: p_todo(jsonb) 创建参数, p_today(date) 当天日期
-- 返回: tasks - 创建后的任务；习惯任务会按规则写入当日 task_records，进度任务会写入 value=0 记录
create or replace function public.todo_add(
  p_todo jsonb,
  p_today date default current_date
)
returns tasks
language plpgsql
security invoker
as $$
declare
  v_task tasks;
  v_pattern int[];
  v_today_dow int;
  v_should_insert_today boolean := false;
  v_initial_success boolean;
begin
  insert into tasks (
    type,
    title,
    is_completed,
    current_value,
    target_value,
    description,
    deadline,
    unit,
    is_active,
    streak_days,
    label,
    scheduled_start_time,
    estimated_duration,
    priority,
    urgency_score,
    repeat_pattern,
    user_id
  )
  values (
    coalesce((p_todo->>'type')::int, 2),
    p_todo->>'title',
    coalesce((p_todo->>'is_completed')::boolean, false),
    (p_todo->>'current_value')::real,
    (p_todo->>'target_value')::real,
    p_todo->>'description',
    (p_todo->>'deadline')::timestamptz,
    p_todo->>'unit',
    coalesce((p_todo->>'is_active')::boolean, true),
    coalesce((p_todo->>'streak_days')::int, 0),
    p_todo->>'label',
    (p_todo->>'scheduled_start_time')::timestamptz,
    (p_todo->>'estimated_duration')::int,
    (p_todo->>'priority')::int,
    (p_todo->>'urgency_score')::real,
    public.todo_parse_repeat_pattern(p_todo->'repeat_pattern'),
    auth.uid()
  )
  returning * into v_task;

  if v_task.type in (0, 1) then
    v_pattern := v_task.repeat_pattern;
    v_today_dow := extract(isodow from p_today)::int;

    if v_pattern is null
      or cardinality(v_pattern) = 0
      or 0 = any(v_pattern)
      or v_today_dow = any(v_pattern) then
      v_should_insert_today := true;
    end if;

    if v_should_insert_today then
      v_initial_success := case when v_task.type = 0 then false else true end;

      insert into task_records (task_id, record_date, is_success)
      values (v_task.id, p_today, v_initial_success)
      on conflict (task_id, record_date) do nothing;
    end if;
  elsif v_task.type = 3 then
    insert into task_records (task_id, record_date, value, is_success, note)
    values (v_task.id, p_today, 0, false, 'Progress initialized')
    on conflict (task_id, record_date) do nothing;
  end if;

  return v_task;
end;
$$;

-- 函数: todo_update
-- 作用: 按给定字段更新任务
-- 入参: p_id(bigint) 任务 ID, p_updates(jsonb) 更新字段
-- 返回: tasks - 更新后的任务
create or replace function public.todo_update(
  p_id bigint,
  p_updates jsonb
)
returns tasks
language plpgsql
security invoker
as $$
declare
  v_task tasks;
begin
  update tasks
  set
    type = coalesce((p_updates->>'type')::int, type),
    title = coalesce(p_updates->>'title', title),
    is_completed = coalesce((p_updates->>'is_completed')::boolean, is_completed),
    completed_at = case
      when p_updates ? 'completed_at' then (p_updates->>'completed_at')::timestamptz
      else completed_at
    end,
    current_value = coalesce((p_updates->>'current_value')::real, current_value),
    target_value = coalesce((p_updates->>'target_value')::real, target_value),
    is_deleted = coalesce((p_updates->>'is_deleted')::boolean, is_deleted),
    description = coalesce(p_updates->>'description', description),
    deadline = coalesce((p_updates->>'deadline')::timestamptz, deadline),
    unit = coalesce(p_updates->>'unit', unit),
    is_active = coalesce((p_updates->>'is_active')::boolean, is_active),
    streak_days = coalesce((p_updates->>'streak_days')::int, streak_days),
    label = coalesce(p_updates->>'label', label),
    scheduled_start_time = coalesce((p_updates->>'scheduled_start_time')::timestamptz, scheduled_start_time),
    estimated_duration = coalesce((p_updates->>'estimated_duration')::int, estimated_duration),
    priority = coalesce((p_updates->>'priority')::int, priority),
    urgency_score = coalesce((p_updates->>'urgency_score')::real, urgency_score),
    repeat_pattern = case
      when p_updates ? 'repeat_pattern' then public.todo_parse_repeat_pattern(p_updates->'repeat_pattern')
      else repeat_pattern
    end,
    updated_at = now()
  where id = p_id
  returning * into v_task;

  if v_task.id is null then
    raise exception 'task not found: %', p_id;
  end if;

  return v_task;
end;
$$;

-- 函数: todo_update_progress
-- 作用: 更新进度任务 current_value，并写入当日进度记录
-- 入参: p_id(bigint), p_progress(real), p_today(date)
-- 返回: tasks - 更新后的任务；同时 upsert 当日进度记录
create or replace function public.todo_update_progress(
  p_id bigint,
  p_progress real,
  p_today date default current_date
)
returns tasks
language plpgsql
security invoker
as $$
declare
  v_task tasks;
begin
  update tasks
  set
    current_value = p_progress,
    updated_at = now()
  where id = p_id
  returning * into v_task;

  if v_task.id is null then
    raise exception 'task not found: %', p_id;
  end if;

  insert into task_records (task_id, record_date, value, is_success, note)
  values (p_id, p_today, p_progress, true, 'Progress updated')
  on conflict (task_id, record_date)
  do update set
    value = excluded.value,
    is_success = excluded.is_success,
    note = excluded.note,
    completed_at = now();

  return v_task;
end;
$$;

-- 函数: todo_toggle_complete
-- 作用: 切换任务完成状态，并同步当日打卡记录
-- 入参: p_id(bigint), p_today(date)
-- 返回: tasks - 切换完成状态后的任务；并同步当日打卡记录
create or replace function public.todo_toggle_complete(
  p_id bigint,
  p_today date default current_date
)
returns tasks
language plpgsql
security invoker
as $$
declare
  v_current_completed boolean;
  v_new_completed boolean;
  v_task tasks;
begin
  select is_completed
  into v_current_completed
  from tasks
  where id = p_id;

  if v_current_completed is null then
    raise exception 'task not found: %', p_id;
  end if;

  v_new_completed := not v_current_completed;

  update tasks
  set
    is_completed = v_new_completed,
    completed_at = case when v_new_completed then now() else null end,
    updated_at = now()
  where id = p_id
  returning * into v_task;

  if v_new_completed then
    insert into task_records (task_id, record_date, is_success, note)
    values (p_id, p_today, true, 'Task completed')
    on conflict (task_id, record_date)
    do update set
      is_success = excluded.is_success,
      note = excluded.note,
      completed_at = now();
  else
    delete from task_records
    where task_id = p_id
      and record_date = p_today;
  end if;

  return v_task;
end;
$$;

-- 函数: todo_toggle_habit_record
-- 作用: 切换习惯任务当日打卡状态并调整 streak_days
-- 入参: p_id(bigint), p_today(date), p_is_success(boolean, 预留)
-- 返回: boolean - 切换后 is_success 状态
create or replace function public.todo_toggle_habit_record(
  p_id bigint,
  p_today date default current_date,
  p_is_success boolean default true
)
returns boolean
language plpgsql
security invoker
as $$
declare
  v_existing_id bigint;
  v_existing_status boolean;
  v_task_type int;
  v_streak_days int;
  v_new_status boolean;
  v_initial_success boolean;
begin
  select type, coalesce(streak_days, 0)
  into v_task_type, v_streak_days
  from tasks
  where id = p_id;

  if v_task_type is null then
    raise exception 'task not found: %', p_id;
  end if;

  select id, is_success
  into v_existing_id, v_existing_status
  from task_records
  where task_id = p_id
    and record_date = p_today
  limit 1;

  if v_existing_id is not null then
    v_new_status := not coalesce(v_existing_status, false);

    if v_task_type = 1 then
      if v_new_status then
        v_streak_days := v_streak_days + 1;
      elsif v_streak_days > 0 then
        v_streak_days := v_streak_days - 1;
      end if;
    elsif v_task_type = 0 then
      if not v_new_status then
        v_streak_days := 0;
      end if;
    end if;

    update tasks
    set
      streak_days = v_streak_days,
      updated_at = now()
    where id = p_id;

    update task_records
    set
      is_success = v_new_status,
      completed_at = case when v_new_status then now() else null end
    where id = v_existing_id;

    return v_new_status;
  end if;

  v_initial_success := case
    when v_task_type = 0 then false
    else true
  end;

  insert into task_records (task_id, record_date, is_success)
  values (p_id, p_today, v_initial_success)
  on conflict (task_id, record_date)
  do nothing;

  if v_task_type = 0 then
    v_streak_days := 0;
  else
    v_streak_days := v_streak_days + 1;
  end if;

  update tasks
  set
    streak_days = v_streak_days,
    updated_at = now()
  where id = p_id;

  return v_initial_success;
end;
$$;

-- 函数: todo_increment_habit_days
-- 作用: 手动将任务 streak_days 加一
-- 入参: p_id(bigint) - 任务 ID
-- 返回: tasks - streak_days + 1 后的任务
create or replace function public.todo_increment_habit_days(p_id bigint)
returns tasks
language plpgsql
security invoker
as $$
declare
  v_task tasks;
begin
  update tasks
  set
    streak_days = coalesce(streak_days, 0) + 1,
    updated_at = now()
  where id = p_id
  returning * into v_task;

  if v_task.id is null then
    raise exception 'task not found: %', p_id;
  end if;

  return v_task;
end;
$$;

-- 函数: todo_delete
-- 作用: 软删除任务（is_deleted=true）
-- 入参: p_id(bigint) - 任务 ID
-- 返回: boolean - 软删除是否成功（是否影响行）
create or replace function public.todo_delete(p_id bigint)
returns boolean
language plpgsql
security invoker
as $$
declare
  v_changed int;
begin
  update tasks
  set
    is_deleted = true,
    updated_at = now()
  where id = p_id;

  get diagnostics v_changed = row_count;
  return v_changed > 0;
end;
$$;

-- 函数: todo_get_task_records_by_task_id
-- 作用: 获取某个任务的全部打卡记录
-- 入参: p_task_id(bigint) - 任务 ID
-- 返回: setof task_records - 该任务全部记录（按日期升序）
create or replace function public.todo_get_task_records_by_task_id(p_task_id bigint)
returns setof task_records
language sql
security invoker
as $$
  select *
  from task_records
  where task_id = p_task_id
  order by record_date asc;
$$;

-- 函数: todo_get_habits_with_records
-- 作用: 统计习惯任务在日期区间内的成功次数
-- 入参: p_start_date(date), p_end_date(date)
-- 返回: table(id,title,type,streak_days) - 区间内习惯成功打卡统计
create or replace function public.todo_get_habits_with_records(
  p_start_date date,
  p_end_date date
)
returns table (
  id bigint,
  title text,
  type int,
  streak_days int
)
language sql
security invoker
as $$
  select
    t.id,
    t.title,
    t.type,
    count(r.*)::int as streak_days
  from tasks t
  left join task_records r
    on r.task_id = t.id
   and r.record_date >= p_start_date
   and r.record_date <= p_end_date
   and r.is_success = true
  where t.type in (0, 1)
    and t.is_deleted is distinct from true
  group by t.id, t.title, t.type
  order by t.created_at desc;
$$;

-- 函数: todo_get_recent_completed_records
-- 作用: 获取最近 N 天成功记录时间，用于图表统计
-- 入参: p_days(int) - 最近天数
-- 返回: table(created_at) - 最近成功记录的创建时间列表
create or replace function public.todo_get_recent_completed_records(p_days int)
returns table (created_at timestamptz)
language sql
security invoker
as $$
  select tr.created_at
  from task_records tr
  where tr.is_success = true
    and tr.created_at >= (now() - make_interval(days => p_days));
$$;

comment on function public.todo_parse_repeat_pattern(jsonb) is
'作用: 解析 repeat_pattern 到 int[]。入参: p_repeat(jsonb, 支持数组或"{1,2}"字符串)。返回: int[] 重复周期数组，无法解析返回 null。';

comment on function public.todo_get_todos(date) is
'作用: 获取任务列表并附带当日打卡记录。入参: p_today(date, 默认 current_date)。返回: setof jsonb，任务列表(含 today_record 数组，仅包含当日记录)。';

comment on function public.todo_get_todo_by_id(bigint) is
'作用: 按 ID 获取单条任务。入参: p_id(bigint)。返回: setof tasks，最多一条未删除任务记录。';

comment on function public.todo_get_todos_by_type(int) is
'作用: 按类型获取任务列表。入参: p_type(int, 任务类型)。返回: setof tasks，对应类型且未删除的任务列表。';

comment on function public.todo_get_todos_by_label(text) is
'作用: 按标签获取任务列表。入参: p_label(text, 标签名)。返回: setof tasks，对应标签且未删除的任务列表。';

comment on function public.todo_add(jsonb, date) is
'作用: 创建任务并初始化当日记录。入参: p_todo(jsonb, 创建任务数据), p_today(date, 默认 current_date)。返回: tasks，创建后的任务；习惯任务会按规则写入当日 task_records，进度任务会写入 value=0 记录。';

comment on function public.todo_update(bigint, jsonb) is
'作用: 更新任务字段。入参: p_id(bigint), p_updates(jsonb, 更新字段集合)。返回: tasks，更新后的任务。';

comment on function public.todo_update_progress(bigint, real, date) is
'作用: 更新进度并写入当日进度记录。入参: p_id(bigint), p_progress(real), p_today(date, 默认 current_date)。返回: tasks，更新后的任务；并 upsert 当日进度记录。';

comment on function public.todo_toggle_complete(bigint, date) is
'作用: 切换完成状态并同步当日记录。入参: p_id(bigint), p_today(date, 默认 current_date)。返回: tasks，切换完成态后的任务；并同步当日记录增删。';

comment on function public.todo_toggle_habit_record(bigint, date, boolean) is
'作用: 切换习惯当日状态并更新 streak_days。入参: p_id(bigint), p_today(date, 默认 current_date), p_is_success(boolean, 预留参数)。返回: boolean，切换后的 is_success 状态。';

comment on function public.todo_increment_habit_days(bigint) is
'作用: 手动增加连续天数。入参: p_id(bigint)。返回: tasks，streak_days + 1 后的任务。';

comment on function public.todo_delete(bigint) is
'作用: 软删除任务。入参: p_id(bigint)。返回: boolean，软删除是否成功(是否影响行)。';

comment on function public.todo_get_task_records_by_task_id(bigint) is
'作用: 查询任务全部打卡记录。入参: p_task_id(bigint)。返回: setof task_records，该任务全部打卡记录(按 record_date 升序)。';

comment on function public.todo_get_habits_with_records(date, date) is
'作用: 统计区间内习惯成功记录。入参: p_start_date(date), p_end_date(date)。返回: table(id,title,type,streak_days)，区间内习惯成功记录统计。';

comment on function public.todo_get_recent_completed_records(int) is
'作用: 获取最近成功记录时间。入参: p_days(int, 最近天数)。返回: table(created_at)，最近成功记录的创建时间列表。';
