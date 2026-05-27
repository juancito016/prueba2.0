import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Inmueble } from '../types/database.types';
import { getImageUrl } from '../utils/helpers';

export const useInmuebles = (page: number, filters: Record<string, string>) => {
    const [inmuebles, setInmuebles] = useState<(Inmueble & { portadaUrl?: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    const PAGE_SIZE = 6;

    const serializedFilters = JSON.stringify(filters);

    useEffect(() => {
        const fetchInmuebles = async () => {
            const activeFilters = JSON.parse(serializedFilters);
            const cacheKey = `inmuebles_${page}_${serializedFilters}`;
            const cachedData = sessionStorage.getItem(cacheKey);

            if (cachedData) {
                const { formatted, count } = JSON.parse(cachedData);
                setInmuebles(prev => page === 0 ? formatted : [...prev, ...formatted]);
                setTotal(count);
                setLoading(false);
                return;
            }

            setLoading(true);

            const from = page * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const selectQuery = `*, barrios!inner(nombre, ciudad_id, ciudades!inner(nombre, departamento_id, departamentos!inner(nombre))), imagenes(url_storage)`;
            let query = supabase.from('inmuebles').select(selectQuery, { count: 'exact' }).eq('estado', 'Disponible');

            if (activeFilters.departamento) {
                query = query.eq('barrios.ciudades.departamento_id', activeFilters.departamento);
            }
            if (activeFilters.ciudad) {
                query = query.eq('barrios.ciudad_id', activeFilters.ciudad);
            }
            if (activeFilters.barrio_id) {
                query = query.eq('barrio_id', activeFilters.barrio_id);
            } else if (activeFilters.barrio_search) {
                query = query.ilike('barrios.nombre', `%${activeFilters.barrio_search}%`);
            }

            if (activeFilters.tipo_propiedad) {
                query = query.eq('tipo_propiedad', activeFilters.tipo_propiedad);
            }

            if (activeFilters.precio_min) {
                query = query.gte('precio', Number(activeFilters.precio_min));
            }
            if (activeFilters.precio_max) {
                query = query.lte('precio', Number(activeFilters.precio_max));
            }

            query = query.range(from, to).order('creado_at', { ascending: false });

            const { data, error, count } = await query;

            if (error) {
                console.error('Error fetching properties', error);
            } else if (data) {
                const formatted = data.map((item: any) => ({
                    ...item,
                    portadaUrl: item.imagenes?.[0]?.url_storage ? getImageUrl(item.imagenes[0].url_storage) : undefined
                }));
                // Si es la página 0 (nueva búsqueda), sobreescribir. Si es > 0, añadir al final.
                setInmuebles(prev => page === 0 ? formatted : [...prev, ...formatted]);

                if (count !== null) {
                    setTotal(count);
                }

                // Guardar en caché
                sessionStorage.setItem(cacheKey, JSON.stringify({
                    formatted,
                    count: count || 0
                }));
            }
            setLoading(false);
        };

        fetchInmuebles();
    }, [page, serializedFilters]);

    return { inmuebles, loading, total, totalPages: Math.ceil(total / PAGE_SIZE) };
};

export const useLocationCombos = () => {
    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [ciudades, setCiudades] = useState<any[]>([]);

    useEffect(() => {
        supabase.from('departamentos').select('*').then(({ data }) => setDepartamentos(data || []));
    }, []);

    const getCiudadesByDepto = async (deptoId: string) => {
        const { data } = await supabase.from('ciudades').select('*').eq('departamento_id', deptoId);
        setCiudades(data || []);
    };

    return { departamentos, ciudades, getCiudadesByDepto };
};
