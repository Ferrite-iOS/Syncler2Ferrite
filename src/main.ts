import YAML from "yaml";
import { promises as fs } from "fs";
import {
    FerriteSource,
    FerriteHtmlParser,
    FerriteJsonParser,
    FerriteSeedLeech,
    FerriteApiInfo,
    FerriteComplexQuery
} from "./interfaces/Ferrite.js";
import { WakoList, WakoCategory, WakoSource } from "./interfaces/Wako.js";
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
        .option("-i, --input <fileName>", "Wako source list name", "wako_input.json")
        .option("-o, --output <fileName>", "Ferrite plugin YAML name", "ferriteOutput.yml")
        .parse(process.argv);

    const options = program.opts();

    const finalSources: Array<FerriteSource> = [];

    const inputText = await fs.readFile(options.input, "utf-8");
    const wakoProviderJson: WakoList = JSON.parse(inputText);

    // Manifest entry
    const wakoManifest = wakoProviderJson._manifest;
    delete wakoProviderJson._manifest;

    // Sources
    for (const sourceName of Object.keys(wakoProviderJson)) {
        const wakoSource = wakoProviderJson[sourceName];

        let ferriteSource: FerriteSource = {
            name: wakoSource.name,
            version: 1,
            minVersion: "0.7.2",
            website: wakoSource.base_url
        };

        if (wakoSource.fallback_urls) {
            ferriteSource.fallbackUrls = wakoSource.fallback_urls;
        }

        let searchQuery = "";
        const searchUrlKeys: Array<keyof WakoSource> = ["movie", "episode", "season", "anime"];
        for (const key of searchUrlKeys) {
            if (searchQuery) {
                break;
            }

            const category = wakoSource[key] as WakoCategory | undefined;
            searchQuery = category?.query ?? "";
        }

        // HTML parser
        if (wakoSource.html_parser) {
            const wakoHtmlParser = wakoSource.html_parser;

            const rows = extractCssSelector(wakoHtmlParser.row)?.query;
            if (!rows) {
                console.log(
                    `Source ${sourceName} doesn't have a properly formatted row query. Skipping.`
                );
                continue;
            }

            const magnet = extractCssSelector(wakoHtmlParser.url);
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

            ferriteHtmlParser.title = extractCssSelector(wakoHtmlParser.title);

            if (wakoHtmlParser.size) {
                ferriteHtmlParser.size = extractCssSelector(wakoHtmlParser.size);
            }

            if (wakoHtmlParser.seeds || wakoHtmlParser.peers) {
                ferriteHtmlParser.sl = {
                    seeders: extractCssSelector(wakoHtmlParser.seeds)?.query,
                    leechers: extractCssSelector(wakoHtmlParser.peers)?.query
                };
            }

            ferriteSource.htmlParser = ferriteHtmlParser;
        }

        // API parser
        // TODO: Move to a separate function for early returns
        if (wakoSource.json_format) {
            // The API URL is the same as the base URL. Requires manual editing
            const ferriteApiInfo: FerriteApiInfo = { apiUrl: wakoSource.base_url };

            const wakoJsonParser = wakoSource.json_format;
            const ferriteJsonParser: FerriteJsonParser = {
                searchUrl: searchQuery,
                results: wakoJsonParser.results,
                subResults: wakoJsonParser.sub_results
            };

            if (wakoJsonParser.hash) {
                ferriteJsonParser.magnetHash = { query: wakoJsonParser.hash };
            } else if (wakoJsonParser.url) {
                ferriteJsonParser.magnetLink = { query: wakoJsonParser.url };
            } else {
                console.log(`Source ${sourceName} doesn't have a magnet link or hash. Skipping.`);
                continue;
            }

            ferriteJsonParser.title = { query: wakoJsonParser.title };

            if (wakoJsonParser.size) {
                ferriteJsonParser.size = { query: wakoJsonParser.size };
            }

            if (wakoJsonParser.seeds || wakoJsonParser.peers) {
                const ferriteSeedLeech: FerriteSeedLeech = {
                    seeders: wakoJsonParser.seeds,
                    leechers: wakoJsonParser.peers
                };
                ferriteJsonParser.sl = ferriteSeedLeech;
            }

            ferriteSource.api = ferriteApiInfo;
            ferriteSource.jsonParser = ferriteJsonParser;
        }

        finalSources.push(ferriteSource);
    }

    const pluginObject = {
        name: cleanNewlines(wakoManifest?.name ?? "Wako Transcribed plugins (change this)"),
        author: cleanNewlines(wakoManifest?.id?.trim() ?? "Wako to Ferrite converter"),
        sources: finalSources
    };
    const sourceYaml = YAML.stringify(pluginObject);

    await fs.writeFile(options.output, sourceYaml, "utf-8");
}

await main();
