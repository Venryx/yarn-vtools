"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VResolver = void 0;
const core_1 = require("@yarnpkg/core");
class VResolver {
    supportsDescriptor(descriptor) {
        return false;
    }
    supportsLocator(locator) {
        return false;
    }
    shouldPersistResolution() {
        return false;
    }
    bindDescriptor(descriptor) {
        return descriptor;
    }
    getResolutionDependencies(descriptor, opts) {
        return [];
    }
    async getCandidates(descriptor, dependencies, opts) {
        return [];
    }
    async getSatisfying() {
        return null;
    }
    async resolve(locator, opts) {
        const hash = null;
        return {
            ...locator,
            version: `0.0.0-condition-${hash}`,
            languageName: opts.project.configuration.get("defaultLanguageName"),
            linkType: core_1.LinkType.HARD,
            dependencies: new Map([]),
            peerDependencies: new Map(),
            dependenciesMeta: new Map(),
            peerDependenciesMeta: new Map(),
            //bin: null,
            bin: new Map(),
        };
    }
}
exports.VResolver = VResolver;
