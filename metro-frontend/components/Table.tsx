interface Column {
    key: string;
    label: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render?: (row: Record<string, any>) => React.ReactNode;
}

interface TableProps {
    columns: Column[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onDelete?: (row: Record<string, any>) => void;
}

export default function Table({ columns, data, onDelete }: TableProps) {
    if (data.length === 0) {
        return <p className="text-sm text-gray-600">No records found.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                    <tr className="bg-gray-100">
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800"
                            >
                                {col.label}
                            </th>
                        ))}
                        {onDelete && (
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800">
                                Action
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                            {columns.map((col) => (
                                <td
                                    key={col.key}
                                    className="border border-gray-300 px-3 py-2 text-gray-800"
                                >
                                    {col.render ? col.render(row) : (row[col.key] ?? '-')}
                                </td>
                            ))}
                            {onDelete && (
                                <td className="border border-gray-300 px-3 py-2">
                                    <button
                                        onClick={() => onDelete(row)}
                                        className="bg-black text-white text-xs px-3 py-1 hover:bg-gray-800"
                                    >
                                        Delete
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
