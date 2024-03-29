import { parseUUID } from '@minecraft-js/uuid';
import { constants, createHash, publicEncrypt, randomBytes } from 'crypto';
import { Client } from './Client';
import { MCAccount } from './Types';

/**
 * Uses a minecraft access token with a username and a uuid and converts it to a Lunar Client access token that can be used to connect to the asset websocket (one time use)
 * @param access_token The Minecraft Access Token
 * @param username The Minecraft Account Username
 * @param uuid The Minecraft Account UUID (with or without dashes)
 * @returns The One-Time-Use Lunar Client Access Token
 */
export function lunarAuth(
	access_token: string,
	username: string,
	uuid: string,
	{ WebSocket, fetch }: Client
): Promise<string> {
	const uuidWithoutDashes = parseUUIDWithoutDashes(uuid);
	const uuidWithDashes = parseUUIDWithDashes(uuid);
	return new Promise((res, rej) => {
		const socket = new WebSocket(
			'wss://authenticator.lunarclientprod.com/',
			{
				headers: {
					playerId: uuidWithDashes,
					username,
				},
			}
		);

		socket.onerror = (err) => rej(err);
		socket.onclose = () => rej();

		function mcHexDigest(buffer) {
			const negative = buffer.readInt8(0) < 0;
			if (negative) {
				let carry = true;
				let i, newByte, value;
				for (i = buffer.length - 1; i >= 0; --i) {
					value = buffer.readUInt8(i);
					newByte = ~value & 0xff;
					if (carry) {
						carry = newByte === 0xff;
						buffer.writeUInt8(carry ? 0 : newByte + 1, i);
					} else {
						buffer.writeUInt8(newByte, i);
					}
				}
			}
			return (
				(negative ? '-' : '') +
				buffer.toString('hex').replace(/^0+/g, '')
			);
		}
		function encrypt(data, publicKey) {
			let pem = '-----BEGIN PUBLIC KEY-----\n';
			let base64PubKey = Buffer.from(publicKey, 'base64').toString(
				'base64'
			);
			const maxLineLength = 64;
			while (base64PubKey.length > 0) {
				pem += base64PubKey.substring(0, maxLineLength) + '\n';
				base64PubKey = base64PubKey.substring(maxLineLength);
			}
			pem += '-----END PUBLIC KEY-----';
			return publicEncrypt(
				{
					key: pem,
					padding: constants.RSA_PKCS1_PADDING,
				},
				data
			);
		}

		function padString(input: string): string {
			let segmentLength = 4;
			let stringLength = input.length;
			let diff = stringLength % segmentLength;

			if (!diff) {
				return input;
			}

			let position = stringLength;
			let padLength = segmentLength - diff;
			let paddedStringLength = stringLength + padLength;
			let buffer = Buffer.alloc(paddedStringLength);

			buffer.write(input);

			while (padLength--) {
				buffer.write('=', position++);
			}

			return buffer.toString();
		}

		socket.on('message', async (event) => {
			let data = null;
			try {
				data = JSON.parse(event.toString('utf-8'));
			} catch (err) {
				rej(err);
				socket.close();
			}
			switch (data.packetType) {
				case 'SPacketEncryptionRequest':
					var secret = randomBytes(16);
					await fetch(
						'https://sessionserver.mojang.com/session/minecraft/join',
						{
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
								accessToken: access_token,
								selectedProfile: uuidWithoutDashes,
								serverId: mcHexDigest(
									createHash('sha1')
										.update('')
										.update(secret)
										.update(
											Buffer.from(
												padString(data.publicKey)
													.replace(/\-/g, '+')
													.replace(/_/g, '/'),
												'base64'
											)
										)
										.digest()
								),
							}),
						}
					);
					socket.send(
						Buffer.from(
							JSON.stringify({
								packetType: 'CPacketEncryptionResponse',
								secretKey: encrypt(secret, data.publicKey)
									.toString('base64')
									.replace(/=/g, '')
									.replace(/\+/g, '-')
									.replace(/\//g, '_'),
								publicKey: encrypt(
									Buffer.from(data.randomBytes, 'base64'),
									data.publicKey
								)
									.toString('base64')
									.replace(/=/g, '')
									.replace(/\+/g, '-')
									.replace(/\//g, '_'),
							}),
							'utf-8'
						)
					);
					break;
				case 'SPacketAuthenticatedRequest':
					socket.close();
					res(data.jwtKey);
					break;
			}
		});
	});
}

/**
 * Uses a Microsoft Access Token to login to Minecraft
 * @param access_token The Microsoft Access Token
 * @returns The Minecraft Account Data (Username, UUID, and Access Token)
 */
export async function loginToMinecraft(
	access_token: string,
	client: Client
): Promise<MCAccount> {
	const { fetch } = client;
	const userAuthReq: any = await fetch(
		'https://user.auth.xboxlive.com/user/authenticate',
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({
				Properties: {
					AuthMethod: 'RPS',
					SiteName: 'user.auth.xboxlive.com',
					RpsTicket: `d=${access_token}`,
				},
				RelyingParty: 'http://auth.xboxlive.com',
				TokenType: 'JWT',
			}),
		}
	).then((res) => res.json());
	const xstsAuthReq: any = await fetch(
		'https://xsts.auth.xboxlive.com/xsts/authorize',
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({
				Properties: {
					SandboxId: 'RETAIL',
					UserTokens: [userAuthReq.Token],
				},
				RelyingParty: 'rp://api.minecraftservices.com/',
				TokenType: 'JWT',
			}),
		}
	).then((res) => res.json());

	const { access_token: token } = await (async () => {
		let res;
		do {
			res = await fetch(
				'https://api.minecraftservices.com/authentication/login_with_xbox',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						identityToken: `XBL3.0 x=${userAuthReq.DisplayClaims.xui[0].uhs};${xstsAuthReq.Token}`,
					}),
				}
			);
			if (!res.ok) await new Promise((res) => setTimeout(res, 10000));
		} while (!res.ok);
		return await res.json();
	})();

	return await fetchUserInfo(token, client);
}

export const parseUUIDWithDashes = (uuid: string) =>
	parseUUID(uuid).toString(true);
export const parseUUIDWithoutDashes = (uuid: string) =>
	parseUUID(uuid).toString(false);

/**
 * Parses time to human-readable string
 * @param milliseconds The time in milliseconds
 * @param excludeMS Whether to exclude the leftover milliseconds from the final result (only excludes if there was at least 1 second)
 * @returns The human-readable string
 */
export function parseTime(milliseconds: number, excludeMS = false) {
	if (typeof milliseconds !== 'number') milliseconds = 0;

	const data = {
		days: Math.trunc(milliseconds / 86_400_000),
		hours: Math.trunc(milliseconds / 3_600_000) % 24,
		minutes: Math.trunc(milliseconds / 60_000) % 60,
		seconds: Math.trunc(milliseconds / 1_000) % 60,
		milliseconds: Math.trunc(milliseconds) % 1_000,
	};

	let timeItems = [];
	for (const item of Object.keys(data)) {
		if (timeItems.length || data[item] !== 0) {
			const formattedName =
				item.substring(0, 1).toUpperCase() +
				item.substring(1).toLowerCase();
			timeItems.push(
				data[item] +
					' ' +
					formattedName.substring(
						0,
						formattedName.length - (data[item] == 1 ? 1 : 0)
					)
			);
		}
	}

	if (excludeMS && timeItems.length > 1)
		timeItems.splice(
			timeItems.findIndex((i) => i.includes('Milliseconds')),
			1
		);

	let time: string;
	if (timeItems.length === 1) time = timeItems[0];
	else if (timeItems.length === 2)
		time = timeItems[0] + ' and ' + timeItems[1];
	else {
		time = '';
		for (const item of timeItems) {
			if (timeItems.indexOf(item) === timeItems.length - 1)
				time += ', and ' + item;
			else if (timeItems.indexOf(item) === 0) time = item;
			else time += ', ' + item;
		}
	}

	return time;
}

/**
 * Fetch info about a User's Account
 * @param token The User's Mojang Access Token
 * @returns The User Profile
 */
export async function fetchUserInfo(
	token: string,
	{ fetch }: Client
): Promise<MCAccount> {
	const { name: username, id: uuid } = await fetch(
		'https://api.minecraftservices.com/minecraft/profile',
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	).then((res) => res.json());
	return {
		username,
		uuid,
		token,
	};
}

/** Git Commit used in Connection, must match ModStates */
export const gitCommit = '78f38fc2881c230532a91fcf8351807e0a9592fa';
/** Mod States used in KeepAlive Packets */
export const ModStates = {
	scrollable_tooltips: true,
	tntCountdown: true,
	titleMod: true,
	keystrokes: true,
	cooldowns: true,
	glint_colorizer: false,
	armorstatus: true,
	chunkborders: false,
	textHotKey: false,
	playtime: true,
	resource_display: false,
	nametag: true,
	skinLayers3D: false,
	items2d: false,
	bossbar: true,
	item_counter: false,
	tab: true,
	hypixel_bedwars: true,
	hypixel_mod: true,
	uhc_overlay: false,
	colorsaturation: false,
	teamview: true,
	pvpInfo: true,
	scoreboard: true,
	pack_organizer: true,
	saturation_mod: true,
	snaplook: false,
	'mumble-link': false,
	neu: false,
	momentum_mod: true,
	skyblockAddons: false,
	itemTrackerChild: true,
	cps: true,
	combo: false,
	clock: true,
	lighting: true,
	hitbox: true,
	hitColor: true,
	waila: false,
	one_seven_visuals: true,
	menu_blur: true,
	quickplay: false,
	potioneffects: true,
	fov_mod: false,
	motionBlur: false,
	daycounter: false,
	memory: true,
	ping: true,
	nickHider: false,
	range: true,
	screenshot: true,
	waypoints: true,
	directionhud: false,
	freelook: false,
	hurt_cam: false,
	replaymod: false,
	coords: true,
	sound_changer: false,
	fps: true,
	zoom: true,
	itemPhysic: true,
	worldedit_cui: true,
	weather_changer: true,
	crosshair: true,
	block_outline: true,
	chat: true,
	shinyPots: false,
	toggleSneak: true,
	time_changer: true,
	fog_mod: false,
	particleMod: false,
	stopwatch: false,
	serverAddressMod: true,
};
