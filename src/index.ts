import * as aws from 'aws-sdk';
import { fromSSO } from '@aws-sdk/credential-provider-sso';
import * as core from '@actions/core';
import compress from 'compressing';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

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
                .on('end', () => {
                    core.notice('Fetching Complete', file.Key);
                    resolve({});
                })
                .pipe(tempFile);
        });
    });
    return Promise.allSettled(writeFile);
};

const getSingleFile = async (bucketName, file) => {
    const s3 = await getS3Bucket();
    const params = {
        Bucket: bucketName,
        MaxKeys: 1,
    };

    return new Promise((resolve) => {
        core.notice(`Fetching: ${file}`);
        const tempFileName = path.join('./', file.split('/')[1]);
        const tempFile = fs.createWriteStream(tempFileName);
        s3.getObject({ Bucket: params.Bucket, Key: file })
            .createReadStream()
            .on('end', () => {
                core.notice(`Fetching: ${file} completed`);
                resolve({});
            })
            .pipe(tempFile);
    });
};

const buildPackages = async (senchaVersion) => {
    const splitByPrefix = senchaVersion.split('/');
    const version = splitByPrefix[splitByPrefix.length - 1]
        .replace('extjs-', '')
        .replace('.tgz', '');
        
    return new Promise((resolve) => {
        var ls = spawn('docker', [
            'build',
            '-t',
            'enterprise-app',
            '--build-arg',
            `senchaVersion=${version}`,
            '--output',
            './build',
            '.',
        ]);

        ls.stdout.on('data', function (data) {
            console.log('stdout: ' + data.toString());
        });

        ls.stderr.on('data', function (data) {
            console.log('stderr: ' + data.toString());
        });
        ls.on('exit', function () {
            compress.tgz
                .compressDir('./build', './build_files.tgz')
                .then(() => {
                    resolve({});
                });
        });
    });
};

export const main = async () => {
    try {
        const buildFiles = core
            .getInput('build-files', { required: false })
            .split('/');

        const SdkBucket = core.getInput('sdk-bucket');
        const buildSdkPrefix = core.getInput('sdk-prefix-with-file');

        //build bucket and prefix
        const buildFilesbucketName = buildFiles[0];
        const buildFilesprefix = buildFiles[1];

        const theDataFiles = await getS3FilesList(
            buildFilesbucketName,
            buildFilesprefix
        );

        core.notice('Downloading required build files');
        await getFiles(buildFilesbucketName, theDataFiles);

        // get theSDK
        core.notice('Downloading SDK');
        await getSingleFile(SdkBucket, buildSdkPrefix);

        core.notice('Building App');
        await buildPackages(buildSdkPrefix);
    } catch (error) {
        core.setFailed(error.message);
    }
};

/* istanbul ignore next */
if (require.main === module) {
    main();
}
