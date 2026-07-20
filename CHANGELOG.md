# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.0.0](https://github.com/magiqsoftware/enterprise-frontend-action/compare/1.0.8...2.0.0) (2026-07-21)

### ⚠️ BREAKING CHANGES

- The action now runs on the **Node 24** runtime (previously Node 16). Runners must support Node 24.
- S3 access is migrated from the AWS SDK v2 to the modular AWS SDK v3.

### Features

- switch action runtime to Node 24 ([#8](https://github.com/magiqsoftware/enterprise-frontend-action/pull/8))
- migrate S3 access from `aws-sdk` v2 to AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/lib-storage`) ([#20](https://github.com/magiqsoftware/enterprise-frontend-action/pull/20))
- bump `@actions/core` to 3.0.1 ([#21](https://github.com/magiqsoftware/enterprise-frontend-action/pull/21))
- migrate ESLint to v10 flat config with `typescript-eslint` ([#16](https://github.com/magiqsoftware/enterprise-frontend-action/pull/16))

### Bug Fixes

- remove the `url.parse()` / DEP0169 deprecation warning by migrating off `aws-sdk` v2 ([#20](https://github.com/magiqsoftware/enterprise-frontend-action/pull/20))
- eliminate the `xml2js` prototype-pollution vulnerability (CVE-2023-0842) carried by `aws-sdk` v2 ([#20](https://github.com/magiqsoftware/enterprise-frontend-action/pull/20))
- guard against an empty S3 listing throwing on `data.Contents` ([#20](https://github.com/magiqsoftware/enterprise-frontend-action/pull/20))
- drop the unused `aws-crt` and `build` dependencies ([#19](https://github.com/magiqsoftware/enterprise-frontend-action/pull/19), [#20](https://github.com/magiqsoftware/enterprise-frontend-action/pull/20))
