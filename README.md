# **enterprise-frontend-action**
Definition of actions required to build the frontend artifacts

## **Required Parameters**
- `sdk-prefix-with-file` _Sencha SDK version_
- `sdk-bucket` _Where the SDK's are located_
- `build-files` _Required build files_
- `artifact-bucket` _Location where the artifacts will be pushed to_
- `artifact-prefix` _The prefix location of the bucket_

## **OptionalParameters**
- `build-folder` _What folder do you want the output to be in (default: build)_
- `environment-build` _Is a production build (default: dev)_