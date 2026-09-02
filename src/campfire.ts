import { getBoundsOfDistance, getDistance } from 'geolib';
import { request } from 'graphql-request';

const GRAPHQL_URL = 'https://niantic-social-api.nianticlabs.com/graphql';
const REALITY_CHANNEL_ID = '0d822c6f-81fc-4100-ac15-45537ca69454';

interface RaidQueryResponse {
	realityChannelMapObjectsInLatLngBounds: {
		pgoGym?: {
			raid?: {
				hatchTime: string;
				rating: string;
				eggImageUrl: string;
			};
			location?: {
				latitude: number;
				longitude: number;
			};
			name: string;
		};
	}[];
}

const query = `
	query RaidQuery($realityChannelMapObjectsInLatLngBoundsInput: RealityChannelMapObjectsInLatLngBoundsInput!) {
		realityChannelMapObjectsInLatLngBounds(input: $realityChannelMapObjectsInLatLngBoundsInput) {
			pgoGym {
				raid {
					rating
					hatchTime
					eggImageUrl
				}

				location {
					latitude
					longitude
				}

				name
			}
		}
	}
`;

export async function checkLocalGyms(
	latitude: number,
	longitude: number,
	withinMinutes: number,
	ratingThreshold: number,
	radius: number
) {
	const date = new Date();
	const hour = date.getHours();
	if (hour < 6 || hour > 22) {
		return null;
	}

	const [sw, ne] = getBoundsOfDistance({ latitude, longitude }, radius);
	const variables = {
		realityChannelMapObjectsInLatLngBoundsInput: {
			sources: [{ name: 'PGO', dropTypes: ['PGO_GYM'] }],
			realityChannelId: REALITY_CHANNEL_ID,
			bounds: {
				sw: { lat: sw.latitude, lng: sw.longitude },
				ne: { lat: ne.latitude, lng: ne.longitude }
			}
		}
	};

	const result = await request<RaidQueryResponse>({ url: GRAPHQL_URL, document: query, variables });
	const now = date.getTime();

	const MINUTES = withinMinutes * 60_000;
	const eligibleEggs = result.realityChannelMapObjectsInLatLngBounds.flatMap(({ pgoGym }) => {
		const { raid, location } = pgoGym ?? {};
		if (!raid || !location) {
			return [];
		}

		// If a rating is >10, it is a shadow raid, and the rating is the
		// second digit. If the rating is 6, it's a 4★ mega raid. If the rating
		// is 7, it's a 6★ mega raid.
		let rating = { '6': 4, '7': 6 }[raid.rating] ?? Number(raid.rating) % 10;
		if (rating < ratingThreshold) {
			return [];
		}

		const start = Date.parse(raid.hatchTime);
		if (Number.isNaN(start)) {
			return [];
		}

		if (start < now || start > now + MINUTES) {
			return [];
		}

		const isShadow = Number(raid.rating) > 10;
		const distance = getDistance({ latitude, longitude }, location);
		return [{ rating, start, isShadow, eggImageUrl: raid.eggImageUrl, location, distance, name: pgoGym!.name }];
	});

	eligibleEggs.sort((a, b) => {
		return a.start - b.start;
	});

	if (eligibleEggs.length > 0) {
		const nextEgg = eligibleEggs[0];
		const notification = `🚨 ${nextEgg.rating}★ ${nextEgg.isShadow ? 'shadow' : ''} raid egg hatching in ${Math.floor((nextEgg.start - now) / (60 * 1000))} minutes!`;
		return { data: eligibleEggs, notification };
	}

	return { data: [], notification: null };
}
