import {ConfigurationDefinitionMap, Plugin} from "@yarnpkg/core";
import {VResolver} from "./Resolver";

export {plugin as default};

const config: Partial<ConfigurationDefinitionMap> = {};

const plugin: Plugin = {
	configuration: config,
	commands: [],
	fetchers: [],
	resolvers: [VResolver],
	hooks: {},
};