# Yarn VTools

Miscellaneous tools and plugins for Yarn.

## Plugin: yarn-vtools-plugin

General plugin for functionality too minor to deserve its own package yet.

Setup:
1) Copy the `Packages/yarn-vtools-plugin/Dist` folder, and paste it into your project's `.yarn/plugins` folder, as `yarn-vtools-plugin`.
2) Modify your `.yarnrc.yml` file to contain:
	```
	plugins:
	- .yarn/plugins/yarn-vtools-plugin/index.js
	```
3) Create a `YVTConfig.[js/mjs/cjs]` file in your repo-root (ie. working-directory when running yarn), with a `config` export.

	Example: (see source code for all options, defined using TS interfaces)
	```js
	exports.config = {
		"dependencyOverrideGroups": [...]
	};
	```

### Feature: Conditional version/protocol overrides for dependencies

1) Add info to config:
	```js
	config.dependencyOverrideGroups = [
		{
			// you can change the versions/protocols of direct-dependencies here
			overrides_forSelf: {
				"directDepA": "directDepA@1.0.0",
				"directDepB": "directDepA@^1.0.0",
				"directDepC": "link:../../../@Modules/directDepB"
			},
			// and for nested subdependencies here (not tested much yet)
			overrides_forDeps: {
				"directDepD": {
					dependencies: {"subDepA": "subDepA@1.0.0"},
					peerDependencies: {"subDepB": "subDepB@1.0.0"},
					peerDependenciesMeta: {"subDepB": {"optional": true}}
				}
			}
		},
		// conditional overrides also work; just use javascript/nodejs conditionals like usual
		process.env.MYPROJECT_USER == "bob" && {
			overrides_forSelf: {
				"depA": `link:../../bob's/path/to/depA`
			}
		},
		process.env.MYPROJECT_USER == "alice" && {
			overrides_forSelf: {
				"depA": `link:/alice's/path/to/depA`
			}
		}
	];
	```

2) Profit. Future yarn-installs will run the config-getter script, read the list of overrides, overwrite its in-memory descriptors (ie. protocol, version, etc.) with those found in the overrides list, and then proceed with using those descriptors to install your project's dependencies.