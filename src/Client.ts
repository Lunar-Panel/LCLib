import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import { WebSocket } from 'ws';
import { Logger } from './Logger';
import { OutgoingPacketTypes, readPacket } from './Packets';
import Packet from './Packets/Packet';
import { ClientEvents, ClientOptions, ClientState, MCAccount, UserState } from './Types';
import { loginToMinecraft, lunarAuth } from './utils';

/** The LunarLib Client */
export class Client extends (EventEmitter as new () => TypedEmitter<ClientEvents>) {
	/** The State of the Client */
	public state: ClientState;
	/** The Client Logger */
	public logger: Logger;

	/** The Client's Minecraft Account */
	public account: MCAccount;
	/** The Client's Lunar Client State */
	public userState: UserState;

	/** The currently active WebSocket */
	public socket: WebSocket;

	/** Whether the Client has sent the `connected` event */
	public sentConnected: boolean = false;

	/**
	 * The LunarLib Client
	 */
	constructor(options: Partial<ClientOptions>) {
		super();
		this.setMaxListeners(0);
		this.logger = new Logger(options.debug ?? false);
		this.state = ClientState.REQUIRES_INIT;
	}

	public async init(access_token: string) {
		if (this.state != ClientState.REQUIRES_INIT) return;
		try {
			this.account = await loginToMinecraft(access_token);
			this.state = ClientState.INITIATED;
			this.logger.log('Successfully Logged In');
		} catch {
			this.emit('disconnected');
			this.state = ClientState.REQUIRES_INIT;
			this.logger.error('Failed to Log In');
		}
	}

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

		state.playerId = this.account.uuid;
		state.playerId = state.playerId.slice(0, 8) + '-' + state.playerId.slice(8, 12) + '-' + state.playerId.slice(12, 16) + '-' + state.playerId.slice(16, 20) + '-' + state.playerId.slice(20, 32);

		this.userState = state as UserState;

		this._connect();
	}

	private async _connect() {
		if (this.state != ClientState.INITIATED) return;
		this.state = ClientState.CONNECTING;
		this.logger.debug('Connecting...');
		this.socket = null;

		let lunarToken: string;
		try {
			lunarToken = await lunarAuth(this.account.token, this.account.username, this.account.uuid);
		} catch (err) {
			this.state = ClientState.REQUIRES_INIT;
			this.sentConnected = false;
			this.logger.error('Lunar Auth Failed');
			return this.emit('invalid');
		}

		this.socket = new WebSocket('wss://assetserver.lunarclientprod.com/connect/', {
			headers: { ...this.userState, Authorization: lunarToken }
		});

		this.socket.on('open', () => {
			this.logger.debug('Connected!');
			this.state = ClientState.CONNECTED;
			if (!this.sentConnected) {
				this.sentConnected = true;
				this.emit('connected');
			}
		});

		this.socket.on('close', (code, reason) => {
			this.logger.debug(`Disconnected with Code ${code} and Reason "${reason ?? 'No Reason Given'}"`);
			this._connect();
		});

		this.socket.on('error', err => {
			this.logger.error('WebSocket Error', err);
		});

		this.socket.on('message', packet => {
			let data: Packet;
			try {
				data = readPacket(packet as Buffer) as Packet;
			} catch (err) {
				return this.logger.error('WebSocket Message Error', err);
			}
			console.log(data);
		});
	}

	public async send<T extends keyof OutgoingPacketTypes>(id: T, data: OutgoingPacketTypes[T]) {}
}
