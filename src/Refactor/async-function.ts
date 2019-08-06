'use strict';

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

module.exports = AsyncFunction;
