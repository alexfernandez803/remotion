import fs from 'fs';
import path from 'path';
import {getResourceManagerClient} from '../helpers/get-resource-manager-client';

export const logPermissionOutput = (output: TestResult) => {
	return [output.decision ? '✅' : '❌', output.permissionName].join(' ');
};

type TestResult = {
	decision: true | false;
	permissionName: string;
};

type TestPermissionsInput = {
	onTest: (result: TestResult) => void;
};

type TestPermissionsOutput = {
	results: TestResult[];
};

/**
 * @description Test the permissions on the service account match the permissions required.
 * @see [Remotion-Documentation](http://remotion.dev/docs/cloudrun/testpermissions)
 * @see [Cloudrun-Documentation](https://cloud.google.com/resource-manager/reference/rest/v3/projects/testIamPermissions)
 * @param {(result: TestResult) => void} params.onTest Function to run on each test result
 * @returns {Promise<TestPermissionsOutput>} Returns array of TestResult objects
 */
export const testPermissions = async (
	params?: TestPermissionsInput,
): Promise<TestPermissionsOutput> => {
	const resourceManagerClient = getResourceManagerClient();

	const saPermissions = JSON.parse(
		fs.readFileSync(
			path.join(__dirname, '../../shared/sa-permissions.json'),
			'utf-8',
		),
	);

	const permissionList: string[] = saPermissions.list.map(
		(permission: {name: string; reason: string}) => permission.name,
	);

	const response = await resourceManagerClient.testIamPermissions({
		resource: `projects/${process.env.REMOTION_GCP_PROJECT_ID}`,
		permissions: permissionList,
	});

	const returnedPermissions = response[0].permissions;

	if (!returnedPermissions) {
		throw new Error(
			'No permissions returned from the testIamPermissions call.',
		);
	}

	const results: TestResult[] = [];

	saPermissions.list.forEach((permission: {name: string; reason: string}) => {
		if (returnedPermissions.includes(permission.name)) {
			const thisResult = {decision: true, permissionName: permission.name};
			results.push(thisResult);
			params?.onTest(thisResult);
		} else {
			const thisResult = {decision: false, permissionName: permission.name};
			results.push(thisResult);
			params?.onTest(thisResult);
		}
	});

	return {results};
};
