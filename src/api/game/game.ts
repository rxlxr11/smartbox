import { supabase } from '@/lib/supabase';

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

export const gameApi = {
  recordGameScore,
  getPersonalHighScore,
};
