import { BufWrapper } from '@minecraft-js/bufwrapper';
import { parseUUID } from '@minecraft-js/uuid';
import Packet from './Packet';

export default class PlayerInfoRequestPacket extends Packet<PlayerInfoRequest> {
	public static readonly id = 48;

	public constructor(buf?: BufWrapper) {
		super(buf);
	}

	public write(data: PlayerInfoRequest): void {
		this.data = data;

		this.buf = new BufWrapper(null, { oneConcat: true });
		this.buf.writeVarInt(PlayerInfoRequestPacket.id); // Packet ID

		this.buf.writeVarInt(data.uuids.length);
		for (const uuid of data.uuids) {
			this.buf.writeUUID(parseUUID(uuid));
		}

		this.buf.finish();
	}

	public read(): void {
		const uuidsLength = this.buf.readVarInt();
		const uuids: string[] = [];
		for (let i = 0; i < uuidsLength; i++) {
			uuids.push(this.buf.readUUID().toString());
		}

		this.data = { uuids };
	}
}

interface PlayerInfoRequest {
	uuids: string[];
}
