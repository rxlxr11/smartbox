create or replace view public.v_habit_streak_segments as
with habit_records as (
  select
    t.id as task_id,
    t.title,
    t.type,
    tr.record_date::date as record_date,
    coalesce(tr.is_success, false) as is_success
  from tasks t
  join task_records tr on tr.task_id = t.id
  where t.type in (0, 1)
    and t.is_deleted is distinct from true
),
ordered_records as (
  select
    hr.*,
    lag(hr.is_success) over (partition by hr.task_id order by hr.record_date) as prev_is_success,
    lead(hr.is_success) over (partition by hr.task_id order by hr.record_date) as next_is_success,
    lead(hr.record_date) over (partition by hr.task_id order by hr.record_date) as next_record_date
  from habit_records hr
),
success_rows as (
  select
    orr.*,
    sum(
      case
        when orr.is_success = true and coalesce(orr.prev_is_success, false) = false then 1
        else 0
      end
    ) over (
      partition by orr.task_id
      order by orr.record_date
      rows between unbounded preceding and current row
    ) as streak_group
  from ordered_records orr
  where orr.is_success = true
)
select
  sr.task_id,
  sr.title,
  sr.type,
  min(sr.record_date) as streak_start_date,
  max(sr.record_date) as streak_end_date,
  count(*)::int as streak_days,
  max(
    case
      when sr.next_is_success = false then sr.next_record_date
      else null
    end
  ) as interrupted_on
from success_rows sr
group by sr.task_id, sr.title, sr.type, sr.streak_group
order by sr.task_id, streak_start_date;

create or replace view public.v_habit_streak_summary as
select
  v.task_id,
  v.title,
  v.type,
  count(*)::int as streak_count,
  max(v.streak_days)::int as max_streak_days,
  avg(v.streak_days)::numeric(10, 2) as avg_streak_days,
  max(v.streak_end_date) as latest_streak_end_date
from public.v_habit_streak_segments v
group by v.task_id, v.title, v.type
order by v.task_id;
