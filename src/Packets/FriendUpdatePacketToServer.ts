import { BufWrapper } from '@minecraft-js/bufwrapper';

import { PlayerStatus } from '../Types';
import Packet from './Packet';

export default class FriendUpdatePacket extends Packet<FriendUpdate> {
	public static readonly id = 18;

	public constructor(buf?: BufWrapper) {
		super(buf);
	}

	public write(data: FriendUpdate): void {
		this.data = data;

		this.buf = new BufWrapper(null, { oneConcat: true });
		this.buf.writeVarInt(FriendUpdatePacket.id); // Packet ID

		this.buf.writeString(data.uuid);
		this.buf.writeString(data.name);
		this.buf.writeLong(data.status);
		this.buf.writeBoolean(data.online);
		this.buf.writeString(data.version);

		this.buf.finish();
	}

	public read(): void {
		this.data = {
			uuid: this.buf.readString(),
			name: this.buf.readString(),
			status: this.buf.readLong() as PlayerStatus,
			online: this.buf.readBoolean(),
			version: this.buf.readString(),
		};
	}
}

interface FriendUpdate {
	uuid: string;
	name: string;
	status: PlayerStatus;
	online: boolean;
	version: string;
}
