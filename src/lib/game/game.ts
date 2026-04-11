import gameConfig from './game.json';
import type { DifficultyConfig } from '@/types/game';

export interface LocalGameInfo {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  path?: string;
  max_errors?: number | null;
  is_active?: boolean;
  difficulty_dict?: Record<string, DifficultyConfig>;
}

const getGameList = (): LocalGameInfo[] => {
  if (!Array.isArray(gameConfig)) {
    return [];
  }
  return gameConfig as LocalGameInfo[];
};

export async function getGames(onlyActive: boolean = true): Promise<LocalGameInfo[]> {
  const list = getGameList();
  if (!onlyActive) {
    return list;
  }
  return list.filter((game) => game.is_active !== false);
}

export async function getGameById(gameId: string): Promise<LocalGameInfo | null> {
  const game = getGameList().find((item) => item.id === gameId);
  return game ?? null;
}
