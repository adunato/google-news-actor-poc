# Google News Actor POC

Search Google News with one or more expressions and collect structured metadata from the results in an Apify dataset. This proof of concept is intended for small, bounded searches and programmatic evaluation.

## Input

Provide an object with a `queries` array. It must contain 1 to 20 non-empty search expressions. The Actor trims surrounding whitespace from query strings.

| Field              | Type             | Default   | Bounds or supported values                                                   |
| ------------------ | ---------------- | --------- | ---------------------------------------------------------------------------- |
| `queries`          | array of strings | Required  | 1–20 non-empty expressions                                                   |
| `maxItemsPerQuery` | integer          | `20`      | 1–100 results per query                                                      |
| `language`         | string           | `"en-US"` | Google News language/locale code                                             |
| `country`          | string           | `"US"`    | Google News country/edition code                                             |
| `dateRange`        | string           | `"7d"`    | `"any"`, `"1h"`, `"6h"`, `"1d"`, `"7d"`, or `"30d"`                          |
| `dedupe`           | boolean          | `true`    | When enabled, keeps the first result for each Google News URL across queries |

Example input:

```json
{
  "queries": ["renewable energy", "climate policy"],
  "maxItemsPerQuery": 10,
  "language": "en-US",
  "country": "US",
  "dateRange": "7d",
  "dedupe": true
}
```

## Output

Each result is written as a record to the run's default dataset. Required fields are:

| Field           | Description                                      |
| --------------- | ------------------------------------------------ |
| `query`         | Search expression that produced the result       |
| `title`         | Result title from Google News                    |
| `sourceName`    | Publisher or source name reported by Google News |
| `googleNewsUrl` | Google News result URL                           |
| `publishedAt`   | Publication timestamp provided by Google News    |
| `position`      | Result position within the query result set      |
| `language`      | Language/locale used for the search              |
| `country`       | Country/edition used for the search              |
| `scrapedAt`     | Timestamp when the metadata was collected        |

These fields are included when available in the feed:

- `sourceUrl`: source URL included in the Google News feed; it is not guaranteed to be a canonical publisher URL.
- `descriptionText`: result description.
- `guid`: source feed identifier.

The output schema and a table view are defined for the dataset. After a run, open its default dataset in Apify Console, or use the dataset items URL from the run output. For example, with the Apify API:

```text
GET https://api.apify.com/v2/datasets/{datasetId}/items?clean=true&format=json
```

Authenticate using an Apify API token in your API client. Treat tokens as secrets; do not put them in shared input examples or commit them to this repository. Apify's normal dataset exports and integrations are also available.

## Limits

- Results depend on Google News feed availability, ranking, and the metadata it provides. Coverage is not exhaustive and ranking is not deterministic.
- `dateRange` is a recency filter; it does not promise complete historical coverage.
- The Actor returns Google News result links and metadata. It does not resolve canonical publisher URLs or retrieve article bodies, images, or other page content.
- This is a bounded single-source proof of concept, not a monitoring service or production-hardened news platform.

## Local build smoke check

Prerequisites: Node.js 20 or later and npm 10 or later.

From a clean checkout, install the lockfile dependencies and run the package smoke check:

```sh
npm ci
npm run actor:smoke
```

The smoke check compiles the TypeScript Actor and verifies that the entry point and files referenced by `.actor/actor.json` are present and valid JSON. This check does not contact Apify or Google News and does not require an Apify account.

## Deploy to Apify

To upload and build the Actor on Apify, install the Apify CLI and authenticate with an account that can create or update the Actor:

The npm installation of Apify CLI requires Node.js 22 or later. The Actor itself supports Node.js 20 or later for local build checks.

```sh
npm install --global apify-cli
apify login
apify push
```

Run these commands from this repository directory. `apify push` uses the name and version in `.actor/actor.json`, uploads the source, and starts a platform build. Authentication is stored by the CLI in your user profile; never commit credentials. A successful build is required before a cloud run. This repository setup does not publish the Actor in the Store or configure billing.

The approved temporary PoC pay-per-event proposal is $0.001 per dataset result plus the applicable Actor-start event. This is temporary PoC configuration only; it is not a production pricing commitment. Verify the Store and billing settings separately before any paid launch.

## Development

Run all repository checks with:

```sh
npm run validate
```
