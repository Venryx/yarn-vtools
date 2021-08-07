import { Resolver, ResolveOptions, MinimalResolveOptions } from "@yarnpkg/core";
import { Descriptor, Locator, Package } from "@yarnpkg/core";
export declare class VResolver implements Resolver {
    supportsDescriptor(descriptor: Descriptor): boolean;
    supportsLocator(locator: Locator): boolean;
    shouldPersistResolution(): boolean;
    bindDescriptor(descriptor: Descriptor): Descriptor;
    getResolutionDependencies(descriptor: Descriptor, opts: MinimalResolveOptions): Descriptor[];
    getCandidates(descriptor: Descriptor, dependencies: unknown, opts: ResolveOptions): Promise<Locator[]>;
    getSatisfying(): Promise<null>;
    resolve(locator: Locator, opts: ResolveOptions): Promise<Package>;
}
