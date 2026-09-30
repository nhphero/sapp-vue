import type { ISocketProtocol } from '../contracts';
export declare class SocketProtocol implements ISocketProtocol {
    id: "socket";
    socket: WebSocket | null;
    url: string;
    private handlers;
    private actionQueue;
    private actionCallbacks;
    constructor(url: string);
    connect(): void;
    /**
     * ⚡ Execute an action (Queued if connecting)
     */
    doAction<T = any>(action: string, data?: any): Promise<T>;
    on(event: string, handler: (data: any) => void): void;
}
//# sourceMappingURL=SocketProtocol.d.ts.map