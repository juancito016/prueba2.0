import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabaseClient';
import imageCompression from 'browser-image-compression';
import { FaTimes, FaCamera, FaSpinner } from 'react-icons/fa';
import { useLocationManager } from '../hooks/useLocationManager';
import { getImageUrl } from '../utils/helpers';

interface FormProps {
    inmueble?: any;
    adminId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const InmuebleForm: React.FC<FormProps> = ({ inmueble, adminId, onClose, onSuccess }) => {
    const isEditing = !!inmueble;
    const [submitting, setSubmitting] = useState(false);
    const [archivosA, setArchivosA] = useState<File[]>([]);

    const { getOrCreateBarrio, departamentos, ciudades, fetchDepartamentos, fetchCiudades } = useLocationManager();

    // Precargar locations referenciales (idealmente filtramos ciudades por depto, aquí simplificado)
    useEffect(() => {
        fetchDepartamentos();
        fetchCiudades();
    }, [fetchDepartamentos, fetchCiudades]);

    const [existingImages, setExistingImages] = useState<any[]>(inmueble?.imagenes || []);

    useEffect(() => {
        if (inmueble?.imagenes) setExistingImages(inmueble.imagenes);
    }, [inmueble]);

    // Extraer datos iniciales si estamos editando
    const initialDeptoId = isEditing && inmueble.barrios?.ciudades?.departamento_id ? inmueble.barrios.ciudades.departamento_id : '';
    const initialCiudadId = isEditing && inmueble.barrios?.ciudad_id ? inmueble.barrios.ciudad_id : '';
    const initialBarrioNombre = isEditing && inmueble.barrios?.nombre ? inmueble.barrios.nombre : '';

    const [formUbicacion, setFormUbicacion] = useState({
        departamento_id: initialDeptoId,
        ciudad_id: initialCiudadId,
        barrio_nombre: initialBarrioNombre
    });

    const [formData, setFormData] = useState({
        titulo: inmueble?.titulo || '',
        descripcion: inmueble?.descripcion || '',
        tipo_propiedad: inmueble?.tipo_propiedad || 'Casa',
        precio: inmueble?.precio || '',
        moneda: inmueble?.moneda || 'Bs',
        superficie_terreno: inmueble?.superficie_terreno || '',
        superficie_construida: inmueble?.superficie_construida || '',
        habitaciones: inmueble?.habitaciones || 0,
        banos: inmueble?.banos || 0,
        estado: inmueble?.estado || 'Disponible',
        contacto: inmueble?.contacto ? inmueble.contacto.replace('+591', '') : ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleUbiChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormUbicacion(prev => {
            const up = { ...prev, [name]: value };
            if (name === 'departamento_id') {
                up.ciudad_id = '';
            }
            return up;
        });
    };

    const ciudadesFiltradas = formUbicacion.departamento_id
        ? ciudades.filter(c => c.departamento_id === formUbicacion.departamento_id)
        : [];

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if (files.length + archivosA.length > 4) {
                toast.error('Solo se permiten 4 imágenes por inmueble.');
                return;
            }
            setArchivosA(prev => [...prev, ...files]);
        }
    };

    const removePhoto = (index: number) => {
        setArchivosA(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingPhoto = async (imageId: string) => {
        if (!window.confirm("¿Seguro que deseas quitar esta foto? (Se borrará online al instante)")) return;
        const toastId = toast.loading('Quitando foto...');
        try {
            const { error: dbError } = await supabase.from('imagenes').delete().eq('id', imageId);
            if (dbError) throw dbError;

            setExistingImages(prev => prev.filter(img => img.id !== imageId));
            toast.success("Foto quitada", { id: toastId });
        } catch (err: any) {
            toast.error(`Error al quitar: ${err.message}`, { id: toastId });
        }
    };

    // Compresión y subida conectada a fotos-inmuebles
    const uploadAndOptimizeImages = async (inmuebleId: string): Promise<string[]> => {
        const urls: string[] = [];
        const options = {
            maxSizeMB: 0.8, // 800 KB max
            maxWidthOrHeight: 1200,
            useWebWorker: true,
            fileType: 'image/webp',
        };

        for (let i = 0; i < archivosA.length; i++) {
            const file = archivosA[i];
            try {
                const compressedBlob = await imageCompression(file, options);
                // Convertir File a webp explicitamente
                const optimizedFile = new File([compressedBlob], `img_${Date.now()}_${i}.webp`, { type: 'image/webp' });

                const filePath = `propiedades/${inmuebleId}/${optimizedFile.name}`;

                const { data, error } = await supabase.storage
                    .from('fotos-inmuebles')
                    .upload(filePath, optimizedFile, { cacheControl: '3600', upsert: false });

                if (error) throw error;

                if (data) {
                    urls.push(data.path);
                }
            } catch (err) {
                console.error('Error optimizando imagen:', err);
                toast.error(`La imagen ${file.name} no se procesó.`);
            }
        }
        return urls;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validaciones de ubicacion
        if (!formUbicacion.ciudad_id) {
            toast.error('Debes seleccionar una ciudad.');
            return;
        }
        if (!formUbicacion.barrio_nombre.trim()) {
            toast.error('Debes escribir el nombre del barrio.');
            return;
        }

        setSubmitting(true);
        const toastId = toast.loading(isEditing ? 'Guardando cambios...' : 'Publicando inmueble...');

        try {
            // Lógica crítica: Obtener o crear el UUID del Barrio
            const finalBarrioId = await getOrCreateBarrio(formUbicacion.barrio_nombre, formUbicacion.ciudad_id);

            // Asegurar Number casting para evitar 400 Bad Request
            const payload = {
                titulo: formData.titulo,
                descripcion: formData.descripcion,
                tipo_propiedad: formData.tipo_propiedad,
                precio: Number(formData.precio), // Numérico estricto
                moneda: formData.moneda,
                superficie_terreno: formData.superficie_terreno ? Number(formData.superficie_terreno) : null,
                superficie_construida: formData.superficie_construida ? Number(formData.superficie_construida) : null,
                habitaciones: Number(formData.habitaciones),
                banos: Number(formData.banos),
                estado: formData.estado,
                barrio_id: finalBarrioId, // Usamos la UUID generada/obtenida
                admin_id: adminId, // El id del auth obligatoriamente
                contacto: formData.contacto ? formData.contacto : null
            };

            let newInmuebleId = inmueble?.id;

            if (isEditing) {
                const { error } = await supabase.from('inmuebles').update(payload).eq('id', newInmuebleId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from('inmuebles').insert(payload).select().single();
                if (error) throw error;
                newInmuebleId = data.id;
            }

            // Subir imágenes si existen
            if (archivosA.length > 0) {
                toast.loading('Optimizando a formato WebP...', { id: toastId });
                const newUrls = await uploadAndOptimizeImages(newInmuebleId);

                if (newUrls.length > 0) {
                    const insertPayload = newUrls.map((url, index) => ({
                        inmueble_id: newInmuebleId,
                        url_storage: url,
                        orden: index + existingImages.length
                    }));
                    const { error: imgError } = await supabase.from('imagenes').insert(insertPayload);
                    if (imgError) throw imgError;
                }
            }

            toast.success(isEditing ? '¡Inmueble actualizado!' : '¡Inmueble publicado!', { id: toastId });
            onSuccess();
        } catch (error: any) {
            toast.error(`Error de Base de Datos: ${error.message}`, { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative text-gray-900">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <h2 className="text-2xl font-black text-[#5e0b15]">
                    {isEditing ? 'Editar Inmueble' : 'Nueva Publicación'}
                </h2>
                <button onClick={onClose} className="text-gray-400 hover:text-[#5e0b15] bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition">
                    <FaTimes size={20} />
                </button>
            </div>

            <div className="p-8 overflow-y-auto">
                <form id="inmuebleForm" onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Título y Descripción */}
                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Título de la publicación <span className="text-red-500">*</span></label>
                                <input required type="text" name="titulo" value={formData.titulo} onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#5e0b15] focus:border-[#5e0b15] bg-gray-50" placeholder="Ej. Hermosa casa en Miraflores" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción detallada <span className="text-red-500">*</span></label>
                                <textarea required name="descripcion" rows={4} value={formData.descripcion} onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#5e0b15] focus:border-[#5e0b15] bg-gray-50" placeholder="Describe los beneficios, acabados y entorno..."></textarea>
                            </div>
                        </div>

                        {/* Precios y Tipos */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Precio <span className="text-red-500">*</span></label>
                                    <input required type="number" step="any" name="precio" value={formData.precio} onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Moneda</label>
                                    <select name="moneda" value={formData.moneda} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50">
                                        <option value="Bs">Bs</option>
                                        <option value="USD">USD</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Tipo</label>
                                    <select name="tipo_propiedad" value={formData.tipo_propiedad} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50">
                                        <option value="Casa">Casa</option>
                                        <option value="Lote">Lote</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp Contacto Directo <span className="text-gray-400 font-normal text-[11px]">(opcional)</span></label>
                                    <div className="flex bg-gray-50 border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#5e0b15] focus-within:border-transparent">
                                        <span className="bg-gray-200 px-3 py-3 text-gray-600 font-bold border-r border-gray-300 flex items-center pointer-events-none">+591</span>
                                        <input type="tel" name="contacto" value={formData.contacto} onChange={handleChange} placeholder="Ej. 70012345" className="w-full px-3 py-3 bg-transparent focus:outline-none focus:ring-0 border-0" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ubicación Nueva (Ciudades + Barrio Libre) */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                            <h3 className="font-bold text-[#5e0b15]">Ubicación (Tarija)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Departamento <span className="text-red-500">*</span></label>
                                    <select
                                        required
                                        name="departamento_id"
                                        value={formUbicacion.departamento_id}
                                        onChange={handleUbiChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-sm focus:ring-[#5e0b15]"
                                    >
                                        <option value="">Seleccione Departamento...</option>
                                        {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Ciudad <span className="text-red-500">*</span></label>
                                    <select
                                        required
                                        name="ciudad_id"
                                        value={formUbicacion.ciudad_id}
                                        onChange={handleUbiChange}
                                        disabled={!formUbicacion.departamento_id}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-sm focus:ring-[#5e0b15] disabled:bg-gray-100"
                                    >
                                        <option value="">Seleccione Ciudad...</option>
                                        {ciudadesFiltradas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Barrio <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    type="text"
                                    name="barrio_nombre"
                                    value={formUbicacion.barrio_nombre}
                                    onChange={handleUbiChange}
                                    placeholder="Ej. Tabladita, Miraflores..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-[#5e0b15] focus:border-[#5e0b15]"
                                />
                                <p className="text-xs text-gray-500 mt-1">Si el barrio no existe, se creará mágicamente.</p>
                            </div>
                        </div>

                        {/* Medidas y Ambientes */}
                        <div className="space-y-4 md:col-span-2">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Terreno (m²)</label>
                                    <input type="number" step="any" name="superficie_terreno" value={formData.superficie_terreno} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Construido (m²)</label>
                                    <input type="number" step="any" name="superficie_construida" value={formData.superficie_construida} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Habitaciones</label>
                                    <input type="number" name="habitaciones" value={formData.habitaciones} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Baños</label>
                                    <input type="number" name="banos" value={formData.banos} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50" />
                                </div>
                            </div>
                        </div>

                        {/* Área de Fotos Obligatoria */}
                        <div className="md:col-span-2 mt-2 bg-gray-50 p-6 rounded-2xl border border-gray-200 border-dashed">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Fotos Locales a WebP (Máx 4)</label>

                            <div className="flex flex-wrap gap-4 mb-4">
                                {isEditing && existingImages.map((img: any, i: number) => (
                                    <div key={`db-${img.id || i}`} className="relative w-24 h-24 rounded-xl overflow-hidden group shadow-md border-2 border-green-500/30">
                                        <img src={getImageUrl(img.url_storage)} className="object-cover w-full h-full opacity-80" alt="online" />
                                        <button type="button" onClick={() => removeExistingPhoto(img.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow">
                                            <FaTimes size={12} />
                                        </button>
                                        <div className="absolute bottom-0 text-[10px] bg-green-500 text-white w-full text-center py-0.5">Online</div>
                                    </div>
                                ))}

                                {archivosA.map((f, i) => (
                                    <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden group shadow-md border">
                                        <img src={URL.createObjectURL(f)} className="object-cover w-full h-full" alt="preview" />
                                        <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow">
                                            <FaTimes size={12} />
                                        </button>
                                        <div className="absolute bottom-0 text-[10px] bg-[#5e0b15] text-white w-full text-center py-0.5">Nueva</div>
                                    </div>
                                ))}

                                {(existingImages.length + archivosA.length) < 4 && (
                                    <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-gray-300 border-dashed rounded-xl cursor-pointer hover:bg-gray-100 hover:border-[#5e0b15] transition text-gray-400">
                                        <FaCamera size={24} className="mb-1" />
                                        <span className="text-[10px] font-bold">Añadir Foto</span>
                                        <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </label>
                                )}
                            </div>

                            <p className="text-xs text-[#5e0b15] font-medium block">
                                Se requiere un máximo de 4 fotos combinadas (Online + Nuevas).
                            </p>
                        </div>

                    </div>
                </form>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-4 rounded-b-3xl">
                <button type="button" onClick={onClose} disabled={submitting} className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition">
                    Cancelar
                </button>
                <button type="submit" form="inmuebleForm" disabled={submitting} className="px-8 py-3 rounded-xl font-bold text-white bg-[#5e0b15] hover:bg-red-900 transition shadow-md flex items-center justify-center min-w-[150px]">
                    {submitting ? <FaSpinner className="animate-spin" /> : (isEditing ? 'Guardar Cambios' : 'Publicar Inmueble')}
                </button>
            </div>
        </div>
    );
};
