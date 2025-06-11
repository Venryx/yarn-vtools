import fs from 'fs'
import paths from 'path'
import type {
    Hooks as CoreHooks, Plugin,
    PackageExtensionData, Configuration,
    Descriptor,
    IdentHash,
    Package
} from '@yarnpkg/core'
import { structUtils } from '@yarnpkg/core'
import type { Hooks as PatchHooks } from '@yarnpkg/plugin-patch'
import { createRequire } from 'node:module'

interface Group {
    name?: string
    overrides_forSelf?: { [key: string]: string }
    overrides_forDeps?: { [key: string]: PackageExtensionData }
    omitPriorDeps_auto?: boolean;
	omitPriorDeps_manual?: string[];
}

let groups: Group[];
// overrides_forSelf indexed by the package's scope
const overridesForSelfByScope: Map<string, { [key: string]: string }> = new Map();

const plugin: Plugin<CoreHooks & PatchHooks> = {
    hooks: {
        registerPackageExtensions: async (configuration, registerPackageExtension) => {
            groups = getGroups(configuration);
            const regularDepsToOmit_byParentPackIdentHash = new Map<IdentHash, IdentHash[]>();

            for (const group of groups) {
                if (!group) continue;

                // set default field values
                group.omitPriorDeps_auto = group.omitPriorDeps_auto ?? true;

                console.log(`Preparing overrides group "${group.name}"...`);

                // most common case, of overriding the versions/protocols of project direct-dependencies
                // (note: lacks some options that overrides_forDeps provides, like overrides for peer-deps)
                for (const [depName, depVersion] of Object.entries(
                    group.overrides_forSelf ?? []
                )) {
                    const { scope, name } = structUtils.parseDescriptor(depName);
                    let overrides = overridesForSelfByScope.get(scope ?? '');
                    if (!overrides) {
                        overrides = {};
                        overridesForSelfByScope.set(scope ?? '', overrides);
                    }
                    overrides[name] = depVersion;
                }

                for (const [packageDescriptor, packageOverrides] of Object.entries(
                    group.overrides_forDeps ?? []
                )) {
                    const descriptor = structUtils.parseDescriptor(packageDescriptor, true);
                    registerPackageExtension(descriptor, packageOverrides);
                
                    const allPackageOverrides_identHashes: IdentHash[] = [
                        ...group.omitPriorDeps_auto ? Object.keys(packageOverrides.dependencies ?? {}).map(DepNameToIdentHash) : [],
                        ...group.omitPriorDeps_auto ? Object.keys(packageOverrides.peerDependencies ?? {}).map(DepNameToIdentHash) : [],
                        ...group.omitPriorDeps_manual ? Object.keys(group.omitPriorDeps_manual).map(DepNameToIdentHash) : [],
                    ];
                    regularDepsToOmit_byParentPackIdentHash.set(descriptor.identHash, allPackageOverrides_identHashes);
                }
                
                function DepNameToIdentHash(name: string) {
                    return structUtils.parseDescriptor(`${name}@*`, true).identHash;
                }
                function FindNameForIdentHash(identHash: string, deps: Map<IdentHash, Descriptor>) {
                    const entry = Array.from(deps.entries()).find(([key, value])=>value.identHash == identHash);
                    if (entry == null) return `[could not find name for ident-hash: ${identHash}]`;
                    return entry[1].name;
                }

                // override normalizePackage func to ignore dependencies with same names as overrides, so the overrides are always applied
                // for ref, see: https://github.com/yarnpkg/berry/blob/6b00c65e4afbfa966a6dc4f8b7c564fcd141709e/packages/yarnpkg-core/sources/Configuration.ts#L1887
                const normalizePackage_orig = configuration.normalizePackage;
                configuration.normalizePackage = function(pkg: Package, ...otherArgs) {
                    const pkg_copy = {...pkg};

                    function OmitDepEntriesWithIdentHashMatching(deps: Map<IdentHash, Descriptor>, depsToOmit: string[]) {
                        const entries_filtered = Array.from(deps.entries()).filter(([key, value])=>{
                            //if (depsToOmit.includes(value.identHash)) console.log("Omitting dep from pkg.dependencies, since has override:", value.name);
                            return !depsToOmit.includes(value.identHash);
                        });
                        return new Map<IdentHash, Descriptor>(entries_filtered);
                    }

                    if (regularDepsToOmit_byParentPackIdentHash.has(pkg.identHash)) {
                        const priorDepsToOmit_forThisPkg = regularDepsToOmit_byParentPackIdentHash.get(pkg.identHash)!;
                        const depsAndPeerDeps = new Map<IdentHash, Descriptor>([...pkg.dependencies, ...pkg.peerDependencies]);
                        console.log("Omitting prior deps (so overrides will apply) for:", pkg.name, "\nDeps to omit/override:", priorDepsToOmit_forThisPkg.map(a=>FindNameForIdentHash(a, depsAndPeerDeps)).join(","));
                        pkg_copy.dependencies = OmitDepEntriesWithIdentHashMatching(pkg.dependencies, priorDepsToOmit_forThisPkg);
                        pkg_copy.peerDependencies = OmitDepEntriesWithIdentHashMatching(pkg.peerDependencies, priorDepsToOmit_forThisPkg);
                    }

                    const pkg_result = normalizePackage_orig.call(this, pkg_copy, ...otherArgs);
                    return pkg_result;
                };
            }
        },

        reduceDependency: async (
            dependency,
        ) => {
            const overrides = overridesForSelfByScope.get(dependency.scope ?? '');
            const depVersion = overrides?.[dependency.name];
            if (depVersion) {
                return {
                    ...dependency,
                    range: depVersion,
                };
            }
            return dependency;
        },
    },
}

function getGroups(configuration: Configuration) {
    const projectFolder = configuration
        .projectCwd!.replace(/\\/g, '/')
        .replace('/C:/', 'C:/');
    const packageJSONPath = paths.join(
        projectFolder,
        'package.json'
    );
    const packageJSONText = fs
        .readFileSync(packageJSONPath)
        .toString();
    const packageJSONObj = JSON.parse(packageJSONText);

    const yvtConfigPaths = [
        paths.join(projectFolder, 'YVTConfig.js'),
        paths.join(projectFolder, 'YVTConfig.cjs'),
    ];
    const yvtConfigPath = yvtConfigPaths.find((a) =>
        fs.existsSync(a)
    );
    if (yvtConfigPath) {
        console.log(
            'Yarn-plugin-vtools starting. Config found at:',
            yvtConfigPath
        );
        const require_node = createRequire(projectFolder);
        const yvtConfigFileExports = require_node(yvtConfigPath);
        const yvtConfigObj = yvtConfigFileExports.config;
        return yvtConfigObj.dependencyOverrideGroups;
    } else if (
        packageJSONObj.dependencyOverrideGroups != null
    ) {
        console.log(
            'Yarn-plugin-vtools starting. Config found in:',
            packageJSONPath
        );
        return packageJSONObj.dependencyOverrideGroups as Group[];
    } else {
        if (fs.existsSync(paths.join(projectFolder, 'YVTConfig.mjs'))) {
            throw Error('ES import/export syntax is not currently supported. '
                + 'Please create a YVTConfig.js or YVTConfig.cjs file instead of an .mjs file.');
        }

        console.log(
            'Yarn-plugin-vtools could not find config info, in project folder:',
            projectFolder
        );
        return [];
    }
}

export default plugin
