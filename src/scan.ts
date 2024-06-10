import robot from '@jitsi/robotjs';
import {locateImage} from './opencv';
import filterImage from './images/ui/filter_button.png'; /*with {type: "file"}*/
import filterPopupImage from './images/ui/filter_popup.png';
import {sleep, $} from 'bun';
import chalk from 'chalk';
import {logger} from './utils';
import screenshotDesktop from 'screenshot-desktop';
import Jimp from 'jimp';
import {Size, Point} from './utils';

const log = new logger();
const screen_ratio = parseFloat(Bun.env.SCREEN_RATIO || '0.5');

export async function scanInventory() {
	const screensize = {
		width: (await Jimp.read(await screenshotDesktop())).getWidth() * screen_ratio,
		height: (await Jimp.read(await screenshotDesktop())).getHeight() * screen_ratio,
	};

	console.log(chalk.greenBright(`Please open ${chalk.underline('Roblox')} in fullscreen, and open your inventory.`));
	console.log(
		chalk.greenBright(
			`The scan will now start briefly. You can stop the program at any moment by pressing ${chalk.underline(
				'Control+C'
			)} inside the terminal.`
		)
	);
	for (let i = 5; i > 0; i--) {
		log.countdown(`Starting scan in ${chalk.underline(i)}`, true);
		await sleep(1000);
	}

	const filterImageLocation = await locateImage(filterImage, true);
	if (!filterImageLocation) {
		log.error("The inventory couldn't be found. Exiting scan.");
		return;
	}
	log.step('Inventory found, proceeding to find items.');

	robot.moveMouse(filterImageLocation.center.x, filterImageLocation.center.y);
	await sleep(100);
	robot.mouseClick();
	await sleep(200);

	const filterPopupImageLocation = await locateImage(filterPopupImage, true);
	if (!filterPopupImageLocation) {
		log.error("The filters pop-up couldn't be found. Exiting scan.");
		return;
	}

	robot.mouseClick();
	await sleep(200);

	log.step('Found filters pop-up. Finding scrollable inventory area.');
	const scrollableInventoryAreaSize = new Size(
		filterPopupImageLocation.width * 1.4514066496, // Ratio obtained from doing: inv_scrollable_area_width / filters_popup_width
		filterPopupImageLocation.height * 1.0857740586 // Ratio obtained from doing: inv_scrollable_area_height / filters_popup_height
	);

	robot.moveMouse(screensize.width / 2, screensize.height / 2);
	await sleep(100);

	const firstItemPos = new Point(
		robot.getMousePos().x - scrollableInventoryAreaSize.width / 2 + 50,
		robot.getMousePos().y - scrollableInventoryAreaSize.height / 2 + 50
	);
    const bottomSpace = scrollableInventoryAreaSize.width * 0.5384615385;
	const itemSize = scrollableInventoryAreaSize.width * 0.1730769231;
	const itemGap = scrollableInventoryAreaSize.width * 0.0230769231;
	const tooltipWidth = scrollableInventoryAreaSize.width * 0.4384615385;
	const tooltipOffset = new Point(
		parseFloat(Bun.env.TOOLTIP_OFFSET_X || '16'),
		parseInt(Bun.env.TOOLTIP_OFFSET_Y || '20')
	);

	await sleep(50);
	robot.moveMouseSmooth(firstItemPos.x, firstItemPos.y, 1);
	await sleep(600);

	async function scanRow(rowIndex: number) {
        await $`rm -rf .aoinv/scanned`
		for (let i = 0; i <= 4; i++) {
			const gap = () => {
				if (i == 0) return 0;
				return i * itemGap;
			};
			if (i > 0) {
				robot.moveMouseSmooth(firstItemPos.x + gap() + itemSize * i, firstItemPos.y, 0.5);
				await sleep(550);
				robot.moveMouseSmooth(firstItemPos.x + gap() + itemSize * i, firstItemPos.y + 1, 1.5);
				await sleep(1550);
			}
			const screenshot = await screenshotDesktop();
			const jimpImage = await Jimp.read(screenshot);
			const cropped = jimpImage.crop(
				(firstItemPos.x + gap() + tooltipOffset.x + itemSize * i) / screen_ratio,
                (robot.getMousePos().y - tooltipOffset.y) / screen_ratio,
				(tooltipWidth - tooltipOffset.x) / screen_ratio,
                jimpImage.bitmap.height - (robot.getMousePos().y - tooltipOffset.y) / screen_ratio
            ).crop(0,0,jimpImage.getWidth(),jimpImage.getHeight() - (bottomSpace / screen_ratio));
            console.log((robot.getMousePos().y - tooltipOffset.y) / screen_ratio)
            cropped.write(`.aoinv/scanned/row${rowIndex}_item${i}.png`)
		}
	}

	await scanRow(1);
}
