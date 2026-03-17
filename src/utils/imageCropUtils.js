/**
 * Image crop + compress utilities.
 *
 * createCroppedImage() takes the original image source and the pixel-crop
 * rectangle produced by react-easy-crop, draws it onto an off-screen canvas,
 * scales it down if wider than MAX_WIDTH, and returns a compressed Blob
 * (JPEG quality ~0.88) wrapped in a File object ready for FormData upload.
 */

const MAX_WIDTH = 1600;
const JPEG_QUALITY = 0.88;

/**
 * Load an image from a blob/data URL and return an HTMLImageElement.
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Crop + compress an image.
 *
 * @param {string}  imageSrc       – blob URL or data URL of the original image
 * @param {Object}  cropPixels     – { x, y, width, height } from react-easy-crop
 * @param {string}  [fileName]     – desired file name (default: 'cropped.jpg')
 * @returns {Promise<File>}        – compressed JPEG File object
 */
export async function createCroppedImage(imageSrc, cropPixels, fileName = 'cropped.jpg') {
  const img = await loadImage(imageSrc);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let outW = cropPixels.width;
  let outH = cropPixels.height;

  // Scale down if the cropped area exceeds MAX_WIDTH
  if (outW > MAX_WIDTH) {
    const scale = MAX_WIDTH / outW;
    outW = MAX_WIDTH;
    outH = Math.round(outH * scale);
  }

  canvas.width = outW;
  canvas.height = outH;

  ctx.drawImage(
    img,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    outW,
    outH,
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(new File([blob], fileName, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      JPEG_QUALITY,
    );
  });
}
