import { BaseGame } from '../BaseGame';
import type { DifficultyConfig } from '@/types/game';
import { recordGameScore, getPersonalHighScore } from '@/api/game/game';

type SlidingPuzzleConfig = {
  id: string;
  name: string;
  maxErrors: number | null;
  difficultyDict: Record<string, DifficultyConfig>;
};

export class SlidingPuzzleGame extends BaseGame {
  readonly id: string;
  readonly name: string;
  readonly maxErrors: number | null;
  readonly difficultyDict: Record<string, DifficultyConfig>;

  currentDifficulty = 'normal';

  board: number[] = [];
  blankIndex: number = 0;
  startTime: number = 0;
  endTime: number = 0;

  constructor(config: SlidingPuzzleConfig) {
    super();
    this.id = config.id;
    this.name = config.name;
    this.maxErrors = config.maxErrors;
    this.difficultyDict = config.difficultyDict;

    const firstDifficulty = Object.keys(config.difficultyDict)[0];
    this.currentDifficulty = firstDifficulty || 'normal';
  }

  onGameLogic(): void {
    this.generateBoard();
    this.startTime = Date.now();
    this.endTime = 0;
  }

  clickCell(index: number): boolean {
    if (this.status !== 'playing') return false;
    if (!Number.isInteger(index) || index < 0 || index >= this.board.length) return false;

    const blank = this.blankIndex;
    const size = this.getBoardSize();
    const row = Math.floor(index / size);
    const col = index % size;
    const blankRow = Math.floor(blank / size);
    const blankCol = blank % size;
    const distance = Math.abs(row - blankRow) + Math.abs(col - blankCol);

    if (distance !== 1) {
      return false;
    }

    [this.board[index], this.board[blank]] = [this.board[blank], this.board[index]];
    this.blankIndex = index;
    this.score++;

    if (this.checkSuccess()) {
      this.status = 'ended';
      this.endTime = Date.now();
      void this.updateHighScore();
    }

    return true;
  }

  getBoardSize(): number {
    const configured = Number(this.difficultyDict[this.currentDifficulty]?.params?.size ?? 0);
    return configured > 1 ? configured : 3;
  }

  getTimeSpent(): number {
    if (this.startTime === 0) return 0;
    const end = this.endTime || Date.now();
    return Math.floor((end - this.startTime) / 1000);
  }

  checkSuccess(): boolean {
    if (this.board.length === 0) return false;

    for (let i = 0; i < this.board.length - 1; i++) {
      if (this.board[i] !== i + 1) return false;
    }
    return this.board[this.board.length - 1] === 0;
  }

  async updateHighScore(): Promise<void> {
    const timeSpent = this.getTimeSpent();
    if (this.highScore === 0 || timeSpent < this.highScore) {
      this.highScore = timeSpent;
    }

    try {
      await recordGameScore({
        game_id: this.id,
        score: timeSpent,
        level: this.getBoardSize(),
        duration: timeSpent,
        extra_data: {
          difficulty: this.currentDifficulty,
          moves: this.score,
        },
      });
    } catch (e) {
      console.error('Failed to save sliding puzzle score', e);
    }
  }

  async getHighScore(): Promise<number> {
    try {
      const score = await getPersonalHighScore(this.id, true);
      return score !== null ? score : 0;
    } catch (e) {
      console.error('Failed to get sliding puzzle high score', e);
      return this.highScore;
    }
  }

  private generateBoard(): void {
    const size = this.getBoardSize();
    const total = size * size;
    const solved = [...Array.from({ length: total - 1 }, (_, i) => i + 1), 0];
    const board = solved.slice();
    let blank = total - 1;

    const randomSteps = Math.max(80, total * 24);
    for (let i = 0; i < randomSteps; i++) {
      const neighbors = this.getNeighborIndexes(blank, size);
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      [board[blank], board[next]] = [board[next], board[blank]];
      blank = next;
    }

    if (board.every((value, index) => value === solved[index])) {
      const neighbors = this.getNeighborIndexes(blank, size);
      const next = neighbors[0];
      [board[blank], board[next]] = [board[next], board[blank]];
      blank = next;
    }

    this.board = board;
    this.blankIndex = blank;
  }

  private getNeighborIndexes(index: number, size: number): number[] {
    const row = Math.floor(index / size);
    const col = index % size;
    const result: number[] = [];

    if (row > 0) result.push(index - size);
    if (row < size - 1) result.push(index + size);
    if (col > 0) result.push(index - 1);
    if (col < size - 1) result.push(index + 1);

    return result;
  }
}
