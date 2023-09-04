import {CliInternals} from '@remotion/cli';

import type {AwsRegion} from '../pricing/aws-regions';

type servicesCommandLineOptions = {
	help: boolean;
	region: AwsRegion;
	['project-id']: string;
	['service-name']: string;
	y: boolean;
	yes: boolean;
	force: boolean;
	f: boolean;

	['max-retries']: number;
	['out-name']: string | undefined;
	['output-bucket']: string;
	['output-folder-path']: string;
};

export const parsedCloudrunCli =
	CliInternals.minimist<servicesCommandLineOptions>(process.argv.slice(2), {
		boolean: CliInternals.BooleanFlags,
	});

export const forceFlagProvided =
	parsedCloudrunCli.f ||
	parsedCloudrunCli.force ||
	parsedCloudrunCli.yes ||
	parsedCloudrunCli.y;
