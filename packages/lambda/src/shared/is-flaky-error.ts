export const isFlakyError = (err: Error): boolean => {
	const message = err.stack ?? '';

	// storage.googleapis.com sometimes returns 500s, and Video does not have retry on its own
	if (
		(message.includes('Format error') || message.includes('audio metadata')) &&
		message.includes('storage.googleapis.com')
	) {
		return true;
	}

	if (message.includes('FATAL:zygote_communication_linux.cc')) {
		return true;
	}

	if (message.includes('error while loading shared libraries: libnss3.so')) {
		return true;
	}

	if (message.includes('but the server sent no data')) {
		return true;
	}

	if (message.includes('Compositor panicked')) {
		return true;
	}

	// S3 in rare occasions
	if (message.includes('We encountered an internal error.')) {
		return true;
	}

	if (message.includes('Compositor exited') && !message.includes('SIGSEGV')) {
		return true;
	}

	if (message.includes('Timed out while setting up the headless browser')) {
		return true;
	}

	// https://github.com/remotion-dev/remotion/issues/2742
	if (message.includes('while trying to connect to the browser')) {
		return true;
	}

	// https://discord.com/channels/809501355504959528/1131234931863998665/1131998442219118622
	if (
		message.includes('RequestTimeout: Your socket connection to the server')
	) {
		return true;
	}

	return false;
};
