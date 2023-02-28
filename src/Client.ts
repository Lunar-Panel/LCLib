import EventEmitter, { once } from 'events';
import TypedEmitter from 'typed-emitter';
import { WebSocket } from 'ws';
import ClientConsole from './Classes/ClientConsole';
import { handle } from './handle';
import Logger from './Classes/Logger';
import { IncomingPacketTypes, OutgoingPacketIDs, OutgoingPacketTypes, readPacket, writePacket } from './Packets';
import Packet from './Packets/Packet';
import { ClientOptions, ClientState, FriendRequest, LCUser, MCAccount, OfflineUser, OnlineUser, User, UserState } from './Types';
import { fetchUserInfo, loginToMinecraft, lunarAuth, parseTime, parseUUIDWithDashes, parseUUIDWithoutDashes } from './utils';
import fetch from 'node-fetch';

/** The LCLib Client */
export class Client extends (EventEmitter as new () => TypedEmitter<ClientEvents>) {
	// Client State Info

	/** The State of the Client */
	public state: ClientState;
	/** The Client Logger */
	public logger: Logger;
	/** Failed Login Attempts, resets on success, fail on 5 failed attempts after one successful login or 3 failed attempts before one */
	private failedAttempts: number = 0;

	/** The Client's Minecraft Account */
	public account: MCAccount;
	public get uuidWithoutDashes() {
		return parseUUIDWithoutDashes(this.account.uuid);
	}
	public get uuidWithDashes() {
		return parseUUIDWithDashes(this.account.uuid);
	}
	public get uuid() {
		return this.uuidWithDashes;
	}
	/** The Client's Lunar Client State */
	public userState: UserState;

	/** The currently active WebSocket */
	public socket: WebSocket;

	/** Whether the Client has sent the `connected` event */
	public sentConnected: boolean = false;

	// Client User Info

	/** Client's LC User */
	public user: LCUser;
	/** All Users that the Client has cached, mapped by their UUIDs (does not include friends, use `users` get property) */
	public _users: Map<string, User> = new Map();
	/** All Users that the Client has cached, mapped by their UUIDs */
	public get users() {
		return new Map([...this._users, ...this.friends]);
	}
	/** All of the Client's Friends, mapped by their UUIDs */
	public friends: Map<string, User> = new Map();
	/** All Friend Requests that are incoming or outgoing from the client, mapped by the target User UUID */
	public friendRequests: Map<string, FriendRequest> = new Map();
	/** All console messages, each string is a new message, in order from first created to last created */
	public clientConsole: ClientConsole;
	/** The IDs of the emotes owned and equipped (meaning shown in the menu when using the keybind) */
	public emotes: {
		owned: number[];
		equipped: number[];
	};
	/** Whether Incoming Friend Requests are enabled for the Client User */
	public friendRequestsEnabled: boolean;

	// Internally used
	private manuallyDisconnected = false;

	/**
	 * The LCLib Client
	 */
	constructor(options: Partial<ClientOptions>) {
		super();
		this.setMaxListeners(0);
		this.logger = new Logger(options.debug ?? false);
		this.state = ClientState.REQUIRES_INIT;
		this.clientConsole = new ClientConsole(this);
	}

	/**
	 * Intiate and Login to the Client
	 * @param access_token The Microsoft Access Token
	 * @param minecraft_authed Whether the provided Access Token has already been authenticated with Minecraft
	 */
	public async init(access_token: string, minecraft_authed = false) {
		if (this.state != ClientState.REQUIRES_INIT) return;
		if (minecraft_authed) this.account = await fetchUserInfo(access_token);
		else {
			this.logger.log('Logging In...');
			try {
				const minecraftAuthTimeStart = Date.now();
				this.account = await loginToMinecraft(access_token);
				this.logger.debug('Minecraft Auth took ' + parseTime(Date.now() - minecraftAuthTimeStart));
			} catch {
				this.emit('disconnected');
				this.state = ClientState.REQUIRES_INIT;
				this.logger.error('Failed to Log In');
			}
		}
		this.state = ClientState.INITIATED;
		this.logger.log('Successfully Logged In');
	}

	/**
	 * Connect to the WebSocket (with auto reconnecter)
	 * @param state User State for the Connection
	 */
	public connect(state: Partial<UserState> = {}) {
		if (this.state != ClientState.INITIATED) return;
		this.logger.log('Starting Connect Sequence');
		this.sentConnected = false;

		state.arch ??= 'x64';
		state.branch ??= 'master';
		state.clothCloak ??= 'false';
		state.gitCommit ??= 'd5e1bcee71328b1885a0365ea1c079b12b0dc4ee';
		state.hatHeightOffset ??= '[{"id":3520,"height":0.0},{"id":2628,"height":0.0},{"id":3471,"height":0.0},{"id":3472,"height":0.0},{"id":2583,"height":0.0},{"id":2584,"height":0.0},{"id":2526,"height":0.0},{"id":2527,"height":0.0},{"id":2528,"height":0.0},{"id":2856,"height":0.0},{"id":2540,"height":0.0},{"id":2541,"height":0.0},{"id":2542,"height":0.0},{"id":3438,"height":0.0},{"id":2543,"height":0.0},{"id":3439,"height":0.0},{"id":2544,"height":0.0},{"id":2545,"height":0.0},{"id":2424,"height":0.0},{"id":2490,"height":0.0},{"id":2491,"height":0.0},{"id":2492,"height":0.0},{"id":2493,"height":0.0},{"id":2494,"height":0.0},{"id":2558,"height":0.0},{"id":2559,"height":0.0},{"id":3519,"height":0.0}]';
		state.hwid ??= 'not supplied';
		state.launcherVersion ??= 'not supplied';
		state.lunarPlusColor ??= '-1';
		state.os ??= 'Windows';
		state.server ??= '';
		state.showHatsOverHelmet ??= 'false';
		state.showHatsOverSkinLayer ??= 'true';
		state.version ??= 'v1_8';
		state.flipShoulderPet ??= 'false';
		state.ichorModules ??= 'common,optifine,lunar';
		state.showOverBoots ??= 'true';
		state.showOverChestplate ??= 'true';
		state.showOverLeggings ??= 'true';

		state.accountType = 'XBOX';
		state.protocolVersion = '8';
		state.Host = 'assetserver.lunarclientprod.com';
		state.username = this.account.username;
		state.playerId = this.uuidWithDashes;

		this.userState = state as UserState;

		this._connect();
	}

	private async _connect() {
		if (this.state != ClientState.INITIATED && this.state != ClientState.CONNECTING) return;
		this.state = ClientState.CONNECTING;
		this.logger.log('Connecting...');
		this.socket = null;

		let lunarToken: string;
		try {
			const lunarAuthTimeStart = Date.now();
			lunarToken = await lunarAuth(this.account.token, this.account.username, this.uuidWithDashes);
			this.logger.debug('Lunar Auth took ' + parseTime(Date.now() - lunarAuthTimeStart));
			this.failedAttempts = 0;
		} catch (err) {
			this.logger.error('Lunar Auth Failed');
			if (this.failedAttempts < (this.user ? 5 : 3)) {
				this.failedAttempts += 1;
				return setTimeout(() => this._connect(), this.failedAttempts * 2500);
			} else {
				this.state = ClientState.REQUIRES_INIT;
				this.sentConnected = false;
				return this.emit('invalid');
			}
		}

		this.socket = new WebSocket('wss://assetserver.lunarclientprod.com/connect/', {
			headers: { ...this.userState, Authorization: lunarToken }
		});
		let heartbeatInterval: NodeJS.Timer;
		let onlineSince = null;

		this.socket.on('open', () => {
			this.logger.log('Connected!');
			onlineSince = Date.now();
			this.state = ClientState.CONNECTED;
			if (!this.sentConnected) {
				this.sentConnected = true;
				setTimeout(() => this.emit('connected'), 3000);
			}
			heartbeatInterval = setInterval(() => {
				if (heartbeatInterval)
					this.sendImpersistent(OutgoingPacketIDs.KeepAlive, {
						mods: {},
						game: ''
					});
			}, 30000);
		});

		this.socket.on('close', (code, reason) => {
			clearInterval(heartbeatInterval);
			if (this.manuallyDisconnected) {
				this.manuallyDisconnected = false;
				this.logger.log('Disconnected Manually');
				this.state = ClientState.INITIATED;
			} else {
				this.logger.log(`Disconnected with Code ${code} and Reason "${reason ?? 'No Reason Given'}" ${onlineSince ? `after ${parseTime(Date.now() - onlineSince, true)}` : 'instantly'}`);
				this.state = ClientState.CONNECTING;
				this._connect();
			}
		});

		this.socket.on('error', err => {
			this.logger.error('WebSocket Error', err);
		});

		this.socket.on('message', packet => {
			let data: { id: number; data: Packet };
			try {
				data = readPacket(packet as Buffer) as { id: number; data: Packet };
			} catch (err) {
				return this.logger.error('WebSocket Message Error', err);
			}
			handle(this, data.id as keyof IncomingPacketTypes, data.data.data);
		});
	}

	/**
	 * Send a Packet through the Socket (DON'T USE, USE `Client#sendPersistent()` OR `Client#sendImpersistent()`)
	 * @param id The Packet ID
	 * @param data Packet Data
	 */
	private send<T extends keyof OutgoingPacketTypes>(id: T, data: OutgoingPacketTypes[T]): Promise<void> {
		return new Promise((res, rej) => this.socket.send((writePacket(id, data) as Packet).buf.buffer, err => (err ? rej(err) : res())));
	}

	/**
	 * Send a Packet through the Socket that will be guaranteed to send, either with the current WebSocket or with the next open one
	 * @param id The Packet ID
	 * @param data Packet Data
	 */
	public async sendPersistent<T extends keyof OutgoingPacketTypes>(id: T, data: OutgoingPacketTypes[T]) {
		if (this.socket?.readyState !== WebSocket.OPEN) {
			if (this.sentConnected) await once(this.socket, 'open');
			else await once(this, 'connected');
		}
		return await this.send(id, data)
			.then(() => true)
			.catch(() => false);
	}
	/**
	 * Send a Packet through the Socket that will only send if there is an active connection
	 * @param id The Packet ID
	 * @param data Packet Data
	 */
	public async sendImpersistent<T extends keyof OutgoingPacketTypes>(id: T, data: OutgoingPacketTypes[T]) {
		if (this.socket?.readyState === WebSocket.OPEN)
			return await this.send(id, data)
				.then(() => true)
				.catch(() => false);
		else return null;
	}

	/**
	 * Send a Message to one of your friends
	 * @param user The Friend User Object or UUID
	 * @param message The message
	 * @returns A promise that resolves with whether the message send was successful
	 */
	public async sendMessage(user: User | string, message: string = '') {
		const uuid = typeof user === 'object' ? user.uuid : user;
		if (!this.friends.get(uuid)?.online) return false;
		if (
			!(await this.sendPersistent(OutgoingPacketIDs.FriendMessage, {
				uuid,
				message
			}))
		)
			return false;
		else {
			(this.friends.get(uuid) as OnlineUser).messages.push({
				uuid: this.uuidWithDashes,
				message
			});
			return true;
		}
	}

	/**
	 * Change the Client's Server
	 * @param server The server name (MUST BE ONE OF LUNAR CLIENT'S SERVER NAMES https://github.com/LunarClient/ServerMappings/tree/master/servers)
	 * @returns A promise that resolves with whether it was successful
	 */
	public async changeServer(server: string) {
		return await this.sendPersistent(OutgoingPacketIDs.JoinServer, {
			uuid: '',
			server: typeof server === 'string' ? server : 'In Menus'
		});
		// TODO: Maybe do some state for this idk
	}

	/**
	 * Send a Friend Request to a User
	 * @param data An object that must have eitehr a valid UUID or a valid Username of the User (preferably both)
	 * @returns Whether the Friend Request was successfully sent
	 */
	public async sendFriendRequest(data: { uuid?: string; username?: string } = {}) {
		data ??= {};
		if (typeof data.uuid !== 'string' && typeof data.username !== 'string') throw new Error('Must have either a valid UUID or valid Username to add a friend!');
		if (typeof data.uuid !== 'string') {
			const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${data.username}`);
			if (res.status != 200) throw new Error('No player with Username ' + data.username);
			data.uuid = await res.json().then(info => info.id);
		}
		data.uuid = parseUUIDWithDashes(data.uuid);
		if (this.friends.has(data.uuid)) return false;
		if (typeof data.username !== 'string') {
			const res = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${data.uuid}`);
			if (res.status != 200) throw new Error('No player with UUID ' + data.uuid);
			data.username = await res.json().then(info => info.name);
		}
		if (
			!(await this.sendPersistent(OutgoingPacketIDs.FriendRequest, {
				uuid: data.uuid,
				name: data.username
			}))
		)
			return false;

		const result = await this.awaitNotification('Friend Request has been sent.');
		if (result.title === 'Success!') {
			this.friendRequests.set(data.uuid, {
				uuid: data.uuid,
				username: data.username,
				outgoing: true
			});
			await this.fetchPlayers(data.uuid);
			return true;
		} else return false;
	}

	/**
	 * Remove a Friend from your Friends List
	 * @param user The Friend User Object or UUID
	 * @returns Whether the Removal was successful
	 */
	public async removeFriend(user: User | string) {
		const uuid = typeof user === 'object' ? user.uuid : user;
		if (!this.friends.has(uuid)) return false;
		if (
			!(await this.sendPersistent(OutgoingPacketIDs.RemoveFriend, {
				uuid
			}))
		)
			return false;
		else {
			this._users.set(uuid, this.friends.get(uuid));
			this.friends.delete(uuid);
			return true;
		}
	}

	/**
	 * Handle a Friend Request
	 * @param request Either the Friend Request Object or the Friend Request target User UUID
	 * @param accepted Whether the request was accepted (default `false`)
	 * @returns Whether the Friend Request was handled successfully
	 */
	public async handleFriendRequest(request: FriendRequest | string, accepted: boolean = false) {
		const uuid = typeof request === 'object' ? request.uuid : request;
		if (!this.friendRequests.has(uuid) || (this.friendRequests.get(uuid).outgoing && accepted)) return false;
		if (
			!(await this.sendPersistent(OutgoingPacketIDs.FriendResponse, {
				uuid,
				accepted
			}))
		)
			return false;
		else {
			if (this.friendRequests.get(uuid).outgoing) {
				this.friendRequests.delete(uuid);
				return true;
			} else {
				if (accepted) {
					this.friends.set(
						uuid,
						this.users.get(uuid) ||
							({
								uuid,
								username: this.friendRequests.get(uuid).username,
								offlineSince: Date.now(),
								online: false
							} as OfflineUser)
					);
					if (this._users.has(uuid)) this._users.delete(uuid);
					this.friendRequests.delete(uuid);
					if (!(await this.fetchPlayers(uuid))?.[0]) return false;
				} else this.friendRequests.delete(uuid);
				return true;
			}
		}
	}

	/**
	 * Toggle Incoming Friend Requests
	 * @param enabled Enabled or Disabled
	 * @returns Whether the toggle succeded
	 */
	public async toggleFriendRequests(enabled: boolean) {
		if (
			!(await this.sendPersistent(OutgoingPacketIDs.ToggleFriendRequests, {
				status: enabled ?? true
			}))
		)
			return false;
		else {
			this.friendRequestsEnabled = !!(enabled ?? true);
			return true;
		}
	}

	/**
	 * Await a Notification (USED INTERNALLY)
	 * @returns The notification data as an object
	 */
	private async awaitNotification(
		successIdentifier?: string,
		successIf: string = 'Success!'
	): Promise<{
		title: string;
		message: string;
	}> {
		let data;
		while (!data) {
			const msg = await once(this, 'notification');
			console.log(msg);
			if (successIdentifier && (msg[0] || '').trim().replace(/§[0-9A-Za-z]/g, '') == (successIf || 'Success!')) {
				if ((msg[1] || '').trim().replace(/§[0-9A-Za-z]/g, '') == successIdentifier) data = msg;
			} else data = msg;
		}
		return {
			title: (data[0] || '').trim().replace(/§[0-9A-Za-z]/g, ''),
			message: (data[1] || '').trim().replace(/§[0-9A-Za-z]/g, '')
		};
	}

	/**
	 * Fetch all players with the UUIDs specified
	 *
	 * You will only recieve a response for the UUID if that user is on Lunar Client or it has been cached before, otherwise that user's data will be `null`
	 * @param uuids The UUIDs to fetch
	 * @returns User data for each user in the same order as the UUIDs (`null` for the user if that user is not online on Lunar Client and has never been cached) (`null` as the object if there were invalid UUIDs or it failed to fetch)
	 */
	public async fetchPlayers(...uuids: string[]): Promise<Array<User> | null> {
		if (
			!(await this.sendPersistent(OutgoingPacketIDs.PlayerInfoRequest, {
				uuids
			}))
		)
			return null;
		let users: User[] = [];
		let resolve = (data?: any) => {};
		const listener = (user: User) => {
			if (uuids.includes(user.uuid)) users[uuids.indexOf(user.uuid)] = user;
			if (uuids.length == users.length) resolve();
		};
		this.on('playerUpdate', listener);
		await new Promise(res => {
			resolve = res;
			setTimeout(res, 2500);
		});
		this.off('playerUpdate', listener);
		await Promise.all(
			uuids.map(async uuid => {
				if (users[uuids.indexOf(uuid)]?.uuid != uuid) {
					const user = {
						uuid,
						username: await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`)
							.then(res => res.json())
							.then(info => info.name),
						online: false,
						offlineSince: Date.now()
					} as OfflineUser;
					users[uuids.indexOf(uuid)] = user;
					if (this.friends.has(uuid)) this.friends.set(uuid, user);
					else this._users.set(uuid, user);
					this.emit('playerUpdate', user);
				}
			})
		);
		return users;
	}

	/**
	 * Disconnect the Client immediately
	 */
	public disconnect() {
		this.manuallyDisconnected = true;
		this.socket.close();
	}
}

/** Events a Client can Emit */
export type ClientEvents = {
	/** The Client is connected */
	connected(): void;
	/** The Client has been logged into with an invalid access token and requires the `init()` method to be run again to re-login */
	invalid(): void;
	/** The Client has been manually disconnected and requires the `connect()` method to be run again to reconnect */
	disconnected(): void;

	/** A Notification has been recieved from the WebSocket */
	notification(title: string | null, message: string): void;
	/** The server has told us to intitate a Force Crash */
	forceCrash(): void;
	/** The server has sent us a message to put in the "Chat" */
	chatMessage(message: string): void;
	/** A player is playing an emote */
	playEmote(user: OnlineUser, emoteID: number, metadata: number): void;
	/** A player has been updated or added to the cache */
	playerUpdate(user: User): void;
	/** A new friend request has been created (incoming OR outgoing) */
	friendRequest(request: FriendRequest): void;
	/** A Friend Request has been handled */
	friendRequestHandled(request: FriendRequest, accepted: boolean): void;
	/** A Message has been recieved from a Friend */
	friendMessage(user: User, message: string): void;
	/** A friend of yours has removed you */
	friendRemove(user: User): void;
};
