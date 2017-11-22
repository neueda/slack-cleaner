const axios = require('axios');
const {stringify: qs} = require('querystring');
const {getTime, subMonths} = require('date-fns');
const {token} = require('./token');

const client = axios.create({
    baseURL: 'https://slack.com/api/',
    headers: {
        'Authorization': `Bearer ${token}`
    }
});

async function listFiles(params = {}, filter = () => true, page = 1) {
    const {data} = await client.post('files.list', qs(Object.assign({page}, params)));

    if (data.files.length === 0) {
        return [];
    }

    const pages = data.paging.pages;
    console.log(`Fetched page ${page} of ${pages}`);

    const ids = data.files
        .filter(filter)
        .map(({id}) => id);

    if (page < pages) {
        const nextIds = await listFiles(params, filter, page + 1);
        return ids.concat(nextIds);
    }
    return ids;
}

async function deleteOldFiles(from) {
    console.log(`Searching for files older than ${from}`);
    const timestamp = Math.floor(getTime(from) / 1000);
    const files = await listFiles({ts_to: timestamp});
    if (files.length > 0) {
        await deleteFiles(files);
    } else {
        console.log('No files found');
    }
}

async function deleteLargeFiles(maxSize) {
    console.log(`Searching for files larger than ${maxSize} bytes`);
    const files = await listFiles({}, ({size}) => size > maxSize);
    if (files.length > 0) {
        await deleteFiles(files);
    } else {
        console.log('No files found');
    }
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
    const from = subMonths(new Date(), 3); // 3 months ago
    await deleteOldFiles(from);

    const maxSize = 5 * 1024 * 1024; // 5 megabytes
    await deleteLargeFiles(maxSize);
}

run();
