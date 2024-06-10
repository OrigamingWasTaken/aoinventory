import chalk from 'chalk';
import readline from 'readline';

export class logger {
	step(text: any, overwrite = false) {
		if (overwrite) {
			readline.cursorTo(process.stdout, 0);
			readline.clearLine(process.stdout, 0);
			process.stdout.write(chalk.blueBright('[Step] ' + text));
			return;
		}
		console.log(chalk.blueBright('\n[Step] ' + text));
	}
	countdown(text: any, overwrite = false) {
		if (overwrite) {
			readline.cursorTo(process.stdout, 0);
			readline.clearLine(process.stdout, 0);
			process.stdout.write(chalk.bgBlackBright(` ${text} `));
			return;
		}
		console.log(chalk.bgBlackBright(` ${text} `));
	}
	error(text: any) {
		console.log(chalk.bgRed('\n[Error] ' + text));
	}
}

export class Point {
	x: number;
	y: number;
	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}
}

export class Size {
	width: number;
	height: number;
	constructor(width: number, height: number) {
		this.width = width;
		this.height = height;
	}
}
