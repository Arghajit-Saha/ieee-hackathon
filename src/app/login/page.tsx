'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, FirstAid } from '@phosphor-icons/react';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber, password }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.user?.role === 'doctor') {
                    router.push('/dashboard/doctor');
                } else {
                    router.push('/patient/consult');
                }
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to login');
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col pt-16">
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-white border-2 border-black p-8 brutal-shadow">

                    <div className="mb-8 text-center">
                        <div className="w-12 h-12 bg-black mx-auto flex items-center justify-center mb-4">
                            <FirstAid size={24} weight="bold" className="text-white" />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Portal Gateway</h1>
                        <p className="font-mono-ui text-[10px] tracking-wider uppercase text-zinc-400 mt-2">
                            Secure Access Required
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-600 text-sm font-bold">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold font-mono-ui uppercase tracking-wider mb-2">Phone Number</label>
                            <input
                                type="tel"
                                required
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full p-4 border-2 border-black bg-zinc-50 focus:bg-white outline-none focus:ring-2 focus:ring-black/5 transition-all text-lg font-medium"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold font-mono-ui uppercase tracking-wider mb-2">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-4 border-2 border-black bg-zinc-50 focus:bg-white outline-none focus:ring-2 focus:ring-black/5 transition-all text-lg"
                                placeholder="..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-black text-white font-bold tracking-wider hover:bg-zinc-800 transition-colors uppercase flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                'AUTHENTICATING...'
                            ) : (
                                <>
                                    LOGIN
                                    <ShieldCheck size={20} weight="bold" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-zinc-200 text-center">
                        <p className="text-sm text-zinc-500">
                            Don&apos;t have an account?{' '}
                            <Link href="/register" className="font-bold text-black border-b border-black hover:text-zinc-600 transition-colors">
                                Register
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
