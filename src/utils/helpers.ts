import { supabase } from '../services/supabaseClient';

export const getImageUrl = (pathOrUrl: string) => {
    if (!pathOrUrl) return '';
    if (pathOrUrl.startsWith('http')) return pathOrUrl;
    return supabase.storage.from('fotos-inmuebles').getPublicUrl(pathOrUrl).data.publicUrl;
};
