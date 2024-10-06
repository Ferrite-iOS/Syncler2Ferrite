import YAML from "yaml";
import { promises as fs } from "fs";
import {
    FerriteSource,
    FerriteHtmlParser,
    FerriteJsonParser,
    FerriteSeedLeech,
    FerriteApiInfo,
    FerriteComplexQuery,
    FerriteApiCredential
} from "./interfaces/Ferrite.js";
import { SynclerExpressList, SynclerCategory, SynclerSource } from "./interfaces/Syncler.js";
import { Command } from "commander";

function cleanNewlines(input: string) {
    return input.replace(/(\r\n|\n|\r)/gm, " ");
}

// Extracts a CSS selector and attributes from a given JS function string
// Returned as a FerriteComplexQuery since it's a unified type for this purpose
function extractCssSelector(input?: string) {
    if (!input) {
        return;
    }

    const queryPattern = /querySelector\('([^']+)'\)/;
    const queryAllPattern = /querySelectorAll\('([^']+)'\)/;
    const attributePattern = /getAttribute\('([^']+)'\)/;

    const queryMatch = queryPattern.exec(input);
    const queryAllMatch = queryAllPattern.exec(input);

    if (!(queryMatch || queryAllMatch)) {
        return;
    }

    const queryResult = queryMatch?.[1] ?? queryAllMatch?.[1];

    if (!queryResult) {
        return;
    }

    let complexQuery: FerriteComplexQuery = {
        query: queryResult
    };

    if (!input.endsWith("textContent")) {
        const attributeMatch = attributePattern.exec(input);
        const attributeName = attributeMatch?.[1];
        complexQuery.attribute = attributeName;
    }

    return complexQuery;
}

async function main() {
    const program = new Command();
    program
        .option("-i, --input <fileName>", "Syncler source list name", "syncler_input.json")
        .option("-o, --output <fileName>", "Ferrite plugin YAML name", "ferriteOutput.yml")
        .parse(process.argv);

    const options = program.opts();

    // Converted Ferrite sources
    const finalSources: Array<FerriteSource> = [];

    // Read Syncler express list
    const inputText = await fs.readFile(options.input, "utf-8");
    const synclerExpressList: SynclerExpressList = JSON.parse(inputText);

    // Manifest entry
    const synclerManifest = synclerExpressList._manifest;
    delete synclerExpressList._manifest;

    // Sources
    for (const sourceName of Object.keys(synclerExpressList)) {
        const synclerSource = synclerExpressList[sourceName];

        let ferriteSource: FerriteSource = {
            name: synclerSource.name,
            version: 1,
            minVersion: "0.7.2",
            website: synclerSource.base_url
        };

        if (synclerSource.fallback_urls) {
            ferriteSource.fallbackUrls = synclerSource.fallback_urls;
        }

        let searchQuery = "";
        const searchUrlKeys: Array<keyof SynclerSource> = ["movie", "episode", "season", "anime"];
        for (const key of searchUrlKeys) {
            if (searchQuery) {
                break;
            }

            const category = synclerSource[key] as SynclerCategory | undefined;
            searchQuery = category?.query ?? "";
        }

        // HTML parser
        if (synclerSource.html_parser) {
            const synclerHtmlParser = synclerSource.html_parser;

            const rows = extractCssSelector(synclerHtmlParser.row)?.query;
            if (!rows) {
                console.log(
                    `Source ${sourceName} doesn't have a properly formatted row query. Skipping.`
                );
                continue;
            }

            const magnet = extractCssSelector(synclerHtmlParser.url);
            if (!magnet) {
                console.log(
                    `Source ${sourceName} doesn't have a properly formatted magnet query. Skipping.`
                );
                continue;
            }

            const ferriteHtmlParser: FerriteHtmlParser = {
                searchUrl: searchQuery,
                rows: rows,
                magnet: magnet
            };

            ferriteHtmlParser.title = extractCssSelector(synclerHtmlParser.title);

            if (synclerHtmlParser.size) {
                ferriteHtmlParser.size = extractCssSelector(synclerHtmlParser.size);
            }

            if (synclerHtmlParser.seeds || synclerHtmlParser.peers) {
                ferriteHtmlParser.sl = {
                    seeders: extractCssSelector(synclerHtmlParser.seeds)?.query,
                    leechers: extractCssSelector(synclerHtmlParser.peers)?.query
                };
            }

            ferriteSource.htmlParser = ferriteHtmlParser;
        }

        // API parser
        // TODO: Move to a separate function for early returns
        if (synclerSource.json_format) {
            // The API URL is the same as the base URL. Requires manual editing
            const ferriteApiInfo: FerriteApiInfo = { apiUrl: synclerSource.base_url };

            // This is some guesswork because syncler's docs are unclear
            if (synclerSource.token) {
                const synclerTokenHandler = synclerSource.token;
                const ferriteCredential: FerriteApiCredential = {
                    url: synclerTokenHandler.query,
                    expiryLength: synclerTokenHandler.token_validity_time_ms,
                    responseType: "json",
                    query: synclerTokenHandler.token_format.token
                };

                ferriteApiInfo.clientSecret = ferriteCredential;
            }

            const synclerJsonParser = synclerSource.json_format;
            const ferriteJsonParser: FerriteJsonParser = {
                searchUrl: searchQuery,
                results: synclerJsonParser.results,
                subResults: synclerJsonParser.sub_results
            };

            if (synclerJsonParser.hash) {
                ferriteJsonParser.magnetHash = { query: synclerJsonParser.hash };
            } else if (synclerJsonParser.url) {
                ferriteJsonParser.magnetLink = { query: synclerJsonParser.url };
            } else {
                console.log(`Source ${sourceName} doesn't have a magnet link or hash. Skipping.`);
                continue;
            }

            ferriteJsonParser.title = { query: synclerJsonParser.title };

            if (synclerJsonParser.size) {
                ferriteJsonParser.size = { query: synclerJsonParser.size };
            }

            if (synclerJsonParser.seeds || synclerJsonParser.peers) {
                const ferriteSeedLeech: FerriteSeedLeech = {
                    seeders: synclerJsonParser.seeds,
                    leechers: synclerJsonParser.peers
                };
                ferriteJsonParser.sl = ferriteSeedLeech;
            }

            ferriteSource.api = ferriteApiInfo;
            ferriteSource.jsonParser = ferriteJsonParser;
        }

        finalSources.push(ferriteSource);
    }

    const pluginObject = {
        name: cleanNewlines(synclerManifest?.name ?? "Syncler Transcribed plugins (change this)"),
        author: cleanNewlines(synclerManifest?.id?.trim() ?? "Syncler2Ferrite"),
        sources: finalSources
    };
    const sourceYaml = YAML.stringify(pluginObject);

    await fs.writeFile(options.output, sourceYaml, "utf-8");
}

await main();
