import { BufWrapper } from '@minecraft-js/bufwrapper';
import ApplyCosmeticsPacket from './ApplyCosmeticsPacket';
import ChatMessagePacket from './ChatMessagePacket';
import ClientBanPacket from './ClientBanPacket';
import ConsoleMessagePacket from './ConsoleMessagePacket';
import DoEmotePacket from './DoEmotePacket';
import EquipEmotesPacket from './EquipEmotesPacket';
import ForceCrashPacket from './ForceCrashPacket';
import FriendListPacket from './FriendListPacket';
import FriendMessagePacket from './FriendMessagePacket';
import FriendRequestPacket from './FriendRequestPacket';
import FriendResponsePacket from './FriendResponsePacket';
import FriendUpdatePacket from './FriendUpdatePacket';
import GiveEmotesPacket from './GiveEmotesPacket';
import HostListPacket from './HostListPacket';
import HostListRequestPacket from './HostListRequest';
import JoinServerPacket from './JoinServerPacket';
import KeepAlivePacket from './KeepAlivePacket';
import NotificationPacket from './NotificationPacket';
import Packet from './Packet';
import PacketId71 from './PacketId71';
import UpdatePlusColorsPacket from './UpdatePlusColors';
import PendingRequestsPacket from './PendingRequestsPacket';
import PlayEmotePacket from './PlayEmotePacket';
import PlayerInfoPacket from './PlayerInfoPacket';
import PlayerInfoRequestPacket from './PlayerInfoRequestPacket';
import ReceiveFriendRequestPacket from './ReceiveFriendRequest';
import RemoveFriendPacket from './RemoveFriendPacket';
import TaskListPacket from './TaskListPacket';
import TaskListRequestPacket from './TaskListRequestPacket';
import ToggleFriendRequestsPacket from './ToggleFriendRequestsPacket';
import UpdateVisiblePlayersPacket from './UpdateVisiblePlayersPacket';

export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

/** From Server */
export const IncomingPackets = [ConsoleMessagePacket, NotificationPacket, FriendListPacket, FriendMessagePacket, JoinServerPacket, PendingRequestsPacket, PlayerInfoPacket, FriendRequestPacket, ReceiveFriendRequestPacket, RemoveFriendPacket, FriendUpdatePacket, FriendResponsePacket, ForceCrashPacket, TaskListRequestPacket, PlayEmotePacket, GiveEmotesPacket, ChatMessagePacket, HostListRequestPacket, UpdatePlusColorsPacket];

export type IncomingPacketTypes = {
	[key in ArrayElement<typeof IncomingPackets>['id']]: Extract<
		ArrayElement<typeof IncomingPackets>,
		{
			id: key;
		}
	> extends typeof Packet<infer U>
		? U
		: never;
};

/** To Server */
export const OutgoingPackets = [DoEmotePacket, ConsoleMessagePacket, JoinServerPacket, EquipEmotesPacket, ApplyCosmeticsPacket, PlayerInfoRequestPacket, FriendMessagePacket, FriendRequestPacket, FriendResponsePacket, KeepAlivePacket, TaskListPacket, HostListPacket, RemoveFriendPacket, ToggleFriendRequestsPacket, UpdateVisiblePlayersPacket, PacketId71];

export type OutgoingPacketTypes = {
	[key in ArrayElement<typeof OutgoingPackets>['id']]: Extract<
		ArrayElement<typeof OutgoingPackets>,
		{
			id: key;
		}
	> extends typeof Packet<infer U>
		? U
		: never;
};

export enum IncomingPacketIDs {
	ConsoleMessage = 2,
	Notification = 3,
	FriendList = 4,
	FriendMessage = 5,
	JoinServer = 6,
	PendingRequests = 7,
	PlayerInfo = 8,
	FriendRequest = 9,
	ReceiveFriendRequest = 16,
	RemoveFriend = 17,
	FriendUpdate = 18,
	FriendResponse = 21,
	ForceCrash = 33,
	TaskListRequest = 35,
	PlayEmote = 51,
	GiveEmotes = 57,
	ChatMessage = 65,
	HostListRequest = 67
	// UpdatePlusColors = 73
	// ClientBan = 1056
}

export enum OutgoingPacketIDs {
	ConsoleMessage = 2,
	FriendMessage = 5,
	JoinServer = 6,
	FriendRequest = 9,
	RemoveFriend = 17,
	// ApplyCosmetics = 20,
	FriendResponse = 21,
	ToggleFriendRequests = 22,
	// ConstantChanged = 24,
	TaskList = 36,
	// DoEmote = 39,
	PlayerInfoRequest = 48,
	// UpdateVisiblePlayers = 50,
	// EquipEmotes = 56,
	KeepAlive = 64,
	HostList = 68
}

export function writePacket(id: number, data: any = {}): Packet | void {
	const Packet = OutgoingPackets.find(p => p.id == id);

	if (!Packet) throw new Error(`No Packet Found While Writing, ID ${id}`);

	const packet = new Packet();
	packet.write(data);

	return packet;
}

export function readPacket(data: Buffer): { id: number; data: Packet } | void {
	const buf = new BufWrapper(data);

	const id = buf.readVarInt();
	const Packet = IncomingPackets.find(p => p.id == id);

	if (!Packet) throw new Error(`No Packet Found While Reading, ID ${id}`);

	const packet = new Packet(buf);
	packet.read();

	return { id: Packet.id, data: packet };
}
