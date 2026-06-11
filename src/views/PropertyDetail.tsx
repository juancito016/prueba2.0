import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { FaWhatsapp, FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt, FaExpandArrowsAlt } from 'react-icons/fa';
import { getImageUrl } from '../utils/helpers';
import logoUrl from '../components/imagenes/logo.webp';

export const PropertyDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [inmueble, setInmueble] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState<string>('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchInmueble = async () => {
            if (!id) return;

            const { data, error } = await supabase
                .from('inmuebles')
                .select(`
          *,
          barrios (nombre, ciudades (nombre, departamentos (nombre))),
          imagenes (url_storage)
        `)
                .eq('id', id)
                .single();

            if (!error && data) {
                setInmueble(data);
                if (data.imagenes && data.imagenes.length > 0) {
                    setActiveImage(data.imagenes[0].url_storage);
                }

                const barrioNombre = data.barrios?.nombre || 'Barrio';
                const ciudadNombre = data.barrios?.ciudades?.nombre || 'Ciudad';

                // SEO TITLE DYNAMIC
                document.title = `${data.tipo_propiedad} en venta en ${barrioNombre}, ${ciudadNombre} | ChuroHogar`;
            }
            setLoading(false);
        };

        fetchInmueble();

        return () => { document.title = 'ChuroHogar | Tarija Vende, Tarija Compra'; };
    }, [id]);

    const formatearPrecio = (precio: number, moneda: string) => {
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: moneda === 'Bs' ? 'BOB' : 'USD'
        }).format(precio);
    };

    const contactarWhatsapp = () => {
        let phoneStr = inmueble.contacto ? inmueble.contacto.replace(/\D/g, '') : '59164303730';
        if (phoneStr && !phoneStr.startsWith('591') && phoneStr.length <= 8) {
            phoneStr = '591' + phoneStr;
        }
        const mensaje = `¡Hola ChuroHogar! Me interesa el inmueble "${inmueble.titulo}" que vi en la web por ${formatearPrecio(inmueble.precio, inmueble.moneda)}. ¿Me das más info?`;
        const url = `https://wa.me/${phoneStr}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-[#A98953] font-bold animate-pulse">Cargando la mejor opción para ti...</div>;
    if (!inmueble) return <div className="min-h-screen flex items-center justify-center font-bold text-[#7A7165]">Inmueble no encontrado</div>;

    const b = inmueble.barrios;
    const ubicacionCompleta = [b?.nombre, b?.ciudades?.nombre, b?.ciudades?.departamentos?.nombre].filter(Boolean).join(', ');

    return (
        <div className="min-h-screen font-sans pb-20 bg-[#FAF7F2]">
            {/* Nav Superior */}
            <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/40 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="text-[#3C0811] hover:text-black font-black flex items-center gap-2 transition text-xs uppercase tracking-widest">
                        ← Regresar
                    </button>
                    <div className="flex items-center cursor-pointer" onDoubleClick={() => navigate('/admin')}>
                        <img src={logoUrl} alt="ChuroHogar Logo" className="h-10 w-auto object-contain" />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

                {/* Header Título & Precio */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <div className="inline-block px-3 py-1 bg-[#3C0811]/10 text-[#3C0811] font-bold text-sm rounded-lg mb-3 uppercase tracking-wider">
                            {inmueble.tipo_propiedad} {inmueble.estado === 'Vendido' && '• ¡VENDIDO!'}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-[#3C0811] mb-2 leading-tight">
                            {inmueble.titulo}
                        </h1>
                        <p className="text-lg text-[#7A7165] flex items-center gap-2 font-medium">
                            <FaMapMarkerAlt className="text-[#A98953]" /> {ubicacionCompleta}
                        </p>
                    </div>
                    <div className="text-left md:text-right">
                        <div className="text-4xl md:text-5xl font-black text-[#3C0811]">
                            {formatearPrecio(inmueble.precio, inmueble.moneda)}
                        </div>
                        <p className="text-sm text-[#7A7165] font-semibold uppercase tracking-widest mt-1">Precio de Venta</p>
                    </div>
                </div>

                {/* Galería Fotográfica Profesional */}
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-lg border border-white/40 mb-10 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:aspect-[16/8]">

                        {/* Foto Principal */}
                        <div className="lg:col-span-2 rounded-2xl overflow-hidden relative shadow-inner bg-[#E5D9C5]">
                            {activeImage ? (
                                <img
                                    src={getImageUrl(activeImage)}
                                    alt="Principal"
                                    className="w-full h-full object-cover transition duration-500 hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#7A7165] font-bold">Sin Imagen</div>
                            )}
                        </div>

                        {/* Mosaico Lateral (Solo 2 fotos para evitar deformación) */}
                        <div className="hidden lg:grid grid-rows-2 gap-4">
                            {inmueble.imagenes && inmueble.imagenes.slice(1, 3).map((img: any, idx: number) => (
                                <div
                                    key={idx}
                                    onClick={() => setActiveImage(img.url_storage)}
                                    className={`rounded-2xl overflow-hidden cursor-pointer border-4 transition-all ${activeImage === img.url_storage ? 'border-[#A98953]' : 'border-transparent opacity-90 hover:opacity-100'}`}
                                >
                                    <img src={getImageUrl(img.url_storage)} alt={`Side ${idx}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Selector de Miniaturas Inferior */}
                    <div className="flex gap-3 mt-4 overflow-x-auto pb-2 snap-x">
                        {inmueble.imagenes && inmueble.imagenes.map((img: any, idx: number) => (
                            <div
                                key={idx}
                                onClick={() => setActiveImage(img.url_storage)}
                                className={`h-20 min-w-[100px] lg:w-28 lg:h-24 snap-center rounded-xl overflow-hidden cursor-pointer border-4 transition-all ${activeImage === img.url_storage ? 'border-[#A98953] scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                            >
                                <img src={getImageUrl(img.url_storage)} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contenido Secundario */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Características - colores armonizados */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-md border border-white/40 flex flex-col items-center justify-center text-center">
                                <FaBed className="text-4xl text-[#A98953] mb-3" />
                                <span className="text-3xl font-black text-[#3C0811]">{inmueble.habitaciones || 0}</span>
                                <span className="text-xs text-[#7A7165] font-bold uppercase tracking-wider mt-1">Dormitorios</span>
                            </div>
                            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-md border border-white/40 flex flex-col items-center justify-center text-center">
                                <FaBath className="text-4xl text-[#A98953] mb-3" />
                                <span className="text-3xl font-black text-[#3C0811]">{inmueble.banos || 0}</span>
                                <span className="text-xs text-[#7A7165] font-bold uppercase tracking-wider mt-1">Baños</span>
                            </div>
                            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-md border border-white/40 flex flex-col items-center justify-center text-center">
                                <FaExpandArrowsAlt className="text-4xl text-[#A98953] mb-3" />
                                <span className="text-3xl font-black text-[#3C0811]">{inmueble.superficie_construida || '-'} <span className="text-lg">m²</span></span>
                                <span className="text-xs text-[#7A7165] font-bold uppercase tracking-wider mt-1">Construidos</span>
                            </div>
                            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-md border border-white/40 flex flex-col items-center justify-center text-center">
                                <FaRulerCombined className="text-4xl text-[#A98953] mb-3" />
                                <span className="text-3xl font-black text-[#3C0811]">{inmueble.superficie_terreno || '-'} <span className="text-lg">m²</span></span>
                                <span className="text-xs text-[#7A7165] font-bold uppercase tracking-wider mt-1">Terreno</span>
                            </div>
                        </div>

                        {/* Descripción */}
                        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-lg border border-white/40">
                            <h2 className="text-2xl font-black text-[#3C0811] mb-6">Descripción de la Propiedad</h2>
                            <p className="text-[#7A7165] text-lg leading-relaxed whitespace-pre-line">
                                {inmueble.descripcion}
                            </p>
                        </div>
                    </div>

                    {/* Columna de Contacto Estilo Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-[#3C0811] p-8 rounded-3xl shadow-xl text-white sticky top-24">
                            <h3 className="text-2xl font-bold mb-2">¿Te interesa?</h3>
                            <p className="text-white/80 mb-8 font-medium">Contáctanos directamente.</p>

                            <button
                                onClick={contactarWhatsapp}
                                className="w-full bg-[#A98953] hover:bg-black text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-transform transform hover:-translate-y-1 shadow-lg text-lg"
                            >
                                <FaWhatsapp size={28} className="text-white" />
                                Consultar por WhatsApp
                            </button>
                            <p className="text-center text-xs text-white/60 mt-4 opacity-80">Certificado por ChuroHogar</p>
                        </div>

                        {/* Ubicación Detallada + Enlace a Google Maps */}
                        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-white/40">
                            <h4 className="font-bold text-[#3C0811] mb-4 flex items-center gap-2">
                                <FaMapMarkerAlt className="text-[#A98953]" /> Ubicación Detallada
                            </h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b border-white/30 pb-2">
                                    <span className="text-[#7A7165]">Departamento:</span>
                                    <span className="font-bold text-[#3C0811]">{b?.ciudades?.departamentos?.nombre}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/30 pb-2">
                                    <span className="text-[#7A7165]">Ciudad:</span>
                                    <span className="font-bold text-[#3C0811]">{b?.ciudades?.nombre}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/30 pb-2">
                                    <span className="text-[#7A7165]">Barrio:</span>
                                    <span className="font-bold text-[#A98953]">{b?.nombre}</span>
                                </div>
                                {/* ✅ NUEVO: Enlace a Google Maps si existe el campo map_url */}
                                {inmueble.map_url && inmueble.map_url.trim() !== '' && (
                                    <div className="mt-4 pt-2">
                                        <a
                                            href={inmueble.map_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full bg-[#A98953]/10 hover:bg-[#A98953]/20 text-[#3C0811] font-semibold py-2 px-4 rounded-xl transition-colors"
                                        >
                                            <FaMapMarkerAlt size={14} />
                                            Ver ubicación en Google Maps
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};