'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, FirstAid } from '@phosphor-icons/react';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        phoneNumber: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'patient',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                if (formData.role === 'doctor') {
                    router.push('/dashboard/doctor');
                } else {
                    router.push('/patient/consult');
                }
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to register');
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col pt-16">
            <div className="flex-1 flex items-center justify-center p-6 py-12">
                <div className="w-full max-w-md bg-white border-2 border-black p-8 brutal-shadow">

                    <div className="mb-8 text-center">
                        <div className="w-12 h-12 bg-black mx-auto flex items-center justify-center mb-4">
                            <FirstAid size={24} weight="bold" className="text-white" />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Create Account</h1>
                        <p className="font-mono-ui text-[10px] tracking-wider uppercase text-zinc-400 mt-2">
                            Secure Personnel Registration
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600 text-sm font-bold">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold font-mono-ui uppercase tracking-wider mb-2">First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    required
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="w-full p-3 border-2 border-black bg-zinc-50 focus:bg-white outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold font-mono-ui uppercase tracking-wider mb-2">Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    required
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full p-3 border-2 border-black bg-zinc-50 focus:bg-white outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold font-mono-ui uppercase tracking-wider mb-2">Phone Number</label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                required
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                className="w-full p-3 border-2 border-black bg-zinc-50 focus:bg-white outline-none focus:ring-2 focus:ring-black/5 transition-all text-lg font-medium"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold font-mono-ui uppercase tracking-wider mb-2">Password</label>
                            <input
                                type="password"
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full p-3 border-2 border-black bg-zinc-50 focus:bg-white outline-none focus:ring-2 focus:ring-black/5 transition-all text-lg"
                                placeholder="..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold font-mono-ui uppercase tracking-wider mb-2">Role</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full p-3 border-2 border-black bg-zinc-50 focus:bg-white outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium appearance-none"
                            >
                                <option value="patient">Patient</option>
                                <option value="doctor">Doctor</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 py-4 bg-black text-white font-bold tracking-wider hover:bg-zinc-800 transition-colors uppercase flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                'REGISTERING...'
                            ) : (
                                <>
                                    CREATE ACCOUNT
                                    <UserPlus size={20} weight="bold" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-zinc-200 text-center">
                        <p className="text-sm text-zinc-500">
                            Already have an account?{' '}
                            <Link href="/login" className="font-bold text-black border-b border-black hover:text-zinc-600 transition-colors">
                                Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
