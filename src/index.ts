export interface Env {
	GITHUB_TOKEN: string
}

export default {
	async fetch(request: Request, env: Env, _: ExecutionContext): Promise<Response> {
		if (request.method !== "GET") {
			return new Response("Method Not Allowed", {status: 405});
		}

		let cache = await caches.open("githubContributionInfo:cache");
		let cacheData = await cache.match(request);

		if (cacheData !== undefined) {
			return cacheData;
		}

		let data = await fetch(
			"https://api.github.com/graphql",
			{
				method: "POST",
				headers: {
					"Authorization": `bearer ${env.GITHUB_TOKEN}`,
					"User-Agent": "Cloudflare-Workers"
				},
				body: JSON.stringify({
					"query": "query { user(login: \"NightFeather0615\") { repositoriesContributedTo( contributionTypes: [PULL_REQUEST] first: 6 orderBy: {field: STARGAZERS, direction: DESC} ) { nodes { owner { login } name description url stargazerCount primaryLanguage { name } } } } }"
				})
			}
		);

		let res = Response.json(
			await data.json(),
			{
				headers: {
					"Cache-Control": "public, max-age=86400"
				}
			}
		);
		await cache.put(request, res.clone());

		return res;
	},
};
