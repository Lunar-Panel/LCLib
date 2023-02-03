import { Client } from '../Client';
import { OutgoingPacketIDs } from '../Packets';

export default class ClientConsole {
	public client: Client;

	public enabled: boolean;

	public logs: {
		sender: 'server' | 'client';
		message: string;
	}[] = [];

	constructor(client: Client) {
		this.client = client;
	}

	public setEnabled(enabled: boolean) {
		this.enabled = !!enabled;
	}

	public _add(message: string) {
		this.logs.push({ sender: 'server', message });
	}

	public async write(message: string = '') {
		if (!this.enabled) return false;
		this.logs.push({ sender: 'client', message });
		return await this.client.sendPersistent(OutgoingPacketIDs.ConsoleMessage, {
			message
		});
	}

	public _clear() {
		this.logs = [];
	}
}
