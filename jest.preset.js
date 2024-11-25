const nxPreset = require('@nx/jest/preset').default;

const config = {
    coverageReporters: ['lcovonly']
}

module.exports = { ...nxPreset, ...config };
