-- 函数: game_record_score
-- 作用: 记录一条游戏成绩（user_id 使用 auth.uid()）
create or replace function public.game_record_score(
  p_game_id text,
  p_score integer,
  p_level integer default 1,
  p_duration integer default null,
  p_extra_data jsonb default null,
  p_played_at timestamptz default now()
)
returns game_scores
language plpgsql
security invoker
as $$
declare
  v_score game_scores;
begin
  insert into public.game_scores (
    user_id,
    game_id,
    score,
    level,
    played_at,
    duration,
    extra_data
  )
  values (
    auth.uid(),
    p_game_id,
    p_score,
    coalesce(p_level, 1),
    coalesce(p_played_at, now()),
    p_duration,
    p_extra_data
  )
  returning * into v_score;

  return v_score;
end;
$$;

-- 函数: game_get_personal_high_score
-- 作用: 获取当前用户某个游戏的个人最佳成绩
create or replace function public.game_get_personal_high_score(
  p_game_id text,
  p_is_ascending boolean default false
)
returns integer
language sql
security invoker
stable
as $$
  select gs.score
  from public.game_scores gs
  where gs.game_id = p_game_id
    and auth.uid() is not null
    and gs.user_id = auth.uid()
  order by
    case when p_is_ascending then gs.score end asc,
    case when not p_is_ascending then gs.score end desc,
    gs.played_at desc
  limit 1;
$$;

comment on function public.game_record_score(text, integer, integer, integer, jsonb, timestamptz) is
'作用: 记录游戏成绩。入参: p_game_id(text), p_score(integer), p_level(integer), p_duration(integer), p_extra_data(jsonb), p_played_at(timestamptz)。返回: game_scores。';

comment on function public.game_get_personal_high_score(text, boolean) is
'作用: 获取当前用户个人最佳成绩。入参: p_game_id(text), p_is_ascending(boolean, 是否升序取最优)。返回: integer。';
