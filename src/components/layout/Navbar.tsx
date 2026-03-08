'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { List, X, FirstAid, MapTrifold, ChatCircleDots, ChartBar, SignOut, User as UserIcon, VideoCamera } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

const links = [
    { name: 'Triage', href: '/triage', icon: ChatCircleDots },
    { name: 'Clinics', href: '/locator', icon: MapTrifold },
    { name: 'Consult', href: '/patient/consult', icon: VideoCamera, patientOnly: true },
    { name: 'Dashboard', href: '/dashboard/doctor', icon: ChartBar, doctorOnly: true },
    { name: 'Profile', href: '/profile', icon: UserIcon, authOnly: true },
];

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState<{ role: string, firstName?: string } | null>(null);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                }
            })
            .catch(() => setUser(null));
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        router.push('/login');
        router.refresh();
    };

    if (pathname.startsWith('/dashboard')) return null;

    return (
        <nav className="fixed top-0 w-full z-50 bg-white border-b-2 border-black">
            <div className="px-8 md:px-16 h-16 flex items-center justify-between">


                <Link href="/" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-black flex items-center justify-center">
                        <FirstAid className="text-white" size={18} weight="bold" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">Aura</span>
                </Link>


                <div className="hidden md:flex items-center gap-1">
                    {links.map((link) => {
                        if (link.doctorOnly && user?.role !== 'doctor') return null;
                        if (link.patientOnly && user?.role !== 'patient') return null;
                        if (link.authOnly && !user) return null;
                        const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${active ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'
                                    }`}
                            >
                                <link.icon size={16} weight={active ? 'fill' : 'bold'} />
                                {link.name}
                            </Link>
                        );
                    })}

                    {user ? (
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <SignOut size={16} weight="bold" />
                            Sign Out
                        </button>
                    ) : (
                        <Link
                            href="/login"
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-black hover:bg-zinc-100 transition-colors"
                        >
                            <UserIcon size={16} weight="bold" />
                            Sign In
                        </Link>
                    )}
                </div>


                <button className="md:hidden p-2 hover:bg-zinc-100 transition-colors" onClick={() => setOpen(!open)}>
                    {open ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
                </button>
            </div>

            {open && (
                <div className="md:hidden border-t-2 border-black bg-white">
                    {links.map((link) => {
                        if (link.doctorOnly && user?.role !== 'doctor') return null;
                        if (link.patientOnly && user?.role !== 'patient') return null;
                        if (link.authOnly && !user) return null;
                        const active = pathname === link.href;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setOpen(false)}
                                className={`flex items-center gap-3 px-8 py-4 text-sm font-medium border-b border-zinc-200 ${active ? 'bg-black text-white' : 'text-zinc-700 hover:bg-zinc-50'
                                    }`}
                            >
                                <link.icon size={18} weight={active ? 'fill' : 'bold'} />
                                {link.name}
                            </Link>
                        );
                    })}
                    {user ? (
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-8 py-4 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                            <SignOut size={18} weight="bold" />
                            Sign Out
                        </button>
                    ) : (
                        <Link
                            href="/login"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-8 py-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                            <UserIcon size={18} weight="bold" />
                            Sign In
                        </Link>
                    )}
                </div>
            )}
        </nav>
    );
}
