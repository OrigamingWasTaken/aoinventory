import robot from '@jitsi/robotjs';
import {locateImage} from './utils';
import filterImage from './images/ui/filter.png' with {type: "file"}
import {sleep} from 'bun';

export async function main() {
	// while (!(await locateImage(filterImage, 0.7))) {
	// 	await sleep(100);
	// }
	const located = await locateImage(filterImage, 0.7, true);
    console.log(located)
	if (!located) {
		console.log('Nothing found!');
		return;
	}
	const {x, y} = located;
	console.log(x, y);
    robot.moveMouse(x,y)
}
