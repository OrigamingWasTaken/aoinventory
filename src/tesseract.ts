import Tesseract from 'tesseract.js';
import Jimp from 'jimp';
import screenshotDesktop from 'screenshot-desktop';
import {sleep} from 'bun';
import {logger} from './utils';
import type {Match} from './opencv';

const log = new logger();

async function performOCR(image: Jimp): Promise<Tesseract.Page> {
	const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
	const {data} = await Tesseract.recognize(buffer, 'eng', {
		logger: (m) => console.log(m), // Optional: To see progress in the console
	});
	return data;
}

export async function detectStringOnScreen(
	targetString: string,
	drawOutput: boolean = false,
	outputPath: string = './output.png'
): Promise<{x: number; y: number; width: number; height: number} | null> {
	const screenImage = await Jimp.read(await screenshotDesktop());
	await (await screenImage).writeAsync('thescreen.png');

	// Optional: Preprocess image for better OCR accuracy
	// Convert to grayscale, adjust contrast, etc.
	// screenImage.greyscale().contrast(0.5);

	const ocrData = await performOCR(screenImage);

	let foundWord = null;
	for (const word of ocrData.words) {
		if (word.text.includes(targetString)) {
			foundWord = {
				x: word.bbox.x0,
				y: word.bbox.y0,
				width: word.bbox.x1 - word.bbox.x0,
				height: word.bbox.y1 - word.bbox.y0,
			};

			// If drawing output is enabled, draw the rectangle around the found word
			if (drawOutput) {
				screenImage.scan(foundWord.x, foundWord.y, foundWord.width, foundWord.height, (x, y, idx) => {
					screenImage.bitmap.data[idx] = 255; // Red
					screenImage.bitmap.data[idx + 1] = 0; // Green
					screenImage.bitmap.data[idx + 2] = 0; // Blue
					screenImage.bitmap.data[idx + 3] = 255; // Alpha
				});
			}
			break;
		}
	}

	// Save the image with drawn boxes if the output path is provided
	if (drawOutput && foundWord) {
		await screenImage.writeAsync(outputPath);
	}

	return foundWord;
}

await sleep(3000);
console.log(await detectStringOnScreen("Worth",true))
// const ocr = await performOCR(await Jimp.read(await screenshotDesktop()));
// console.log(ocr.words.find(word => word.text.includes("Worth")));
