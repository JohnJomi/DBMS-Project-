'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Table from '@/components/Table';
import { Metro } from '@/types/metro';

const BASE_URL = 'http://localhost:3000/api';

export default function ManageMetroPage() {
    const router = useRouter();
    const [metros, setMetros] = useState<Metro[]>([]);
    const [form, setForm] = useState({ metro_name: '', metro_num: '', metro_seat_num: '' });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user || user.role_id !== 1) { router.push('/'); return; }
        fetchMetros();
    }, [router]);

    async function fetchMetros() {
        try {
            const res = await fetch(`${BASE_URL}/admin/metro`);
            const data = await res.json();
            setMetros(data.metros || []);
        } catch {
            setMessage('Failed to load metros.');
        }
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setMessage('');
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/admin/metro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    metro_name: form.metro_name,
                    metro_num: form.metro_num,
                    metro_seat_num: parseInt(form.metro_seat_num),
                }),
            });
            const data = await res.json();
            if (!res.ok) { setMessage(data.error || 'Failed.'); return; }
            setMessage('Metro added successfully.');
            setForm({ metro_name: '', metro_num: '', metro_seat_num: '' });
            fetchMetros();
        } catch {
            setMessage('Could not connect to server.');
        } finally {
            setLoading(false);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function handleDelete(row: Record<string, any>) {
        setMessage('');
        try {
            const res = await fetch(`${BASE_URL}/admin/metro/${row.metro_id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) { setMessage(data.error || 'Delete failed.'); return; }
            setMessage('Metro deleted.');
            fetchMetros();
        } catch {
            setMessage('Could not connect to server.');
        }
    }

    return (
        <main className="min-h-screen bg-white">
            <div className="border-b border-gray-300 px-4 py-3 flex items-center justify-between">
                <span className="font-semibold text-gray-900 text-sm">Metro Ticket Management System</span>
                <button onClick={() => router.push('/admin')} className="text-sm text-gray-700 hover:text-black">
                    ← Back to Dashboard
                </button>
            </div>

            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <h2 className="text-base font-semibold text-gray-900">Manage Metro</h2>

                {message && (
                    <p className="text-sm border border-gray-300 px-3 py-2 text-gray-800">{message}</p>
                )}

                {/* Add Metro Form */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Add New Metro</h3>
                    <form onSubmit={handleAdd} className="space-y-3 max-w-sm">
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Metro Name</label>
                            <input
                                name="metro_name"
                                required
                                value={form.metro_name}
                                onChange={handleChange}
                                placeholder="e.g. Blue Line Express"
                                className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Metro Number</label>
                            <input
                                name="metro_num"
                                required
                                value={form.metro_num}
                                onChange={handleChange}
                                placeholder="e.g. BL-04"
                                className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Seat Capacity</label>
                            <input
                                name="metro_seat_num"
                                type="number"
                                required
                                min="1"
                                value={form.metro_seat_num}
                                onChange={handleChange}
                                placeholder="e.g. 200"
                                className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-black text-white text-sm px-4 py-2 hover:bg-gray-800 disabled:bg-gray-400"
                        >
                            {loading ? 'Adding...' : 'Add Metro'}
                        </button>
                    </form>
                </div>

                {/* Metro List */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Metro List</h3>
                    <Table
                        columns={[
                            { key: 'metro_id', label: 'ID' },
                            { key: 'metro_name', label: 'Name' },
                            { key: 'metro_num', label: 'Number' },
                            { key: 'metro_seat_num', label: 'Seats' },
                        ]}
                        data={metros}
                        onDelete={handleDelete}
                    />
                </div>
            </div>
        </main>
    );
}
