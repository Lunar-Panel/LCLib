# Documentation

## **Client**

<br/>

## Properties

<br/>

### `state`

`1 | 2 | 3 | 4`

The state of the Client:

- 1 = The `init()` method hasn't been called yet OR there was an invalid access token (you will be notified of that with an event)
- 2 = The Client is initiated but the `connect()` method hasn't been called yet OR the Client was manually disconnected
- 3 = The Client is connecting or reconnecting to the WebSocket
- 4 = The Client is connected to the WebSocket

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

#### `init(access_token: string, minecraft_token?: boolean): Promise<void>`

Initiate the Client (must be the first thing you do to the Client) with either a **Microsoft Access Token** OR a **Minecraft Authed Access Token**, but you must set the second argument to true.

#### `connect(userState): Promise<void>`

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

The Client has connected and you may begin doing whatever you want, will only be sent once for every time you run `connect()`.

### `open`

The Client has opened a connection, **can be sent multiple times**.

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
