interface SynclerSources {
    [key: string]: SynclerSource;
}

export type SynclerExpressList = {
    _manifest?: SynclerManifest;
} & Omit<SynclerSources, "_manifest">;

// Manifest isn't a thing in Helios's source code, but some lists have them
export interface SynclerManifest {
    name?: string;
    id?: string;
}

export interface SynclerSource {
    name: string;
    base_url: string;
    fallback_urls?: Array<string>;
    response_type: "json" | "text";
    token: SynclerTokenHandler;
    source_is_in_sub_page?: boolean;
    movie?: SynclerCategory;
    episode?: SynclerCategory;
    season?: SynclerCategory;
    anime?: SynclerCategory;
    json_format?: SynclerApiParser;
    html_parser?: SynclerHtmlParser;
}

export interface SynclerTokenHandler {
    query: string;
    token_validity_time_ms: number;

    // Unsure what this means
    token_format: { token: "token" };
}

export interface SynclerCategory {
    query: string;
}

export interface SynclerApiParser {
    results?: string;
    sub_results?: string;
    url?: string;
    title: string;
    seeds?: string;
    peers?: string;
    size?: string;
    quality?: string;
    isPackage?: string;
    hash?: string;
}

export interface SynclerHtmlParser {
    row: string;
    url: string;
    title: string;
    seeds?: string;
    peers?: string;
    size?: string;
    isPackage?: string;
    hash?: string;
}
