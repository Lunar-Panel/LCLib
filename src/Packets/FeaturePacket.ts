import { BufWrapper } from '@minecraft-js/bufwrapper';

import Packet from './Packet';

export default class FeaturePacket extends Packet<FeatureChange> {
	public static readonly id = 104;

	public constructor(buf?: BufWrapper) {
		super(buf);
	}

	public write(data: FeatureChange): void {
		this.data = data;

		this.buf = new BufWrapper(null, { oneConcat: true });
		this.buf.writeVarInt(FeaturePacket.id); // Packet ID

		this.buf.writeString(data.server);
		this.buf.writeString(data.feature);

		this.buf.finish();
	}

	public read(): void {
		this.data = {
			server: this.buf.readString(),
			feature: this.buf.readString(),
		};
	}
}

interface FeatureChange {
	server: string;
	feature: string;
}
