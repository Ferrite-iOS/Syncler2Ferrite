export interface FerritePluginList {
    name: string;
    author: string;
    sources: Array<FerriteSource>;
}

export interface FerriteSource {
    name: string;
    version: number;
    minVersion: string;
    website: string;
    trackers?: Array<string>;
    api?: FerriteApiInfo;
    jsonParser?: FerriteJsonParser;
    rssParser?: FerriteRssParser;
    htmlParser?: FerriteHtmlParser;
}

export interface FerriteApiInfo {
    apiUrl: string;
}

export interface FerriteJsonParser {
    searchUrl?: string;
    results?: string;
    subResults?: string;
    magnetHash?: FerriteComplexQuery;
    magnetLink?: FerriteComplexQuery;
    subName?: FerriteComplexQuery;
    title?: FerriteComplexQuery;
    size?: FerriteComplexQuery;
    sl?: FerriteSeedLeech;
}

export interface FerriteRssParser {
    rssUrl?: string;
    searchUrl?: string;
    items: string;
    magnetHash?: FerriteComplexQuery;
    magnetLink?: FerriteComplexQuery;
    subName?: FerriteComplexQuery;
    title?: FerriteComplexQuery;
    size?: FerriteComplexQuery;
    sl?: FerriteSeedLeech;
}

export interface FerriteHtmlParser {
    searchUrl: string;
    rows: string;
    magnet: FerriteComplexQuery;
    subName?: FerriteComplexQuery;
    title?: FerriteComplexQuery;
    size?: FerriteComplexQuery;
    sl?: FerriteSeedLeech;
}

export interface FerriteComplexQuery {
    query: string;
    attribute?: string;
    discriminator?: string;
    regex?: string;
}

export interface FerriteSeedLeech {
    seeders?: string;
    leechers?: string;
    combined?: string;
    attribute?: string;
    seederRegex?: string;
    leecherRegex?: string;
}
