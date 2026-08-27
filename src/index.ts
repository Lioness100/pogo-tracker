import { checkLocalGyms } from './campfire';

async function checkLocation(req: Request) {
	try {
		const body = await req.json();
		const lat = Number(body.lat);
		const lng = Number(body.lng);

		if (isNaN(lat) || isNaN(lng)) {
			return Response.json({ error: 'lat and lng must be numbers' }, { status: 400 });
		}

		const withinMinutes = Number(body.withinMinutes ?? 5);
		const ratingThreshold = Number(body.ratingThreshold ?? 4);
		const radius = Number(body.radius ?? 80);

		if (isNaN(withinMinutes)) {
			return Response.json({ error: 'withinMinutes must be a number' }, { status: 400 });
		}

		if (isNaN(ratingThreshold)) {
			return Response.json({ error: 'ratingThreshold must be a number' }, { status: 400 });
		}

		if (isNaN(radius)) {
			return Response.json({ error: 'radius must be a number' }, { status: 400 });
		}

		return Response.json(await checkLocalGyms(lat, lng, withinMinutes, ratingThreshold, radius));
	} catch (error) {
		console.error(error);

		return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
	}
}

Bun.serve({
	port: Number(process.env.PORT ?? 3000),
	routes: {
		'/': Bun.file('public/index.html'),
		'/location': { POST: checkLocation }
	}
});

console.log(`Listening on http://localhost:${process.env.PORT ?? 3000}`);
