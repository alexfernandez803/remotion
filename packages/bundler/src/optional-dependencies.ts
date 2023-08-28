// When Webpack cannot resolve these dependencies, it will not print an error message.

import type {Compiler} from 'webpack';

const OPTIONAL_DEPENDENCIES = [
	'zod',
	'@remotion/zod-types',
	'react-native-reanimated',
	'react-native-reanimated/package.json',
];

export class AllowOptionalDependenciesPlugin {
	filter(error: Error) {
		for (const dependency of OPTIONAL_DEPENDENCIES) {
			if (error.message.includes(`Can't resolve '${dependency}'`)) {
				return false;
			}
		}

		return true;
	}

	apply(compiler: Compiler) {
		compiler.hooks.afterEmit.tap(
			'AllowOptionalDependenciesPlugin',
			(compilation) => {
				compilation.errors = compilation.errors.filter(this.filter);
				compilation.warnings = compilation.warnings.filter(this.filter);
			},
		);
	}
}
