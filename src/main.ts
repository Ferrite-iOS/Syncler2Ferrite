import YAML from 'yaml';
import { promises as fs } from 'fs';
import {
    FerriteSource,
    FerriteHtmlParser,
    FerriteJsonParser,
    FerriteSeedLeech,
    FerriteApiInfo,
    FerriteComplexQuery
} from './interfaces/Ferrite.js';
import { WakoList, WakoCategory, WakoSource } from './interfaces/Wako.js';

function extractCssSelector(input: string) {
    const queryPattern = /querySelector\('([^']+)'\)/;
    const queryAllPattern = /querySelectorAll\('([^']+)'\)/;
    const attributePattern = /getAttribute\('([^']+)'\)/;

    const queryMatch = queryPattern.exec(input);
    const queryAllMatch = queryAllPattern.exec(input);

    if (!(queryMatch || queryAllMatch)) {
        return
    }

    const queryResult = queryMatch?.[1] ?? queryAllMatch?.[1];

    if (!queryResult) {
        return;
    }

    let complexQuery: FerriteComplexQuery = {
        query: queryResult
    };

    if (!input.endsWith('textContent')) {
        const attributeMatch = attributePattern.exec(input);
        const attributeName = attributeMatch?.[1];
        complexQuery.attribute = attributeName;
    }

    return complexQuery;
}

async function main() {
    const finalSources: Array<FerriteSource> = [];
    const inputText = await fs.readFile('wako_input.json', 'utf-8');
    const inputJson: WakoList = JSON.parse(inputText);
    for (const sourceName of Object.keys(inputJson)) {
        const sourceOptions = inputJson[sourceName];

        let ferriteSource: FerriteSource = {
            name: sourceOptions.name,
            version: 1,
            minVersion: '0.7.2',
            website: sourceOptions.base_url
        };

        let searchQuery = '';
        const searchUrlKeys: Array<keyof WakoSource> = ['movie', 'episode', 'season', 'anime'];
        for (const key of searchUrlKeys) {
            if (searchQuery) {
                break;
            }

            const category = sourceOptions[key] as WakoCategory | undefined;
            searchQuery = category?.query ?? '';
        }

        // HTML parser
        if (sourceOptions.html_parser) {
            const wakoHtmlParser = sourceOptions.html_parser;

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
            ferriteHtmlParser.size = extractCssSelector(wakoHtmlParser.size);

            ferriteHtmlParser.sl = {
                seeders: extractCssSelector(wakoHtmlParser.seeds)?.query,
                leechers: extractCssSelector(wakoHtmlParser.peers)?.query
            };

            ferriteSource.htmlParser = ferriteHtmlParser;
        }

        // API parser
        // TODO: Move to a separate function for early returns
        if (sourceOptions.json_format) {
            // The API URL is the same as the base URL. Requires manual editing
            const ferriteApiInfo: FerriteApiInfo = { apiUrl: sourceOptions.base_url };

            const wakoJsonParser = sourceOptions.json_format;
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

            const ferriteSeedLeech: FerriteSeedLeech = {
                seeders: wakoJsonParser.seeds,
                leechers: wakoJsonParser.peers
            };
            ferriteJsonParser.sl = ferriteSeedLeech;

            ferriteJsonParser.size = { query: wakoJsonParser.size };

            ferriteSource.api = ferriteApiInfo;
            ferriteSource.jsonParser = ferriteJsonParser;
        }

        finalSources.push(ferriteSource);
    }

    const pluginObject = {
        name: 'Wako Transcribed plugins (change this)',
        author: 'Your name here!',
        sources: finalSources
    };
    const sourceYaml = YAML.stringify(pluginObject);
    await fs.writeFile('ferriteOutput.yml', sourceYaml, 'utf-8');
}

await main();
