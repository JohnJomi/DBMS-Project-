'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
    const router = useRouter();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user || user.role_id !== 1) {
            router.push('/');
        }
    }, [router]);

    function handleLogout() {
        localStorage.clear();
        router.push('/');
    }

    return (
        <main className="min-h-screen bg-white">
            <div className="border-b border-gray-300 px-4 py-3 flex items-center justify-between">
                <span className="font-semibold text-gray-900 text-sm">
                    Metro Ticket Management System — Admin Panel
                </span>
                <button
                    onClick={handleLogout}
                    className="text-sm text-gray-700 hover:text-black"
                >
                    Logout
                </button>
            </div>

            <div className="max-w-4xl mx-auto p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Admin Dashboard</h2>

                <div className="border border-gray-300 divide-y divide-gray-300 max-w-xs">
                    {[
                        { href: '/manage-metro', label: 'Manage Metro' },
                        { href: '/manage-routes', label: 'Manage Routes' },
                        { href: '/reports', label: 'Reports' },
                    ].map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="block px-4 py-3 text-sm text-gray-800 hover:bg-gray-100"
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}
