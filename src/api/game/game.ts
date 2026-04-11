import { supabase } from '@/lib/supabase';

export interface GameDifficulty {
  label: string;
  value: string;
  params?: Record<string, unknown>;
}

export interface GameInfo {
  id: string;
  name: string;
  description?: string | null;
  difficulty_levels?: GameDifficulty[] | null;
  max_errors?: number | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GameScore {
  id?: number;
  user_id?: string;
  game_id: string;
  score: number;
  level?: number;
  played_at?: string;
  duration?: number;
  extra_data?: Record<string, unknown> | null;
  created_at?: string;
}

export interface GameRankingItem {
  score: number;
  user_id: string | null;
  duration: number | null;
  played_at: string;
  level: number | null;
}

const getSingleRow = <T>(data: unknown): T | null => {
  if (Array.isArray(data)) {
    return (data[0] ?? null) as T | null;
  }
  return (data ?? null) as T | null;
};

const getNullableNumber = (data: unknown): number | null => {
  if (typeof data === 'number') {
    return data;
  }

  if (Array.isArray(data)) {
    return getNullableNumber(data[0]);
  }

  if (data && typeof data === 'object') {
    const values = Object.values(data);
    if (typeof values[0] === 'number') {
      return values[0];
    }
  }

  return null;
};

/**
 * 记录游戏成绩
 * @param scoreData 游戏成绩数据
 */
export async function recordGameScore(scoreData: GameScore) {
  try {
    const { data, error } = await supabase.rpc('game_record_score', {
      p_game_id: scoreData.game_id,
      p_score: scoreData.score,
      p_level: scoreData.level ?? 1,
      p_duration: scoreData.duration ?? null,
      p_extra_data: scoreData.extra_data ?? null,
      p_played_at: scoreData.played_at ?? null,
    });

    if (error) {
      console.error('Error recording game score:', error);
      throw error;
    }
    
    return getSingleRow<GameScore>(data);
  } catch (error) {
    console.error('Failed to record game score:', error);
    throw error;
  }
}

/**
 * 获取指定游戏的个人历史最高分
 * 对于舒尔特方格来说，时间越短越好，所以我们可能需要按 score 升序或者降序取一条。
 * @param gameId 游戏ID
 * @param isAscending 是否升序（例如时间类的记录是升序，分数类的记录是降序）
 */
export async function getPersonalHighScore(gameId: string, isAscending: boolean = false) {
  try {
    const { data, error } = await supabase.rpc('game_get_personal_high_score', {
      p_game_id: gameId,
      p_is_ascending: isAscending,
    });

    if (error) {
      console.error('Error fetching high score:', error);
      throw error;
    }

    return getNullableNumber(data);
  } catch (error) {
    console.error('Failed to get personal high score:', error);
    return null;
  }
}

/**
 * 获取排行榜
 * @param gameId 游戏ID
 * @param limit 获取前几名
 * @param isAscending 是否升序（例如时间类的记录是升序，分数类的记录是降序）
 */
export async function getGameRanking(gameId: string, limit: number = 10, isAscending: boolean = false) {
  try {
    const { data, error } = await supabase.rpc('game_get_ranking', {
      p_game_id: gameId,
      p_limit: limit,
      p_is_ascending: isAscending,
    });

    if (error) {
      console.error('Error fetching game ranking:', error);
      throw error;
    }

    return (data as GameRankingItem[]) || [];
  } catch (error) {
    console.error('Failed to get game ranking:', error);
    return [];
  }
}

export async function getGames(onlyActive: boolean = true) {
  const { data, error } = await supabase.rpc('game_get_games', {
    p_only_active: onlyActive,
  });

  if (error) {
    console.error('Error fetching game list:', error);
    throw error;
  }

  return (data as GameInfo[]) || [];
}

export async function getGameById(gameId: string) {
  const { data, error } = await supabase.rpc('game_get_game_by_id', {
    p_game_id: gameId,
  });

  if (error) {
    console.error('Error fetching game detail:', error);
    throw error;
  }

  return getSingleRow<GameInfo>(data);
}


export const gameApi = {
  getGames,
  getGameById,
  recordGameScore,
  getPersonalHighScore,
  getGameRanking,
};
