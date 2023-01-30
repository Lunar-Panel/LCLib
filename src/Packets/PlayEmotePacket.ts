import { BufWrapper } from '@minecraft-js/bufwrapper';
import { parseUUID } from '@minecraft-js/uuid';

import Packet from './Packet';

export default class PlayEmotePacket extends Packet<PlayEmote> {
	public static readonly id = 51;

	public constructor(buf?: BufWrapper) {
		super(buf);
	}

	public write(data: PlayEmote): void {
		this.data = data;

		this.buf = new BufWrapper(null, { oneConcat: true });
		this.buf.writeVarInt(PlayEmotePacket.id); // Packet ID
		this.buf.writeUUID(parseUUID(data.uuid));
		this.buf.writeInt(data.id);
		this.buf.writeInt(data.metadata);

		this.buf.finish();
	}

	public read(): void {
		this.data = {
			uuid: this.buf.readUUID().toString(true),
			id: this.buf.readInt(),
			metadata: this.buf.readInt()
		};
	}
}

interface PlayEmote {
	uuid: string;
	id: number;
	metadata: number;
}
