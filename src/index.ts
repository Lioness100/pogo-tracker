import { checkLocalGyms } from './campfire';

async function checkLocation(req: Request) {
	try {
		const body = await req.json();
		const lat = Number(body.lat);
		const lng = Number(body.lng);

		if (isNaN(lat) || isNaN(lng)) {
			return Response.json({ error: 'lat and lng must be numbers' }, { status: 400 });
		}

		return Response.json({
			notification: await checkLocalGyms(lat, lng)
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
