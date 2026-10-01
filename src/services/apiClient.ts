import axios, { type AxiosError, type AxiosInstance } from 'axios';
import type { ApiClientError, CreateApi, CreateApiOptions, IAppState, MessageService } from '../contracts';

interface ApiFactoryDeps {
  /** localStorage key of the access token (`createSapp` option `auth.tokenKey`). */
  tokenKey: string;
  message?: MessageService | null;
  appState?: () => IAppState | null;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const REQUEST_ID_HEADER = 'x-request-id';

/**
 * UUID v4 for `x-request-id`. `crypto.randomUUID` exists only in a secure context (https or
 * localhost); the Shell is also opened over plain http by IP, so fall back to getRandomValues.
 */
function newRequestId(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function toApiClientError(error: AxiosError): ApiClientError {
  const data = error.response?.data as Record<string, any> | undefined;
  const backendMessage = data && typeof data === 'object'
    ? data.message || data.error_description || (typeof data.error === 'string' ? data.error : undefined)
    : undefined;

  return {
    status: error.response?.status ?? null,
    message: backendMessage || error.message || 'Request failed',
    code: (data && typeof data === 'object' && (data.code || (typeof data.error === 'string' ? data.error : undefined))) || error.code,
    data,
    url: error.config?.url,
    method: error.config?.method?.toUpperCase(),
    requestId: error.config?.headers?.get?.(REQUEST_ID_HEADER)?.toString(),
    cause: error,
  };
}

/**
 * Builds `superApp.createApi` (see contracts/api-client.ts). Called once by `createSapp` with what
 * only the Shell knows: where the token lives, the message service, the app state.
 */
export function createApiFactory(deps: ApiFactoryDeps): CreateApi {
  return function createApi(options: CreateApiOptions): AxiosInstance {
    const { baseURL, headers, withToken = true, workspace = false, onError, onSuccess, setup, ...axiosConfig } = options;

    if (!baseURL) {
      throw new Error('[createApi] `baseURL` is required — read it from env (e.g. import.meta.env.VITE_API_URL) or pass a function.');
    }

    const instance = axios.create({
      timeout: DEFAULT_TIMEOUT_MS,
      ...axiosConfig,
      baseURL: typeof baseURL === 'string' ? baseURL : undefined,
      headers: { Accept: 'application/json', ...headers },
    });

    instance.interceptors.request.use((config) => {
      // A function base is read per request (e.g. a public environment value an admin can change).
      if (typeof baseURL === 'function' && !config.baseURL) {
        const resolved = baseURL();
        if (!resolved) {
          throw new axios.AxiosError('No API base URL is configured for this client.', 'BASE_URL_MISSING', config);
        }
        config.baseURL = resolved;
      }
      // Every request is traceable end to end: keep the caller's id, otherwise mint one.
      if (!config.headers.has(REQUEST_ID_HEADER)) {
        config.headers.set(REQUEST_ID_HEADER, newRequestId());
      }
      if (withToken) {
        const token = localStorage.getItem(deps.tokenKey);
        if (token && !config.headers.has('Authorization')) {
          config.headers.set('Authorization', `Bearer ${token}`);
        }
      }
      if (workspace) {
        const current = deps.appState?.()?.current_workspace;
        if (current) {
          config.headers.set('x-workspace-id', String(current));
        }
      }
      return config;
    });

    instance.interceptors.response.use(
      response => (onSuccess ? onSuccess(response) : response),
      (error: AxiosError) => {
        if (axios.isCancel(error)) {
          return Promise.reject(error);
        }
        const apiError = toApiClientError(error);
        if (onError) {
          onError(apiError);
        } else {
          deps.message?.error(apiError.message);
        }
        return Promise.reject(apiError);
      },
    );

    setup?.(instance);
    return instance;
  };
}
