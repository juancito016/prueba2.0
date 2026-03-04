import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import toast from 'react-hot-toast';
import { FaTrash, FaSearch, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export const StorageCleaner: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [orphanedFiles, setOrphanedFiles] = useState<string[]>([]);
    const [analyzed, setAnalyzed] = useState(false);
    const [stats, setStats] = useState({ totalDb: 0, totalStorage: 0 });

    // Explorador Recursivo Dinámico que limita al prefijo indicado (ej: 'propiedades')
    const fetchAllStorageFiles = async (bucket: string, prefix: string = '') => {
        let allFiles: string[] = [];
        const { data: list, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
        if (error || !list) return [];

        for (const item of list) {
            if (item.name === '.emptyFolderPlaceholder') continue;

            // Supabase devuelve sin 'id' o mimetype a los que son carpetas
            const isFolder = !item.id || !item.metadata || !item.metadata.mimetype;

            if (isFolder) {
                const subPrefix = prefix ? `${prefix}/${item.name}` : item.name;
                const subFiles = await fetchAllStorageFiles(bucket, subPrefix);
                allFiles.push(...subFiles);
            } else {
                const filePath = prefix ? `${prefix}/${item.name}` : item.name;
                allFiles.push(filePath);
            }
        }
        return allFiles;
    };

    const analyzeStorage = async () => {
        setAnalyzing(true);
        setAnalyzed(false);
        const toastId = toast.loading('Analizando el almacenamiento recursivamente...');
        try {
            // 1. Fetch DB records
            const { data: dbImages, error: dbError } = await supabase.from('imagenes').select('url_storage');
            if (dbError) throw dbError;

            const dbPaths = new Set(dbImages.map((img: any) => {
                let url = img.url_storage as string;
                if (url.startsWith('http')) {
                    const match = url.match(/fotos-inmuebles\/(.+)$/);
                    return match ? match[1] : url;
                }
                return url;
            }));

            // 2. Fetch Storage records (Restringido solo a /propiedades para evitar conflictos)
            const storageFiles = await fetchAllStorageFiles('fotos-inmuebles', 'propiedades');

            // 3. Compare
            const orphans = storageFiles.filter(path => !dbPaths.has(path));

            setOrphanedFiles(orphans);
            setStats({ totalDb: dbPaths.size, totalStorage: storageFiles.length });
            setAnalyzed(true);
            toast.success(`Análisis completado: ${orphans.length} archivos huérfanos detectados.`, { id: toastId });
        } catch (error: any) {
            console.error(error);
            toast.error(`Error al analizar: ${error.message}`, { id: toastId });
        } finally {
            setAnalyzing(false);
        }
    };

    const cleanOrphans = async () => {
        if (orphanedFiles.length === 0) return;
        if (!window.confirm(`¿Estás súper seguro de que deseas eliminar permanentemente estos ${orphanedFiles.length} archivos basura? (Esta acción es irreversible y tu storage subirá de espacio.)`)) return;

        setLoading(true);
        const toastId = toast.loading(`Eliminando masivamente ${orphanedFiles.length} archivos...`);
        try {
            // Eliminar en lotes de 20 para no sobrecargar el endpoint de Storage (Evita RateLimits)
            const batchSize = 20;
            let totalDeleted = 0;
            for (let i = 0; i < orphanedFiles.length; i += batchSize) {
                const batch = orphanedFiles.slice(i, i + batchSize);
                const { error, data } = await supabase.storage.from('fotos-inmuebles').remove(batch);
                if (error) throw error;
                totalDeleted += data?.length || 0;
            }

            toast.success(`¡Cacería Exitosa! Liberamos el espacio borrando ${totalDeleted} archivos fantasmas.`, { id: toastId });
            setOrphanedFiles([]);
            setStats(prev => ({ ...prev, totalStorage: prev.totalStorage - totalDeleted }));
        } catch (error: any) {
            console.error(error);
            toast.error(`Error al limpiar: ${error.message}`, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-2">
            <h3 className="text-xl font-black text-[#5e0b15] mb-2 flex items-center gap-2">
                <FaExclamationTriangle className="text-amber-500" /> Limpieza del Servidor (Basurero AWS/Supabase)
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-2xl">
                Al subir constantes fotos, los archivos pueden quedar "huérfanos" (existen ocupando tu 1GB en Supabase, pero la base de datos ya no los referencia). Con esta herramienta podrás mapear la ruta <strong>/propiedades</strong> y eliminarlos en un clic.
            </p>

            <div className="flex flex-wrap gap-4 mb-6">
                <button
                    onClick={analyzeStorage}
                    disabled={analyzing || loading}
                    className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition disabled:opacity-50"
                >
                    {analyzing ? <FaSpinner className="animate-spin" /> : <FaSearch />}
                    Escanear Archivos Basura
                </button>

                {analyzed && orphanedFiles.length > 0 && (
                    <button
                        onClick={cleanOrphans}
                        disabled={loading}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition disabled:opacity-50 animate-pulse border-2 border-red-700"
                    >
                        {loading ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                        Purgar Basura ({orphanedFiles.length} MB / Archivos)
                    </button>
                )}
            </div>

            {analyzed && (
                <div className="bg-gray-50 rounded-xl p-6 border grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                        <span className="block text-4xl font-black text-blue-600">{stats.totalDb}</span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Fotos en Base de Datos</span>
                    </div>
                    <div className="text-center lg:border-l lg:border-gray-200">
                        <span className="block text-4xl font-black text-gray-800">{stats.totalStorage}</span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Archivos Físicos</span>
                    </div>
                    <div className="text-center lg:border-l lg:border-gray-200">
                        <span className={`block text-4xl font-black ${orphanedFiles.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {orphanedFiles.length}
                        </span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Archivos Fantasmas</span>
                    </div>
                    <div className="text-center lg:border-l lg:border-gray-200 flex flex-col items-center justify-center">
                        {orphanedFiles.length === 0 ? (
                            <>
                                <FaCheckCircle className="text-4xl text-green-500 mb-1" />
                                <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Sincronizado</span>
                            </>
                        ) : (
                            <>
                                <FaExclamationTriangle className="text-4xl text-amber-500 mb-1 animate-bounce" />
                                <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Requiere Purgado</span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {analyzed && orphanedFiles.length > 0 && (
                <div className="mt-6">
                    <h4 className="font-bold text-gray-700 text-sm mb-2">Vista previa de Elementos a Eliminar:</h4>
                    <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-xl p-4 text-xs font-mono text-gray-500 border whitespace-pre-line break-all">
                        {orphanedFiles.slice(0, 50).join("\n")}
                        {orphanedFiles.length > 50 && `\n\n...y ${orphanedFiles.length - 50} archivos fantasma más.`}
                    </div>
                </div>
            )}
        </div>
    );
};
