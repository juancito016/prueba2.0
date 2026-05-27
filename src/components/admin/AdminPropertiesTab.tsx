/**
 * AdminPropertiesTab Component
 * 
 * Pestaña del panel administrativo para gestionar inmuebles.
 * Funcionalidades:
 * - Listar todos los inmuebles del admin
 * - Buscar por título
 * - Filtrar por departamento, ciudad y estado
 * - Paginación
 * - Crear nuevo inmueble
 * - Editar inmueble existente
 * - Cambiar estado (Disponible ↔ Vendido)
 * - Eliminar inmueble
 */

import React, { useState } from 'react';
import { FaPlus, FaSearch, FaFilter, FaTrash, FaEdit } from 'react-icons/fa';
import { useAdminInmuebles } from '../../hooks/useAdminInmuebles';
import { getImageUrl } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { InmuebleForm } from '../InmuebleForm';

/**
 * Props para el componente AdminPropertiesTab
 * 
 * @interface Props
 * @property {string} adminId - ID del administrador/usuario autenticado
 *           Usado para filtrar los inmuebles del admin específico
 * 
 * @property {any[]} departamentos - Lista de todos los departamentos disponibles
 *           Usado en el selector de filtros para búsqueda por ubicación
 *           Estructura: { id: string, nombre: string }[]
 * 
 * @property {any[]} ciudades - Lista de todas las ciudades disponibles
 *           Usado en el selector de filtros para búsqueda por ciudad
 *           Estructura: { id: string, nombre: string, departamento_id: string }[]
 * 
 * @description
 * Este componente maneja toda la interfaz de administración de propiedades.
 * Comunica con:
 * - Hook useAdminInmuebles: para CRUD y búsqueda
 * - Componente InmuebleForm: para crear/editar modales
 * - Toasts: para manejar notificaciones al usuario
 * 
 * @example
 * <AdminPropertiesTab
 *   adminId="admin-123"
 *   departamentos={deptoList}
 *   ciudades={ciudadList}
 * />
 */
interface Props {
    adminId: string;
    departamentos: any[];
    ciudades: any[];
}

export const AdminPropertiesTab: React.FC<Props> = ({ adminId, departamentos, ciudades }) => {
    // Filtros locales
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepto, setFilterDepto] = useState('');
    const [filterCiudad, setFilterCiudad] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [page, setPage] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInmueble, setEditingInmueble] = useState<any>(null);

    // Llama al hook con los parámetros actualizados
    const {
        inmuebles, loading, total, totalPages,
        fetchInmuebles, toggleEstado, eliminarInmueble
    } = useAdminInmuebles(adminId, page, searchTerm, filterDepto, filterCiudad, filterEstado);

    const openModal = (inmueble?: any) => {
        setEditingInmueble(inmueble || null);
        setIsModalOpen(true);
    };

    const handleToggle = async (id: string, estado: 'Disponible' | 'Vendido') => {
        try {
            const nuevo = await toggleEstado(id, estado);
            toast.success(`Estado cambiado a ${nuevo}`);
        } catch (e: any) {
            toast.error('Error al cambiar el estado');
        }
    };

    const handleEliminarInmueble = async (id: string) => {
        if (!window.confirm('¿Seguro que deseas eliminar este inmueble permanentemente?')) return;
        const loadingToast = toast.loading('Eliminando...');
        try {
            await eliminarInmueble(id);
            toast.success('Inmueble eliminado', { id: loadingToast });
        } catch (e: any) {
            toast.error(`Error: ${e.message}`, { id: loadingToast });
        }
    };

    const ciudadesFiltradasAdmin = filterDepto ? ciudades.filter(c => c.departamento_id === filterDepto) : [];

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-800">Tus Publicaciones</h2>
                    <p className="text-gray-500 mt-1">
                        Gestiona tu catálogo. Total registrado: <span className="font-bold text-gray-800">{total}</span> inmuebles.
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-[#5e0b15] hover:bg-[#4a0911] text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transform transition hover:-translate-y-1 shadow-md whitespace-nowrap"
                >
                    <FaPlus /> Publicar Nuevo
                </button>
            </div>

            {/* Barra de Filtros */}
            <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-semibold text-[#5e0b15] bg-[#5e0b15]/10 px-3 py-1 rounded-full w-max">
                    Mostrando resultados {(page * 10) + (inmuebles.length > 0 ? 1 : 0)} - {(page * 10) + inmuebles.length} de {total}
                </p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <FaSearch className="absolute left-4 top-3.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por título..."
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-[#5e0b15] focus:outline-none bg-gray-50"
                    />
                </div>
                <div className="flex gap-4 flex-1">
                    <FaFilter className="mt-4 text-gray-400 hidden md:block" />
                    <select
                        value={filterDepto}
                        onChange={(e) => {
                            setFilterDepto(e.target.value);
                            setFilterCiudad('');
                            setPage(0);
                        }}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-[#5e0b15] focus:outline-none bg-gray-50 text-sm"
                    >
                        <option value="">Todos los Deptos</option>
                        {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                    </select>
                    <select
                        value={filterCiudad}
                        onChange={(e) => { setFilterCiudad(e.target.value); setPage(0); }}
                        disabled={!filterDepto}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-[#5e0b15] focus:outline-none bg-gray-50 text-sm disabled:bg-gray-100"
                    >
                        <option value="">Todas las Ciudades</option>
                        {ciudadesFiltradasAdmin.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                    <select
                        value={filterEstado}
                        onChange={(e) => { setFilterEstado(e.target.value); setPage(0); }}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-[#5e0b15] focus:outline-none bg-gray-50 text-sm"
                    >
                        <option value="">Todos los Estados</option>
                        <option value="Disponible">Disponibles</option>
                        <option value="Vendido">Vendidos</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-500 animate-pulse">Cargando propiedades...</div>
            ) : inmuebles.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center border">
                    <h3 className="text-xl font-bold">Sin propiedades</h3>
                    <p className="text-gray-500 mb-4">No se encontraron resultados para esta búsqueda o página.</p>
                    <button onClick={() => openModal()} className="mt-4 text-[#5e0b15] font-bold border border-[#5e0b15] px-4 py-2 rounded-xl">Crea una propiedad</button>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto w-full">
                        <table className="w-full text-left min-w-[700px]">
                            <thead className="bg-gray-50 border-b">
                                <tr className="text-gray-600 text-sm">
                                    <th className="p-4 font-semibold w-12 text-center text-gray-400">Nº</th>
                                    <th className="p-4 font-semibold">Inmueble</th>
                                    <th className="p-4 font-semibold">Precio</th>
                                    <th className="p-4 font-semibold text-center">Estado (Toggle)</th>
                                    <th className="p-4 font-semibold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inmuebles.map((inv, index) => (
                                    <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-4 text-center font-bold text-gray-400 text-sm">{(page * 10) + index + 1}</td>
                                        <td className="p-4 flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden min-w-[3rem]">
                                                {inv.imagenes?.[0] && <img src={getImageUrl(inv.imagenes[0].url_storage)} className="w-full h-full object-cover" alt="img" loading="lazy" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 line-clamp-1 break-all mr-2" title={inv.titulo}>{inv.titulo}</div>
                                                <div className="text-xs text-gray-500">{inv.tipo_propiedad}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-gray-700 whitespace-nowrap">{inv.moneda} {inv.precio}</td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handleToggle(inv.id, inv.estado)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold border ${inv.estado === 'Vendido' ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'}`}
                                            >
                                                {inv.estado}
                                            </button>
                                        </td>
                                        <td className="p-4 text-right whitespace-nowrap">
                                            <button onClick={() => openModal(inv)} className="text-blue-500 p-2 hover:bg-blue-50 rounded" title="Editar"><FaEdit /></button>
                                            <button onClick={() => handleEliminarInmueble(inv.id)} className="text-red-500 p-2 hover:bg-red-50 rounded ml-2" title="Eliminar"><FaTrash /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINACIÓN */}
                    {totalPages > 1 && (
                        <div className="mt-8 flex justify-center items-center gap-3">
                            <button
                                disabled={page === 0}
                                onClick={() => setPage(p => p - 1)}
                                className="px-4 py-2 text-sm uppercase font-bold text-gray-500 hover:text-black transition disabled:opacity-30"
                            >
                                Anterior
                            </button>

                            {[...Array(totalPages)].map((_, index) => {
                                if (index < page - 2 || index > page + 2) return null;
                                return (
                                    <button
                                        key={index}
                                        onClick={() => setPage(index)}
                                        className={`w-10 h-10 rounded-full text-sm font-bold transition-all duration-300
                                            ${page === index
                                                ? 'bg-[#5e0b15] text-white shadow-md'
                                                : 'text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {index + 1}
                                    </button>
                                );
                            })}

                            <button
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(p => p + 1)}
                                className="px-4 py-2 text-sm uppercase font-bold text-gray-500 hover:text-black transition disabled:opacity-30"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <InmuebleForm
                            inmueble={editingInmueble}
                            adminId={adminId}
                            onClose={() => setIsModalOpen(false)}
                            onSuccess={() => {
                                setIsModalOpen(false);
                                fetchInmuebles();
                            }}
                        />
                    </div>
                </div>
            )}
        </>
    );
};
