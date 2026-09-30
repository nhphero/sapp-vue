import type { ISocketProtocol, SocketMessage } from '../contracts';

export class SocketProtocol implements ISocketProtocol {
  public id = 'socket' as const;
  public socket: WebSocket | null = null;
  public url: string;
  private handlers: Map<string, ((data: any) => void)[]> = new Map();
  private actionQueue: (() => void)[] = [];
  private actionCallbacks: Map<string, { resolve: (val: any) => void; reject: (err: any) => void }> = new Map();

  constructor(url: string) {
    this.url = url;
  }

  public connect() {
    this.socket = new WebSocket(this.url);
    
    this.socket.onopen = () => {
      console.log(`📡 [SocketProtocol] CONNECTED to ${this.url}`);
      // Flush Queue
      while (this.actionQueue.length > 0) {
        const action = this.actionQueue.shift();
        if (action) action();
      }
    };

    this.socket.onerror = (err) => {
      console.error(`📡 [SocketProtocol] CONNECTION ERROR for ${this.url}`, err);
    };

    this.socket.onclose = (event) => {
      console.warn(`📡 [SocketProtocol] CLOSED: Code ${event.code}, Reason: ${event.reason || 'none'}`);
      // Clear pending callbacks on close to prevent leaks
      this.actionCallbacks.forEach(({ reject }) => reject(new Error('Socket closed')));
      this.actionCallbacks.clear();
    };

    this.socket.onmessage = (event) => {
      try {
        const payload: SocketMessage = JSON.parse(event.data);
        const { type, data, id } = payload;

        // 1. Handle Targeted Action Responses
        if (type === 'ACTION_RESPONSE' && id && this.actionCallbacks.has(id)) {
          const { resolve } = this.actionCallbacks.get(id)!;
          this.actionCallbacks.delete(id);
          resolve(data);
          return;
        }

        // 2. Handle Broadcast Events (Topic-based)
        if (type === 'EVENT' && payload.event) {
          if (this.handlers.has(payload.event)) {
            this.handlers.get(payload.event)?.forEach(h => h(payload.data));
          }
          return;
        }

        // 3. Legacy / Generic Handlers
        if (this.handlers.has(type)) {
          this.handlers.get(type)?.forEach(h => h(data));
        }
      } catch (e) {
        console.error('📡 [SocketProtocol] Message Parse Error', e);
      }
    };
  }

  /**
   * ⚡ Execute an action (Queued if connecting)
   */
  public async doAction<T = any>(action: string, data?: any): Promise<T> {
    const execute = (resolve: (v: any) => void, reject: (e: any) => void) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        reject(new Error('Socket unexpectedly unavailable'));
        return;
      }

      const id = Math.random().toString(36).substring(7);
      this.actionCallbacks.set(id, { resolve, reject });
      
      const message: SocketMessage = { type: 'ACTION', id, action, data };
      this.socket.send(JSON.stringify(message));

      // Timeout protection
      setTimeout(() => {
        if (this.actionCallbacks.has(id)) {
          this.actionCallbacks.delete(id);
          reject(new Error(`📡 [SocketProtocol] Action "${action}" timed out.`));
        }
      }, 30000);
    };

    // 🌊 Queue or Execute
    return new Promise((resolve, reject) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        execute(resolve, reject);
      } else {
        console.log(`📡 [SocketProtocol] Action "${action}" queued (Socket connecting...)`);
        this.actionQueue.push(() => execute(resolve, reject));
      }
    });
  }

  public on(event: string, handler: (data: any) => void) {
    const list = this.handlers.get(event) || [];
    list.push(handler);
    this.handlers.set(event, list);
  }
}
