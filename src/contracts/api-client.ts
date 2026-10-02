/**
 * 🌐 API client factory — `superApp.createApi(options)`.
 *
 * Every mini app builds its backend client with this instead of creating its own axios/fetch
 * layer. It returns a plain **axios instance** preconfigured by the Shell; `options` overrides
 * any of it:
 *
 *   const http = superApp.createApi({
 *     baseURL: import.meta.env.VITE_API_URL,        // the app's OWN backend — never the Shell's
 *     // or, read per request (a public environment value):
 *     // baseURL: () => superApp.$env.get('BIZ_API_SERVER'),
 *     headers: { 'x-app': 'demo-app' },
 *     onSuccess: (response) => response,            // optional: look at / reshape every answer
 *     onError: (error) => { if (error.status !== 404) message.error(error.message); },
 *   });
 *   const { data } = await http.get('/products', { params: { page: 1 } });
 *
 * Defaults (each one overridable):
 * - `Authorization: Bearer <accessToken>` of the signed-in user (`withToken: false` to skip);
 * - `x-request-id` on every request — a fresh UUID unless the request already carries one;
 * - `timeout` 30 s;
 * - a failed request toasts `$message.error(error.message)` (`onError` replaces that);
 * - every rejection is an {@link ApiClientError}, whatever went wrong (HTTP, network, timeout).
 *
 * axios is provided by the Shell (peer dependency) — a mini app does not install or bundle it.
 */
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/** The one error shape every client rejects with. */
export interface ApiClientError {
  /** HTTP status; `null` for a network error or a timeout. */
  status: number | null;
  /** Best human-readable message: the backend's own (`message`, `error_description`, `error`) or axios'. */
  message: string;
  /** Backend error code when it sends one (`code` / `error`), else axios' (`ECONNABORTED`…). */
  code?: string;
  /** Response body, as received. */
  data?: unknown;
  url?: string;
  method?: string;
  /** `x-request-id` the request was sent with — quote it when reporting the failure. */
  requestId?: string;
  /** The original axios error, for the rare caller that needs it. */
  cause: unknown;
}

export interface CreateApiOptions extends Omit<AxiosRequestConfig, 'baseURL' | 'headers'> {
  /**
   * The app's own backend — never a literal: from env (`import.meta.env.VITE_API_URL`), or a function
   * read on every request (`() => superApp.$env.get('BIZ_API_SERVER')`). A function that returns
   * nothing rejects the request (code `BASE_URL_MISSING`) before anything is sent.
   */
  baseURL: string | (() => string | null | undefined);
  /** Merged over the defaults; a key here wins. */
  headers?: Record<string, string>;
  /** Send the signed-in user's bearer token. Default `true`. (Not `auth`: that is axios' basic-auth option.) */
  withToken?: boolean;
  /**
   * Replaces the default error handling (a `$message.error` toast). Called once per failed request,
   * not for a cancelled one. The request promise still rejects with the same error.
   */
  onError?: (error: ApiClientError) => void;
  /** Every successful response passes through it (inspect or reshape); what it returns is what callers get. */
  onSuccess?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
  /** Last word on the instance: add interceptors after the Shell's defaults are in place. */
  setup?: (instance: AxiosInstance) => void;
}

export type CreateApi = (options: CreateApiOptions) => AxiosInstance;
