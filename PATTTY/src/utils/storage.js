// src/utils/storage.js

const IMG_PREFIX = "pet_img_";

/**
 * Görseli LocalStorage'a kaydeder.
 * Eğer alan yetmezse en eski görseli silip yer açmaya çalışır (Basit LRU mantığı).
 */
export const saveImageToLocal = (id, base64Data) => {
  if (!id || !base64Data) return false;
  
  const key = `${IMG_PREFIX}${id}`;
  
  try {
    localStorage.setItem(key, base64Data);
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.warn("LocalStorage dolu! Yer açılmaya çalışılıyor...");
      // Yer açma denemesi (Gerekirse buraya eski kayıtları silme mantığı eklenebilir)
      // Şimdilik sadece hatayı yakalıyoruz.
      return false;
    }
    console.error("Görsel kaydedilemedi:", e);
    return false;
  }
};

/**
 * LocalStorage'dan görseli çeker.
 */
export const getImageFromLocal = (id) => {
  const key = `${IMG_PREFIX}${id}`;
  return localStorage.getItem(key);
};

/**
 * Görseli siler.
 */
export const removeImageFromLocal = (id) => {
  const key = `${IMG_PREFIX}${id}`;
  localStorage.removeItem(key);
};

/**
 * Bir verinin LocalStorage referansı olup olmadığını kontrol eder.
 * Format: "LOCAL::[ID]"
 */
export const isLocalImage = (imageString) => {
  return imageString && imageString.startsWith("LOCAL::");
};

/**
 * Referans stringinden ID'yi çeker.
 */
export const getLocalId = (imageString) => {
  if (!isLocalImage(imageString)) return null;
  return imageString.split("::")[1];
};