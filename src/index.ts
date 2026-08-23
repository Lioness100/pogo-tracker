import { checkLocalGyms } from './campfire';

async function checkLocation(req: Request) {
	try {
		const body = await req.json();

		if (typeof body.lat !== 'number' || typeof body.lng !== 'number') {
			return Response.json({ error: 'lat and lng must be numbers' }, { status: 400 });
		}

		return Response.json({
			notification: await checkLocalGyms(body.lat, body.lng)
		});
	} catch (error) {
		console.error(error);

		return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
	}
}

Bun.serve({
	port: Number(process.env.PORT ?? 3000),
	routes: { '/location': { POST: checkLocation } }
});

console.log(`Listening on http://localhost:${process.env.PORT ?? 3000}`);
