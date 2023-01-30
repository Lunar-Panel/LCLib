/** Data for a Minecraft Account */
export interface MCAccount {
	token: string;
	username: string;
	uuid: string;
}

/** Possible states for the Client */
export enum ClientState {
	/** `init()` needs to be run on the Client with a valid access token, the state resets here when the access token is invalid */
	REQUIRES_INIT = 1,
	/** The Client is initiated and logged in, the state resets here when manually disconnected */
	INITIATED = 2,
	/** Connecting or Reconnecting to WebSocket (this includes the process of LC Auth) */
	CONNECTING = 3,
	/** Connected to WebSocket */
	CONNECTED = 4
}

export type ClientEvents = {
	/** The Client is connected */
	connected(): void;
	/** The Client has been logged into with an invalid access token and requires the `init()` method to be run again to re-login */
	invalid(): void;
	/** The Client has been manually disconnected and requires the `connect()` method to be run again to reconnect */
	disconnected(): void;
};

export interface UserState {
	accountType: 'XBOX';
	arch: string;
	branch: 'master';
	clothCloak: 'true' | 'false';
	gitCommit: string;
	hatHeightOffset: string;
	hwid: string;
	launcherVersion: string;
	lunarPlusColor: string;
	os: string;
	protocolVersion: string;
	server: string;
	showHatsOverHelmet: 'true' | 'false';
	showHatsOverSkinLayer: 'true' | 'false';
	version: string;
	flipShoulderPet: 'true' | 'false';
	ichorModules: string;
	showOverBoots: 'true' | 'false';
	showOverChestplate: 'true' | 'false';
	showOverLeggings: 'true' | 'false';
	Host: 'assetserver.lunarclientprod.com';

	username: string;
	playerId: string;
}

export interface ClientOptions {
	debug: boolean;
}
