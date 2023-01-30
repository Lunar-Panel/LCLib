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
import PacketId73 from './PacketId73';
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
export const IncomingPackets = [GiveEmotesPacket, PlayEmotePacket, NotificationPacket, PlayerInfoPacket, FriendListPacket, FriendMessagePacket, PendingRequestsPacket, FriendRequestPacket, FriendResponsePacket, ForceCrashPacket, TaskListRequestPacket, HostListRequestPacket, ClientBanPacket, FriendUpdatePacket, JoinServerPacket, ReceiveFriendRequestPacket, ChatMessagePacket];

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
export const OutgoingPackets = [DoEmotePacket, ConsoleMessagePacket, JoinServerPacket, EquipEmotesPacket, ApplyCosmeticsPacket, PlayerInfoRequestPacket, FriendMessagePacket, FriendRequestPacket, FriendResponsePacket, KeepAlivePacket, TaskListPacket, HostListPacket, RemoveFriendPacket, ToggleFriendRequestsPacket, UpdateVisiblePlayersPacket, PacketId71, PacketId73];

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

export function writePacket(id: number, data: any): Packet | void {
	const Packet = OutgoingPackets.find(p => p.id == id);

	if (!Packet) return console.error(`No Packet Found While Writing, ID ${id}, Data`, data);

	const packet = new Packet();
	packet.write(data);

	return packet;
}

export function readPacket(data: Buffer): Packet | void {
	const buf = new BufWrapper(data);

	const id = buf.readVarInt();
	const Packet = IncomingPackets.find(p => p.id == id);

	if (!Packet) return console.error(`No Packet Found While Reading, ID ${id}, Data`, data);

	const packet = new Packet(buf);
	packet.read();

	return packet;
}
