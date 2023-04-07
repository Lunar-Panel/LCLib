import { Client } from "../Client";
import { OutgoingPacketIDs } from "../Packets";

/** The Console for the Client */
export default class ClientConsole {
	/** The Client the Console is related to */
	public client: Client;

	/** Whether the Client is allowed to send Console messages */
	public enabled: boolean;

	/** All logs */
	public logs: {
		sender: "server" | "client";
		message: string;
	}[] = [];

	/**
	 * The Console for the Client
	 * @param client  The Client the Console is related to
	 */
	constructor(client: Client) {
		this.client = client;
	}

	public _setEnabled(enabled: boolean) {
		this.enabled = !!enabled;
	}

	public _add(message: string = "") {
		this.logs.push({ sender: "server", message });
	}

	/**
	 * Write a message to the Client Console
	 * @param message The message
	 * @returns Whether the console send was successful
	 */
	public async write(message: string = "") {
		if (!this.enabled) return false;
		if (
			!(await this.client.sendPersistent(
				OutgoingPacketIDs.ConsoleMessage,
				{
					message,
				}
			))
		)
			return false;
		else {
			this.logs.push({ sender: "client", message });
			return true;
		}
	}

	/** Clear the logs (Client-Side) */
	public clear() {
		this.logs = [];
	}
}
