import {Resolver, ResolveOptions, LinkType, IdentHash, MinimalResolveOptions} from "@yarnpkg/core";
import {Descriptor, Locator, Package} from "@yarnpkg/core";

export class VResolver implements Resolver {
	supportsDescriptor(descriptor: Descriptor) {
		return false;
	}
	supportsLocator(locator: Locator) {
		return false;
	}
	shouldPersistResolution() {
		return false;
	}
	bindDescriptor(descriptor: Descriptor): Descriptor {
		return descriptor;
	}
	getResolutionDependencies(descriptor: Descriptor, opts: MinimalResolveOptions): Descriptor[] {
		return [];
	}
	async getCandidates(descriptor: Descriptor, dependencies: unknown, opts: ResolveOptions): Promise<Locator[]> {
		return [];
	}
	async getSatisfying() {
		return null;
	}

	async resolve(locator: Locator, opts: ResolveOptions): Promise<Package> {
		const hash = null;
		return {
			...locator,
			version: `0.0.0-condition-${hash}`,
			languageName: opts.project.configuration.get("defaultLanguageName"),
			linkType: LinkType.HARD,
			dependencies: new Map([]),
			peerDependencies: new Map(),
			dependenciesMeta: new Map(),
			peerDependenciesMeta: new Map(),
			//bin: null,
			bin: new Map(),
		};
	}
}