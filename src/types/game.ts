/** 游戏状态 */
export type GameStatus = 'idle' | 'playing' | 'paused' | 'ended';

/** 难度配置 */
export interface DifficultyConfig {
  label: string;
  value: string;
  params: Record<string, any>;
}

/** 游戏接口 */
export interface Game {
  // 属性
  readonly id: string;
  readonly name: string;
  readonly difficultyDict: Record<string, DifficultyConfig>;
  readonly maxErrors: number | null;
  
  currentDifficulty: string;
  currentErrors: number;
  highScore: number;
  score: number;
  status: GameStatus;
  
  // 生命周期方法
  start(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  
  // 难度控制
  setDifficulty(difficulty: string): void;
  
  // 错误处理
  recordError(): void;
  
  // 状态判断
  checkGameOver(): boolean;
  checkSuccess(): boolean;
  
  // 分数管理
  updateHighScore(): Promise<void>;
  getHighScore(): Promise<number>;
  
  // 游戏独特逻辑
  onGameLogic(): void;
}

/** 游戏注册信息 */
export interface GameInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
  component: () => Promise<any>; // 动态导入组件
}
