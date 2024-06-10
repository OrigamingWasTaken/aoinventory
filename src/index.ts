import {createInterface} from 'readline';
import {version} from '../package.json';
import figlet from 'figlet';
import chalk from 'chalk';
import {scanInventory} from './scan';
import {saveMatToFile} from './opencv';
import sd from 'screenshot-desktop';
import {$, sleep} from 'bun';

const rl = createInterface({
	input: process.stdin,
	output: process.stdout,
	completer: completerFunction,
});

const figletText = await figlet.text('AoInventory v' + version, 'Big', (err, res) => {
	if (err) {
		console.log(chalk.redBright('An error occurred while displaying program figlet title.'));
		return;
	}
	return chalk.greenBright(res);
});
function showHelp() {
	console.log(chalk.greenBright(figletText));
	console.log(chalk.bgBlue("      Here's a list of commands:      \n"));
	console.log(`   - help: ${chalk.yellowBright('Displays this menu')}`);
	console.log(`   - scan: ${chalk.yellowBright('Scans your inventory, and save the list of items to a file.')}`);
	console.log(`   - shop: ${chalk.yellowBright('Create a discord shop message from the template.txt file.')}`);
	console.log(
		`   - screenshot: ${chalk.yellowBright(
			'Takes a screenshot, in a format the programs will read with more accuracy.'
		)}`
	);
	console.log(`   - quit: ${chalk.yellowBright('Quits the program.')}`);
	console.log(
		chalk.magentaBright(
			`   \nFor any questions or issues, visit the ${chalk.underline(
				'Github repo'
			)} (https://github.com/OrigamingWasTaken/aoinv)`
		)
	);
}

function completerFunction(line: string) {
	const completions = ['help', 'scan', 'shop', 'quit', 'screenshot'];
	const hits = completions.filter((c) => c.startsWith(line));
	// Show all completions if none found
	return [hits.length ? hits : completions, line];
}

console.clear();
showHelp();
rl.prompt();

rl.on('line', async (input) => {
	const command = input.trim().toLowerCase();
	switch (command) {
		case 'help':
			console.clear();
			showHelp();
			break;
		case 'scan':
			console.log('Scanning inventory...');
			await scanInventory();
			// Your logic for scanning inventory here
			break;
		case 'shop':
			console.log('Creating shop message...');
			// Your logic for creating shop message here
			break;
		case 'quit':
			console.log('Goodbye!');
			rl.close();
			break;
		case 'screenshot':
			for (let i = 3; i > 0; i--) {
				console.log('Screenshot in ' + i);
				await sleep(1000);
			}
			console.log('Took the screenshot!');
			Bun.write('./screenshot.png', await sd());
			await $`open ./screenshot.png`;
			break;
		default:
			console.log(chalk.redBright`Unknown command: ${command}`);
			console.log('Type "help" for a list of commands.');
	}
	rl.prompt();
});

rl.on('close', () => {
	process.exit(0);
});
