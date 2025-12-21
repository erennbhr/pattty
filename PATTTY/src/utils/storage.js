// src/utils/storage.js

const IMG_PREFIX = "pet_img_";

/**
 * Görseli LocalStorage'a kaydeder.
 * @returns {boolean} başarı durumu
 */
export const saveImageToLocal = (id, base64Data) => {
  if (!id || !base64Data) return false;

  const key = `${IMG_PREFIX}${id}`;

  try {
    localStorage.setItem(key, base64Data);
    return true;
  } catch (e) {
    // Storage katmanı mesaj üretmez
    return false;
  }
};

/**
 * LocalStorage'dan görseli çeker.
 */
export const getImageFromLocal = (id) => {
  if (!id) return null;
  return localStorage.getItem(`${IMG_PREFIX}${id}`);
};

/**
 * Tek bir görseli siler (geriye uyumlu).
 */
export const removeImageFromLocal = (id) => {
  if (!id) return;
  localStorage.removeItem(`${IMG_PREFIX}${id}`);
};

/**
 * LocalStorage referansı mı?
 * Format: "LOCAL::[ID]"
 */
export const isLocalImage = (value) => {
  return typeof value === "string" && value.startsWith("LOCAL::");
};

/**
 * "LOCAL::profile_xxx" → "profile_xxx"
 */
export const getLocalId = (value) => {
  if (!isLocalImage(value)) return null;
  return value.split("::")[1];
};

/**
 * Bir pet'e ait TÜM local görselleri siler.
 * UI mesajı ÜRETMEZ.
 */
export const removeAllPetImagesFromLocal = (petId) => {
  if (!petId) return;

  try {
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith(IMG_PREFIX)) continue;

      const pureKey = k.replace(IMG_PREFIX, "");
      if (
        pureKey.startsWith(`profile_${petId}_`) ||
        pureKey.startsWith(`mood_${petId}_`)
      ) {
        keysToRemove.push(k);
      }
    }

    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Sessiz fail — UI kararı üst katmanda
  }
};
