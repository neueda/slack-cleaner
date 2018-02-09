# Slack Cleaner

Old files belong in the trash. :wastebasket:

Use this script to truncate Slack storage when your workspace is over its storage limit.

## Prerequisites

Install through your preferred package manager:

- `bash`
- `curl`
- `jq`
- `sed`

## Usage

1. Create a token file:
   ```
   cp token.example token
   ```
1. Edit `token` and add [your token](https://api.slack.com/custom-integrations/legacy-tokens).
1. Look through `cleaner.sh` and adjust as needed.
1. Run:
   ```
   ./cleaner.sh
   ```
