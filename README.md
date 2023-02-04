# [**LCLib**](https://github.com/TBHGodPro/LCLib)

A library to access the Lunar Client Assets WebSocket easily and quickly, comes with:

- Automatic State Handling
- Reconnects
- Unmatched Speed
- Reliable Anti-Crashing Systems
- Built-In Utilities for you to use

## **Getting Started**

Before you begin, I recommend installing the `typed-emitter` npm package along with this one as it helps a lot with event names and arguments.

First off, install the package by simply running `npm install lc-lib`. Once it installs, go to your main file and import it with either of these ways:

```js
// ES6
import Lunar from 'lc-lib';

// CommonJS
const Lunar = require('lc-lib');
```

Now, you can create a client:

```js
const client = new Lunar.Client({
	// Enable if you want to see built-in logging details from the library, useful for debugging and testing
	debug: false
});
```

Next up, you need to get a **Microsoft Access Token**, and then you need to initiate the Client, connect, and wait for the `connected` event before running any code:

```js
const userState = {
	arch: 'x64',
	branch: 'master',
	clothCloak: 'false',
	gitCommit: 'd5e1bcee71328b1885a0365ea1c079b12b0dc4ee',
	hatHeightOffset: '[{"id":3520,"height":0.0},{"id":2628,"height":0.0},{"id":3471,"height":0.0},{"id":3472,"height":0.0},{"id":2583,"height":0.0},{"id":2584,"height":0.0},{"id":2526,"height":0.0},{"id":2527,"height":0.0},{"id":2528,"height":0.0},{"id":2856,"height":0.0},{"id":2540,"height":0.0},{"id":2541,"height":0.0},{"id":2542,"height":0.0},{"id":3438,"height":0.0},{"id":2543,"height":0.0},{"id":3439,"height":0.0},{"id":2544,"height":0.0},{"id":2545,"height":0.0},{"id":2424,"height":0.0},{"id":2490,"height":0.0},{"id":2491,"height":0.0},{"id":2492,"height":0.0},{"id":2493,"height":0.0},{"id":2494,"height":0.0},{"id":2558,"height":0.0},{"id":2559,"height":0.0},{"id":3519,"height":0.0}]',
	hwid: 'not supplied',
	launcherVersion: 'not supplied',
	lunarPlusColor: '-1',
	os: 'Windows',
	server: '',
	showHatsOverHelmet: 'false',
	showHatsOverSkinLayer: 'true',
	version: 'v1_8',
	flipShoulderPet: 'false',
	ichorModules: 'common,optifine,lunar',
	showOverBoots: 'true',
	showOverChestplate: 'true',
	showOverLeggings: 'true'
};

// Using callbacks

client.init(access_token).then(() => client.connect(userState));

// Using async/await (either in an async function or in an mjs file)

await client.init(access_token);

client.connect(userState);

// Waiting for connected event

client.on('connected', () => {
	// Code Here
});

// OR (in an async/await context)

import { once } from 'events';
const { once } = require('events');

await once(client, 'connected');

// Code Here
```

And now you're ready to go!

## **Client Info**

<br/>

## Properties

<br/>

### `state`

`1 | 2 | 3 | 4`

The state of the Client:

- 1 = The `init()` method hasn't been called yet OR there was an invalid access token (you will be notified of that with an event)
- 2 = The Client is initiated but the `connect()` method hasn't been called yet OR the Client was manually disconnected
- 3 = The Client is connecting or reconnecting to the WebSocket (you can still run methods at this time IF it is reconnecting, not if it is the inital connect)
- 4 = The Client is connected to the WebSocket and has a live connecting going

### `account`

`{ username: string, uuid: string, token: string }`

The account info for the Client containing the Username, UUID, and **Minecraft Access Token**.

### `user`

`LCUser`

The Lunar Client User info for the User.

### `_users`

`Map<string, User>`

All cached users that are not friends (NOT RELIABLE, DO NOT USE).

### `friends`

`Map<string, User>`

All friends of the User.

### `users`

`Map<string, User>`

All users the user has cached, including friends.

### `friendRequests`

`Map<string, FriendRequest>`

All friend requests for the user, incoming and outgoing.

### `clientConsole`

`ClientConsole`

The in-client console where you can send console messages to and from the Server, but it only works if the `allowed` property on it is `true`.

You can run `client.clientConsole.write(message)` to send messages and you can get all messages from `client.clientConsole.logs`.

### `emotes`

`{ owned: number[]; equipped: number[] }`

All emotes owned and equipped (shown in the emotes menu) for the user.

### `friendRequestsEnabled`

`boolean`

Whether Incoming Friend Requests are enabled for the Client User

<br/>

## Methods

<br/>

#### `init(access_token: string): Promise<void>`

Initiate the Client (must be the first thing you do to the Client) with a **Microsoft Access Token**.

#### `connect(userState): void`

Connect to the Lunar Client WebSocket after initiating with the specified User State.

#### `sendMessage(user: User | string, message: string): Promise<boolean>`

Send a message to the User (specified either with a User object or User UUID).

Returns whether it was successful.

#### `changeServer(server: string): Promise<boolean>`

Change the Server of the Client (only changes what Lunar Client thinks it is, not the real server).

Returns whether it was successful.

#### `sendFriendRequest(data: { uuid?: string; username?: string; }): Promise<boolean>`

Send a friend request to a User, you must specify either a UUID or a Username to send the request to (preferably both for faster speed).

Returns whether it was successful.

#### `removeFriend(user: User | string): Promise<boolean>`

Remove a friend (specified with either a User object or User UUID).

Returns whether it was successful.

#### `handleFriendRequest(request: FriendRequest | string, accepted: boolean = false): Promise<boolean>`

Handle a friend request (specified with either the Friend Request Object or the Friend Request sender/reciever UUID).

If the request is outgoing, you can only deny it (which is just revoking it).

Returns whether it was successful.

#### `toggleFriendRequests(enabled: boolean): Promise<boolean>`

Toggles your incoming friend requests ON or OFF.

Returns whether it was successful.

#### `fetchPlayers(...uuids: string[]): Promise<Array<User> | null>`

Fetches all the players with the uuids specified from Lunar.

You will recieve `null` as a response if there was an error.

<br/>

## Events

<br/>

### `connected`

The Client has connected and you may begin doing whatever you want.

### `invalid`

The Client's **Microsoft Access Token** was invalid and you need to run the `init()` method again with a new one.

### `disconnected`

The Client has been manually disconnected and requires the `connect()` method to be run again to reconnect.

<br/>

### `notification`

A notification has been sent to the User from the Server, passes along `title` and `message` arguments.

### `forceCrash`

The server has requested a Force Crash to the User.

### `chatMessage`

The server has requested to send a message to the client in the chat, comes with a `message` argument.

### `playEmote`

The server has said that a User is playing an emote.

Passes along a `user` as a User Object, an `emoteID`, and `metadata` (a number idk what it means).

### `playerUpdate`

A player has been updated and their data has been modified (not guaranteed to have changed), the player is passed in the `user` argument.

### `friendRequest`

A new friend request has been sent to the Client, contained in the `request` argument.

### `friendRequestHandled`

An outgoing friend request has been handled, contains `request` and `accepted` properties.

### `friendMessage`

A friend has sent you a message, contains `user` and `message` properties.

### `friendRemove`

A friend of yours has removed you, contained in the `user` argument. This user is still stored in the `users` property as it is moved from the `friends` Map to the `_users` Map.

<br/><br/>

And that's it!

Good luck on your journey exploring the Lunar Client Backend, and I hope you don't suffer as much as I did while making this!

<br/>

Credits:

- [LunarSocket by Solar Tweaks](https://github.com/Solar-Tweaks/LunarSocket) for the Packet declarations and reading/writing, although I did change a lot with my findings
- [MinecraftJS](https://github.com/MinecraftJS) for the UUID and BufWrapper Packages which really helped in development and made it MUCH easier
- [Leoo](https://github.com/heyitsleo) for helping out a lot during the testing phase and keeping me mentally sane (at least somewhat)
