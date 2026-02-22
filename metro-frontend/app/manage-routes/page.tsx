'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Table from '@/components/Table';
import { Route } from '@/types/route';
import { Metro } from '@/types/metro';

const BASE_URL = 'http://localhost:3000/api';

export default function ManageRoutesPage() {
    const router = useRouter();
    const [routes, setRoutes] = useState<Route[]>([]);
    const [metros, setMetros] = useState<Metro[]>([]);
    const [routeName, setRouteName] = useState('');
    const [metroId, setMetroId] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Station Management State
    const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
    const [routeStations, setRouteStations] = useState<any[]>([]);
    const [stationName, setStationName] = useState('');
    const [stationZone, setStationZone] = useState('');
    const [loadingStations, setLoadingStations] = useState(false);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user || user.role_id !== 1) { router.push('/'); return; }
        fetchRoutes();
        fetchMetros();
    }, [router]);

    async function fetchRoutes() {
        try {
            const res = await fetch(`${BASE_URL}/admin/routes`);
            const data = await res.json();
            setRoutes(data.routes || []);
        } catch {
            setMessage('Failed to load routes.');
        }
    }

    async function fetchMetros() {
        try {
            const res = await fetch(`${BASE_URL}/admin/metro`);
            const data = await res.json();
            setMetros(data.metros || []);
        } catch {
            // silent
        }
    }

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setMessage('');
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/admin/route`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ route_name: routeName, metro_id: parseInt(metroId) }),
            });
            const data = await res.json();
            if (!res.ok) { setMessage(data.error || 'Failed.'); return; }
            setMessage('Route added successfully.');
            setRouteName('');
            setMetroId('');
            fetchRoutes();
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
            const res = await fetch(`${BASE_URL}/admin/route/${row.route_id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) { setMessage(data.error || 'Delete failed.'); return; }
            setMessage('Route deleted.');
            fetchRoutes();
        } catch {
            setMessage('Could not connect to server.');
        }
    }

    async function fetchRouteStations(rid: number) {
        setLoadingStations(true);
        setRouteStations([]);
        try {
            const res = await fetch(`${BASE_URL}/user/stations/${rid}`);
            const data = await res.json();
            setRouteStations(data.stations || []);
        } catch {
            setMessage('Failed to load stations.');
        } finally {
            setLoadingStations(false);
        }
    }

    function openStationManager(route: Route) {
        setSelectedRouteId(route.route_id);
        setStationName('');
        setStationZone('');
        setMessage(`Managing stations for: ${route.route_name}`);
        fetchRouteStations(route.route_id);
    }

    async function handleAddStation(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedRouteId) return;
        setMessage('');
        setLoadingStations(true);
        try {
            const res = await fetch(`${BASE_URL}/admin/station`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    route_id: selectedRouteId,
                    station_name: stationName,
                    zone: parseInt(stationZone)
                }),
            });
            const data = await res.json();
            if (!res.ok) { setMessage(data.error || 'Failed.'); return; }
            setMessage('Station added successfully.');
            setStationName('');
            setStationZone('');
            fetchRouteStations(selectedRouteId);
        } catch {
            setMessage('Could not connect to server.');
        } finally {
            setLoadingStations(false);
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
                <h2 className="text-base font-semibold text-gray-900">Manage Routes</h2>

                {message && (
                    <p className="text-sm border border-gray-300 px-3 py-2 text-gray-800">{message}</p>
                )}

                {/* Add Route Form */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Add New Route</h3>
                    <form onSubmit={handleAdd} className="space-y-3 max-w-sm">
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Route Name</label>
                            <input
                                required
                                value={routeName}
                                onChange={(e) => setRouteName(e.target.value)}
                                placeholder="e.g. Station A to Station B"
                                className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Assign Metro</label>
                            <select
                                required
                                value={metroId}
                                onChange={(e) => setMetroId(e.target.value)}
                                className="w-full border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-gray-500"
                            >
                                <option value="">-- Select Metro --</option>
                                {metros.map((m) => (
                                    <option key={m.metro_id} value={m.metro_id}>
                                        {m.metro_name} ({m.metro_num})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-black text-white text-sm px-4 py-2 hover:bg-gray-800 disabled:bg-gray-400"
                        >
                            {loading ? 'Adding...' : 'Add Route'}
                        </button>
                    </form>
                </div>

                {/* Route List */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Route List</h3>
                    <Table
                        columns={[
                            { key: 'route_id', label: 'ID' },
                            { key: 'route_name', label: 'Route Name' },
                            { key: 'metro_name', label: 'Metro' },
                            {
                                key: 'actions', label: 'Actions', render: (row: any) => (
                                    <button
                                        onClick={() => openStationManager(row)}
                                        className="text-blue-600 hover:text-blue-800 text-xs underline mr-3"
                                    >
                                        Manage Stations
                                    </button>
                                )
                            }
                        ]}
                        data={routes}
                        onDelete={handleDelete}
                    />
                </div>

                {/* Station Manager Section */}
                {selectedRouteId && (
                    <div className="border-t border-gray-200 pt-6 mt-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">
                            Stations for Route ID: {selectedRouteId}
                        </h3>

                        {/* Add Station Form */}
                        <form onSubmit={handleAddStation} className="flex gap-3 mb-6 items-end bg-gray-50 p-4 rounded border border-gray-200">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Station Name</label>
                                <input
                                    required
                                    value={stationName}
                                    onChange={(e) => setStationName(e.target.value)}
                                    className="border border-gray-300 px-3 py-2 text-sm w-48 focus:outline-none focus:border-gray-500"
                                    placeholder="e.g. Camden Town"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Zone</label>
                                <input
                                    required
                                    type="number"
                                    value={stationZone}
                                    onChange={(e) => setStationZone(e.target.value)}
                                    className="border border-gray-300 px-3 py-2 text-sm w-20 focus:outline-none focus:border-gray-500"
                                    placeholder="1-6"
                                    min="1"
                                    max="6"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loadingStations}
                                className="bg-black text-white text-sm px-4 py-2 hover:bg-gray-800 disabled:bg-gray-400"
                            >
                                {loadingStations ? 'Adding...' : 'Add Station'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedRouteId(null)}
                                className="text-gray-500 text-sm px-4 py-2 hover:text-gray-700"
                            >
                                Close
                            </button>
                        </form>

                        {/* Stations Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse border border-gray-300 text-sm">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-gray-300 px-3 py-2 text-left">Stop Order</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">Station Name</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">Zone</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {routeStations.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="border border-gray-300 px-3 py-2 text-center text-gray-500">
                                                No stations added yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        routeStations.map((s) => (
                                            <tr key={s.station_id}>
                                                <td className="border border-gray-300 px-3 py-2">{s.stop_order}</td>
                                                <td className="border border-gray-300 px-3 py-2">{s.station_name}</td>
                                                <td className="border border-gray-300 px-3 py-2">{s.zone}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
