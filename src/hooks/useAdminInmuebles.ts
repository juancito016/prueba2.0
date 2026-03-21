import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Inmueble, Imagen } from '../types/database.types';

export const useAdminInmuebles = (
    adminId: string,
    page: number = 0,
    searchTerm: string = '',
    filterDepto: string = '',
    filterCiudad: string = '',
    filterEstado: string = ''
) => {
    const [inmuebles, setInmuebles] = useState<(Inmueble & { imagenes: Imagen[] })[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);

    const PAGE_SIZE = 10;

    // Leer inmuebles (paginado y filtrado en servidor)
    const fetchInmuebles = useCallback(async () => {
        if (!adminId) return;
        setLoading(true);

        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let selectQuery = '*, imagenes(*), barrios!inner(nombre, ciudad_id, ciudades!inner(departamento_id))';
        let query = supabase
            .from('inmuebles')
            .select(selectQuery, { count: 'exact' })
            .eq('admin_id', adminId);

        if (searchTerm) {
            query = query.ilike('titulo', `%${searchTerm}%`);
        }
        if (filterDepto) {
            query = query.eq('barrios.ciudades.departamento_id', filterDepto);
        }
        if (filterCiudad) {
            query = query.eq('barrios.ciudad_id', filterCiudad);
        }
        if (filterEstado) {
            query = query.eq('estado', filterEstado);
        }

        query = query.range(from, to).order('creado_at', { ascending: false });

        const { data, error, count } = await query;

        if (!error && data) {
            setInmuebles(data as any[]);
        }
        if (count !== null) {
            setTotal(count);
        }

        setLoading(false);
    }, [adminId, page, searchTerm, filterDepto, filterCiudad, filterEstado]);

    useEffect(() => {
        fetchInmuebles();
    }, [fetchInmuebles]);

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
        fetchInmuebles();
    };

    return {
        inmuebles,
        loading,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        page,
        fetchInmuebles,
        toggleEstado,
        eliminarInmueble
    };
};
