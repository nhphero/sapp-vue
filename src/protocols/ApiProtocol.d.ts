import type { IApiProtocol, ISuperAppCore, RequestOptions } from '../contracts';
export declare class ApiProtocol implements IApiProtocol {
    id: "api";
    private baseUrl;
    private superApp;
    constructor(baseUrl?: string);
    setBaseUrl(baseUrl: string): void;
    /**
     * 🔗 Bind to SuperApp to enable event broadcasting
     */
    bind(superApp: ISuperAppCore): void;
    private getHeaders;
    request<T = any>(path: string, options?: RequestOptions): Promise<T>;
    /**
     * ⚡ Invoke a SuperApp Action via the Bridge
     */
    doAction<T = any>(action: string, params?: any): Promise<T>;
    get<T = any>(path: string, options?: RequestOptions): Promise<T>;
    post<T = any>(path: string, body: any, options?: RequestOptions): Promise<T>;
    put<T = any>(path: string, body: any, options?: RequestOptions): Promise<T>;
    delete<T = any>(path: string, options?: RequestOptions): Promise<T>;
}
//# sourceMappingURL=ApiProtocol.d.ts.map