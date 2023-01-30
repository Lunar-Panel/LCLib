import { BufWrapper } from "@minecraft-js/bufwrapper";

import Packet from "./Packet";

export default class ReceiveFriendRequestPacket extends Packet<ReceiveFriendRequest> {
	public static readonly id = 16;

	public constructor(buf?: BufWrapper) {
		super(buf);
	}

	public write(data: ReceiveFriendRequest): void {
		this.data = data;

		this.buf = new BufWrapper(null, { oneConcat: true });
		this.buf.writeVarInt(ReceiveFriendRequestPacket.id); // Packet ID

		this.buf.writeString(data.uuid);
		this.buf.writeString(data.username);
		this.buf.writeBoolean(data.outgoing);

		this.buf.finish();
	}

	public read(): void {
		this.data = {
			uuid: this.buf.readString(),
			username: this.buf.readString(),
			outgoing: this.buf.readBoolean(),
		};
	}
}

interface ReceiveFriendRequest {
	uuid: string;
	username: string;
	outgoing: boolean;
}
