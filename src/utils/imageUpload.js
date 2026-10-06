/**
 * Processes an uploaded image file, automatically resizing and compressing it
 * via an in-memory canvas to produce a lightweight Data URL (~40-80 KB).
 */
export function processImageUpload(file, maxWidth = 800, maxHeight = 500, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please upload a valid image file (PNG, JPG, WEBP)'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to parse image file'));
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
  });
}
