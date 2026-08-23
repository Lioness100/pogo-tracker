import { request } from 'graphql-request';

const RADIUS = 80;
const GRAPHQL_URL = 'https://niantic-social-api.nianticlabs.com/graphql';
const REALITY_CHANNEL_ID = '0d822c6f-81fc-4100-ac15-45537ca69454';

interface RaidQueryResponse {
	realityChannelMapObjectsInLatLngBounds: {
		pgoGym?: {
			raid?: {
				hatchTime: string;
				rating: number;
			};
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
				}
			}
		}
	}
`;

function getBounds(lat: number, lng: number) {
	const dLat = RADIUS / 111_320;
	const dLng = RADIUS / (111_320 * Math.cos((lat * Math.PI) / 180));

	return {
		sw: { lat: lat - dLat, lng: lng - dLng },
		ne: { lat: lat + dLat, lng: lng + dLng }
	};
}

export async function checkLocalGyms(lat: number, lng: number) {
	const date = new Date();
	const hour = date.getHours();
	if (hour < 6 || hour > 22) {
		return null;
	}

	const variables = {
		realityChannelMapObjectsInLatLngBoundsInput: {
			sources: [{ name: 'PGO', dropTypes: ['PGO_GYM'] }],
			realityChannelId: REALITY_CHANNEL_ID,
			bounds: getBounds(lat, lng)
		}
	};

	const result = await request<RaidQueryResponse>({ url: GRAPHQL_URL, document: query, variables });
	const now = date.getTime();

	for (const { pgoGym } of result.realityChannelMapObjectsInLatLngBounds) {
		const raid = pgoGym?.raid;
		if (!raid || Number(raid.rating) < 4) {
			continue;
		}

		const start = Date.parse(raid.hatchTime);
		if (Number.isNaN(start)) {
			continue;
		}

		const FIVE_MINUTES = 5 * 60_000;
		if (start >= now && start <= now + FIVE_MINUTES) {
			return `🚨 ${raid.rating}★ raid egg hatching in ${Math.floor((start - now) / (60 * 1000))} minutes!`;
		}
	}

	return null;
}
