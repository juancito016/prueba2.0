import imageCompression from 'browser-image-compression';
import { supabase } from './supabaseClient';

export const compressImageForWebP = async (file: File) => {
    const options = {
        maxSizeMB: 0.8, // 800 KB
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/webp', // Forzar conversión a WebP
    };

    try {
        const compressedFile = await imageCompression(file, options);
        // Cambiar la extensión a .webp manualmente si browser-image-compression no respeta el fileType de forma exacta 
        return new File([compressedFile], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
            type: 'image/webp',
            lastModified: Date.now(),
        });
    } catch (error) {
        console.error('Error comprimiendo la imagen:', error);
        throw error;
    }
};

export const uploadImagesToSupabase = async (inmuebleId: string, files: File[]) => {
    if (files.length > 4) {
        throw new Error('Solo se permiten 4 imágenes por inmueble.');
    }

    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
        const webpFile = await compressImageForWebP(files[i]);

        // Subir al bucket 'inmuebles' (ajustar el nombre del bucket al configurado en Supabase)
        const filePath = `propiedades/${inmuebleId}/${Date.now()}_img${i}.webp`;

        const { data, error } = await supabase.storage
            .from('inmuebles') // El bucket debe existir en Supabase
            .upload(filePath, webpFile, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Error subiendo imagen a Supabase:', error);
            throw error;
        }

        if (data) {
            // Obtener la URL pública
            const { data: publicData } = supabase.storage
                .from('inmuebles')
                .getPublicUrl(data.path);

            uploadedUrls.push(publicData.publicUrl);
        }
    }

    return uploadedUrls;
};
