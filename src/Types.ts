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
	CONNECTED = 4,
}

/** State for a User */
export interface UserState {
	/** Account Type (Immutable) */
	accountType: 'XBOX';
	/** Operating System Architecture */
	arch: string;
	/** Lunar Client Branch (Immutable) */
	branch: 'master';
	/** Cloth Cloaks Enabled (`false` Recommended) */
	clothCloak: string;
	/** Lunar Client Git Commit (Recommended Empty) */
	gitCommit: string;
	/** Data for Hat Height Offset */
	hatHeightOffset: string;
	/** Machine HWID */
	hwid: string;
	/** Launcher Version (Recommended Empty) */
	launcherVersion: string;
	/** Color of Lunar Plus (`-1` Recommended) */
	lunarPlusColor: string;
	/** Operating System */
	os: string;
	/** Lunar Client Protocol Version (8 | Immutable) */
	protocolVersion: string;
	/** Server logged into */
	server: string;
	/** Show hats over helmet */
	showHatsOverHelmet: string;
	/** Show hats over second skin layer */
	showHatsOverSkinLayer: string;
	/** Game Version */
	version: string;
	/** Flip shoulder of shoulder pet */
	flipShoulderPet: string;
	/** Ichor Modules Being Used (Recommended Empty) */
	ichorModules: string;
	/** Show cosmetics over boots */
	showOverBoots: string;
	/** Show cosmetics over chestplate */
	showOverChestplate: string;
	/** Show cosmetics over leggings */
	showOverLeggings: string;
	/** WebSocket Host (Immutable) */
	Host: 'assetserver.lunarclientprod.com';

	/** Player Username (Immutable) */
	username: string;
	/** Player UUID with Dashes (Immutable) */
	playerId: string;
}

/** Options for a Client */
export interface ClientOptions {
	/** Whether to enable built-in debug logging */
	debug: boolean;

	/**
	 * A replacement for the WebSocket used, must allow sending headers and buffers and have properties such as readyStates
	 *
	 * MUST HAVE THE SAME FORMAT AS NPM PACKAGE `ws`
	 */
	WebSocket: any;
	/**
	 * A replacement for the fetch used, must allow sending headers + body and recieving responses
	 *
	 * MUST HAVE THE SAME FORMAT AS NPM PACKAGE `node-fetch`
	 */
	fetch: any;
	/**
	 * A Custom Socket URL that the Client should connect to, defaults to "wss://assetserver.lunarclientprod.com/connect/"
	 */
	socketURL: string;
}

/** An Offline User */
export interface OnlineUser {
	/** User UUID */
	uuid: string;
	/** User Username */
	username: string;
	/** When the User went offline (`0` since online) */
	offlineSince: 0;
	/** Whether the User is online */
	online: true;
	/** What version the User is playing on */
	version: string;
	/** What server the User is playing on (`"In Menus"` when not on a server) */
	server: string;
	/** The LCUser of the User, only when it's been fetched or in some special and unreliable scenarios */
	lcUser?: LCUser;
	/** All messages you have sent to or recieved from this player (resets once they go offline) */
	messages?: {
		/** UUID of the player who sent the message */
		uuid: string;
		/** The Message Text */
		message: string;
	}[];
}

/** An Online User */
export interface OfflineUser {
	/** User UUID */
	uuid: string;
	/** User Username */
	username: string;
	/** When the User went offline */
	offlineSince: number;
	/** Whether the User is online */
	online: false;
}

/** A User, either Online or Offline */
export type User = OnlineUser | OfflineUser;

/** Data for a User when fetched from Lunar Client, only available when online */
export interface LCUser extends PlayerInfo {}

/** A Pending Friend Request */
export interface FriendRequest {
	/** User UUID */
	uuid: string;
	/** User Username */
	username: string;
	/** Whether the request is outgoing */
	outgoing: boolean;
}

/** A User fetched from Mojang API */
export interface FetchedUser {
	/** User UUID */
	uuid: string;
	/** User Username */
	username: string;
}

/** Possible User Statuses */
export enum PlayerStatus {
	ONLINE,
	AWAY,
	BUSY,
	INVISIBLE,
	OFFLINE,
}

/** Lunar Client User Data for a Player */
export interface PlayerInfo {
	uuid: string;
	cosmetics: Cosmetic[];
	color: number;
	unknownBooleanA: boolean;
	premium: boolean;
	clothCloak: boolean;
	showHatAboveHelmet: boolean;
	scaleHatWithHeadwear: boolean;
	adjustableHeightCosmetics: { [key: string]: number };
	plusColor: number;
	petFlipShoulder: boolean;
	unknownBooleanB: boolean;
	unknownBooleanC: boolean;
	unknownBooleanD: boolean;
}

/** Lunar Client Cosmetic */
export interface Cosmetic {
	id: number;
	equipped: boolean;
}
