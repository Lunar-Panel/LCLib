import { BufWrapper } from "@minecraft-js/bufwrapper";

function processColorCodes(str: string): string {
	const count = str.split("§").length - 1;
	return str + " ".repeat(count);
}

import Packet from "./Packet";

export default class ConsoleMessagePacket extends Packet<ConsoleMessage> {
	public static readonly id = 2;

	public constructor(buf?: BufWrapper) {
		super(buf);
	}

	public write(data: ConsoleMessage): void {
		this.data = data;

		this.buf = new BufWrapper(null, { oneConcat: true });
		this.buf.writeVarInt(ConsoleMessagePacket.id); // Packet ID

		this.buf.writeString(processColorCodes(data.message));

		this.buf.finish();
	}

	public read(): void {
		this.data = {
			message: this.buf.readString(),
		};
	}
}

interface ConsoleMessage {
	message: string;
}
