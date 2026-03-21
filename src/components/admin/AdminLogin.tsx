import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '../../services/supabaseClient';

export const AdminLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

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
};
