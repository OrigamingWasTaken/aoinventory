import pino from 'pino';
import {$} from 'bun';
import rcedit from "rcedit";

const start = performance.now();

// Pretty logger, don't use in production.
const plogger = pino({
	transport: {
		target: 'pino-pretty',
	},
});
await $`rm -rf ./dist`;

plogger.info('[1/5] Compiling for Windows');
await Bun.spawn([
	'bun',
	'build',
	'--compile',
	'--target=bun-windows-x64-baseline',
	'./src/index.ts',
	'--outfile',
	'dist/aoinv.exe',
]).exited;
// App Icon
await rcedit("./dist/aoinv.exe", {
	icon: "./build/app.ico"
})

plogger.info('[2/5] Compiling for Linux x64');
await Bun.spawn([
	'bun',
	'build',
	'--compile',
	'--target=bun-linux-x64-baseline',
	'./src/index.ts',
	'--outfile',
	'dist/aoinv_linux_x64',
]).exited;
plogger.info('[3/5] Compiling for Linux arm64');
await Bun.spawn([
	'bun',
	'build',
	'--compile',
	'--target=bun-linux-arm64',
	'./src/index.ts',
	'--outfile',
	'dist/aoinv_linux_arm64',
]).exited;
plogger.info('[4/5] Compiling for MacOS x64');
await Bun.spawn([
	'bun',
	'build',
	'--compile',
	'--target=bun-darwin-x64',
	'./src/index.ts',
	'--outfile',
	'dist/aoinv_macos_x64',
]).exited;
plogger.info('[5/5] Compiling for MacOS arm64');
await Bun.spawn([
	'bun',
	'build',
	'--compile',
	'--target=bun-darwin-arm64',
	'./src/index.ts',
	'--outfile',
	'dist/aoinv_macos_arm64',
]).exited;
plogger.info(`Build complete in ${(performance.now() - start).toFixed(2)}ms`);
await $`open dist`