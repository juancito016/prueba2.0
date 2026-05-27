import React, { useState } from 'react';
import { useInmuebles } from '../hooks/useData';
import { PropertyCard } from '../components/PropertyCard';
import { SearchHero } from '../components/SearchHero';
import { SkeletonsGrid } from '../components/Skeletons';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const LandingPage: React.FC = () => {
    const [page, setPage] = useState(() => {
        const savedPage = sessionStorage.getItem('lp_page');
        return savedPage ? parseInt(savedPage) : 0;
    });

    const [filters, setFilters] = useState<any>(() => {
        const savedFilters = sessionStorage.getItem('lp_filters');
        return savedFilters ? JSON.parse(savedFilters) : {};
    });

    React.useEffect(() => {
        sessionStorage.setItem('lp_page', page.toString());
        sessionStorage.setItem('lp_filters', JSON.stringify(filters));
    }, [page, filters]);

    const { inmuebles, loading, totalPages } = useInmuebles(page, filters);

    const isFiltered = React.useMemo(() => {
        if (!filters) return false;
        return Object.values(filters).some(val => val && val.toString().trim() !== '');
    }, [filters]);

    const handleSearch = (newFilters: any) => {
        setFilters(newFilters);
        setPage(0);
        setTimeout(() => {
            document.getElementById('inmuebles-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-grow">
                <SearchHero onSearch={handleSearch} initialFilters={filters} />

                <section id="inmuebles-grid" className="max-w-6xl mx-auto px-6 md:px-12 pt-2 pb-20 scroll-mt-24">

                    {/* Header */}
                    <div className="mb-16">
                        <h2 className="text-5xl md:text-6xl font-serif font-black text-[#111827] mb-4">
                            Inmuebles <span className="italic font-light text-[#a1824a]">Destacados</span>
                        </h2>
                        {/* texto eliminado 
                        <p className="text-gray-500 text-lg max-w-xl leading-relaxed">
                            Propiedades seleccionadas estratégicamente con alto potencial
                            y excelente ubicación.
                        </p>*/}
                    </div>

                    {/* GRID */}
                    {loading && page === 0 ? (
                        <SkeletonsGrid count={6} />
                    ) : inmuebles.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            <p className="text-xl">
                                No se encontraron propiedades con esos filtros.
                            </p>
                            <button
                                onClick={() => handleSearch({})}
                                className="mt-6 text-[#630d16] hover:underline font-bold uppercase tracking-widest text-sm"
                            >
                                Limpiar búsqueda
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                                {inmuebles.map((inmueble, index) => (
                                    <PropertyCard
                                        key={`${inmueble.id}_${index}`}
                                        inmueble={inmueble}
                                    />
                                ))}
                            </div>

                            {/* Mostrar Skeletons extra al fondo mientras se carga la siguiente página */}
                            {loading && page > 0 && (
                                <div className="mt-10">
                                    <SkeletonsGrid count={3} />
                                </div>
                            )}

                            {/* BOTÓN CARGAR MÁS o ALERTA DE BÚSQUEDA */}
                            {page < totalPages - 1 && !loading && (
                                <div className="mt-16 flex justify-center">
                                    {isFiltered || page < 2 ? (
                                        <button
                                            onClick={() => setPage(p => p + 1)}
                                            className="bg-transparent border-2 border-[#111827] text-[#111827] hover:bg-[#111827] hover:text-white font-sans font-black text-sm uppercase tracking-widest py-4 px-10 rounded-full transition-all duration-300 transform hover:-translate-y-1"
                                        >
                                            Cargar más propiedades
                                        </button>
                                    ) : (
                                        <div className="text-center bg-white border border-gray-100 px-8 py-8 rounded-[2rem] w-full max-w-2xl mx-auto shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)]">
                                            <button
                                                onClick={() => document.getElementById('filtro-busqueda')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                                className="bg-[#630d16] text-white hover:bg-black font-sans font-bold text-sm uppercase tracking-[0.15em] py-4 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                                            >
                                                Utiliza el Filtro Arriba ↑
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* BOTÓN FLOTANTE BÚSQUEDA (Móviles y Tablets) */}
                            {page > 0 && (
                                <button
                                    onClick={() => document.getElementById('filtro-busqueda')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                    className="fixed bottom-8 right-8 z-50 bg-[#630d16] text-white p-4 rounded-full shadow-2xl hover:bg-black hover:scale-110 transition-all duration-300 md:hidden flex items-center justify-center gap-2"
                                    aria-label="Volver a los filtros"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </button>
                            )}
                        </>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
};