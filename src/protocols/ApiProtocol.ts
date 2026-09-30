import type { IApiProtocol, ISuperAppCore, RequestOptions, ActionResponse, SystemErrorInfo } from '../contracts';
import { SUPERAPP_EVENTS, SUPERAPP_PROTOCOL, ACCESS_TOKEN_STORAGE_KEY, ACTIVE_WORKSPACE_STORAGE_KEY } from '../contracts';

export class ApiProtocol implements IApiProtocol {
  public id = 'api' as const;
  private baseUrl: string;
  private superApp: ISuperAppCore | null = null;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  public setBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * 🔗 Bind to SuperApp to enable event broadcasting
   */
  public bind(superApp: ISuperAppCore) {
    this.superApp = superApp;
  }

  private getHeaders() {
    const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    
    // 🛰️ ESA v5 Synchronization: Priority is given to the global appState
    // This ensures that when the workspace is switched in the UI, all subsequent
    // API calls immediately use the new context.
    const workspaceId = (this.superApp as any)?.$appState?.current_workspace || localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY);
    
    const requestId = `req-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const headers: any = {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      'request-id': requestId
    };
    
    if (workspaceId) {
      headers['x-workspace-id'] = workspaceId;
      
      // Also sync back to localStorage for legacy components that might still read it directly
      if (localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY) !== String(workspaceId)) {
        localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, String(workspaceId));
      }
    }
    
    return headers;
  }

  public async request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: { ...this.getHeaders(), ...options.headers }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'System error' }));
        const errorInfo: SystemErrorInfo = { 
          message: error.error || error.message || `Request failed with status ${response.status}`,
          status: response.status,
          path 
        };
        
        // 🛰️ Broadcast error to the system
        this.superApp?.emit(SUPERAPP_EVENTS.SYSTEM_ERROR, errorInfo);
        throw new Error(errorInfo.message);
      }

      return response.json().catch(() => ({}));
    } catch (err: any) {
      if (err.message !== 'System error') {
        this.superApp?.emit(SUPERAPP_EVENTS.SYSTEM_ERROR, { message: err.message, path } as SystemErrorInfo);
      }
      throw err;
    }
  }

  /**
   * ⚡ Invoke a SuperApp Action via the Bridge
   */
  public async doAction<T = any>(action: string, params: any = {}): Promise<T> {
    console.log(`📡 [ApiProtocol] Invoking action: ${action}`, params);
    
    const response = await this.request<ActionResponse<T>>(`${SUPERAPP_PROTOCOL.ENDPOINTS.SUPERAPP_CALL}/${action}`, {
      method: 'POST',
      body: JSON.stringify(params)
    });

    if (response.success) {
      return response.data as T;
    }

    throw new Error(response.error || `Action ${action} failed`);
  }

  // --- HTTP Helpers (Axios-like compatibility) ---

  public async get<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request(path, { ...options, method: 'GET' });
  }

  public async post<T = any>(path: string, body: any, options: RequestOptions = {}): Promise<T> {
    return this.request(path, { ...options, method: 'POST', body: JSON.stringify(body) });
  }

  public async put<T = any>(path: string, body: any, options: RequestOptions = {}): Promise<T> {
    return this.request(path, { ...options, method: 'PUT', body: JSON.stringify(body) });
  }

  public async delete<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request(path, { ...options, method: 'DELETE' });
  }
}
