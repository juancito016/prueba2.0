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

    const handleSearch = (newFilters: any) => {
        setFilters(newFilters);
        setPage(0);
        window.scrollTo({ top: 900, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-[#fcfaf7] flex flex-col">
            <Navbar />

            <main className="flex-grow">
                <SearchHero onSearch={handleSearch} initialFilters={filters} />

                <section className="max-w-6xl mx-auto px-6 md:px-12 pt-2 pb-20">

                    {/* Header */}
                    <div className="mb-16">
                        <h2 className="text-5xl md:text-6xl font-serif font-black text-[#111827] mb-4">
                            Inmuebles <span className="italic font-light text-[#a1824a]">Destacados</span>
                        </h2>

                        <p className="text-gray-500 text-lg max-w-xl leading-relaxed">
                            Propiedades seleccionadas estratégicamente con alto potencial
                            y excelente ubicación.
                        </p>
                    </div>

                    {/* GRID */}
                    {loading ? (
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
                                {inmuebles.map((inmueble) => (
                                    <PropertyCard
                                        key={inmueble.id}
                                        inmueble={inmueble}
                                    />
                                ))}
                            </div>

                            {/* PAGINACIÓN */}
                            {totalPages > 1 && (
                                <div className="mt-20 flex flex-col items-center gap-6">

                                    <div className="w-24 h-[2px] bg-[#a1824a] opacity-40"></div>

                                    <div className="flex items-center gap-3 flex-wrap justify-center">

                                        <button
                                            disabled={page === 0}
                                            onClick={() => setPage(p => p - 1)}
                                            className="px-4 py-2 text-sm uppercase tracking-widest font-bold text-gray-500 hover:text-black transition disabled:opacity-30"
                                        >
                                            Anterior
                                        </button>

                                        {[...Array(totalPages)].map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setPage(index)}
                                                className={`w-12 h-12 rounded-full text-sm font-bold transition-all duration-300
                                                    ${page === index
                                                        ? 'bg-[#630d16] text-white shadow-lg scale-110'
                                                        : 'text-gray-600 hover:bg-[#f3f1ec]'
                                                    }`}
                                            >
                                                {index + 1}
                                            </button>
                                        ))}

                                        <button
                                            disabled={page >= totalPages - 1}
                                            onClick={() => setPage(p => p + 1)}
                                            className="px-4 py-2 text-sm uppercase tracking-widest font-bold text-gray-500 hover:text-black transition disabled:opacity-30"
                                        >
                                            Siguiente
                                        </button>

                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
};