#!/bin/bash

FROM_DATE='3 months ago'
MAX_SIZE=5242880 # 5 megabytes
TOKEN=$(cat $(dirname "$0")/token)

slack() {
    TAIL=$1
    curl -fsSL \
        -H "Authorization: Bearer $TOKEN" \
        -X POST https://slack.com/api/$TAIL
}

listFiles() {
    MORE_PARAMS=$(echo $1 | sed -e 's/^\(.\)/\&\1/')
    FILTER=${2:-true}

    PAGE=1
    while true; do
        RESPONSE=$(slack files.list?page=${PAGE}${MORE_PARAMS})
        echo $RESPONSE | jq -r ".files[] | select(. | $FILTER) | .id"

        PAGES=$(echo $RESPONSE | jq -r '.paging.pages')
        [ "$PAGE" -eq "$PAGES" ] && break
        ((PAGE++))
    done
}

deleteFiles() {
    IDS=( $(cat) )
    SIZE=${#IDS[@]}

    if [ "$SIZE" -eq 0 ]; then
        echo "No files found"
        return
    fi

    echo "Deleting ${#IDS[@]} files"
    for id in "${IDS[@]}"; do
        OK=$(slack files.delete?file=${id} | jq -r '.ok')
        ERROR=$(slack files.delete?file=${id} | jq -r '.error')
        if [ "$OK" = true ]; then
            echo "Deleted $id"
        else
            echo "Failed to delete $id: $ERROR"
        fi
    done
}

echo "Searching for files older than $FROM_DATE"
listFiles ts_to=$(date --date="$FROM_DATE" +%s) | deleteFiles

echo "Searching for files larger than $MAX_SIZE bytes"
listFiles '' ".size > $MAX_SIZE" | deleteFiles
