import type { CreateApi, IAppState, MessageService } from '../contracts';
interface ApiFactoryDeps {
    /** localStorage key of the access token (`createSapp` option `auth.tokenKey`). */
    tokenKey: string;
    message?: MessageService | null;
    appState?: () => IAppState | null;
}
/**
 * Builds `superApp.createApi` (see contracts/api-client.ts). Called once by `createSapp` with what
 * only the Shell knows: where the token lives, the message service, the app state.
 */
export declare function createApiFactory(deps: ApiFactoryDeps): CreateApi;
export {};
//# sourceMappingURL=apiClient.d.ts.map