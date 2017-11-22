const axios = require('axios');
const {stringify: qs} = require('querystring');
const {getTime, subYears} = require('date-fns');
const {token} = require('./token');

const client = axios.create({
    baseURL: 'https://slack.com/api/',
    headers: {
        'Authorization': `Bearer ${token}`
    }
});

// Change this to change starting time
function fromTime() {
    return subYears(new Date(), 1);
}

// Change this to prevent deletion of certain files
function fileFilter(file) {
    return true;
}

function dateToSec(date) {
    const ms = getTime(date);
    return Math.floor(ms / 1000);
}

async function fetchFileIds(from, page = 1) {
    const {data} = await client.post(
        'files.list',
        qs({
            ts_to: dateToSec(from),
            page
        })
    );

    const pages = data.paging.pages;
    console.log(`Fetched page ${page} of ${pages}`);

    const ids = data.files
        .filter(fileFilter)
        .map(({id}) => id);

    if (page < pages) {
        const nextIds = await fetchFileIds(from, page + 1);
        return ids.concat(nextIds);
    }
    return ids;
}

async function deleteFiles(ids) {
    console.log(`Deleting ${ids.length} files`);
    const requests = ids.map((file) => {
        return client.post(
            'files.delete',
            qs({
                file
            })
        ).then(({data: {ok}}) => {
            if (ok) {
                console.log(`Deleted ${file}`);
            }
        });
    });
    return Promise.all(requests);
}

async function run() {
    const from = fromTime();
    console.log(`Fetching records older than ${from}`);
    const idsToDelete = await fetchFileIds(from);
    await deleteFiles(idsToDelete);
    console.log('Done');
}

run();
