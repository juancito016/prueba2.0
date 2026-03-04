import { useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Inmueble, Imagen } from '../types/database.types';

export const useAdminInmuebles = (adminId: string) => {
    const [inmuebles, setInmuebles] = useState<(Inmueble & { imagenes: Imagen[] })[]>([]);
    const [loading, setLoading] = useState(false);

    // Leer inmuebles
    const fetchInmuebles = useCallback(async () => {
        if (!adminId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('inmuebles')
            .select('*, imagenes(*), barrios(nombre, ciudad_id, ciudades(departamento_id))')
            .eq('admin_id', adminId)
            .order('creado_at', { ascending: false });

        if (!error && data) setInmuebles(data as any[]);
        setLoading(false);
    }, [adminId]);

    // Cambiar estado Disponible <-> Vendido
    const toggleEstado = async (id: string, estadoActual: 'Disponible' | 'Vendido') => {
        const nuevoEstado = estadoActual === 'Disponible' ? 'Vendido' : 'Disponible';
        const { error } = await supabase
            .from('inmuebles')
            .update({ estado: nuevoEstado })
            .eq('id', id)
            .eq('admin_id', adminId);

        if (error) throw error;
        setInmuebles(prev => prev.map(item => item.id === id ? { ...item, estado: nuevoEstado } : item));
        return nuevoEstado;
    };

    // Eliminar inmueble (el ON DELETE CASCADE del SQL y el Trigger del bucket limpiarán imágenes físicas e hijas)
    const eliminarInmueble = async (id: string) => {
        const { error } = await supabase
            .from('inmuebles')
            .delete()
            .eq('id', id)
            .eq('admin_id', adminId);

        if (error) throw error;
        setInmuebles(prev => prev.filter(item => item.id !== id));
    };

    return {
        inmuebles,
        loading,
        fetchInmuebles,
        toggleEstado,
        eliminarInmueble
    };
};
