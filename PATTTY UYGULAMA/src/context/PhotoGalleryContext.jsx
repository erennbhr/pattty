import React, { createContext, useState, useContext, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

const PhotoGalleryContext = createContext();

export const PhotoGalleryProvider = ({ children }) => {
    const [photos, setPhotos] = useState([]); 
    const PHOTO_STORAGE = 'pattty_photos_v1';

    useEffect(() => {
        loadSaved();
    }, []);

    const loadSaved = async () => {
        const { value } = await Preferences.get({ key: PHOTO_STORAGE });
        const photosInPreferences = (value ? JSON.parse(value) : []);

        const loadedPhotos = [];
        for (let photo of photosInPreferences) {
            try {
                // Tarayıcıda çalışıyorsa dosya okumayı atla (Demo verilerini koru)
                if (photo.isDemo) {
                    loadedPhotos.push(photo);
                    continue;
                }

                const file = await Filesystem.readFile({
                    path: photo.filepath,
                    directory: Directory.Data,
                });
                loadedPhotos.push({
                    ...photo,
                    webviewPath: `data:image/jpeg;base64,${file.data}`
                });
            } catch (e) {
                console.log("Dosya okunamadı:", e);
            }
        }
        setPhotos(loadedPhotos);
    };

    const takePhoto = async (dateStr) => {
        try {
            const photo = await Camera.getPhoto({
                resultType: CameraResultType.Base64,
                source: CameraSource.Prompt,
                quality: 80,
                width: 1080
            });

            const fileName = new Date().getTime() + '.jpeg';
            await Filesystem.writeFile({
                path: fileName,
                data: photo.base64String,
                directory: Directory.Data,
            });

            const newPhoto = {
                filepath: fileName,
                date: dateStr,
                webviewPath: `data:image/jpeg;base64,${photo.base64String}`
            };

            const newPhotos = [newPhoto, ...photos];
            setPhotos(newPhotos);
            
            Preferences.set({
                key: PHOTO_STORAGE,
                value: JSON.stringify(newPhotos.map(p => ({ filepath: p.filepath, date: p.date })))
            });
            
            return true;
        } catch (e) {
            console.error("Kamera hatası:", e);
            return false;
        }
    };

    // --- DEMO VERİSİ YÜKLEME FONKSİYONU ---
    const loadDemoPhotos = () => {
        const currentYear = new Date().getFullYear();
        const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
        
        // Rastgele kedi fotoğrafları (Unsplash üzerinden)
        const demoData = [
            { date: `${currentYear}-${currentMonth}-02`, webviewPath: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500', isDemo: true },
            { date: `${currentYear}-${currentMonth}-05`, webviewPath: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=500', isDemo: true },
            { date: `${currentYear}-${currentMonth}-10`, webviewPath: 'https://images.unsplash.com/photo-1495360019602-e05980bf549a?w=500', isDemo: true },
            { date: `${currentYear}-${currentMonth}-15`, webviewPath: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=500', isDemo: true },
            { date: `${currentYear}-${currentMonth}-20`, webviewPath: 'https://images.unsplash.com/photo-1529778873920-4da4926a7071?w=500', isDemo: true },
            { date: `${currentYear}-${currentMonth}-25`, webviewPath: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=500', isDemo: true },
        ];

        setPhotos([...photos, ...demoData]);
        alert("Demo anıları yüklendi! Takvime bakabilirsin.");
    };

    const getPhotoByDate = (dateStr) => {
        return photos.find(p => p.date === dateStr);
    };

    const getPhotosByMonth = (month, year) => {
        const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
        return photos.filter(p => p.date.startsWith(prefix)).reverse(); 
    };

    return (
        // loadDemoPhotos fonksiyonunu dışarıya açtık
        <PhotoGalleryContext.Provider value={{ photos, takePhoto, getPhotoByDate, getPhotosByMonth, loadDemoPhotos }}>
            {children}
        </PhotoGalleryContext.Provider>
    );
};

export const useGallery = () => useContext(PhotoGalleryContext);