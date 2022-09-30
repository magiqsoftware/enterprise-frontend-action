import * as core from '@actions/core';

export const cleanup = async () => {
    try {
        const buildOutputFolder = core.getInput('build-folder');
        core.notice(`The build artifact is ${buildOutputFolder}`);
        core.notice(`The build artifact is latest.tgz`);
    } catch (error) {
        core.setFailed(error.message);
    }
};

/* istanbul ignore next */
if (require.main === module) {
    cleanup();
}
