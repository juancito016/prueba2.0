import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '../services/supabaseClient';
import { useAdminInmuebles } from '../hooks/useAdminInmuebles';
import { useLocationManager } from '../hooks/useLocationManager';
import { InmuebleForm } from '../components/InmuebleForm';
import { FaTrash, FaEdit, FaSignOutAlt, FaPlus, FaBuilding, FaMapMarkerAlt, FaHome, FaSearch, FaFilter, FaCogs } from 'react-icons/fa';
import { getImageUrl } from '../utils/helpers';
import { StorageCleaner } from '../components/StorageCleaner';
import logoUrl from '../components/imagenes/logo.png';

export const AdminPanel: React.FC = () => {
    const [session, setSession] = useState<any>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [activeTab, setActiveTab] = useState<'inmuebles' | 'ubicaciones' | 'sistema'>('inmuebles');

    // Estados para Modal de Formulario
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInmueble, setEditingInmueble] = useState<any>(null);

    // Estados para Ubicaciones form
    const [newDepto, setNewDepto] = useState('');
    const [newCiudad, setNewCiudad] = useState('');
    const [selectedDeptoForCiudad, setSelectedDeptoForCiudad] = useState('');

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepto, setFilterDepto] = useState('');
    const [filterCiudad, setFilterCiudad] = useState('');

    const { inmuebles, loading, fetchInmuebles, toggleEstado, eliminarInmueble } = useAdminInmuebles(session?.user?.id);
    const {
        departamentos, ciudades,
        fetchDepartamentos, fetchCiudades,
        addDepartamento, deleteDepartamento,
        addCiudad, deleteCiudad
    } = useLocationManager();

    useEffect(() => {
        const initSession = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    await supabase.auth.signOut();
                } else {
                    setSession(data.session);
                }
            } catch (err) {
                await supabase.auth.signOut();
            }
        };
        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
            if (event === 'SIGNED_OUT') {
                setSession(null);
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                setSession(newSession);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session?.user?.id) {
            fetchInmuebles();
            fetchDepartamentos();
            fetchCiudades();
        }
    }, [session?.user?.id, fetchInmuebles, fetchDepartamentos, fetchCiudades]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const loadingToast = toast.loading('Accediendo...');
        await supabase.auth.signOut();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            toast.error(error.message, { id: loadingToast });
        } else {
            toast.success('Bienvenido', { id: loadingToast });
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        toast.success('Sesión cerrada');
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

    const handleToggle = async (id: string, estado: 'Disponible' | 'Vendido') => {
        try {
            const nuevo = await toggleEstado(id, estado);
            toast.success(`Estado cambiado a ${nuevo}`);
        } catch (e: any) {
            toast.error('Error al cambiar el estado');
        }
    };

    const openModal = (inmueble?: any) => {
        setEditingInmueble(inmueble || null);
        setIsModalOpen(true);
    };

    // Funciones de Ubicación
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
            fetchInmuebles(); // Refresh listings to reflect cascade deletions
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
            fetchInmuebles();
        } catch (e: any) {
            toast.error(e.message, { id: toastId });
        }
    };

    const ciudadesFiltradasAdmin = filterDepto ? ciudades.filter(c => c.departamento_id === filterDepto) : [];

    const filteredInmuebles = inmuebles.filter(inv => {
        const b = (inv as any).barrios;
        const deptoId = b?.ciudades?.departamento_id;
        const ciudadId = b?.ciudad_id;

        const matchesSearch = inv.titulo.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDepto = filterDepto ? deptoId === filterDepto : true;
        const matchesCiudad = filterCiudad ? ciudadId === filterCiudad : true;

        return matchesSearch && matchesDepto && matchesCiudad;
    });

    if (!session) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Toaster position="top-right" />
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8 border border-gray-100">
                    <h2 className="text-3xl font-black text-center text-[#5e0b15] mb-8">Acceso Admin</h2>
                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5e0b15]" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña</label>
                            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5e0b15]" />
                        </div>
                        <button type="submit" className="w-full py-3 px-4 text-white bg-[#5e0b15] hover:bg-opacity-90 rounded-xl font-bold">
                            Ingresar
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Toaster position="top-right" />
            <header className="bg-white shadow-sm border-b px-4 md:px-8 py-4 flex flex-wrap justify-between items-center gap-4 z-10">
                <div className="flex items-center gap-3">
                    <img src={logoUrl} alt="ChuroPago Logo" className="h-10 md:h-12 w-auto object-contain" />
                    <div className="hidden sm:block">
                        <p className="text-xs text-gray-500 font-medium leading-none">Panel Maestro</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-semibold bg-gray-100 px-4 py-2 rounded-lg text-sm md:text-base"
                >
                    <FaSignOutAlt /> Salir
                </button>
            </header>

            <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b pb-2 overflow-x-auto whitespace-nowrap scrollbar-hide w-full">
                    <button
                        onClick={() => setActiveTab('inmuebles')}
                        className={`flex items-center gap-2 font-bold px-4 py-2 rounded-t-lg transition ${activeTab === 'inmuebles' ? 'text-[#5e0b15] border-b-2 border-[#5e0b15]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <FaHome /> Inmuebles
                    </button>
                    <button
                        onClick={() => setActiveTab('ubicaciones')}
                        className={`flex items-center gap-2 font-bold px-4 py-2 rounded-t-lg transition ${activeTab === 'ubicaciones' ? 'text-[#5e0b15] border-b-2 border-[#5e0b15]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <FaMapMarkerAlt /> Ubicaciones Locales
                    </button>
                    <button
                        onClick={() => setActiveTab('sistema')}
                        className={`flex items-center gap-2 font-bold px-4 py-2 rounded-t-lg transition ml-auto ${activeTab === 'sistema' ? 'text-gray-800 border-b-2 border-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <FaCogs /> Sistema
                    </button>
                </div>

                {activeTab === 'inmuebles' && (
                    <>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                            <div>
                                <h2 className="text-3xl font-extrabold text-gray-800">Tus Publicaciones</h2>
                                <p className="text-gray-500 mt-1">Gestiona tu catálogo completo.</p>
                            </div>
                            <button
                                onClick={() => openModal()}
                                className="bg-[#5e0b15] hover:bg-[#4a0911] text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transform transition hover:-translate-y-1 shadow-md whitespace-nowrap"
                            >
                                <FaPlus /> Publicar Nuevo
                            </button>
                        </div>

                        {/* Barra de Filtros */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 mb-6">
                            <div className="flex-1 relative">
                                <FaSearch className="absolute left-4 top-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por título..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
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
                                    }}
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-[#5e0b15] focus:outline-none bg-gray-50 text-sm"
                                >
                                    <option value="">Todos los Deptos</option>
                                    {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                </select>
                                <select
                                    value={filterCiudad}
                                    onChange={(e) => setFilterCiudad(e.target.value)}
                                    disabled={!filterDepto}
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-[#5e0b15] focus:outline-none bg-gray-50 text-sm disabled:bg-gray-100"
                                >
                                    <option value="">Todas las Ciudades</option>
                                    {ciudadesFiltradasAdmin.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-20 text-gray-500 animate-pulse">Cargando...</div>
                        ) : inmuebles.length === 0 ? (
                            <div className="bg-white rounded-3xl p-16 text-center border">
                                <h3 className="text-xl font-bold">Sin propiedades</h3>
                                <button onClick={() => openModal()} className="mt-4 text-[#5e0b15] font-bold">Crea una</button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto w-full">
                                <table className="w-full text-left min-w-[700px]">
                                    <thead className="bg-gray-50 border-b">
                                        <tr className="text-gray-600 text-sm">
                                            <th className="p-4 font-semibold">Inmueble</th>
                                            <th className="p-4 font-semibold">Precio</th>
                                            <th className="p-4 font-semibold">Estado (Toggle)</th>
                                            <th className="p-4 font-semibold text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredInmuebles.map((inv) => (
                                            <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50">
                                                <td className="p-4 flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden">
                                                        {inv.imagenes?.[0] && <img src={getImageUrl(inv.imagenes[0].url_storage)} className="w-full h-full object-cover" alt="img" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">{inv.titulo}</div>
                                                        <div className="text-xs text-gray-500">{inv.tipo_propiedad}</div>
                                                    </div>
                                                </td>
                                                <td className="p-4 font-bold text-gray-700">{inv.moneda} {inv.precio}</td>
                                                <td className="p-4">
                                                    <button
                                                        onClick={() => handleToggle(inv.id, inv.estado)}
                                                        className={`px-3 py-1 rounded-full text-xs font-bold border ${inv.estado === 'Vendido' ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'}`}
                                                    >
                                                        {inv.estado}
                                                    </button>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => openModal(inv)} className="text-blue-500 p-2"><FaEdit /></button>
                                                    <button onClick={() => handleEliminarInmueble(inv.id)} className="text-red-500 p-2 hover:bg-red-50 rounded"><FaTrash /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'ubicaciones' && (
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
                                {ciudades.map(c => (
                                    <div key={c.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border">
                                        <div>
                                            <span className="font-semibold block">{c.nombre}</span>
                                            <span className="text-xs text-gray-500">Depto: {(c as any).departamentos?.nombre}</span>
                                        </div>
                                        <button onClick={() => handleEliminarCiudad(c.id)} className="text-red-500 hover:bg-red-100 p-2 rounded"><FaTrash size={12} /></button>
                                    </div>
                                ))}
                                {ciudades.length === 0 && <p className="text-sm text-gray-500">Aún no hay ciudades asociadas.</p>}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'sistema' && (
                    <div className="animate-fade-in-up">
                        <div className="mb-6">
                            <h2 className="text-3xl font-extrabold text-gray-800">Mantenimiento del Sistema</h2>
                            <p className="text-gray-500 mt-1">Herramientas avanzadas para optimizar ChuroPago.</p>
                        </div>
                        <StorageCleaner />
                    </div>
                )}
            </main>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <InmuebleForm
                            inmueble={editingInmueble}
                            adminId={session.user.id}
                            onClose={() => setIsModalOpen(false)}
                            onSuccess={() => {
                                setIsModalOpen(false);
                                fetchInmuebles();
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
