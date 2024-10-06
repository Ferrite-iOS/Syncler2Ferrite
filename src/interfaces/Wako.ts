interface WakoSources {
    [key: string]: WakoSource;
}

export type WakoList = {
    _manifest?: WakoManifest;
} & Omit<WakoSources, '_manifest'>;

// Manifest isn't a thing in Helios's source code, but some lists have them
export interface WakoManifest {
    name?: string;
    id?: string;
}

export interface WakoSource {
    name: string;
    base_url: string;
    fallback_urls?: Array<string>;
    response_type: 'json' | 'text';
    source_is_in_sub_page?: boolean;
    movie?: WakoCategory;
    episode?: WakoCategory;
    season?: WakoCategory;
    anime?: WakoCategory;
    json_format?: WakoApiParser;
    html_parser?: WakoHtmlParser;
}

export interface WakoCategory {
    query: string;
}

export interface WakoApiParser {
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

export interface WakoHtmlParser {
    row: string;
    url: string;
    title: string;
    seeds?: string;
    peers?: string;
    size?: string;
    isPackage?: string;
    hash?: string;
}
