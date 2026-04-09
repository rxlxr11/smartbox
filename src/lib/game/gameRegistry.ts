import type { GameInfo, Game } from '@/types/game';
import { SchulteGridGame } from './games/SchulteGridGame';

export const gameRegistry: GameInfo[] = [
  {
    id: 'schulte-grid',
    name: '舒尔特方格',
    icon: '🔢',
    description: '经典舒尔特方格注意力训练',
    component: () => import('@/components/games/SchulteGrid.vue')
  }
];

// 工厂方法用于创建游戏实例
export function createGameInstance(id: string): Game | null {
  switch (id) {
    case 'schulte-grid':
      return new SchulteGridGame();
    default:
      return null;
  }
}
