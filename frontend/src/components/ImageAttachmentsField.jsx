import React, { useId, useState } from 'react';

const MAX_ATTACHMENTS = 3;
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const MAX_COMPRESSED_BYTES = 400 * 1024;
const MAX_DIMENSION = 1440;

function readAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(blob);
  });
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const source = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(source);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(source);
      reject(new Error(`${file.name} is not a readable image.`));
    };
    image.src = source;
  });
}

async function compressImage(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a PNG, JPEG, or WebP image.');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error(`${file.name} is larger than 8 MB.`);
  }

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image processing is unavailable in this browser.');

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const compressed = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.78));
  if (!compressed) throw new Error(`Could not compress ${file.name}.`);
  if (compressed.size > MAX_COMPRESSED_BYTES) {
    throw new Error(`${file.name} is still too large. Choose a smaller image.`);
  }

  return { name: file.name, data_url: await readAsDataUrl(compressed) };
}

export default function ImageAttachmentsField({ images, onChange }) {
  const inputId = useId();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const remainingSlots = MAX_ATTACHMENTS - images.length;

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;
    setError('');

    if (files.length > remainingSlots) {
      setError(`Attach up to ${MAX_ATTACHMENTS} images per work item.`);
      return;
    }

    setProcessing(true);
    try {
      const newImages = [];
      for (const file of files) newImages.push(await compressImage(file));
      onChange([...images, ...newImages]);
    } catch (attachmentError) {
      setError(attachmentError.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="form-group image-attachments-field">
      <span className="form-label">REFERENCE IMAGES</span>
      <div className="image-attachment-list">
        {images.map((image, index) => (
          <figure className="image-attachment-preview" key={`${image.name}-${index}`}>
            <img src={image.data_url} alt={image.name} />
            <figcaption title={image.name}>{image.name}</figcaption>
            <button
              type="button"
              className="image-attachment-remove"
              aria-label={`Remove ${image.name}`}
              disabled={processing}
              onClick={() => onChange(images.filter((_, itemIndex) => itemIndex !== index))}
            >
              ×
            </button>
          </figure>
        ))}
        {remainingSlots > 0 && (
          <label className={`image-attachment-add ${processing ? 'is-processing' : ''}`} htmlFor={inputId}>
            <input
              id={inputId}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              disabled={processing}
              onChange={handleFiles}
            />
            <span className="image-attachment-add-icon">{processing ? '…' : '+'}</span>
            <span>{processing ? 'Preparing image' : 'Add image'}</span>
            <small>PNG, JPEG or WebP · max 8 MB</small>
          </label>
        )}
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
