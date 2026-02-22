'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const BASE_URL = 'http://localhost:3000/api';

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        user_name: '',
        user_email: '',
        user_mobile: '',
        user_address: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/user/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Registration failed.');
                return;
            }
            setSuccess('Registration successful. Redirecting to login...');
            setTimeout(() => router.push('/'), 1500);
        } catch {
            setError('Could not connect to server.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-white flex items-start justify-center pt-16">
            <div className="w-full max-w-sm border border-gray-300 p-6">
                <h1 className="text-lg font-semibold text-gray-900 mb-1">Register</h1>
                <p className="text-sm text-gray-600 mb-5">Create a new passenger account</p>

                {error && (
                    <p className="text-sm text-red-700 border border-red-300 px-3 py-2 mb-4">
                        {error}
                    </p>
                )}
                {success && (
                    <p className="text-sm text-green-700 border border-green-300 px-3 py-2 mb-4">
                        {success}
                    </p>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    {[
                        { label: 'Full Name', name: 'user_name', type: 'text', placeholder: 'John Doe' },
                        { label: 'Email', name: 'user_email', type: 'email', placeholder: 'john@email.com' },
                        { label: 'Mobile', name: 'user_mobile', type: 'text', placeholder: '9000000000' },
                        { label: 'Address', name: 'user_address', type: 'text', placeholder: 'Sector 5' },
                        { label: 'Password', name: 'password', type: 'password', placeholder: '••••••••' },
                    ].map((field) => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {field.label}
                            </label>
                            <input
                                type={field.type}
                                name={field.name}
                                required
                                value={form[field.name as keyof typeof form]}
                                onChange={handleChange}
                                placeholder={field.placeholder}
                                className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-500"
                            />
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white text-sm py-2 hover:bg-gray-800 disabled:bg-gray-400"
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <p className="text-sm text-gray-600 mt-4">
                    Already have an account?{' '}
                    <Link href="/" className="text-black underline">
                        Login here
                    </Link>
                </p>
            </div>
        </main>
    );
}
