import { Client } from '../Client';
import { FetchedUser } from '../Types';
import { parseUUIDWithDashes } from '../utils';

/** A Manager for Users */
export default class UserManager {
	/** The Client that the User Manager is for */
	public client: Client;

	/** The Cached Users */
	public users: FetchedUser[] = [];

	/**
	 * A Manager for Users
	 * @param client The Client that the User Manager is for
	 */
	constructor(client: Client) {
		this.client = client;
	}

	/**
	 * Fetch a User with the specified UUID
	 * @param uuid The UUID
	 * @param force Set to `true` to skip cache check
	 * @returns The User (or throws an error if failed)
	 */
	public async fetchUUID(uuid: string, force = false) {
		if (typeof uuid !== 'string')
			throw new Error('UUID must be a valid UUID String');

		uuid = parseUUIDWithDashes(uuid);

		if (!force) {
			const user = this.users.find((u) => u.uuid == uuid);
			if (user) return user;
		}

		const data = (await this.client
			.fetch(
				`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`
			)
			.then(async (res) => {
				const status = res.status;

				if (status === 200) {
					const data = await res.json();
					return {
						username: data.name,
						uuid: parseUUIDWithDashes(data.id),
					};
				} else return null;
			})
			.catch(() => null)) as FetchedUser;

		if (!data) throw new Error("User doesn't exist!");

		const userCached = this.users.findIndex((u) => u.uuid == data.uuid);

		if (userCached === -1) this.users.push(data);
		else this.users[userCached] = data;

		return data;
	}

	/**
	 * Fetch a User with the specified Username
	 * @param username The Username
	 * @param force Set to `true` to skip cache check
	 * @returns The User (or throws an error if failed)
	 */
	public async fetchUsername(username: string, force = false) {
		if (typeof username !== 'string')
			throw new Error('Username must be a valid string');

		if (!force) {
			const user = this.users.find((u) => u.username == username);
			if (user) return user;
		}

		const data = (await this.client
			.fetch(
				`https://api.mojang.com/users/profiles/minecraft/${username}`
			)
			.then(async (res) => {
				const status = res.status;

				if (status === 200) {
					const data = await res.json();
					return {
						username: data.name,
						uuid: parseUUIDWithDashes(data.id),
					};
				} else return null;
			})
			.catch(() => null)) as FetchedUser;

		if (!data) throw new Error("User doesn't exist!");

		const userCached = this.users.findIndex((u) => u.uuid == data.uuid);

		if (userCached === -1) this.users.push(data);
		else this.users[userCached] = data;

		return data;
	}
}
