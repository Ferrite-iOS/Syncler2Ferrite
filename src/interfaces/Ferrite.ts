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
    fallbackUrls?: Array<string>;
    trackers?: Array<string>;
    tags?: Array<FerriteTag>;
    api?: FerriteApiInfo;
    jsonParser?: FerriteJsonParser;
    rssParser?: FerriteRssParser;
    htmlParser?: FerriteHtmlParser;
}

export interface FerriteTag {
    name: string;
    color?: string;
}

export interface FerriteApiInfo {
    apiUrl?: string;
    clientId?: FerriteApiCredential;
    clientSecret?: FerriteApiCredential;
}

export interface FerriteApiCredential {
    url?: string;
    dynamic?: boolean;
    expiryLength?: number;
    responseType?: "json" | "text";
    query?: string;
}

export interface FerriteJsonParser {
    searchUrl?: string;
    results?: string;
    subResults?: string;
    magnetHash?: FerriteComplexQuery;
    magnetLink?: FerriteMagnetLink;
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
    magnetLink?: FerriteMagnetLink;
    subName?: FerriteComplexQuery;
    title?: FerriteComplexQuery;
    size?: FerriteComplexQuery;
    sl?: FerriteSeedLeech;
}

export interface FerriteHtmlParser {
    searchUrl: string;
    rows: string;
    magnet: FerriteMagnetLink;
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

export interface FerriteMagnetLink extends FerriteComplexQuery {
    externalLinkQuery?: string;
}

export interface FerriteSeedLeech {
    seeders?: string;
    leechers?: string;
    combined?: string;
    attribute?: string;
    seederRegex?: string;
    leecherRegex?: string;
}
