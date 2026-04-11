

-- 函数: game_get_games
-- 作用: 获取游戏列表（可选仅返回启用项）
create or replace function public.game_get_games(p_only_active boolean default true)
returns setof games
language sql
security invoker
stable
as $$
  select *
  from public.games g
  where (not p_only_active) or g.is_active = true
  order by g.created_at asc;
$$;

-- 函数: game_get_game_by_id
-- 作用: 按游戏 ID 获取单条游戏信息
create or replace function public.game_get_game_by_id(p_game_id text)
returns setof games
language sql
security invoker
stable
as $$
  select *
  from public.games g
  where g.id = p_game_id
  limit 1;
$$;

-- 函数: game_upsert_game
-- 作用: 新增或更新游戏基础信息
create or replace function public.game_upsert_game(
  p_game_id text,
  p_name text,
  p_description text default null,
  p_difficulty_levels jsonb default '[]'::jsonb,
  p_max_errors integer default null,
  p_is_active boolean default true
)
returns games
language plpgsql
security invoker
as $$
declare
  v_game games;
begin
  insert into public.games (
    id,
    name,
    description,
    difficulty_levels,
    max_errors,
    is_active,
    updated_at
  )
  values (
    p_game_id,
    p_name,
    p_description,
    coalesce(p_difficulty_levels, '[]'::jsonb),
    p_max_errors,
    coalesce(p_is_active, true),
    now()
  )
  on conflict (id)
  do update
  set
    name = excluded.name,
    description = excluded.description,
    difficulty_levels = excluded.difficulty_levels,
    max_errors = excluded.max_errors,
    is_active = excluded.is_active,
    updated_at = now()
  returning * into v_game;

  return v_game;
end;
$$;

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

-- 函数: game_get_ranking
-- 作用: 获取某个游戏的排行榜
create or replace function public.game_get_ranking(
  p_game_id text,
  p_limit integer default 10,
  p_is_ascending boolean default false
)
returns table (
  score integer,
  user_id uuid,
  duration integer,
  played_at timestamptz,
  level integer
)
language sql
security invoker
stable
as $$
  select
    gs.score,
    gs.user_id,
    gs.duration,
    gs.played_at,
    gs.level
  from public.game_scores gs
  where gs.game_id = p_game_id
  order by
    case when p_is_ascending then gs.score end asc,
    case when not p_is_ascending then gs.score end desc,
    gs.played_at asc
  limit greatest(coalesce(p_limit, 10), 1);
$$;

comment on function public.game_get_games(boolean) is
'作用: 获取游戏列表。入参: p_only_active(boolean, 是否只返回启用游戏，默认 true)。返回: setof games。';

comment on function public.game_get_game_by_id(text) is
'作用: 按游戏 ID 获取游戏信息。入参: p_game_id(text)。返回: setof games，最多一条。';

comment on function public.game_upsert_game(text, text, text, jsonb, integer, boolean) is
'作用: 新增或更新游戏基础信息。入参: p_game_id(text), p_name(text), p_description(text), p_difficulty_levels(jsonb), p_max_errors(integer), p_is_active(boolean)。返回: games。';

comment on function public.game_record_score(text, integer, integer, integer, jsonb, timestamptz) is
'作用: 记录游戏成绩。入参: p_game_id(text), p_score(integer), p_level(integer), p_duration(integer), p_extra_data(jsonb), p_played_at(timestamptz)。返回: game_scores。';

comment on function public.game_get_personal_high_score(text, boolean) is
'作用: 获取当前用户个人最佳成绩。入参: p_game_id(text), p_is_ascending(boolean, 是否升序取最优)。返回: integer。';

comment on function public.game_get_ranking(text, integer, boolean) is
'作用: 获取游戏排行榜。入参: p_game_id(text), p_limit(integer), p_is_ascending(boolean)。返回: table(score,user_id,duration,played_at,level)。';
