const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
const REMOVE_BG_API_KEY = import.meta.env.VITE_REMOVE_BG_API_KEY;

export async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(UPLOAD_URL, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Erro no Cloudinary. Verifique o seu preset.");
  const data = await res.json();
  return data.secure_url;
}

export function applyCloudinaryTransform(url, transformCode) {
  if (!url || !url.includes('/upload/') || transformCode === 'none') return url;
  return url.replace('/upload/', `/upload/${transformCode}/`);
}

export async function removeBackgroundWithRemoveBg(imageBlob) {
  const formData = new FormData();
  formData.append('image_file', imageBlob);
  formData.append('size', 'auto');

  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': REMOVE_BG_API_KEY,
    },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.errors?.[0]?.title || "Erro na API Remove.bg");
  }

  return await response.blob(); 
}
