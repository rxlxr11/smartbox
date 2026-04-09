import { supabase } from '@/lib/supabase';

export interface GameScore {
  id?: number;
  user_id?: string;
  game_id: string;
  score: number;
  level?: number;
  played_at?: string;
  duration?: number;
  extra_data?: any;
  created_at?: string;
}

/**
 * 记录游戏成绩
 * @param scoreData 游戏成绩数据
 */
export async function recordGameScore(scoreData: GameScore) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 如果有登录用户，附加 user_id
    const payload = {
      ...scoreData,
      user_id: user?.id || null
    };

    const { data, error } = await supabase
      .from('game_scores')
      .insert([payload])
      .select();

    if (error) {
      console.error('Error recording game score:', error);
      throw error;
    }
    
    return data;
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
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('game_scores')
      .select('score')
      .eq('user_id', user.id)
      .eq('game_id', gameId)
      .order('score', { ascending: isAscending })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
      console.error('Error fetching high score:', error);
      throw error;
    }

    return data ? data.score : null;
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
    const { data, error } = await supabase
      .from('game_scores')
      .select('score, user_id, duration')
      .eq('game_id', gameId)
      .order('score', { ascending: isAscending })
      .limit(limit);

    if (error) {
      console.error('Error fetching game ranking:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get game ranking:', error);
    return [];
  }
}
