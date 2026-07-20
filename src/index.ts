import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { fromSSO } from '@aws-sdk/credential-provider-sso';
import * as core from '@actions/core';
import compress from 'compressing';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { Readable } from 'stream';

let credentials = null;
const repo = process.env['GITHUB_REPOSITORY'];

export const setInput = (name, value) =>
  (process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] = value);

const getS3Bucket = async () => {
  if (repo) {
    return new S3Client({});
  }
  credentials = await fromSSO({ profile: process.argv[2] })();
  return new S3Client({ credentials });
};

export const getS3FilesList = async (bucketName, prefix) => {
  const s3 = await getS3Bucket();
  const data = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 10,
      Prefix: prefix,
    }),
  );
  // so that it does not try to fetch the prefix itself
  return (data.Contents ?? []).filter((i) => i.Key !== prefix + '/');
};

export const getFiles = async (bucketName, filesList) => {
  const s3 = await getS3Bucket();
  const writeFile = filesList.map(async (file) => {
    core.notice(`Fetching ${file.Key}`);
    const tempFileName = path.join('./', file.Key.split('/')[1]);
    const tempFile = fs.createWriteStream(tempFileName);
    const { Body } = await s3.send(
      new GetObjectCommand({ Bucket: bucketName, Key: file.Key }),
    );
    await new Promise((resolve, reject) => {
      (Body as Readable)
        .on('error', reject)
        .pipe(tempFile)
        .on('finish', () => {
          core.notice(`Fetching Complete ${file.Key}`);
          resolve({});
        })
        .on('error', reject);
    });
  });
  return Promise.allSettled(writeFile);
};

export const getSingleFile = async (bucketName, file) => {
  const s3 = await getS3Bucket();
  core.notice(`Fetching: ${file}`);
  const tempFileName = path.join('./', file.split('/')[1]);
  const tempFile = fs.createWriteStream(tempFileName);
  const { Body } = await s3.send(
    new GetObjectCommand({ Bucket: bucketName, Key: file }),
  );
  return new Promise((resolve, reject) => {
    (Body as Readable)
      .on('error', reject)
      .pipe(tempFile)
      .on('finish', () => {
        core.notice(`Fetching: ${file} completed`);
        resolve({});
      })
      .on('error', reject);
  });
};

export const buildPackages = async (
  senchaVersion,
  epaPrefix,
  buildOutputFolder,
  enviro,
) => {
  const splitByPrefix = senchaVersion.split('/');
  const version = splitByPrefix[splitByPrefix.length - 1]
    .replace('extjs-', '')
    .replace('.tgz', '');

  const dockerFile =
    (enviro == 'prod' ? 'Dockerfile-Prod' : 'Dockerfile-Dev') +
    (epaPrefix == '' ? '' : '-epa');

  return new Promise((resolve) => {
    const ls = spawn('docker', [
      'build',
      '-t',
      'enterprise-app',
      '--build-arg',
      `senchaVersion=${version}`,
      '--output',
      `./${buildOutputFolder}`,
      `-f`,
      `${dockerFile}`,
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
        .compressDir(`./${buildOutputFolder}`, `./${buildOutputFolder}.tgz`, {
          ignoreBase: true,
        })
        .then(() => {
          resolve({});
        })
        .catch(() => {
          core.setFailed('Failed to build');
        });
    });
  });
};

export const uploadToS3 = async (bucket, artifactLocation, buildFileName) => {
  const s3 = await getS3Bucket();

  const fileStream = fs.createReadStream(`./${buildFileName}.tgz`);
  await new Upload({
    client: s3,
    params: {
      Bucket: bucket,
      Key: `${artifactLocation}/${buildFileName}.tgz`,
      Body: fileStream,
    },
  }).done();

  const latest = fs.createReadStream(`./${buildFileName}.tgz`);
  await new Upload({
    client: s3,
    params: {
      Bucket: bucket,
      Key: `${artifactLocation}/latest.tgz`,
      Body: latest,
    },
  }).done();

  return {};
};

export const main = async () => {
  try {
    const buildFiles = core
      .getInput('build-files', { required: false })
      .split('/');
    const SdkBucket = core.getInput('sdk-bucket');
    const epaPrefix = core.getInput('epa-prefix-with-file');
    const buildSdkPrefix = core.getInput('sdk-prefix-with-file');
    const artifactBucket = core.getInput('artifact-bucket');
    const artifactPrefix = core.getInput('artifact-prefix');
    const buildOutputFolder = core.getInput('build-folder');
    const enviro = core.getInput('environment-build');

    //build bucket and prefix
    const buildFilesbucketName = buildFiles[0];
    const buildFilesprefix = buildFiles[1];

    const theDataFiles = await getS3FilesList(
      buildFilesbucketName,
      buildFilesprefix,
    );

    core.notice('Downloading required build files');
    await getFiles(buildFilesbucketName, theDataFiles);

    // get theSDK
    core.notice('Downloading SDK');
    await getSingleFile(SdkBucket, buildSdkPrefix);
    if (epaPrefix.trim() != '') {
      await getSingleFile(SdkBucket, epaPrefix);
    }

    // build the app
    core.notice('Building App');
    await buildPackages(buildSdkPrefix, epaPrefix, buildOutputFolder, enviro);

    // push to the bucket
    await uploadToS3(artifactBucket, artifactPrefix, buildOutputFolder);
  } catch (error) {
    core.setFailed(error.message);
  }
};

/* istanbul ignore next */
if (require.main === module) {
  main();
}
