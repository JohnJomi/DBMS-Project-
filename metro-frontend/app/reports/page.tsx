'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const BASE_URL = 'http://localhost:3000/api';

interface SummaryReport {
    total_tickets: number;
    total_revenue: number;
    avg_fare: number;
    max_fare: number;
    min_fare: number;
}

interface RouteReport {
    route_name: string;
    metro_name: string;
    ticket_count: number;
    total_revenue: number;
}

interface MonthlyReport {
    booking_year: number;
    booking_month: number;
    tickets_sold: number;
    monthly_revenue: number;
    avg_fare: number;
}

export default function ReportsPage() {
    const router = useRouter();
    const [summary, setSummary] = useState<SummaryReport | null>(null);
    const [routeReport, setRouteReport] = useState<RouteReport[]>([]);
    const [monthlyReport, setMonthlyReport] = useState<MonthlyReport[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user || user.role_id !== 1) { router.push('/'); return; }
        fetchReports();
    }, [router]);

    async function fetchReports() {
        try {
            const [r1, r2, r3] = await Promise.all([
                fetch(`${BASE_URL}/admin/reports`),
                fetch(`${BASE_URL}/admin/reports/routes`),
                fetch(`${BASE_URL}/admin/reports/monthly`),
            ]);
            const d1 = await r1.json();
            const d2 = await r2.json();
            const d3 = await r3.json();
            setSummary(d1.report);
            setRouteReport(d2.route_report || []);
            setMonthlyReport(d3.monthly_report || []);
        } catch {
            setError('Failed to load reports.');
        }
    }

    const MONTHS = [
        '', 'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];

    return (
        <main className="min-h-screen bg-white">
            <div className="border-b border-gray-300 px-4 py-3 flex items-center justify-between">
                <span className="font-semibold text-gray-900 text-sm">Metro Ticket Management System</span>
                <button onClick={() => router.push('/admin')} className="text-sm text-gray-700 hover:text-black">
                    ← Back to Dashboard
                </button>
            </div>

            <div className="max-w-4xl mx-auto p-6 space-y-8">
                <h2 className="text-base font-semibold text-gray-900">Reports</h2>

                {error && (
                    <p className="text-sm border border-gray-300 px-3 py-2 text-gray-800">{error}</p>
                )}

                {/* Summary */}
                {summary && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Overall Summary</h3>
                        <table className="border-collapse border border-gray-300 text-sm">
                            <tbody>
                                {[
                                    ['Total Tickets', summary.total_tickets],
                                    ['Total Revenue (₹)', Number(summary.total_revenue).toFixed(2)],
                                    ['Average Fare (₹)', Number(summary.avg_fare).toFixed(2)],
                                    ['Max Fare (₹)', summary.max_fare],
                                    ['Min Fare (₹)', summary.min_fare],
                                ].map(([label, value]) => (
                                    <tr key={label}>
                                        <td className="border border-gray-300 px-4 py-2 font-medium text-gray-700 bg-gray-50 w-48">
                                            {label}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-gray-900">{value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Route-wise Report */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Route-wise Ticket Count</h3>
                    {routeReport.length === 0 ? (
                        <p className="text-sm text-gray-600">No data available.</p>
                    ) : (
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    {['Route Name', 'Metro', 'Tickets Sold', 'Total Revenue (₹)'].map((h) => (
                                        <th key={h} className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {routeReport.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-3 py-2">{row.route_name}</td>
                                        <td className="border border-gray-300 px-3 py-2">{row.metro_name}</td>
                                        <td className="border border-gray-300 px-3 py-2">{row.ticket_count}</td>
                                        <td className="border border-gray-300 px-3 py-2">{Number(row.total_revenue).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Monthly Report */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Monthly Report</h3>
                    {monthlyReport.length === 0 ? (
                        <p className="text-sm text-gray-600">No data available.</p>
                    ) : (
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    {['Month', 'Year', 'Tickets Sold', 'Revenue (₹)', 'Avg Fare (₹)'].map((h) => (
                                        <th key={h} className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {monthlyReport.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-3 py-2">{MONTHS[row.booking_month]}</td>
                                        <td className="border border-gray-300 px-3 py-2">{row.booking_year}</td>
                                        <td className="border border-gray-300 px-3 py-2">{row.tickets_sold}</td>
                                        <td className="border border-gray-300 px-3 py-2">{Number(row.monthly_revenue).toFixed(2)}</td>
                                        <td className="border border-gray-300 px-3 py-2">{Number(row.avg_fare).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </main>
    );
}
