FROM 738608577325.dkr.ecr.ap-southeast-2.amazonaws.com/enterprise-packages-build:2.3.9 AS build


RUN sencha repo add magiq https://sencha.devops.magiq.cloud/release/ &&\
    sencha repo add magiq-beta https://sencha.devops.magiq.cloud/pre-release/

COPY sencha.cfg /opt/Sencha/Cmd/repo/.sencha/repo/remotes/magiq/sencha.cfg
COPY sencha-beta.cfg /opt/Sencha/Cmd/repo/.sencha/repo/remotes/magiq-beta/sencha.cfg

ARG sencha-version
ENV PACKAGE $sencha-version

WORKDIR /frontend

ADD . /frontend

RUN sencha app install --framework=/frontend/${PACKAGE}
