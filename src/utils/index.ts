/**
 * 防止异步操作被快速重复点击（异步锁）
 * 包装一个异步函数，在它执行完成前，丢弃所有新的调用。
 * 
 * @param fn 需要防抖的异步函数
 * @returns 包装后的函数
 */
export function withAsyncLock<T extends (...args: any[]) => Promise<any>>(fn: T): (...args: Parameters<T>) => Promise<ReturnType<T> | void> {
  let isLocked = false;
  
  return async function (this: any, ...args: Parameters<T>) {
    if (isLocked) {
      return Promise.resolve(); // 如果已经被锁住，直接返回，不执行
    }
    
    isLocked = true;
    try {
      return await fn.apply(this, args);
    } finally {
      isLocked = false;
    }
  };
}

/**
 * 传统的防抖函数（Debounce）
 * 
 * @param fn 需要防抖的函数
 * @param delay 延迟时间（毫秒）
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number = 300) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (this: any, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}
