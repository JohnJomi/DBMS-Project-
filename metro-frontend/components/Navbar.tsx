'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const router = useRouter();

    function handleLogout() {
        localStorage.clear();
        router.push('/');
    }

    return (
        <nav className="border-b border-gray-300 bg-white px-4 py-3 flex items-center justify-between">
            <span className="font-semibold text-gray-900 text-sm">
                Metro Ticket Management System
            </span>
            <div className="flex gap-4 text-sm">
                <Link href="/admin" className="text-gray-700 hover:text-black">Admin</Link>
                <Link href="/user" className="text-gray-700 hover:text-black">User</Link>
                <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-black"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}
