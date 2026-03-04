import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { FaWhatsapp, FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt, FaExpandArrowsAlt } from 'react-icons/fa';
import { getImageUrl } from '../utils/helpers';
import logoUrl from '../components/imagenes/logo.png';

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
                document.title = `${data.tipo_propiedad} en venta en ${barrioNombre}, ${ciudadNombre} | ChuroPago`;
            }
            setLoading(false);
        };

        fetchInmueble();

        return () => { document.title = 'ChuroPago | Tarija Vende, Tarija Compra'; };
    }, [id]);

    const formatearPrecio = (precio: number, moneda: string) => {
        return new Intl.NumberFormat('es-BO', { style: 'currency', currency: moneda === 'Bs' ? 'BOB' : 'USD' }).format(precio);
    };

    const contactarWhatsapp = () => {
        let phoneStr = inmueble.contacto ? inmueble.contacto.replace(/\D/g, '') : '59170000000';
        if (phoneStr && !phoneStr.startsWith('591') && phoneStr.length <= 8) {
            phoneStr = '591' + phoneStr;
        }
        if (!phoneStr) phoneStr = '59170000000';

        const mensaje = `¡Hola ChuroPago! Me interesa el inmueble "${inmueble.titulo}" que vi en la web por ${formatearPrecio(inmueble.precio, inmueble.moneda)}. ¿Me das más info?`;
        const url = `https://wa.me/${phoneStr}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-primary font-bold animate-pulse">Cargando la mejor opción para ti...</div>;
    if (!inmueble) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Inmueble no encontrado</div>;

    const b = inmueble.barrios;
    const barrioStr = b?.nombre || '';
    const ciudadStr = b?.ciudades?.nombre || '';
    const deptoStr = b?.ciudades?.departamentos?.nombre || '';
    const ubicacionCompleta = [barrioStr, ciudadStr, deptoStr].filter(Boolean).join(', ');

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            {/* Nav Sup */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="text-[#630d16] hover:text-black font-black flex items-center gap-2 transition text-xs uppercase tracking-widest">
                        ← Regresar
                    </button>
                    <div
                        className="flex items-center cursor-pointer"
                        onDoubleClick={() => navigate('/admin')}
                        title="Doble clic para acceso interno"
                    >
                        <img src={logoUrl} alt="ChuroPago Logo" className="h-10 w-auto object-contain" />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

                {/* Header Titulo & Precio */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <div className="inline-block px-3 py-1 bg-[#630d16]/10 text-[#630d16] font-bold text-sm rounded-lg mb-3 uppercase tracking-wider">
                            {inmueble.tipo_propiedad} {inmueble.estado === 'Vendido' && '• ¡VENDIDO!'}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-2 leading-tight">
                            {inmueble.titulo}
                        </h1>
                        <p className="text-lg text-gray-500 flex items-center gap-2 font-medium">
                            <FaMapMarkerAlt className="text-[#630d16]" /> {ubicacionCompleta}
                        </p>
                    </div>
                    <div className="text-left md:text-right">
                        <div className="text-4xl md:text-5xl font-black text-[#630d16]">
                            {formatearPrecio(inmueble.precio, inmueble.moneda)}
                        </div>
                        <p className="text-sm text-gray-400 font-semibold uppercase tracking-widest mt-1">Precio de Venta</p>
                    </div>
                </div>

                {/* Galería Fotográfica */}
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-10 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[400px] md:h-[600px]">
                        {/* Foto Principal Grande */}
                        <div className="lg:col-span-2 h-full rounded-2xl overflow-hidden relative shadow-inner bg-gray-100">
                            {activeImage ? (
                                <img src={getImageUrl(activeImage)} alt="Principal" className="w-full h-full object-cover transition duration-500 hover:scale-105" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">Sin Imagen</div>
                            )}
                        </div>

                        {/* Miniaturas */}
                        <div className="hidden lg:flex flex-col gap-4 h-full">
                            {inmueble.imagenes && inmueble.imagenes.slice(0, 4).map((img: any, idx: number) => (
                                <div
                                    key={idx}
                                    onClick={() => setActiveImage(img.url_storage)}
                                    className={`flex-1 rounded-2xl overflow-hidden cursor-pointer border-4 transition-all ${activeImage === img.url_storage ? 'border-[#630d16] shadow-lg scale-[1.02]' : 'border-transparent hover:border-gray-200 opacity-80 hover:opacity-100'}`}
                                >
                                    <img src={getImageUrl(img.url_storage)} alt={`Min ${idx}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                            {(!inmueble.imagenes || inmueble.imagenes.length === 0) && (
                                <div className="flex-1 rounded-2xl overflow-hidden bg-gray-50 flex justify-center items-center border-2 border-dashed border-gray-200">
                                    <span className="text-gray-300 font-bold text-sm">No hay más fotos</span>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Miniaturas en Móvil */}
                    <div className="flex lg:hidden gap-2 mt-4 overflow-x-auto pb-2 snap-x">
                        {inmueble.imagenes && inmueble.imagenes.map((img: any, idx: number) => (
                            <div
                                key={idx}
                                onClick={() => setActiveImage(img.url_storage)}
                                className={`h-24 min-w-[96px] snap-center rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${activeImage === img.url_storage ? 'border-[#630d16]' : 'border-transparent opacity-70'}`}
                            >
                                <img src={getImageUrl(img.url_storage)} alt={`Min ${idx}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contenido Secundario */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Columna Izquierda (Detalles y Desc) */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Bloques Grandes de Características */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center transition hover:shadow-md">
                                <FaBed className="text-4xl text-blue-400 mb-3" />
                                <span className="text-3xl font-black text-gray-800">{inmueble.habitaciones || 0}</span>
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Dormitorios</span>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center transition hover:shadow-md">
                                <FaBath className="text-4xl text-cyan-400 mb-3" />
                                <span className="text-3xl font-black text-gray-800">{inmueble.banos || 0}</span>
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Baños</span>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center transition hover:shadow-md">
                                <FaExpandArrowsAlt className="text-4xl text-emerald-400 mb-3" />
                                <span className="text-3xl font-black text-gray-800">{inmueble.superficie_construida || '-'} <span className="text-lg">m²</span></span>
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Construidos</span>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center transition hover:shadow-md">
                                <FaRulerCombined className="text-4xl text-amber-400 mb-3" />
                                <span className="text-3xl font-black text-gray-800">{inmueble.superficie_terreno || '-'} <span className="text-lg">m²</span></span>
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Terreno</span>
                            </div>
                        </div>

                        {/* Descripción Completa */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-black text-gray-900 mb-6">Descripción de la Propiedad</h2>
                            <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">
                                {inmueble.descripcion}
                            </p>
                        </div>

                    </div>

                    {/* Columna Derecha (Acciones y Resumen) */}
                    <div className="space-y-6">

                        {/* Caja Destacada de Contacto */}
                        <div className="bg-[#630d16] p-8 rounded-3xl shadow-xl text-white sticky top-24">
                            <h3 className="text-2xl font-bold mb-2">¿Te interesa?</h3>
                            <p className="text-white/80 mb-8 font-medium">Contáctanos directamente para agendar una visita o recibir más información.</p>

                            <button
                                onClick={contactarWhatsapp}
                                className="w-full bg-green-500 hover:bg-green-400 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-transform transform hover:-translate-y-1 shadow-lg text-lg"
                            >
                                <FaWhatsapp size={28} />
                                Consultar por WhatsApp
                            </button>
                            <p className="text-center text-xs text-white/60 mt-4 opacity-80">Asesor certificado por ChuroPago</p>
                        </div>

                        {/* Caja Extra Ubicacion */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FaMapMarkerAlt className="text-gray-400" /> Ubicación Detallada
                            </h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Departamento:</span>
                                    <span className="font-bold text-gray-900">{deptoStr}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Ciudad/Municipio:</span>
                                    <span className="font-bold text-gray-900">{ciudadStr}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Barrio/Zona:</span>
                                    <span className="font-bold text-[#630d16]">{barrioStr}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};
