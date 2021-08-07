# Yarn VTools

Miscellaneous tools and plugins for Yarn.

## Tools/Plugins

### yarn-vtools-plugin

General plugin for functionality too minor to deserve its own package yet.

Steps:
1) Copy the `Packages/yarn-vtools-plugin/Dist` folder, and paste it into your project's `.yarn/plugins` folder, as `yarn-vtools-plugin`.
2) Modify your `.yarnrc.yml` file to contain:
```
plugins:
  - .yarn/plugins/yarn-vtools-plugin/index.js
```

Usage:
1) Add configuration information.
1.1) [option 1] Add something like the below to your `package.json`: (see source code for typescript definitions)
```
	"dependencyOverrideGroups": [
		{
			"name": "Bob's dependency overrides",
			"conditions": [{
				"envVarEquals": {"name": "MYPROJECT_USER", "value": "bob"}
				// can also use the "invert" field to invert the condition (ie. have condition pass only if env-var does *not* equal the given value)
				//"envVarEquals": {"invert": true, "name": "MYPROJECT_USER", "value": "bob"}
			}],
			// you can change dependency versions/protocols here
			"overrides_forSelf": {
				"directDepA": "directDepA@1.0.0",
				"directDepB": "directDepA@^1.0.0",
				"directDepC": "link:../../../@Modules/directDepB",
			},
			"overrides_forDeps": {
				"directDepD": {
					"dependencies": {
						"subDepA": "subDepA@1.0.0"
					},
					"peerDependencies": {
						"subDepB": "subDepB@1.0.0"
					},
					"peerDependenciesMeta": {
						"subDepB": {"optional": true},
					}
				}
			}
		}
	],
```
1.2) [option 2] Create a `YVTConfig.[js/mjs/cjs]` file, with a `config` export. Example:
```
exports.config = {
	"dependencyOverrideGroups":
		process.env.MYPROJECT_USER == "bob" ? [...] :
		process.env.MYPROJECT_USER == "alice" ? [...] :
		[],
};
```
2) Profit. Future yarn-installs will use the listed overrides for installing the dependencies.