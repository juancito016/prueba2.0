import React from 'react';
import { FaWhatsapp, FaBed, FaBath, FaRulerCombined } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import type { Inmueble } from '../types/database.types';

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

        const mensaje = `¡Hola ChuroPago! Me interesa el inmueble "${inmueble.titulo}" que vi en la web por ${formatearPrecio(inmueble.precio, inmueble.moneda)}. ¿Me das más info?`;
        const url = `https://wa.me/${phoneStr}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
    };

    const b = (inmueble as any).barrios;
    const ciudad = b?.ciudades?.nombre;
    const depto = b?.ciudades?.departamentos?.nombre;
    const ubicacionStr = (ciudad && depto) ? `${ciudad}, ${depto}` : '';

    return (
        <div
            onClick={() => navigate(`/inmueble/${inmueble.id}`)}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden col-span-1 flex flex-col h-full transform transition hover:-translate-y-1 hover:shadow-xl duration-300 cursor-pointer"
        >
            <div className="w-full h-48 relative bg-gray-100 flex-shrink-0">
                {inmueble.portadaUrl ? (
                    <img src={inmueble.portadaUrl} alt={inmueble.titulo} className="object-cover w-full h-full" />
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-gray-400 font-medium">Sin Imagen</div>
                )}
                <div className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-md shadow">
                    {inmueble.tipo_propiedad}
                </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-secondary text-2xl font-bold mb-1">{formatearPrecio(inmueble.precio, inmueble.moneda)}</h3>
                <h4 className="text-gray-700 font-semibold mb-1 line-clamp-1">{inmueble.titulo}</h4>
                {ubicacionStr && <p className="text-xs text-gray-500 mb-2 font-medium">{ubicacionStr}</p>}

                <div className="flex text-gray-500 text-sm mb-4 gap-4">
                    {inmueble.habitaciones > 0 && (
                        <div className="flex items-center gap-1"><FaBed /> {inmueble.habitaciones}</div>
                    )}
                    {inmueble.banos > 0 && (
                        <div className="flex items-center gap-1"><FaBath /> {inmueble.banos}</div>
                    )}
                    {inmueble.superficie_terreno && (
                        <div className="flex items-center gap-1"><FaRulerCombined /> {inmueble.superficie_terreno} m²</div>
                    )}
                </div>

                <div className="mt-auto flex gap-2">
                    <button
                        onClick={contactarWhatsapp}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-300 shadow-sm"
                    >
                        <FaWhatsapp size={20} />
                        Consultar
                    </button>
                </div>
            </div>
        </div>
    );
};
