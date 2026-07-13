export const proxyFetch = async (targetUrl: string, init?: RequestInit, fallbackStatus = 502) => {
	try {
		const response = await fetch(targetUrl, init);
		const contentType = response.headers.get('content-type') ?? '';

		if (contentType.includes('application/json')) {
			return {
				status: response.status,
				body: await response.json(),
			};
		}

		return {
			status: response.status,
			body: { message: await response.text() },
		};
	} catch (_error) {
		return {
			status: fallbackStatus,
			body: { error: 'Leaderboard service is unavailable' },
		};
	}
};