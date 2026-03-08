'use client';

import { useState } from 'react';
import { ShieldWarning, Users, CalendarBlank, ArrowLineLeft, List, X, Heartbeat, ChartBar, ChatCircle } from '@phosphor-icons/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<{ role: string, firstName?: string, lastName?: string } | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                }
            })
            .catch(console.error);
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
    };


    const navigation = [
        { name: 'Surveillance', href: '/dashboard/doctor', icon: ShieldWarning },
        { name: 'Response Queue', href: '/dashboard/doctor/queue', icon: Users },
        { name: 'Telecare', href: '/dashboard/doctor/consults', icon: CalendarBlank },
        { name: 'Health Monitor', href: '/dashboard/doctor/heatmap', icon: Heartbeat },
    ];

    return (
        <div className="min-h-screen bg-[#fafafa] flex">


            {sidebarOpen && (
                <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}


            <div className={`fixed inset-y-0 left-0 z-30 w-60 bg-black text-white flex flex-col transform transition-transform duration-200 lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>


                <div className="flex items-center justify-between h-14 px-5 border-b border-zinc-800">
                    <Link href="/" className="flex items-center gap-2">
                        <ChartBar size={16} weight="bold" className="text-zinc-400" />
                        <span className="text-sm font-bold tracking-wider">REGIONAL CARE HUB</span>
                    </Link>
                    <button className="lg:hidden text-zinc-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
                        <X size={18} weight="bold" />
                    </button>
                </div>


                <div className="px-5 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-800 flex items-center justify-center font-mono text-xs font-bold border border-zinc-700">
                            {user?.role ? user.role.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                            <p className="text-xs text-zinc-400">Logged in as</p>
                            <p className="text-xs font-mono font-bold tracking-wider">
                                {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.role?.toUpperCase() || 'LOADING...'}
                            </p>
                        </div>
                    </div>
                </div>


                <nav className="flex-1 py-3 px-3 space-y-0.5">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                                    ? 'bg-white text-black'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                                    }`}
                            >
                                <item.icon size={16} weight={isActive ? 'fill' : 'bold'} className="mr-2.5 shrink-0" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>


                <div className="p-3 border-t border-zinc-800 space-y-1">
                    <Link
                        href="/"
                        className="flex items-center px-3 py-2.5 text-sm text-zinc-500 hover:text-white transition-colors"
                    >
                        <ArrowLineLeft size={16} weight="bold" className="mr-2.5" />
                        Back to Site
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-3 py-2.5 text-sm text-red-500 hover:text-red-400 hover:bg-zinc-900 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </div>


            <div className="flex-1 flex flex-col min-w-0">


                <header className="bg-white border-b-2 border-black h-14 flex items-center px-5">
                    <button className="text-zinc-600 hover:text-black lg:hidden mr-4" onClick={() => setSidebarOpen(true)}>
                        <List size={20} weight="bold" />
                    </button>
                    <span className="font-mono text-xs text-zinc-400 tracking-wider">INTEGRATED RURAL HEALTH COMMAND</span>
                </header>


                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-6xl mx-auto p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
