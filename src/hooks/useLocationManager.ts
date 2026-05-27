import { useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

export const useLocationManager = () => {
    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [ciudades, setCiudades] = useState<any[]>([]);
    const [loadingLocations, setLoadingLocations] = useState(false);
    const [isLoadingCiudades, setIsLoadingCiudades] = useState(false);
    const [errorCiudades, setErrorCiudades] = useState<any>(null);

    // Fetch Departamentos
    const fetchDepartamentos = useCallback(async () => {
        setLoadingLocations(true);
        const { data, error } = await supabase.from('departamentos').select('*').order('nombre');
        if (!error && data) setDepartamentos(data);
        setLoadingLocations(false);
    }, []);

    // Fetch Ciudades
    const fetchCiudades = useCallback(async () => {
        setLoadingLocations(true);
        const { data, error } = await supabase.from('ciudades').select('*, departamentos(nombre)').order('nombre');
        if (!error && data) setCiudades(data);
        setLoadingLocations(false);
    }, []);

    // Obtener ciudades filtradas por departamento (uso en UI para mejorar UX)
    const getCiudadesByDepto = useCallback(async (departamento_id: string) => {
        setIsLoadingCiudades(true);
        setErrorCiudades(null);
        setCiudades([]);
        const { data, error } = await supabase
            .from('ciudades')
            .select('id,nombre')
            .eq('departamento_id', departamento_id)
            .order('nombre');
        if (!error && data) setCiudades(data);
        if (error) setErrorCiudades(error);
        setIsLoadingCiudades(false);
        return { data, error };
    }, []);

    // Agregar Departamento
    const addDepartamento = async (nombre: string) => {
        const { data, error } = await supabase.from('departamentos').insert({ nombre }).select().single();
        if (error) throw error;
        setDepartamentos(prev => [...prev, data]);
        return data;
    };

    // Eliminar Departamento (Cascada borrará ciudades y barrios e inmuebles relacionados)
    const deleteDepartamento = async (id: string) => {
        const { error } = await supabase.from('departamentos').delete().eq('id', id);
        if (error) throw error;
        setDepartamentos(prev => prev.filter(d => d.id !== id));
    };

    // Agregar Ciudad
    const addCiudad = async (nombre: string, departamento_id: string) => {
        const nombreLimpio = nombre.trim();

        // Verificar si ya existe
        const { data: existing } = await supabase
            .from('ciudades')
            .select('id')
            .eq('departamento_id', departamento_id)
            .ilike('nombre', nombreLimpio)
            .maybeSingle();

        if (existing) {
            throw new Error(`La ciudad "${nombreLimpio}" ya está registrada en este departamento.`);
        }

        const { data, error } = await supabase.from('ciudades').insert({ nombre: nombreLimpio, departamento_id }).select('*, departamentos(nombre)').single();
        if (error) throw error;
        setCiudades(prev => [...prev, data]);
        return data;
    };

    // Eliminar Ciudad (Cascada a barrios e inmuebles)
    const deleteCiudad = async (id: string) => {
        const { error } = await supabase.from('ciudades').delete().eq('id', id);
        if (error) throw error;
        setCiudades(prev => prev.filter(c => c.id !== id));
    };

    // Lógica de Barrio Libre -> Si existe retorna ID, si no lo crea y lo retorna.
    const getOrCreateBarrio = async (nombre: string, ciudad_id: string) => {
        if (!nombre.trim() || !ciudad_id) throw new Error("Falta nombre del barrio o ciudad");

        // Buscar ignorando mayúsculas/minúsculas
        const { data: existing } = await supabase
            .from('barrios')
            .select('id')
            .eq('ciudad_id', ciudad_id)
            .ilike('nombre', nombre.trim())
            .maybeSingle();

        if (existing) {
            return existing.id;
        }

        // Si no existe, crear
        const { data: newBarrio, error } = await supabase
            .from('barrios')
            .insert({ nombre: nombre.trim(), ciudad_id })
            .select('id')
            .single();

        if (error) throw error;

        return newBarrio.id;
    };

    return {
        departamentos,
        ciudades,
        loadingLocations,
        isLoadingCiudades,
        errorCiudades,
        fetchDepartamentos,
        fetchCiudades,
        getCiudadesByDepto,
        addDepartamento,
        deleteDepartamento,
        addCiudad,
        deleteCiudad,
        getOrCreateBarrio
    };
};
