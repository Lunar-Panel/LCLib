import { constants, createHash, publicEncrypt, randomBytes } from 'crypto';
import fetch from 'node-fetch';
import { WebSocket } from 'ws';
import { MCAccount } from './Types';

/**
 * Uses a minecraft access token with a username and a uuid and converts it to a Lunar Client access token that can be used to connect to the asset websocket (one time use)
 * @param access_token The Minecraft Access Token
 * @param username The Minecraft Account Username
 * @param uuid The Minecraft Account UUID (with or without dashes)
 * @returns The One-Time-Use Lunar Client Access Token
 */
export function lunarAuth(access_token: string, username: string, uuid: string): Promise<string> {
	const uuidWithoutDashes = uuid.replace(/-/g, '');
	const uuidWithDashes = uuidWithoutDashes.slice(0, 8) + '-' + uuidWithoutDashes.slice(8, 12) + '-' + uuidWithoutDashes.slice(12, 16) + '-' + uuidWithoutDashes.slice(16, 20) + '-' + uuidWithoutDashes.slice(20, 32);
	return new Promise((res, rej) => {
		const socket = new WebSocket('wss://authenticator.lunarclientprod.com/', {
			headers: {
				playerId: uuidWithDashes,
				username
			}
		});

		socket.onerror = err => rej(err);
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
			return (negative ? '-' : '') + buffer.toString('hex').replace(/^0+/g, '');
		}
		function encrypt(data, publicKey) {
			let pem = '-----BEGIN PUBLIC KEY-----\n';
			let base64PubKey = Buffer.from(publicKey, 'base64').toString('base64');
			const maxLineLength = 64;
			while (base64PubKey.length > 0) {
				pem += base64PubKey.substring(0, maxLineLength) + '\n';
				base64PubKey = base64PubKey.substring(maxLineLength);
			}
			pem += '-----END PUBLIC KEY-----';
			return publicEncrypt(
				{
					key: pem,
					padding: constants.RSA_PKCS1_PADDING
				},
				data
			);
		}

		socket.on('message', async event => {
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
					await fetch('https://sessionserver.mojang.com/session/minecraft/join', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							accessToken: access_token,
							selectedProfile: uuidWithoutDashes,
							serverId: mcHexDigest(createHash('sha1').update('').update(secret).update(Buffer.from(data.publicKey, 'base64url')).digest())
						})
					});
					socket.send(
						Buffer.from(
							JSON.stringify({
								packetType: 'CPacketEncryptionResponse',
								secretKey: encrypt(secret, data.publicKey).toString('base64url'),
								publicKey: encrypt(Buffer.from(data.randomBytes, 'base64'), data.publicKey).toString('base64url')
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
export async function loginToMinecraft(access_token: string): Promise<MCAccount> {
	const fetch1: any = await fetch('https://user.auth.xboxlive.com/user/authenticate', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json'
		},
		body: JSON.stringify({
			Properties: {
				AuthMethod: 'RPS',
				SiteName: 'user.auth.xboxlive.com',
				RpsTicket: `d=${access_token}`
			},
			RelyingParty: 'http://auth.xboxlive.com',
			TokenType: 'JWT'
		})
	}).then(res => res.json());
	const fetch2: any = await fetch('https://xsts.auth.xboxlive.com/xsts/authorize', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json'
		},
		body: JSON.stringify({
			Properties: {
				SandboxId: 'RETAIL',
				UserTokens: [fetch1.Token]
			},
			RelyingParty: 'rp://api.minecraftservices.com/',
			TokenType: 'JWT'
		})
	}).then(res => res.json());

	const { access_token: token, token_type } = await (async () => {
		let res;
		do {
			res = await fetch('https://api.minecraftservices.com/authentication/login_with_xbox', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					identityToken: `XBL3.0 x=${fetch1.DisplayClaims.xui[0].uhs};${fetch2.Token}`
				})
			});
			if (!res.ok) await new Promise(res => setTimeout(res, 10000));
		} while (!res.ok);
		return await res.json();
	})();
	const { name: username, id: uuid } = (await fetch('https://api.minecraftservices.com/minecraft/profile', {
		headers: {
			Authorization: `${token_type} ${token}`
		}
	}).then(res => res.json())) as any;

	return { username, uuid, token };
}
