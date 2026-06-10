/**
 * SearchHero Component - Efecto 3D Isométrico con Tarjeta de Fondo (Pulido)
 * - La casa sobresale de la tarjeta hacia derecha y abajo.
 * - Fondo de tarjeta con la misma imagen fondo.webp pero en otro ángulo
 * - Totalmente responsive
 * - En móvil: barra de búsqueda + botón de filtro con despliegue suave y cierre al hacer clic fuera
 */

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { useLocationManager } from '../hooks/useLocationManager';
import {
    FaMapMarkerAlt, FaMap, FaChevronDown,
    FaArrowRight, FaDollarSign, FaCheck, FaHome, FaBuilding,
    FaLandmark, FaChevronRight, FaSpinner, FaTimes, FaTrashAlt, FaSlidersH, FaSearch
} from 'react-icons/fa';
import portadaUrl1 from './imagenes/casao.png';
import fondotarjetaUrl from './imagenes/fondotarjeta.png';

interface SearchHeroProps {
    onSearch: (filters: any) => void;
    initialFilters?: any;
}

export const SearchHero: React.FC<SearchHeroProps> = ({ onSearch, initialFilters = {} }) => {
    // Refs
    const locationPickerRef = useRef<HTMLDivElement>(null);
    const budgetPickerRef = useRef<HTMLDivElement>(null);
    const tipoPropiedadPickerRef = useRef<HTMLDivElement>(null);
    const filtroContainerRef = useRef<HTMLDivElement>(null);
    const mobileBarRef = useRef<HTMLDivElement>(null); // referencia a la barra de búsqueda móvil

    // Estados originales (sin cambios)
    const { departamentos, ciudades, isLoadingCiudades, getCiudadesByDepto, fetchDepartamentos } = useLocationManager();
    const [tipoPropiedad, setTipoPropiedad] = useState(initialFilters.tipo_propiedad || '');
    const [selectedDepto, setSelectedDepto] = useState(initialFilters.departamento || '');
    const [selectedCiudad, setSelectedCiudad] = useState(initialFilters.ciudad || '');
    const [selectedBarrioId, setSelectedBarrioId] = useState(initialFilters.barrio_id || '');
    const [barrioSearch, setBarrioSearch] = useState(initialFilters.barrio_search || '');
    const [precioMin, setPrecioMin] = useState(initialFilters.precio_min || '');
    const [precioMax, setPrecioMax] = useState(initialFilters.precio_max || '');
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [showBudgetPicker, setShowBudgetPicker] = useState(false);
    const [showTipoPropiedadPicker, setShowTipoPropiedadPicker] = useState(false);
    const [locationStep, setLocationStep] = useState<'deptos' | 'ciudades'>('deptos');
    const [barrioSuggestions, setBarrioSuggestions] = useState<any[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    
    // Mostrar overflow cuando cualquier dropdown esté abierto para evitar recorte
    const anyDropdownOpen = showBudgetPicker || showLocationPicker || showTipoPropiedadPicker;
    // Cerrar popovers al hacer clic fuera (original)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (locationPickerRef.current && !locationPickerRef.current.contains(event.target as Node)) {
                setShowLocationPicker(false);
            }
            if (budgetPickerRef.current && !budgetPickerRef.current.contains(event.target as Node)) {
                setShowBudgetPicker(false);
            }
            if (tipoPropiedadPickerRef.current && !tipoPropiedadPickerRef.current.contains(event.target as Node)) {
                setShowTipoPropiedadPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cerrar el panel de filtros móvil al hacer clic fuera (solo en móvil y cuando está abierto)
    useEffect(() => {
        if (!mobileFiltersOpen) return;
        const handleClickOutsideMobile = (event: MouseEvent) => {
            const target = event.target as Node;
            // Si el clic es dentro del contenedor de filtros o dentro de la barra de búsqueda, no cerrar
            if (
                (filtroContainerRef.current && filtroContainerRef.current.contains(target)) ||
                (mobileBarRef.current && mobileBarRef.current.contains(target))
            ) {
                return;
            }
            // Si un dropdown interno está abierto, el clic fuera solo debería cerrar el dropdown (manejado por el otro hook)
            if (showLocationPicker || showBudgetPicker || showTipoPropiedadPicker) {
                return;
            }
            // Cerrar el panel solo si no había menús abiertos
            setMobileFiltersOpen(false);
        };
        // Pequeño retraso para evitar que el clic que abrió el panel lo cierre inmediatamente
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutsideMobile);
        }, 100);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutsideMobile);
        };
    }, [mobileFiltersOpen, showLocationPicker, showBudgetPicker, showTipoPropiedadPicker]);

    // Resto de efectos y handlers (idénticos al original)
    useEffect(() => {
        fetchDepartamentos();
    }, [fetchDepartamentos]);

    useEffect(() => {
        if (!selectedCiudad) {
            setBarrioSuggestions([]);
            return;
        }
        const handler = setTimeout(async () => {
            const searchTerm = barrioSearch.trim();
            if (searchTerm.length > 2) {
                setIsLoadingSuggestions(true);
                const { data } = await supabase
                    .from('barrios')
                    .select('id, nombre')
                    .eq('ciudad_id', selectedCiudad)
                    .ilike('nombre', `%${searchTerm}%`)
                    .limit(8);
                setBarrioSuggestions(data || []);
                setIsLoadingSuggestions(false);
            } else {
                setBarrioSuggestions([]);
            }
        }, 300);
        return () => clearTimeout(handler);
    }, [barrioSearch, selectedCiudad]);

    const tipoPropiedadOptions = [
        { value: '', label: '¿Qué buscas?' },
        { value: 'Casa', label: 'Casa', icon: FaHome },
        { value: 'Lote', label: 'Lote / Terreno', icon: FaLandmark },
        { value: 'Departamento', label: 'Departamento', icon: FaBuilding },
    ];
    const getTipoPropiedadLabel = () => {
        const option = tipoPropiedadOptions.find(opt => opt.value === tipoPropiedad);
        return option ? option.label : '¿Qué buscas?';
    };

    const handleOpenLocationPicker = () => {
        setLocationStep('deptos');
        setShowLocationPicker(true);
    };
    const handleSelectDepto = async (depto: any) => {
        setSelectedDepto(depto.id); // Guardamos oficialmente el departamento enseguida
        setSelectedCiudad(''); // Reseteamos la ciudad al cambiar de departamento
        setSelectedBarrioId('');
        setBarrioSearch('');
        // Mostrar inmediatamente el paso de ciudades (UX perceptual)
        setLocationStep('ciudades');
        // Limpiar y cargar ciudades desde el hook (usa select reducido en columnas)
        await getCiudadesByDepto(depto.id);
    };
    const handleSelectCiudad = (ciudad: any) => {
        setSelectedCiudad(ciudad.id);
        setShowLocationPicker(false);
        setLocationStep('deptos');
    };
    const getLocationDisplayText = () => {
        const depto = departamentos.find(d => d.id === selectedDepto);
        const ciudad = ciudades.find(c => c.id === selectedCiudad);
        if (depto && ciudad) return `${depto.nombre}, ${ciudad.nombre}`;
        if (depto) return depto.nombre;
        if (ciudad) return ciudad.nombre;
        return 'Ubicación';
    };

    const quickRanges = [
        { label: 'Hasta $10,000', min: 0, max: 10000, desc: 'Lotes pequeños o preventas' },
        { label: '$10,000 - $30,000', min: 10000, max: 30000, desc: 'Zonas de expansión' },
        { label: '$30,000 - $70,000', min: 30000, max: 70000, desc: 'Departamentos y casas medianas' },
        { label: 'Más de $100,000', min: 100000, max: null, desc: 'Inversión o lujo' },
    ];
    const applyQuickRange = (range: any) => {
        setPrecioMin(range.min.toString());
        setPrecioMax(range.max ? range.max.toString() : '');
        setShowBudgetPicker(false);
    };
    const clearBudget = () => {
        setPrecioMin('');
        setPrecioMax('');
        setShowBudgetPicker(false);
    };
    const hasBudgetFilter = precioMin !== '' || precioMax !== '';

    const clearAllFilters = () => {
        setTipoPropiedad('');
        setSelectedDepto('');
        setSelectedCiudad('');
        setSelectedBarrioId('');
        setBarrioSearch('');
        setPrecioMin('');
        setPrecioMax('');
        setShowLocationPicker(false);
        setShowBudgetPicker(false);
        setShowTipoPropiedadPicker(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch({
            tipo_propiedad: tipoPropiedad,
            departamento: selectedDepto,
            ciudad: selectedCiudad,
            barrio_id: selectedBarrioId,
            barrio_search: barrioSearch,
            precio_min: precioMin,
            precio_max: precioMax,
        });
        setMobileFiltersOpen(false);
    };

    const openMobileFilters = () => {
        if (!mobileFiltersOpen) {
            setMobileFiltersOpen(true);
            // Scroll suave al formulario después de que se muestre, sin saltar al top
            setTimeout(() => {
                filtroContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 150);
        }
    };

    return (
        <div
            className="w-full relative overflow-visible pt-6 md:pt-16 pb-6 md:pb-12 px-4 md:px-12 lg:px-24 font-sans"
            style={{ backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
        >
            {/* Contenedor Principal Hero */}
            <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row items-stretch justify-between gap-8 lg:gap-4 relative z-10">
                {/* LADO IZQUIERDO: Tipografía */}
                <div className="w-full lg:w-[48%] flex flex-col justify-center text-left z-10 pb-4 lg:pb-0 select-none">
                    <h1 className="text-[40px] md:text-[84px] lg:text-[102px] font-serif font-black text-[#3C0811] leading-[1.03] tracking-tighter mb-5">
                        Tu casa <br />
                        <span className="italic font-normal text-[#A98953]">ideal</span> <br />
                        en Tarija <br />
                        y Bolivia.
                    </h1>
                    <p className="text-[#7A7165] text-base md:text-lg lg:text-[18.5px] max-w-sm leading-relaxed font-medium pl-1">
                        Encuentra el hogar donde tu familia crecerá con tranquilidad
                    </p>
                </div>

                {/* LADO DERECHO: Tarjeta de fondo + Casa 3D */}
                <div className="w-full lg:w-[52%] flex items-center justify-center lg:justify-end relative min-h-[280px] md:min-h-[440px] lg:min-h-[480px]">
                    <div
                        className="absolute w-[75%] h-[80%] top-[8%] right-[5%] rounded-[48px] border border-white/50 shadow-2xl pointer-events-none z-0"
                        style={{
                            backgroundImage: `url(${fondotarjetaUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: '30% 70%',
                            backgroundRepeat: 'no-repeat',
                        }}
                    ></div>
                    <div className="relative z-10 w-full max-w-[500px] lg:max-w-[550px] transform translate-x-[8%] md:translate-x-[10%] translate-y-[10%] md:translate-y-[12%] transition-transform duration-500 hover:scale-[1.02]">
                        <img src={portadaUrl1} alt="Casas exclusivas en Bolivia" className="w-full h-auto object-contain filter drop-shadow-ideal-isometric" />
                    </div>
                </div>
            </div>

            {/* ========== FORMULARIO DE FILTROS (optimizado móvil) ========== */}
            {/* Barra de búsqueda simplificada (solo móvil) */}
            <div ref={mobileBarRef} className="md:hidden mt-6">
                <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-md border border-white/50">
                    <button onClick={openMobileFilters} className="flex-1 flex items-center gap-2 pl-4 text-[#7A7165] focus:outline-none">
                        <FaSearch className="text-[#A98953]" size={16} />
                        <span className="text-sm font-medium">Buscar propiedades...</span>
                    </button>
                    <button onClick={openMobileFilters} className="bg-[#3C0811] hover:bg-black text-white p-2.5 rounded-full transition-colors">
                        <FaSlidersH size={16} />
                    </button>
                </div>
            </div>

            {/* Panel de filtros con transición suave (visible siempre en desktop) */}
            <div
                ref={filtroContainerRef}
                className={`
                    transition-all duration-300 ease-in-out
                    ${mobileFiltersOpen || anyDropdownOpen ? 'max-h-[1000px] opacity-100 mt-1 overflow-visible' : 'max-h-0 opacity-0 mt-0 overflow-hidden'}
                    md:max-h-none md:opacity-100 md:mt-0 md:overflow-visible
                `}
            >
                <div id="filtro-busqueda" className="max-w-[940px] mx-auto relative z-30">
                    <form onSubmit={handleSubmit} className="bg-white/85 backdrop-blur-xl p-2.5 md:p-3.5 rounded-[38px] md:rounded-[50px] shadow-ideal-pill border border-white/70">
                        <div className="flex flex-col md:flex-row items-center gap-1.5 w-full">
                            {/* 1. Tipo de inmueble */}
                            <div className="w-full md:w-[24%] relative" ref={tipoPropiedadPickerRef}>
                                <button
                                    type="button"
                                    onClick={() => setShowTipoPropiedadPicker(!showTipoPropiedadPicker)}
                                    className="w-full bg-[#FAF7F2]/90 hover:bg-[#F3EDE2] text-[#544A3D] font-bold text-[13.5px] md:text-[14px] rounded-full py-3.5 px-5 flex items-center justify-between transition-colors"
                                >
                                    <div className="flex items-center gap-2.5 truncate">
                                        {tipoPropiedad === 'Casa' ? <FaHome className="text-[#A98953]" size={14} /> :
                                            tipoPropiedad === 'Lote' ? <FaLandmark className="text-[#A98953]" size={13} /> :
                                                tipoPropiedad === 'Departamento' ? <FaBuilding className="text-[#A98953]" size={13} /> :
                                                    <FaMapMarkerAlt className="text-[#A98953]" size={13} />}
                                        <span className="truncate">{getTipoPropiedadLabel()}</span>
                                    </div>
                                    <FaChevronDown size={10} className="text-[#A98953]/80 ml-1" />
                                </button>
                                {showTipoPropiedadPicker && (
                                    <div className="absolute left-0 z-50 mt-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fadeIn">
                                        {tipoPropiedadOptions.map(opt => {
                                            const Icon = opt.icon;
                                            return (
                                                <div
                                                    key={opt.value || 'default'}
                                                    onClick={() => {
                                                        setTipoPropiedad(opt.value);
                                                        setShowTipoPropiedadPicker(false);
                                                    }}
                                                    className={`p-3 hover:bg-[#FAF7F2] cursor-pointer flex items-center gap-3 text-[13px] text-gray-700 font-semibold transition-colors ${tipoPropiedad === opt.value ? 'bg-[#FAF7F2] text-[#3C0811] font-bold' : ''}`}
                                                >
                                                    {Icon && <Icon size={13} className="text-[#A98953]" />}
                                                    <span>{opt.label}</span>
                                                    {tipoPropiedad === opt.value && <FaCheck size={10} className="ml-auto text-[#3C0811]" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* 2. Ubicación */}
                            <div className="w-full md:w-[24%] relative" ref={locationPickerRef}>
                                <button
                                    type="button"
                                    onClick={handleOpenLocationPicker}
                                    className="w-full bg-[#FAF7F2]/90 hover:bg-[#F3EDE2] text-[#544A3D] font-bold text-[13.5px] md:text-[14px] rounded-full py-3.5 px-5 flex items-center justify-between transition-colors"
                                >
                                    <div className="flex items-center gap-2.5 truncate">
                                        <FaMap className="text-[#A98953]" size={13} />
                                        <span className="truncate">{getLocationDisplayText()}</span>
                                    </div>
                                    <FaChevronDown size={10} className="text-[#A98953]/70 ml-1" />
                                </button>
                                {showLocationPicker && (
                                    <div className="absolute left-0 z-50 mt-2 w-full sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fadeIn">
                                        <div className="p-2.5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{locationStep === 'deptos' ? 'Departamento' : 'Ciudades'}</span>
                                            {locationStep === 'ciudades' && (
                                                <button type="button" onClick={() => setLocationStep('deptos')} className="text-[11px] text-[#A98953] font-bold hover:underline">Volver</button>
                                            )}
                                        </div>
                                        <div className="max-h-64 overflow-y-auto p-1">
                                            {locationStep === 'deptos' && departamentos.map(depto => (
                                                <div key={depto.id} onClick={() => handleSelectDepto(depto)} className="p-2.5 hover:bg-[#FAF7F2] rounded-lg cursor-pointer flex items-center justify-between text-[13px] text-gray-700">
                                                    <span className="font-medium">{depto.nombre}</span>
                                                    <FaChevronRight size={10} className="text-gray-300" />
                                                </div>
                                            ))}
                                            {locationStep === 'ciudades' && (
                                                isLoadingCiudades ? (
                                                    <div className="p-4 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                                                        <FaSpinner className="animate-spin text-[#A98953]" size={12} /> Cargando...
                                                    </div>
                                                ) : (
                                                    ciudades.map(ciudad => (
                                                        <div key={ciudad.id} onClick={() => handleSelectCiudad(ciudad)} className="p-2.5 hover:bg-[#FAF7F2] rounded-lg cursor-pointer text-[13px] text-gray-700 font-medium">
                                                            {ciudad.nombre}
                                                        </div>
                                                    ))
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 3. Barrio */}
                            <div className="w-full md:w-[24%] relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A98953]"><FaMapMarkerAlt size={13} /></div>
                                <input
                                    type="text"
                                    placeholder={selectedCiudad ? "Barrio (opcional)" : "Primero ciudad"}
                                    value={barrioSearch}
                                    onChange={(e) => { setBarrioSearch(e.target.value); setSelectedBarrioId(''); }}
                                    disabled={!selectedCiudad}
                                    className="w-full pl-10 pr-4 py-3.5 bg-[#FAF7F2]/90 text-[#544A3D] font-bold text-[13.5px] md:text-[14px] rounded-full focus:outline-none placeholder-gray-400"
                                />
                                {isLoadingSuggestions && <div className="absolute right-4 top-1/2 -translate-y-1/2"><FaSpinner className="animate-spin text-[#A98953]" size={12} /></div>}
                                {barrioSuggestions.length > 0 && selectedCiudad && (
                                    <ul className="absolute left-0 z-50 w-full bg-white border border-gray-100 mt-2 rounded-2xl shadow-2xl max-h-56 overflow-y-auto p-1 animate-fadeIn">
                                        {barrioSuggestions.map(b => (
                                            <li key={b.id} onClick={() => { setSelectedBarrioId(b.id); setBarrioSearch(b.nombre); setBarrioSuggestions([]); }} className="p-2.5 hover:bg-[#FAF7F2] rounded-lg cursor-pointer flex items-center gap-2 text-[13px] text-gray-700">
                                                <FaMapMarkerAlt className="text-[#A98953] opacity-60" size={11} /> <span>{b.nombre}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* 4. Presupuesto */}
                            <div className="w-full md:w-[24%] relative" ref={budgetPickerRef}>
                                <button
                                    type="button"
                                    onClick={() => setShowBudgetPicker(!showBudgetPicker)}
                                    className="w-full bg-[#FAF7F2]/90 hover:bg-[#F3EDE2] text-[#544A3D] font-bold text-[13.5px] md:text-[14px] rounded-full py-3.5 px-5 flex items-center justify-between transition-all"
                                >
                                    <div className="flex items-center gap-2.5 truncate">
                                        <FaDollarSign className="text-[#A98953]" size={13} />
                                        <span className="truncate">{hasBudgetFilter ? `${precioMin ? `$${parseInt(precioMin).toLocaleString()}` : '0'}-${precioMax ? `$${parseInt(precioMax).toLocaleString()}` : '∞'}` : 'Presupuesto'}</span>
                                    </div>
                                    <div className="flex items-center gap-1 ml-auto">
                                        {hasBudgetFilter && <button type="button" onClick={(e) => { e.stopPropagation(); clearBudget(); }} className="text-gray-400 hover:text-[#3C0811] mr-1"><FaTimes size={10} /></button>}
                                        <FaChevronDown size={10} className="text-[#A98953]/70" />
                                    </div>
                                </button>
                                {showBudgetPicker && (
                                    <div className="absolute right-0 z-50 mt-2 w-full sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fadeIn">
                                        <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                            <h4 className="font-bold text-gray-700 text-xs">Rangos rápidos</h4>
                                            <button type="button" onClick={clearBudget} className="text-[11px] text-[#A98953] font-bold hover:underline">Borrar</button>
                                        </div>
                                        <div className="p-1 max-h-48 overflow-y-auto">
                                            {quickRanges.map((range, idx) => (
                                                <button key={idx} type="button" onClick={() => applyQuickRange(range)} className="w-full text-left p-2.5 text-[12px] rounded-lg hover:bg-[#FAF7F2] text-gray-700 flex justify-between items-center">
                                                    <div><p className="font-semibold">{range.label}</p><p className="text-[10px] text-gray-400">{range.desc}</p></div>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="border-t border-gray-100 p-3 bg-gray-50/50">
                                            <div className="flex gap-2">
                                                <input type="number" placeholder="Min" value={precioMin} onChange={e => setPrecioMin(e.target.value)} className="w-1/2 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none" />
                                                <input type="number" placeholder="Max" value={precioMax} onChange={e => setPrecioMax(e.target.value)} className="w-1/2 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none" />
                                            </div>
                                            <button type="button" onClick={() => setShowBudgetPicker(false)} className="mt-2.5 w-full bg-[#3C0811] text-white py-2 rounded-lg text-xs font-bold transition-colors hover:bg-black">Aplicar</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 5. Botón Buscar */}
                            <div className="w-full md:w-[15%]">
                                <button type="submit" className="w-full bg-[#3C0811] hover:bg-black text-white font-bold text-[12px] uppercase tracking-widest py-3.5 px-4 rounded-full transition-all duration-200 flex items-center justify-center gap-2 active:scale-95">
                                    Buscar <FaArrowRight size={10} className="opacity-90" />
                                </button>
                            </div>
                        </div>
                    </form>
                    <div className="flex justify-end mt-3 px-2">
                        <button type="button" onClick={clearAllFilters} className="text-[#7A7165] text-xs font-medium hover:text-[#3C0811] transition-colors flex items-center gap-1.5 group">
                            <FaTrashAlt className="text-[10px] group-hover:scale-105" /> Limpiar búsqueda
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&family=Playfair+Display:ital,wght@0,700;0,900;1,400&display=swap');
                .font-sans { font-family: 'Plus Jakarta Sans', sans-serif; }
                .font-serif { font-family: 'Playfair Display', serif; }
                .drop-shadow-ideal-isometric { filter: drop-shadow(26px 42px 28px rgba(52, 40, 28, 0.35)) drop-shadow(-8px 12px 14px rgba(52, 40, 28, 0.1)); }
                .shadow-ideal-pill { box-shadow: 0px 25px 55px -15px rgba(95, 80, 65, 0.16); }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.14s ease-out forwards; }
            `}</style>
        </div>
    );
};