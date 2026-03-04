import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { FaBolt } from 'react-icons/fa';
import portadaUrl1 from './imagenes/casa.avif';

interface SearchHeroProps {
    onSearch: (filters: any) => void;
    initialFilters?: any;
}

export const SearchHero: React.FC<SearchHeroProps> = ({ onSearch, initialFilters = {} }) => {
    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [ciudades, setCiudades] = useState<any[]>([]);
    const [barrios, setBarrios] = useState<any[]>([]);

    const [selectedDepto, setSelectedDepto] = useState(initialFilters.departamento || '');
    const [selectedCiudad, setSelectedCiudad] = useState(initialFilters.ciudad || '');
    const [selectedBarrioId, setSelectedBarrioId] = useState(initialFilters.barrio_id || '');
    const [barrioSearch, setBarrioSearch] = useState(initialFilters.barrio_search ? initialFilters.barrio_search : (initialFilters.barrio_id ? 'Barrio seleccionado...' : ''));

    // Debounce Barrio
    useEffect(() => {
        const handler = setTimeout(async () => {
            if (barrioSearch.trim().length > 2 && selectedCiudad) {
                const { data } = await supabase
                    .from('barrios')
                    .select('id, nombre')
                    .eq('ciudad_id', selectedCiudad)
                    .ilike('nombre', `%${barrioSearch}%`)
                    .limit(10);
                setBarrios(data || []);
            } else {
                setBarrios([]);
            }
        }, 300);

        return () => clearTimeout(handler);
    }, [barrioSearch, selectedCiudad]);

    // Cargar departamentos y ciudades iniciales si existen
    useEffect(() => {
        supabase
            .from('departamentos')
            .select('*')
            .then(({ data }) => setDepartamentos(data || []));

        if (initialFilters.departamento) {
            supabase
                .from('ciudades')
                .select('*')
                .eq('departamento_id', initialFilters.departamento)
                .then(({ data }) => setCiudades(data || []));
        }
    }, [initialFilters.departamento]);

    const handleDeptoChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const deptoId = e.target.value;
        setSelectedDepto(deptoId);
        setSelectedCiudad('');
        setSelectedBarrioId('');
        setBarrioSearch('');
        setBarrios([]);

        if (deptoId) {
            const { data } = await supabase
                .from('ciudades')
                .select('*')
                .eq('departamento_id', deptoId);
            setCiudades(data || []);
        } else {
            setCiudades([]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch({
            departamento: selectedDepto,
            ciudad: selectedCiudad,
            barrio_id: selectedBarrioId,
            barrio_search: selectedBarrioId ? '' : barrioSearch
        });
    };

    return (
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-12 md:pt-12 pb-16">
            <div className="flex flex-col lg:flex-row items-center relative">

                {/* TEXTO */}
                <div className="w-full lg:w-6/12 lg:pr-12 mb-16 lg:mb-0">
                    <h2 className="text-7xl md:text-9xl font-serif font-black text-[#111827] leading-[1.05] tracking-tighter mb-8">
                        Tu lugar <br />
                        <span className="italic font-light text-[#a1824a]">perfecto</span> <br />
                        en <br />
                        Bolivia.
                    </h2>

                    <p className="text-gray-500 text-lg md:text-xl max-w-md leading-relaxed">
                        Descubre una selección curada de casas y lotes con transparencia total y asesoramiento experto en cada paso.
                    </p>
                </div>

                {/* IMAGEN */}
                <div className="w-full lg:w-6/12 relative flex justify-center lg:justify-end">

                    <div className="bg-white p-5 rounded-[60px] w-full md:w-[85%] lg:w-[75%] aspect-[4/5] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)]">
                        <img
                            src={portadaUrl1}
                            alt="Casas exclusivas en Bolivia"
                            className="w-full h-full object-cover rounded-[45px]"
                        />
                    </div>

                    {/* TARJETA ALINEADA */}
                    <div className="
    absolute
    -bottom-14
    left-6
    md:left-20
    bg-[#ffffff]
    rounded-[35px]
    p-8
    w-[260px]
    shadow-[0_35px_70px_-20px_rgba(0,0,0,0.25)]
    rotate-[-8deg]
    origin-bottom-left
    transition-transform
    duration-300
">

                        <div className="flex text-[#c6a75e] drop-shadow-[0_1px_2px_rgba(198,167,94,0.6)] mb-4 gap-1">
                            {[...Array(5)].map((_, i) => (
                                <FaBolt key={i} size={15} />
                            ))}
                        </div>

                        <p className="text-[11px] uppercase tracking-[0.25em] text-[#b8974b] font-bold mb-3">
                            Inmuebles Verificados
                        </p>

                        <p className="text-4xl font-serif font-black text-[#630d16] mb-3">
                            +2,500
                        </p>

                        <p className="text-sm text-gray-500 leading-relaxed">
                            Propiedades listas para ser tu nuevo hogar.
                        </p>
                    </div>

                </div>
            </div>

            {/* BUSCADOR COMPLETO RESTAURADO */}
            <div className="mt-24 lg:mt-32 max-w-5xl mx-auto relative z-20">
                <form
                    onSubmit={handleSubmit}
                    className="bg-white/80 backdrop-blur-xl border border-white p-4 md:p-6 rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col md:flex-row gap-4 w-full"
                >

                    {/* Departamento */}
                    <div className="flex-1">
                        <select
                            className="w-full p-4 md:p-5 bg-transparent border-b-2 border-gray-200 focus:border-[#630d16] text-gray-700 font-sans font-black text-sm uppercase tracking-widest focus:outline-none transition-colors appearance-none cursor-pointer"
                            value={selectedDepto}
                            onChange={handleDeptoChange}
                        >
                            <option value="">¿Departamento?</option>
                            {departamentos.map(d => (
                                <option key={d.id} value={d.id}>{d.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Ciudad */}
                    <div className="flex-1">
                        <select
                            className="w-full p-4 md:p-5 bg-transparent border-b-2 border-gray-200 focus:border-[#630d16] text-gray-700 font-sans font-black text-sm uppercase tracking-widest focus:outline-none transition-colors appearance-none disabled:opacity-30 cursor-pointer"
                            value={selectedCiudad}
                            onChange={(e) => {
                                setSelectedCiudad(e.target.value);
                                setSelectedBarrioId('');
                                setBarrioSearch('');
                                setBarrios([]);
                            }}
                            disabled={!selectedDepto}
                        >
                            <option value="">¿Ciudad?</option>
                            {ciudades.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Barrio Autocomplete */}
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="BARRIO (OPCIONAL)"
                            className="w-full p-4 md:p-5 bg-transparent border-b-2 border-gray-200 focus:border-[#630d16] text-gray-700 font-sans font-black text-sm uppercase tracking-widest focus:outline-none transition-colors disabled:opacity-30 placeholder-gray-400"
                            value={barrioSearch}
                            onChange={(e) => {
                                setBarrioSearch(e.target.value);
                                setSelectedBarrioId('');
                            }}
                            disabled={!selectedCiudad}
                        />

                        {barrios.length > 0 && selectedBarrioId === '' && (
                            <ul className="absolute z-10 w-full bg-white border border-gray-100 mt-2 rounded-[20px] shadow-2xl max-h-48 overflow-y-auto p-2">
                                {barrios.map(b => (
                                    <li
                                        key={b.id}
                                        className="p-4 hover:bg-[#f3f1ec] rounded-2xl cursor-pointer font-sans text-sm font-bold text-gray-700 transition"
                                        onClick={() => {
                                            setSelectedBarrioId(b.id);
                                            setBarrioSearch(b.nombre);
                                            setBarrios([]);
                                        }}
                                    >
                                        {b.nombre}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Botón */}
                    <div className="flex items-end">
                        <button
                            type="submit"
                            className="w-full md:w-auto bg-[#630d16] hover:bg-black text-white font-sans font-black text-sm uppercase tracking-[0.2em] py-5 px-10 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                            Explorar
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};