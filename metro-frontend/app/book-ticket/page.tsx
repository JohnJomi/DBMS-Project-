'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Route } from '@/types/route';
import { Station } from '@/types/station';

const BASE_URL = 'http://localhost:3000/api';

export default function BookTicketPage() {
    const router = useRouter();
    const [routes, setRoutes] = useState<Route[]>([]);
    const [stations, setStations] = useState<Station[]>([]);
    const [routeId, setRouteId] = useState('');
    const [fromStationId, setFromStationId] = useState('');
    const [toStationId, setToStationId] = useState('');
    const [fare, setFare] = useState<number | null>(null);
    const [fareDetails, setFareDetails] = useState<{ from: string; to: string; zoneMin: number; zoneMax: number } | null>(null);
    const [userId, setUserId] = useState<number | null>(null);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [loadingStations, setLoadingStations] = useState(false);
    const [loadingFare, setLoadingFare] = useState(false);
    const [loadingBook, setLoadingBook] = useState(false);
    const dateRef = useRef<HTMLInputElement>(null);
    const timeRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) { router.push('/'); return; }
        const user = JSON.parse(stored);
        setUserId(user.user_id);
        fetchRoutes();
    }, [router]);

    async function fetchRoutes() {
        try {
            const res = await fetch(`${BASE_URL}/admin/routes`);
            const data = await res.json();
            setRoutes(data.routes || []);
        } catch {
            setMessage('Failed to load routes.'); setIsError(true);
        }
    }

    async function fetchStations(rid: string) {
        setLoadingStations(true);
        setStations([]);
        setFromStationId('');
        setToStationId('');
        setFare(null);
        setFareDetails(null);
        try {
            const res = await fetch(`${BASE_URL}/user/stations/${rid}`);
            const data = await res.json();
            setStations(data.stations || []);
        } catch {
            setMessage('Failed to load stations.'); setIsError(true);
        } finally {
            setLoadingStations(false);
        }
    }

    const fetchFare = useCallback(async (fromId: string, toId: string) => {
        if (!fromId || !toId || fromId === toId) { setFare(null); return; }
        setLoadingFare(true);
        setFare(null);
        setFareDetails(null);
        try {
            const res = await fetch(`${BASE_URL}/user/fare?from_station_id=${fromId}&to_station_id=${toId}`);
            const data = await res.json();
            if (res.ok) {
                setFare(data.fare);
                setFareDetails({
                    from: data.from_station.name,
                    to: data.to_station.name,
                    zoneMin: data.zone_min,
                    zoneMax: data.zone_max
                });
            } else {
                setFare(null);
            }
        } catch {
            setFare(null);
        } finally {
            setLoadingFare(false);
        }
    }, []);

    function handleRouteChange(rid: string) {
        setRouteId(rid);
        if (rid) fetchStations(rid);
    }

    function handleFromChange(val: string) {
        setFromStationId(val);
        fetchFare(val, toStationId);
    }

    function handleToChange(val: string) {
        setToStationId(val);
        fetchFare(fromStationId, val);
    }

    async function handleBook(e: React.FormEvent) {
        e.preventDefault();
        setMessage(''); setIsError(false);
        if (!userId || !routeId || !fromStationId || !toStationId) {
            setIsError(true);
            setMessage('Please select a line, from station, and to station.');
            return;
        }
        const travelDate = dateRef.current?.value || '';
        const travelTime = timeRef.current?.value || '';
        if (!travelDate || !travelTime) {
            setIsError(true);
            setMessage('Please enter a travel date and time.');
            return;
        }
        if (fare === null) {
            setIsError(true);
            setMessage('Fare could not be calculated. Please reselect stations.');
            return;
        }
        setLoadingBook(true);
        try {
            const res = await fetch(`${BASE_URL}/user/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    route_id: parseInt(routeId),
                    from_station_id: parseInt(fromStationId),
                    to_station_id: parseInt(toStationId),
                    travel_date: travelDate,
                    travel_time: travelTime,
                }),
            });
            const data = await res.json();
            if (!res.ok) { setIsError(true); setMessage(data.error || 'Booking failed.'); return; }
            setMessage(
                `✓ Ticket #${data.ticket_id} booked! ${data.from_station} → ${data.to_station} | £${data.fare.toFixed(2)}`
            );
            // Reset form
            setRouteId(''); setFromStationId(''); setToStationId('');
            if (dateRef.current) dateRef.current.value = '';
            if (timeRef.current) timeRef.current.value = '';
            setStations([]); setFare(null); setFareDetails(null);
        } catch {
            setIsError(true);
            setMessage('Could not connect to server.');
        } finally {
            setLoadingBook(false);
        }
    }

    const today = new Date().toISOString().split('T')[0];

    return (
        <main className="min-h-screen bg-white">
            {/* Top bar */}
            <div className="border-b border-gray-300 px-4 py-3 flex items-center justify-between">
                <span className="font-semibold text-gray-900 text-sm">Metro Ticket Management System</span>
                <button onClick={() => router.push('/user')} className="text-sm text-gray-700 hover:text-black">
                    ← Back
                </button>
            </div>

            <div className="max-w-lg mx-auto p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-1">Book a Ticket</h2>
                <p className="text-xs text-gray-500 mb-5">London Underground · Zone-based fares (£)</p>

                {/* Status message */}
                {message && (
                    <p className={`text-sm border px-3 py-2 mb-5 ${isError ? 'border-red-300 text-red-700' : 'border-green-400 text-green-700 bg-green-50'}`}>
                        {message}
                    </p>
                )}

                <form onSubmit={handleBook} className="space-y-4">

                    {/* ── Line ── */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Line</label>
                        <select
                            required
                            value={routeId}
                            onChange={(e) => handleRouteChange(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-500 bg-white"
                        >
                            <option value="">-- Select a line --</option>
                            {routes.map((r) => (
                                <option key={r.route_id} value={r.route_id}>{r.route_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* ── From / To Stations ── */}
                    {routeId && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">From Station</label>
                                <select
                                    required
                                    value={fromStationId}
                                    onChange={(e) => handleFromChange(e.target.value)}
                                    disabled={loadingStations}
                                    className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-500 bg-white disabled:bg-gray-100"
                                >
                                    <option value="">{loadingStations ? 'Loading…' : '-- From --'}</option>
                                    {stations.map((s) => (
                                        <option key={s.station_id} value={s.station_id} disabled={s.station_id.toString() === toStationId}>
                                            {s.station_name} (Z{s.zone})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">To Station</label>
                                <select
                                    required
                                    value={toStationId}
                                    onChange={(e) => handleToChange(e.target.value)}
                                    disabled={loadingStations || !fromStationId}
                                    className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-500 bg-white disabled:bg-gray-100"
                                >
                                    <option value="">{loadingStations ? 'Loading…' : '-- To --'}</option>
                                    {stations
                                        .filter((s) => s.station_id.toString() !== fromStationId)
                                        .map((s) => (
                                            <option key={s.station_id} value={s.station_id}>
                                                {s.station_name} (Z{s.zone})
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* ── Fare display ── */}
                    {(fromStationId && toStationId) && (
                        <div className={`border px-4 py-3 ${loadingFare ? 'border-gray-200 bg-gray-50' : fare !== null ? 'border-gray-300 bg-gray-50' : 'border-red-200 bg-red-50'}`}>
                            {loadingFare ? (
                                <p className="text-sm text-gray-500">Calculating fare…</p>
                            ) : fare !== null && fareDetails ? (
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                        Zone {fareDetails.zoneMin} → Zone {fareDetails.zoneMax}
                                    </p>
                                    <p className="text-lg font-bold text-gray-900">£{fare.toFixed(2)}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {fareDetails.from} → {fareDetails.to}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-red-600">Select different From/To stations</p>
                            )}
                        </div>
                    )}

                    {/* ── Date & Time (uncontrolled via refs) ── */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Travel Date</label>
                            <input
                                ref={dateRef}
                                type="date"
                                required
                                min={today}
                                className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Travel Time</label>
                            <input
                                ref={timeRef}
                                type="time"
                                required
                                className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-500"
                            />
                        </div>
                    </div>

                    {/* ── Submit ── */}
                    <button
                        type="submit"
                        disabled={loadingBook}
                        className="w-full bg-black text-white text-sm py-2.5 hover:bg-gray-800 disabled:bg-gray-400 font-medium"
                    >
                        {loadingBook ? 'Booking…' : fare !== null ? `Book Ticket — £${fare.toFixed(2)}` : 'Book Ticket'}
                    </button>
                </form>

                {/* Zone reference */}
                <div className="mt-8 border-t border-gray-200 pt-4">
                    <p className="text-xs font-medium text-gray-600 mb-2">Zone Fare Reference (£)</p>
                    <div className="grid grid-cols-3 gap-1 text-xs text-gray-500">
                        {[
                            ['Z1→Z1', '2.80'], ['Z1→Z2', '3.40'], ['Z1→Z3', '3.90'],
                            ['Z1→Z4', '4.90'], ['Z1→Z5', '5.60'], ['Z1→Z6', '6.00'],
                            ['Z2→Z2', '2.00'], ['Z2→Z3', '2.50'], ['Z2→Z4', '3.00'],
                            ['Z3→Z3', '2.00'], ['Z3→Z4', '2.50'], ['Z4→Z4', '2.00'],
                        ].map(([label, val]) => (
                            <div key={label} className="flex justify-between border border-gray-100 px-2 py-1">
                                <span>{label}</span><span className="font-medium text-gray-700">£{val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
