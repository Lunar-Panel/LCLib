import { Client } from "./Client";
import {
	IncomingPacketIDs,
	IncomingPacketTypes,
	OutgoingPacketIDs,
} from "./Packets";
import { FriendRequest, OfflineUser, OnlineUser, User } from "./Types";

export async function handle<T extends keyof IncomingPacketTypes>(
	client: Client,
	id: T,
	data: any
) {
	switch (id) {
		case IncomingPacketIDs.TaskListRequest:
			client.sendImpersistent(OutgoingPacketIDs.TaskList, { tasks: [] });
			break;
		case IncomingPacketIDs.HostListRequest:
			client.sendImpersistent(OutgoingPacketIDs.HostList, { hosts: [] });
			break;
		case IncomingPacketIDs.FriendList:
			for (const rawUser of data.offline) {
				const player = {
					uuid: rawUser.uuid,
					username: rawUser.displayName,
					offlineSince: rawUser.offlineSince,
					online: false,
				} as OfflineUser;
				client.friends.set(rawUser.uuid, player);
				client.emit("playerUpdate", player);
			}
			for (const rawUser of data.online) {
				const player = {
					uuid: rawUser.uuid,
					username: rawUser.displayName,
					offlineSince: 0,
					online: true,
					version: rawUser.version,
					server: rawUser.server || "In Menus",
					messages: [],
					lcUser: null,
				} as OnlineUser;
				client.friends.set(rawUser.uuid, player);
				client.emit("playerUpdate", player);
			}
			client.clientConsole._setEnabled(data.consoleAccess ?? false);
			client.friendRequestsEnabled = data.requestsEnabled;
			break;
		case IncomingPacketIDs.FriendUpdate:
			let player: User;
			if (data.online) {
				player = {
					uuid: data.uuid,
					username: data.name,
					offlineSince: 0,
					online: true,
					version: data.version,
					server: data.server || "In Menus",
					messages: [],
					lcUser: null,
				} as OnlineUser;
			} else {
				player = {
					uuid: data.uuid,
					username: data.name,
					offlineSince: data.offlineSince,
					online: false,
				} as OfflineUser;
			}
			client.friends.set(data.uuid, player);
			client.emit("playerUpdate", player);
			break;
		case IncomingPacketIDs.JoinServer:
			if (client.friends.get(data.uuid).online)
				(client.friends.get(data.uuid) as OnlineUser).server =
					data.server || "In Menus";
			else {
				client.friends.set(data.uuid, {
					uuid: data.uuid,
					username: client.friends.get(data.uuid).username,
					offlineSince: 0,
					online: true,
					version: null,
					server: "In Menus",
					messages: [],
					lcUser: null,
				} as OnlineUser);
			}
			client.emit("playerUpdate", client.friends.get(data.uuid));
			break;
		case IncomingPacketIDs.PlayerInfo:
			if (data.uuid == client.uuidWithDashes) client.user = data;
			else {
				if (client.friends.get(data.uuid).online)
					(client.friends.get(data.uuid) as OnlineUser).lcUser = data;
				else if (client.friends.has(data.uuid)) {
					client.friends.set(data.uuid, {
						uuid: data.uuid,
						username: client.friends.get(data.uuid).username,
						offlineSince: 0,
						online: true,
						version: null,
						server: "In Menus",
						messages: [],
						lcUser: data,
					} as OnlineUser);
				} else {
					client._users.set(data.uuid, {
						uuid: data.uuid,
						username: client.friends.get(data.uuid).username,
						offlineSince: 0,
						online: true,
						version: null,
						server: "In Menus",
						messages: [],
						lcUser: data,
					} as OnlineUser);
				}
				client.emit("playerUpdate", client.friends.get(data.uuid));
			}
			break;
		case IncomingPacketIDs.FriendRequest:
			var req = {
				uuid: data.uuid,
				username:
					data.username ||
					(await client.userManager.fetchUUID(data.uuid)).username,
				outgoing: false,
			} as FriendRequest;
			client.friendRequests.set(data.uuid, req);
			await client.fetchPlayers(data.uuid);
			client.emit("friendRequest", req);
			break;
		case IncomingPacketIDs.ReceiveFriendRequest:
			var req = {
				uuid: data.uuid,
				username:
					data.username ||
					(await client.userManager.fetchUUID(data.uuid)).username,
				outgoing: data.outgoing,
			} as FriendRequest;
			client.friendRequests.set(data.uuid, req);
			await client.fetchPlayers(data.uuid);
			client.emit("friendRequest", req);
			break;
		case IncomingPacketIDs.RemoveFriend:
			if (!client.friends.has(data.uuid)) break;
			client._users.set(data.uuid, client.friends.get(data.uuid));
			client.emit("friendRemove", client.friends.get(data.uuid));
			client.friends.delete(data.uuid);
			break;
		case IncomingPacketIDs.FriendResponse:
			if (data.accepted) {
				const player = {
					uuid: data.uuid,
					username: client.friendRequests.get(data.uuid).username,
					offlineSince: Date.now(),
					online: false,
				} as OfflineUser;
				client.friends.set(data.uuid, player);
				await client.fetchPlayers(data.uuid);
				client.emit("playerUpdate", player);
			}
			client.emit(
				"friendRequestHandled",
				client.friendRequests.get(data.uuid),
				data.accepted
			);
			client.friendRequests.delete(data.uuid);
			break;
		case IncomingPacketIDs.PendingRequests:
			data.bulk.forEach(async (request) => {
				const req = {
					uuid: request.uuid,
					username:
						request.username ||
						(await client.userManager.fetchUUID(request.uuid))
							.username,
					outgoing: false,
				} as FriendRequest;
				client.friendRequests.set(request.uuid, req);
				client.emit("friendRequest", req);
			});
			await client.fetchPlayers(data.bulk.map((req) => req.uuid));
			break;
		case IncomingPacketIDs.Notification:
			client.emit("notification", data.title || null, data.message || "");
			break;
		case IncomingPacketIDs.ForceCrash:
			client.emit("forceCrash");
			break;
		case IncomingPacketIDs.ConsoleMessage:
			client.clientConsole._add(data.message || "");
			break;
		case IncomingPacketIDs.ChatMessage:
			client.emit("chatMessage", data.message || "");
			break;
		case IncomingPacketIDs.FriendMessage:
			if (client.friends.get(data.uuid)?.online) {
				(client.friends.get(data.uuid) as OnlineUser).messages.push({
					uuid: data.uuid,
					message: data.message,
				});
				client.emit(
					"friendMessage",
					client.friends.get(data.uuid),
					data.message || ""
				);
			}
			break;
		case IncomingPacketIDs.GiveEmotes:
			client.emotes = data;
			break;
		case IncomingPacketIDs.PlayEmote:
			if (client.users.get(data.uuid)?.online)
				client.emit(
					"playEmote",
					client.users.get(data.uuid) as OnlineUser,
					data.id,
					data.metadata
				);
			break;
		default:
			client.logger.warn(
				`---------------------------------\nRECIEVED UNKNOWN PACKET: ${id}\n\n`,
				data,
				"\n---------------------------------"
			);
			break;
	}
}
