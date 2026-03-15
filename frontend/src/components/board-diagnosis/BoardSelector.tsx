import React, { useEffect, useState } from 'react';
import { boardDiagnosisApi, type Board } from '../../services/apiBoardDiagnosis';
import { Server, Search } from 'lucide-react';

interface Props {
    onSelected: (boardId: string) => void;
}

export const BoardSelector: React.FC<Props> = ({ onSelected }) => {
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadBoards();
    }, []);

    const loadBoards = async () => {
        try {
            const data = await boardDiagnosisApi.getBoards();
            setBoards(data);
        } catch (error) {
            console.error('Failed to load boards', error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = boards.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.model.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-white">Step 1: Select Board</h2>
                <p className="text-gray-400 text-sm">Choose the logic board model you are working on.</p>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="Search by model or name (e.g. 820-01958, iPhone 12 Pro)..."
                />
            </div>

            {loading ? (
                <div className="text-center py-8 text-gray-400">Loading boards...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(board => (
                        <div
                            key={board.id}
                            onClick={() => onSelected(board.id)}
                            className="bg-[#0a0a0c] border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all group"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-xs font-semibold text-purple-400 mb-1">{board.manufacturer}</div>
                                    <div className="text-white font-medium">{board.name}</div>
                                    <div className="text-gray-500 text-sm">{board.model}</div>
                                </div>
                                <Server className="w-5 h-5 text-gray-600 group-hover:text-purple-400" />
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="col-span-full text-center py-8 text-gray-500 border border-dashed border-gray-800 rounded-xl">
                            No boards found matching your search.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
