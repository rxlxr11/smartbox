import { BaseGame } from '../BaseGame';
import type { DifficultyConfig } from '@/types/game';
import { recordGameScore, getPersonalHighScore } from '@/api/game/game';

export class SchulteGridGame extends BaseGame {
  readonly id = 'schulte-grid';
  readonly name = '舒尔特方格';
  readonly maxErrors = null; // 不限制错误次数
  
  readonly difficultyDict: Record<string, DifficultyConfig> = {
    easy: {
      label: '简单 (3x3)',
      value: 'easy',
      params: { size: 3 }
    },
    normal: {
      label: '普通 (4x4)',
      value: 'normal',
      params: { size: 4 }
    },
    hard: {
      label: '困难 (5x5)',
      value: 'hard',
      params: { size: 5 }
    }
  };

  currentDifficulty = 'normal';
  
  // 舒尔特方格特有属性
  grid: number[] = [];
  expectedNumber: number = 1;
  startTime: number = 0;
  endTime: number = 0;

  constructor() {
    super();
    // 初始化时尝试获取历史最高分
    this.getHighScore().then(score => {
      if (score) {
        this.highScore = score;
      }
    });
  }

  onGameLogic(): void {
    this.expectedNumber = 1;
    this.generateGrid();
    this.startTime = Date.now();
  }

  private generateGrid(): void {
    const size = this.difficultyDict[this.currentDifficulty].params.size;
    const total = size * size;
    const numbers = Array.from({ length: total }, (_, i) => i + 1);
    
    // 洗牌算法
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    
    this.grid = numbers;
  }

  // 点击格子处理
  clickCell(number: number): boolean {
    if (this.status !== 'playing') return false;

    if (number === this.expectedNumber) {
      this.expectedNumber++;
      this.score++;
      
      if (this.checkSuccess()) {
        this.status = 'ended';
        this.endTime = Date.now();
        this.updateHighScore();
      }
      return true;
    } else {
      this.recordError();
      return false;
    }
  }

  getTimeSpent(): number {
    if (this.startTime === 0) return 0;
    const end = this.endTime || Date.now();
    return Math.floor((end - this.startTime) / 1000);
  }

  checkSuccess(): boolean {
    const size = this.difficultyDict[this.currentDifficulty].params.size;
    return this.expectedNumber > size * size;
  }

  async updateHighScore(): Promise<void> {
    const timeSpent = this.getTimeSpent();
    
    // 如果是第一次玩或者时间比历史最高分短，更新本地状态
    if (this.highScore === 0 || timeSpent < this.highScore) {
      this.highScore = timeSpent;
    }

    // 无论是否破纪录，每次游戏结束都记录到数据库
    try {
      await recordGameScore({
        game_id: this.id,
        score: timeSpent, // 这里用耗时作为分数
        level: this.difficultyDict[this.currentDifficulty].params.size, // 可以用格子大小代表等级
        duration: timeSpent,
        extra_data: { difficulty: this.currentDifficulty }
      });
    } catch (e) {
      console.error('Failed to save score to Supabase', e);
    }
  }

  async getHighScore(): Promise<number> {
    try {
      // 舒尔特方格耗时越短越好，因此传 true 获取升序第一条（最小值）
      const score = await getPersonalHighScore(this.id, true);
      return score !== null ? score : 0;
    } catch (e) {
      console.error('Failed to get high score from Supabase', e);
      return this.highScore;
    }
  }
}
