import robot from '@jitsi/robotjs';
import cv from '@techstark/opencv-js';
import {$, sleep} from 'bun';
import Jimp from 'jimp';
import {loadImage as loadimg, createCanvas} from '@napi-rs/canvas';
import sd from 'screenshot-desktop';

export type Match = null | {
	x: number;
	y: number;
	width: number;
	height: number;
	center: {
		x: number;
		y: number;
	};
};

export async function loadImage(src: string | Buffer): Promise<cv.Mat> {
	const image = await loadimg(src);
	const canvas = createCanvas(image.width, image.height); // create an OffscreenCanvas
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas ctx is null. Please report this issue in the github.');
	ctx.drawImage(image, 0, 0); // draw the ImageBitmap on the canvas
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height); // get ImageData from the canvas
	const mat = cv.matFromImageData(imageData);
	return mat;
}

export async function saveMatToFile(mat: cv.Mat, filePath: string): Promise<void> {
	const imgData = new Uint8Array(mat.data);
	const jimpImage = new Jimp({
		width: mat.cols,
		height: mat.rows,
		data: imgData,
	});

	await jimpImage.writeAsync(filePath);
}

export async function locateImage(imagePath: string, drawOutput = false): Promise<Match | null> {
	// Temporary files
	// await $`rm -rf .aoinv`;
	// await $`mkdir -p .aoinv`;
	// await Bun.write('.aoinv/img_tmp.png', await sd());

	// const screenshotMat = await loadImage('.aoinv/img_tmp.png');
	const screenshotMat = await loadImage(await sd());
	const templateMat = await loadImage(imagePath);

	const dest = new cv.Mat();
	const mask = new cv.Mat();
	cv.matchTemplate(screenshotMat, templateMat, dest, cv.TM_SQDIFF_NORMED, mask);
	cv.threshold(dest, dest, 0.01, 1, cv.THRESH_BINARY);

	const screen_ratio = parseFloat(Bun.env.SCREEN_RATIO || '0.5');
	const result = cv.minMaxLoc(dest, mask);
	let match: Match = {
		x: result.minLoc.x,
		y: result.minLoc.y,
		width: templateMat.cols,
		height: templateMat.rows,
		center: {
			x: result.minLoc.x + templateMat.cols * 0.5,
			y: result.minLoc.y + templateMat.rows * 0.5,
		},
	};

	if (drawOutput) {
		const color = new cv.Scalar(0, 255, 0, 255);
		cv.rectangle(
			screenshotMat,
			new cv.Point(match.x, match.y),
			new cv.Point(match.x + templateMat.cols, match.y + templateMat.rows),
			color,
			2
		);
		await saveMatToFile(screenshotMat, 'draw_output.png');
	}

	// Modify after, to not break the draw_output thing
	match = {
		x: match.x * screen_ratio,
		y: match.y * screen_ratio,
		width: match.width * screen_ratio,
		height: match.height * screen_ratio,
		center: {
			x: match.center.x * screen_ratio,
			y: match.center.y * screen_ratio,
		},
	};

	if (match.x == 0 && match.y == 0) {
		return null;
	}

	return match;
}
