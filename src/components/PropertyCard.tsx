/**
 * PropertyCard Component
 * 
 * Tarjeta compacta que muestra un inmueble con:
 * - Imagen portada
 * - Precio formateado
 * - Tipo de propiedad
 * - Características (habitaciones, baños, superficie)
 * - Ubicación (ciudad, departamento)
 * - Botón de contacto WhatsApp
 * - Interacción: click para ver detalles
 */

import React from 'react';
import { FaWhatsapp, FaBed, FaBath, FaRulerCombined } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import type { Inmueble } from '../types/database.types';

/**
 * Props para el componente PropertyCard
 * 
 * @interface PropertyCardProps
 * @property {Inmueble & { portadaUrl?: string }} inmueble - Objeto del inmueble a mostrar
 *           Contiene todos los datos del inmueble + URL de imagen portada
 * 
 * @description
 * La propiedad `portadaUrl` es opcional y contiene la URL de la primera imagen.
 * Si no existe, se muestra un placeholder "Sin Imagen"
 */
interface PropertyCardProps {
    inmueble: Inmueble & { portadaUrl?: string };
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ inmueble }) => {
    const navigate = useNavigate();
    const formatearPrecio = (precio: number, moneda: string) => {
        return new Intl.NumberFormat('es-BO', { style: 'currency', currency: moneda === 'Bs' ? 'BOB' : 'USD' }).format(precio);
    };

    const contactarWhatsapp = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevenir que el click expanda o navegue a la vista de detalle
        let phoneStr = inmueble.contacto ? inmueble.contacto.replace(/\D/g, '') : '59164303730';
        if (phoneStr && !phoneStr.startsWith('591') && phoneStr.length <= 8) {
            phoneStr = '591' + phoneStr;
        }
        if (!phoneStr) phoneStr = '59164303730';

        const mensaje = `¡Hola Churo Hogar! Me interesa el inmueble "${inmueble.titulo}" que vi en la web por ${formatearPrecio(inmueble.precio, inmueble.moneda)}. ¿Me das más info?`;
        const url = `https://wa.me/${phoneStr}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
    };

    const b = (inmueble as any).barrios;
    const ciudad = b?.ciudades?.nombre;
    const depto = b?.ciudades?.departamentos?.nombre;
    const ubicacionStr = (ciudad && depto) ? `${ciudad}, ${depto}` : '';

    return (
        <div
            onClick={() => navigate(`/inmueble/${inmueble.slug || inmueble.id}`)}
            className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg overflow-hidden col-span-1 flex flex-col h-full transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-white/90 cursor-pointer"
        >
            <div className="w-full h-48 relative bg-[#E5D9C5] flex-shrink-0">
                {inmueble.portadaUrl ? (
                    <img src={inmueble.portadaUrl} alt={inmueble.titulo} className="object-cover w-full h-full" />
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-[#7A7165] font-medium">Sin Imagen</div>
                )}
                <div className="absolute top-3 right-3 bg-[#3C0811]/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                    {inmueble.tipo_propiedad}
                </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-[#3C0811] text-2xl font-bold mb-1">{formatearPrecio(inmueble.precio, inmueble.moneda)}</h3>
                <h4 className="text-[#3C0811] font-semibold mb-1 line-clamp-1">{inmueble.titulo}</h4>
                {ubicacionStr && <p className="text-xs text-[#7A7165] mb-2 font-medium">{ubicacionStr}</p>}

                <div className="flex text-[#7A7165] text-sm mb-4 gap-4">
                    {inmueble.habitaciones > 0 && (
                        <div className="flex items-center gap-1"><FaBed size={14} /> {inmueble.habitaciones}</div>
                    )}
                    {inmueble.banos > 0 && (
                        <div className="flex items-center gap-1"><FaBath size={14} /> {inmueble.banos}</div>
                    )}
                    {inmueble.superficie_terreno && (
                        <div className="flex items-center gap-1"><FaRulerCombined size={14} /> {inmueble.superficie_terreno} m²</div>
                    )}
                </div>

                <div className="mt-auto flex gap-2">
                    <button
                        onClick={contactarWhatsapp}
                        className="w-full bg-[#A98953] hover:bg-[#3C0811] text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-300 shadow-md hover:shadow-lg"
                    >
                        <FaWhatsapp size={20} className="text-white" />
                        Consultar
                    </button>
                </div>
            </div>
        </div>
    );
};