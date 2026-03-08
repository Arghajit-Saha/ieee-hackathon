'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Trash, FloppyDisk, CaretLeft } from '@phosphor-icons/react';
import Link from 'next/link';

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userData, setUserData] = useState({
        firstName: '',
        lastName: '',
        age: '',
        gender: '',
        languagePref: 'en',
        phoneNumber: '',
        role: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/user/profile');
            if (res.ok) {
                const data = await res.json();
                setUserData({
                    firstName: data.user.firstName || '',
                    lastName: data.user.lastName || '',
                    age: data.user.age || '',
                    gender: data.user.gender || '',
                    languagePref: data.user.languagePref || 'en',
                    phoneNumber: data.user.phoneNumber || '',
                    role: data.user.role || ''
                });
            } else {
                router.push('/login');
            }
        } catch (err) {
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (res.ok) {
                setSuccess('Profile updated successfully');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to update profile');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        try {
            const res = await fetch('/api/user/profile', { method: 'DELETE' });
            if (res.ok) {
                router.push('/');
                router.refresh();
            } else {
                setError('Failed to delete account');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center pt-16">
                <div className="font-mono-ui tracking-widest text-xs animate-pulse">LOADING PROFILE...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] pt-24 pb-20 px-6">
            <div className="max-w-2xl mx-auto">
                <Link
                    href={userData.role === 'doctor' ? '/dashboard/doctor' : '/'}
                    className="inline-flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-wider text-zinc-400 hover:text-black mb-8 transition-colors"
                >
                    <CaretLeft size={12} weight="bold" />
                    Back to {userData.role === 'doctor' ? 'Dashboard' : 'Home'}
                </Link>

                <div className="bg-white border-2 border-black brutal-shadow p-8 md:p-12 mb-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-black flex items-center justify-center">
                            <User className="text-white" size={24} weight="bold" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight uppercase">User Profile</h1>
                            <p className="font-mono-ui text-xs tracking-wider text-zinc-500 mt-1">
                                Manage your account settings
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-2 border-red-500 p-4 mb-8 font-mono-ui text-xs text-red-600 font-bold uppercase tracking-tight">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border-2 border-green-500 p-4 mb-8 font-mono-ui text-xs text-green-600 font-bold uppercase tracking-tight">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block font-mono-ui text-[10px] uppercase tracking-wider text-zinc-500 font-bold">First Name</label>
                                <input
                                    type="text"
                                    value={userData.firstName}
                                    onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                                    className="w-full bg-white border-2 border-black p-3 text-sm font-bold focus:outline-none focus:bg-zinc-50 transition-colors"
                                    placeholder="Enter first name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block font-mono-ui text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Last Name</label>
                                <input
                                    type="text"
                                    value={userData.lastName}
                                    onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                                    className="w-full bg-white border-2 border-black p-3 text-sm font-bold focus:outline-none focus:bg-zinc-50 transition-colors"
                                    placeholder="Enter last name"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block font-mono-ui text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Age</label>
                                <input
                                    type="number"
                                    value={userData.age}
                                    onChange={(e) => setUserData({ ...userData, age: e.target.value })}
                                    className="w-full bg-white border-2 border-black p-3 text-sm font-bold focus:outline-none focus:bg-zinc-50 transition-colors"
                                    placeholder="Enter age"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block font-mono-ui text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Gender</label>
                                <select
                                    value={userData.gender}
                                    onChange={(e) => setUserData({ ...userData, gender: e.target.value })}
                                    className="w-full bg-white border-2 border-black p-3 text-sm font-bold focus:outline-none focus:bg-zinc-50 transition-colors appearance-none"
                                >
                                    <option value="">Select gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block font-mono-ui text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Language Preference</label>
                            <select
                                value={userData.languagePref}
                                onChange={(e) => setUserData({ ...userData, languagePref: e.target.value })}
                                className="w-full bg-white border-2 border-black p-3 text-sm font-bold focus:outline-none focus:bg-zinc-50 transition-colors appearance-none"
                            >
                                <option value="en">English</option>
                                <option value="fr">French</option>
                                <option value="es">Spanish</option>
                                <option value="hi">Hindi</option>
                            </select>
                        </div>

                        <div className="pt-4 border-t-2 border-black/5 mt-8">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-black text-white p-4 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 brutal-shadow-hover transition-all disabled:opacity-50"
                            >
                                {saving ? (
                                    'SAVING...'
                                ) : (
                                    <>
                                        <FloppyDisk size={16} weight="bold" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-white border-2 border-black brutal-shadow p-8 md:p-12 border-red-100">
                    <h3 className="text-xl font-black tracking-tight uppercase mb-4 text-red-600">Danger Zone</h3>
                    <p className="text-sm text-zinc-500 mb-8 leading-relaxed font-medium">
                        Deleting your account will permanently remove all your data from our servers.
                        This action cannot be undone. Please proceed with caution.
                    </p>
                    <button
                        onClick={handleDeleteAccount}
                        className="bg-red-50 text-red-600 border-2 border-red-500 px-6 py-3 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all brutal-shadow-red"
                    >
                        <Trash size={16} weight="bold" />
                        Delete Account Permanently
                    </button>
                </div>
            </div>
        </div>
    );
}
