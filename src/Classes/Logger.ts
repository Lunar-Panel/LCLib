import chalk from 'chalk';

/** Client Logger */
export default class Logger {
	/** Whether the Logger is enabled */
	public readonly enabled: boolean = false;

	/** The Logger the Logger is using to Log */
	public logger: Console = console;

	/**
	 * Client Logger
	 * @param enabled Whether the Logger is enabled
	 */
	constructor(enabled: boolean = false) {
		this.enabled = enabled;
	}

	/** Send a Log Message */
	public log(...args: any[]): void {
		// @ts-ignore
		if (this.enabled) this.logger.log(chalk.bgBlue.white(' LOG '), ...args);
	}

	/** Send a Warn Message */
	public warn(...args: any[]): void {
		// @ts-ignore
		if (this.enabled)
			this.logger.warn(chalk.bgYellow.black(' WARN '), ...args);
	}

	/** Send an Error Message */
	public error(...args: any[]): void {
		// @ts-ignore
		if (this.enabled)
			this.logger.error(chalk.bgRed.white(' ERROR '), ...args);
	}

	/** Send a Debug Message */
	public debug(...args: any[]): void {
		// @ts-ignore
		if (this.enabled)
			this.logger.debug(chalk.bgGreen.white(' DEBUG '), ...args);
	}
}
