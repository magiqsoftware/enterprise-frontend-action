import * as aws from 'aws-sdk';
import { fromSSO } from '@aws-sdk/credential-provider-sso';
import * as core from '@actions/core';
import fs from 'fs';
import path from 'path';

var credentials = null;
const repo = process.env['GITHUB_REPOSITORY'];

const getS3Bucket = async () => {
    if (!repo) {
        // if you are using sso
        credentials = await fromSSO({ profile: process.argv[2] })();
        return new aws.S3({ credentials });
    } else {
        return new aws.S3();
    }
};

const getS3FilesList = async (bucketName, prefix) => {
    const s3 = await getS3Bucket();
    const params = {
        Bucket: bucketName,
        MaxKeys: 10,
        Prefix: prefix,
    };
    return new Promise((resolve) => {
        s3.listObjects(params, (err, data) => {
            const filteredWithPrefix = data.Contents.filter(
                (i) => i.Key !== prefix + '/'
            ); // so that it does not try to fetch the prefix itself
            resolve(filteredWithPrefix);
        });
    });
};

const getFiles = async (bucketName, filesList) => {
    const s3 = await getS3Bucket();
    const params = {
        Bucket: bucketName,
        MaxKeys: 10,
    };
    const writeFile = filesList.map((file) => {
        return new Promise((resolve) => {
            core.notice('Fetching', file.Key);
            const tempFileName = path.join('./', file.Key.split('/')[1]);
            const tempFile = fs.createWriteStream(tempFileName);
            s3.getObject({ Bucket: params.Bucket, Key: file.Key })
                .createReadStream()
                .pipe(tempFile);

            core.notice('Fetching Complete', file.Key);
            resolve({});
        });
    });
    return Promise.allSettled(writeFile);
};

export const main = async () => {
    try {
        const buildFiles = core
            .getInput('build-files', { required: false })
            .split('/');
        //build bucket and prefix
        const bucketName = buildFiles[0];
        const prefix = buildFiles[1];

        const theDataFiles = await getS3FilesList(bucketName, prefix);
        core.notice('Downloading required build files');
        await getFiles(bucketName, theDataFiles);
    } catch (error) {
        core.setFailed(error.message);
    }
};

/* istanbul ignore next */
if (require.main === module) {
    main();
}
