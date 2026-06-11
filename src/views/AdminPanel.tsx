import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from '../services/supabaseClient';
import { useLocationManager } from '../hooks/useLocationManager';
import { FaSignOutAlt, FaHome, FaMapMarkerAlt, FaCogs } from 'react-icons/fa';
import logoUrl from '../components/imagenes/logo.webp';

// Import new components
import { AdminLogin } from '../components/admin/AdminLogin';
import { AdminPropertiesTab } from '../components/admin/AdminPropertiesTab';
import { AdminLocationsTab } from '../components/admin/AdminLocationsTab';
import { StorageCleaner } from '../components/StorageCleaner';

export const AdminPanel: React.FC = () => {
    const [session, setSession] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'inmuebles' | 'ubicaciones' | 'sistema'>('inmuebles');

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
            fetchDepartamentos();
            fetchCiudades();
        }
    }, [session?.user?.id, fetchDepartamentos, fetchCiudades]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        toast.success('Sesión cerrada');
    };

    if (!session) {
        return <AdminLogin />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Toaster position="top-right" />
            <header className="bg-white shadow-sm border-b px-4 md:px-8 py-4 flex flex-wrap justify-between items-center gap-4 z-10">
                <div className="flex items-center gap-3">
                    <img src={logoUrl} alt="Churo Hogar Logo" className="h-10 md:h-12 w-auto object-contain" />
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
                    <AdminPropertiesTab
                        adminId={session.user.id}
                        departamentos={departamentos}
                        ciudades={ciudades}
                    />
                )}

                {activeTab === 'ubicaciones' && (
                    <AdminLocationsTab
                        departamentos={departamentos}
                        ciudades={ciudades}
                        addDepartamento={addDepartamento}
                        deleteDepartamento={deleteDepartamento}
                        fetchCiudades={fetchCiudades}
                        fetchDepartamentos={fetchDepartamentos}
                        addCiudad={addCiudad}
                        deleteCiudad={deleteCiudad}
                    />
                )}

                {activeTab === 'sistema' && (
                    <div className="animate-fade-in-up">
                        <div className="mb-6">
                            <h2 className="text-3xl font-extrabold text-gray-800">Mantenimiento del Sistema</h2>
                            <p className="text-gray-500 mt-1">Herramientas avanzadas para optimizar Churo Hogar.</p>
                        </div>
                        <StorageCleaner />
                    </div>
                )}
            </main>
        </div>
    );
};
