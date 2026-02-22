'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Ticket } from '@/types/ticket';

const BASE_URL = 'http://localhost:3000/api';

export default function UserPage() {
    const router = useRouter();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [userId, setUserId] = useState<number | null>(null);
    const [userName, setUserName] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) { router.push('/'); return; }
        const user = JSON.parse(stored);
        if (user.role_id === 1) { router.push('/admin'); return; }
        setUserId(user.user_id);
        setUserName(user.user_name);
        fetchTickets(user.user_id);
    }, [router]);

    async function fetchTickets(uid: number) {
        try {
            const res = await fetch(`${BASE_URL}/user/tickets/${uid}`);
            const data = await res.json();
            setTickets(data.tickets || []);
        } catch {
            setMessage('Failed to load tickets.');
        }
    }

    async function cancelTicket(ticketId: number) {
        try {
            const res = await fetch(`${BASE_URL}/user/cancel/${ticketId}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) { setMessage(data.error || 'Cancel failed.'); return; }
            setMessage('Ticket cancelled.');
            if (userId) fetchTickets(userId);
        } catch {
            setMessage('Failed to cancel ticket.');
        }
    }

    function handleLogout() {
        localStorage.clear();
        router.push('/');
    }

    return (
        <main className="min-h-screen bg-white">
            <div className="border-b border-gray-300 px-4 py-3 flex items-center justify-between">
                <span className="font-semibold text-gray-900 text-sm">
                    Metro Ticket Management System
                </span>
                <button onClick={handleLogout} className="text-sm text-gray-700 hover:text-black">
                    Logout
                </button>
            </div>

            <div className="max-w-4xl mx-auto p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-1">User Dashboard</h2>
                {userName && <p className="text-sm text-gray-600 mb-4">Welcome, {userName}</p>}

                <div className="mb-6">
                    <Link
                        href="/book-ticket"
                        className="inline-block bg-black text-white text-sm px-4 py-2 hover:bg-gray-800"
                    >
                        Book a Ticket
                    </Link>
                </div>

                {message && (
                    <p className="text-sm text-gray-700 border border-gray-300 px-3 py-2 mb-4">
                        {message}
                    </p>
                )}

                <h3 className="text-sm font-semibold text-gray-900 mb-2">My Tickets</h3>
                {tickets.length === 0 ? (
                    <p className="text-sm text-gray-600">No tickets booked yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    {['ID', 'Line', 'From', 'To', 'Fare (£)', 'Travel Date', 'Action'].map((h) => (
                                        <th key={h} className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800 whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map((t) => (
                                    <tr key={t.ticket_id} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-3 py-2">{t.ticket_id}</td>
                                        <td className="border border-gray-300 px-3 py-2 whitespace-nowrap">{t.route_name}</td>
                                        <td className="border border-gray-300 px-3 py-2 whitespace-nowrap">{(t as any).from_station || '—'}</td>
                                        <td className="border border-gray-300 px-3 py-2 whitespace-nowrap">{(t as any).to_station || '—'}</td>
                                        <td className="border border-gray-300 px-3 py-2">£{parseFloat(t.fare as any).toFixed(2)}</td>
                                        <td className="border border-gray-300 px-3 py-2 whitespace-nowrap">
                                            {new Date(t.booking_date).toLocaleString()}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-2">
                                            <button
                                                onClick={() => cancelTicket(t.ticket_id)}
                                                className="bg-black text-white text-xs px-3 py-1 hover:bg-gray-800"
                                            >
                                                Cancel
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </main>
    );
}
