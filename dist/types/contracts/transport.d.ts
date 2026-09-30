/**
 * 🌐 Transport Contracts (API / Socket protocols)
 */
import type { IProtocol } from './protocol';
export interface RequestOptions {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    [key: string]: any;
}
/** Envelope returned by `/v1/superapp/call/:action`. */
export interface ActionResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}
export interface SystemErrorInfo {
    message: string;
    status?: number;
    path?: string;
}
export interface IApiProtocol extends IProtocol {
    id: 'api';
    setBaseUrl(baseUrl: string): void;
    request<T = any>(path: string, options?: RequestOptions): Promise<T>;
    doAction<T = any>(action: string, params?: any): Promise<T>;
    get<T = any>(path: string, options?: RequestOptions): Promise<T>;
    post<T = any>(path: string, body: any, options?: RequestOptions): Promise<T>;
    put<T = any>(path: string, body: any, options?: RequestOptions): Promise<T>;
    delete<T = any>(path: string, options?: RequestOptions): Promise<T>;
}
/**
 * Wire format for the socket protocol.
 * - `ACTION` (client → server): `{ id, action, data }`
 * - `ACTION_RESPONSE` (server → client): `{ id, data }`
 * - `EVENT` (server broadcast): `{ event, data }`
 * - any other `type` is dispatched to legacy handlers registered under that type.
 */
export interface SocketMessage {
    type: 'ACTION' | 'ACTION_RESPONSE' | 'EVENT' | (string & {});
    id?: string;
    action?: string;
    event?: string;
    data?: any;
}
export interface ISocketProtocol extends IProtocol {
    id: 'socket';
    url: string;
    socket: WebSocket | null;
    connect(): void;
    doAction<T = any>(action: string, data?: any): Promise<T>;
    on(event: string, handler: (data: any) => void): void;
}
//# sourceMappingURL=transport.d.ts.map