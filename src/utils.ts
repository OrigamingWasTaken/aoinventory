import robot from '@jitsi/robotjs';
import cv from '@techstark/opencv-js';
import {$, sleep} from 'bun';
import Jimp from 'jimp';
import {loadImage as loadimg, createCanvas} from '@napi-rs/canvas';
import sd from "screenshot-desktop"

export type Match = null | {
    x: number;
    y: number;
    width: number;
    height: number;
    center?: {
        x: number;
        y: number;
    };
};

// export function screenCaptureToFile(robotScreenPic: robot.Bitmap): Promise<Jimp> {
// 	return new Promise((resolve, reject) => {
// 		try {
// 			const image = new Jimp(robotScreenPic.width, robotScreenPic.height);
// 			let pos = 0;
// 			image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
// 				/* eslint-disable no-plusplus */
// 				image.bitmap.data[idx + 2] = robotScreenPic.image.readUInt8(pos++);
// 				image.bitmap.data[idx + 1] = robotScreenPic.image.readUInt8(pos++);
// 				image.bitmap.data[idx + 0] = robotScreenPic.image.readUInt8(pos++);
// 				image.bitmap.data[idx + 3] = robotScreenPic.image.readUInt8(pos++);
// 				/* eslint-enable no-plusplus */
// 			});
// 			resolve(image);
// 		} catch (e) {
// 			console.error(e);
// 			reject(e);
// 		}
// 	});
// }

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

export async function locateImage(imagePath: string, threshold: number = 0.7,drawOutput = false): Promise<Match | null> {
	console.log(3);
	await sleep(1000);
	console.log(2);
	await sleep(1000);
	console.log(1);
	await sleep(1000);

	// Temporary files
	await $`rm -rf .aoinv`;
	await $`mkdir -p .aoinv`;
	await Bun.write('.aoinv/img_tmp.png', await sd());

	const screenshotMat = await loadImage('.aoinv/img_tmp.png');
	const templateMat = await loadImage(imagePath);

	const dest = new cv.Mat();
	const mask = new cv.Mat();
	cv.matchTemplate(screenshotMat, templateMat, dest, cv.TM_SQDIFF_NORMED, mask);
	cv.threshold(dest, dest, 0.01, 1, cv.THRESH_BINARY);

	const result = cv.minMaxLoc(dest,mask);
	const match: Match = {
        x: result.minLoc.x,
        y: result.minLoc.y,
        width: templateMat.cols,
        height: templateMat.rows,
    };
    match.center = {
        x: match.x + (match.width * 0.5),
        y: match.y + (match.height * 0.5),
    };

	if (drawOutput) {
		const color = new cv.Scalar(0, 255, 0, 255);
		cv.rectangle(screenshotMat, new cv.Point(match.x, match.y), new cv.Point(match.x + templateMat.cols, match.y + templateMat.rows), color, 2);
		await saveMatToFile(screenshotMat, 'draw_output.png');
	}

	if (match.x == 0 && match.y == 0) {
		return null;
	}

	return match;

	// const result = new cv.Mat();
	// cv.matchTemplate(screenshotMat, templateMat, result, cv.TM_CCOEFF_NORMED);

	// // Find the position of the best match, for some reasons, the types are wrong.
	// console.log("b")
	// // @ts-expect-error
	// const {minVal, maxVal, minLoc, maxLoc} = cv.minMaxLoc(result);
	// // Clean up
	// templateMat.delete();
	// result.delete();
	// // $`rm -rf .aoinv`;
	// console.log("c")

	// saveMatToFile(screenshotMat,"teee.png")
	// console.log("d")
	// screenshotMat.delete();
	// if (maxVal < threshold) {
	// 	return null;
	// }

	// return {x: maxLoc.x * 0.5, y: maxLoc.y * 0.5};
}
