# [**LCLib**](https://github.com/TBHGodPro/LCLib)

A library to access the Lunar Client Assets WebSocket easily and quickly, comes with:

-   Automatic State Handling
-   Reconnects
-   Unmatched Speed
-   Reliable Anti-Crashing Systems
-   Built-In Utilities for you to use

## **Getting Started**

Before you begin, I recommend installing the `typed-emitter` npm package along with this one as it helps a lot with event names and arguments.

First off, install the package by simply running `npm install lc-lib`. Once it installs, go to your main file and import it with either of these ways:

```js
// ES6
import Lunar from 'lc-lib';

// CommonJS
const Lunar = require('lc-lib');
```

Now, you can create a client:

```js
const client = new Lunar.Client({
	// Enable if you want to see built-in logging details from the library, useful for debugging and testing
	debug: false,
});
```

Next up, you need to get a **Microsoft OR Minecraft Access Token**, and then you need to initiate the Client, connect, and wait for the `connected` event before running any code:

```js
const userState = {
	arch: 'x64',
	branch: 'master',
	clothCloak: 'false',
	gitCommit: 'd5e1bcee71328b1885a0365ea1c079b12b0dc4ee',
	hatHeightOffset:
		'[{"id":3520,"height":0.0},{"id":2628,"height":0.0},{"id":3471,"height":0.0},{"id":3472,"height":0.0},{"id":2583,"height":0.0},{"id":2584,"height":0.0},{"id":2526,"height":0.0},{"id":2527,"height":0.0},{"id":2528,"height":0.0},{"id":2856,"height":0.0},{"id":2540,"height":0.0},{"id":2541,"height":0.0},{"id":2542,"height":0.0},{"id":3438,"height":0.0},{"id":2543,"height":0.0},{"id":3439,"height":0.0},{"id":2544,"height":0.0},{"id":2545,"height":0.0},{"id":2424,"height":0.0},{"id":2490,"height":0.0},{"id":2491,"height":0.0},{"id":2492,"height":0.0},{"id":2493,"height":0.0},{"id":2494,"height":0.0},{"id":2558,"height":0.0},{"id":2559,"height":0.0},{"id":3519,"height":0.0}]',
	hwid: 'not supplied',
	launcherVersion: 'not supplied',
	lunarPlusColor: '-1',
	os: 'Windows',
	server: '',
	showHatsOverHelmet: 'false',
	showHatsOverSkinLayer: 'true',
	version: 'v1_8',
	flipShoulderPet: 'false',
	ichorModules: 'common,optifine,lunar',
	showOverBoots: 'true',
	showOverChestplate: 'true',
	showOverLeggings: 'true',
};

// Init and Connect

// - Microsoft Access Token
await client.init(access_token);

// - Minecraft Access Token
await client.init(access_token, true);

client.connect(userState);

// Waiting for connected event (not necessary if you await the client.connect() method)

client.on('connected', () => {
	// Code Here
});

client.on('otherListener', (arg1, arg2) => console.log(arg1, arg2));
```

<br/><br/>

[View the full documentation](./documentation.md)

<br/><br/>

And now you're ready to go!

Good luck on your journey exploring the Lunar Client Backend, and I hope you don't suffer as much as I did while making this!

<br/>

Credits:

-   [LunarSocket by Solar Tweaks](https://github.com/Solar-Tweaks/LunarSocket) for the Packet declarations and reading/writing, although I did change a lot with my findings
-   [MinecraftJS](https://github.com/MinecraftJS) for the UUID and BufWrapper Packages which really helped in development and made it MUCH easier
-   [Leoo](https://github.com/heyitsleo) for helping out a lot during the testing phase and keeping me mentally sane (at least somewhat)
