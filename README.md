# Syncler2Ferrite

A converter between [Syncler Express](https://support.syncler.net/develop/source-provider-package/express) (and Wako's helios addon) lists to Ferrite's Plugin lists

## Disclaimer

This project is used for automated conversion between Syncler providers and Ferrite plugins. Running this script does not mean that every source will work. Please test the auto-generated sources in Ferrite before publishing them.

## Getting Started

Since Syncler2Ferrite uses TypeScript, [NodeJS](https://nodejs.org/en) must be installed.

### Steps
1. Clone this repository
2. Open a terminal and run `npm install --dev`
3. Place your Syncler/Wako list in the project directory
4. Run `npm run build && npm run start --input <syncler_list>.ext` (ext can be any text format. Preferrably json)
5. The autogenerated plugin list should be located in `ferriteOutput.yml`

For all other arguments, run `npm run start --help`.

## Developers and Permissions

Creator/Developer: kingbri

Developer Discord: kingbri

Join the support discord here: [Ferrite Discord](https://discord.gg/sYQxnuD7Fj)
