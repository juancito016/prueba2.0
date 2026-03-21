import React, { useState } from 'react';
import { FaBuilding, FaMapMarkerAlt, FaPlus, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface Props {
    departamentos: any[];
    ciudades: any[];
    addDepartamento: (nombre: string) => Promise<any>;
    deleteDepartamento: (id: string) => Promise<void>;
    fetchCiudades: () => void;
    fetchDepartamentos: () => void;
    addCiudad: (nombre: string, deptoId: string) => Promise<any>;
    deleteCiudad: (id: string) => Promise<void>;
}

export const AdminLocationsTab: React.FC<Props> = ({
    departamentos, ciudades,
    addDepartamento, deleteDepartamento,
    fetchCiudades, addCiudad, deleteCiudad
}) => {
    const [newDepto, setNewDepto] = useState('');
    const [newCiudad, setNewCiudad] = useState('');
    const [selectedDeptoForCiudad, setSelectedDeptoForCiudad] = useState('');

    const handleAddDepto = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDepto.trim()) return;
        const toastId = toast.loading('Agregando Departamento...');
        try {
            await addDepartamento(newDepto.trim());
            toast.success('Departamento agregado', { id: toastId });
            setNewDepto('');
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        }
    };

    const handleEliminarDepto = async (id: string) => {
        if (!window.confirm('¡ALERTA! Si borras un Departamento, se eliminarán en Cascada todas las Ciudades, Barrios e INMUEBLES asociados. ¿Seguro?')) return;
        const toastId = toast.loading('Eliminando...');
        try {
            await deleteDepartamento(id);
            toast.success('Departamento eliminado', { id: toastId });
            fetchCiudades(); // Refresh associated cities
        } catch (e: any) {
            toast.error(e.message, { id: toastId });
        }
    };

    const handleAddCiudad = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCiudad.trim() || !selectedDeptoForCiudad) return;
        const toastId = toast.loading('Agregando Ciudad...');
        try {
            await addCiudad(newCiudad.trim(), selectedDeptoForCiudad);
            toast.success('Ciudad agregada', { id: toastId });
            setNewCiudad('');
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        }
    };

    const handleEliminarCiudad = async (id: string) => {
        if (!window.confirm('¡ALERTA! Se perderán Barrios e Inmuebles en cascada. ¿Deseas continuar?')) return;
        const toastId = toast.loading('Eliminando...');
        try {
            await deleteCiudad(id);
            toast.success('Ciudad eliminada', { id: toastId });
        } catch (e: any) {
            toast.error(e.message, { id: toastId });
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Departamentos */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <h3 className="text-xl font-black text-[#5e0b15] mb-4 flex items-center gap-2"><FaBuilding /> Departamentos</h3>
                <form onSubmit={handleAddDepto} className="flex gap-2 mb-6">
                    <input required value={newDepto} onChange={e => setNewDepto(e.target.value)} placeholder="Ej. Tarija" className="border p-2 rounded flex-1 focus:ring-[#5e0b15] focus:outline-none" />
                    <button type="submit" className="bg-[#5e0b15] text-white px-4 rounded font-bold whitespace-nowrap"><FaPlus /></button>
                </form>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {departamentos.map(d => (
                        <div key={d.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border">
                            <span className="font-semibold">{d.nombre}</span>
                            <button onClick={() => handleEliminarDepto(d.id)} className="text-red-500 hover:bg-red-100 p-2 rounded"><FaTrash size={12} /></button>
                        </div>
                    ))}
                    {departamentos.length === 0 && <p className="text-sm text-gray-500">No hay departamentos definidos.</p>}
                </div>
            </div>

            {/* Ciudades */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <h3 className="text-xl font-black text-[#5e0b15] mb-4 flex items-center gap-2"><FaMapMarkerAlt /> Ciudades</h3>
                <form onSubmit={handleAddCiudad} className="flex flex-col gap-2 mb-6">
                    <select required value={selectedDeptoForCiudad} onChange={e => setSelectedDeptoForCiudad(e.target.value)} className="border p-2 rounded focus:ring-[#5e0b15] focus:outline-none text-sm">
                        <option value="">Seleccione Departamento...</option>
                        {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                    </select>
                    <div className="flex gap-2">
                        <input required value={newCiudad} onChange={e => setNewCiudad(e.target.value)} placeholder="Ej. Cercado, Bermejo..." className="border p-2 rounded flex-1 focus:ring-[#5e0b15] focus:outline-none" />
                        <button type="submit" className="bg-[#5e0b15] text-white px-4 rounded font-bold"><FaPlus /></button>
                    </div>
                </form>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {ciudades
                        .filter(c => selectedDeptoForCiudad ? c.departamento_id === selectedDeptoForCiudad : true)
                        .map(c => (
                            <div key={c.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border">
                                <div>
                                    <span className="font-semibold block">{c.nombre}</span>
                                    <span className="text-xs text-gray-500">Depto: {(c as any).departamentos?.nombre}</span>
                                </div>
                                <button onClick={() => handleEliminarCiudad(c.id)} className="text-red-500 hover:bg-red-100 p-2 rounded"><FaTrash size={12} /></button>
                            </div>
                        ))}
                    {ciudades.filter(c => selectedDeptoForCiudad ? c.departamento_id === selectedDeptoForCiudad : true).length === 0 && <p className="text-sm text-gray-500">Aún no hay ciudades asociadas en esta vista.</p>}
                </div>
            </div>
        </div>
    );
};
