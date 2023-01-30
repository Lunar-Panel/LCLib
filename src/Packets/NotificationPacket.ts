import { BufWrapper } from "@minecraft-js/bufwrapper";

import Packet from "./Packet";

function processColorCodes(str: string): string {
	const count = str.split("§").length - 1;
	return str + " ".repeat(count);
}

export default class NotificationPacket extends Packet<Notification> {
	public static readonly id = 3;

	public constructor(buf?: BufWrapper) {
		super(buf);
	}

	public write(data: Notification): void {
		this.data = data;

		this.buf = new BufWrapper(null, { oneConcat: true });
		this.buf.writeVarInt(NotificationPacket.id); // Packet ID

		this.buf.writeString(processColorCodes(data.title));
		this.buf.writeString(processColorCodes(data.message));

		this.buf.finish();
	}

	public read(): void {
		this.data = {
			title: this.buf.readString(),
			message: this.buf.readString(),
		};
	}
}

interface Notification {
	title: string;
	message: string;
}
