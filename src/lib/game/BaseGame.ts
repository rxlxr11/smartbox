import type { Game, GameStatus, DifficultyConfig } from '@/types/game';

export abstract class BaseGame implements Game {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly difficultyDict: Record<string, DifficultyConfig>;
  abstract readonly maxErrors: number | null;
  
  currentDifficulty: string = 'normal';
  currentErrors: number = 0;
  highScore: number = 0;
  score: number = 0;
  status: GameStatus = 'idle';
  
  start(): void {
    this.status = 'playing';
    this.score = 0;
    this.currentErrors = 0;
    this.onGameLogic(); // Start specific game logic
  }
  
  pause(): void {
    if (this.status === 'playing') {
      this.status = 'paused';
    }
  }
  
  resume(): void {
    if (this.status === 'paused') {
      this.status = 'playing';
    }
  }
  
  restart(): void {
    this.status = 'idle';
    this.score = 0;
    this.currentErrors = 0;
    this.start();
  }
  
  setDifficulty(difficulty: string): void {
    if (this.difficultyDict[difficulty]) {
      this.currentDifficulty = difficulty;
    }
  }
  
  recordError(): void {
    this.currentErrors++;
    if (this.checkGameOver()) {
      this.status = 'ended';
    }
  }
  
  checkGameOver(): boolean {
    if (this.maxErrors === null) return false;
    return this.currentErrors >= this.maxErrors;
  }
  
  abstract checkSuccess(): boolean;
  abstract updateHighScore(): Promise<void>;
  abstract getHighScore(): Promise<number>;
  abstract onGameLogic(): void;
}
