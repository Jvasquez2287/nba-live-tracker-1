export declare class ApiConfig {
    private configList;
    constructor();
    getConfig(): string | null;
    getConfigDict(): {
        http?: string;
        https?: string;
    } | null;
}
export declare const apiConfig: ApiConfig;
export declare function getApiConfig(): ApiConfig;
export declare function getApiKwargs(): {
    proxy?: string;
};
export declare function getApiProxyConfig(): string | null;
export declare const config: {
    getApiProxyConfig: typeof getApiProxyConfig;
};
//# sourceMappingURL=config.d.ts.map