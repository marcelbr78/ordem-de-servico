import React, { useEffect, useState } from 'react';
import { boardDiagnosisApi, type SymptomCategory } from '../../services/apiBoardDiagnosis';
import { Activity, ArrowLeft, ArrowRight } from 'lucide-react';

interface Props {
    onNext: (symptomId: string, description: string) => void;
    onBack: () => void;
}

export const SymptomInput: React.FC<Props> = ({ onNext, onBack }) => {
    const [categories, setCategories] = useState<SymptomCategory[]>([]);
    const [selectedId, setSelectedId] = useState<string>('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSymptoms();
    }, []);

    const loadSymptoms = async () => {
        try {
            const data = await boardDiagnosisApi.getSymptoms();
            setCategories(data);
        } catch (error) {
            console.error('Failed to load symptoms', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h2 className="text-xl font-semibold text-white">Step 2: Device State Classification</h2>
                <p className="text-gray-400 text-sm">Select the primary symptom category to guide the diagnostic engine.</p>
            </div>

            {loading ? (
                <div className="text-gray-400 text-center py-8">Loading classifications...</div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {categories.map(cat => (
                        <div
                            key={cat.id}
                            onClick={() => setSelectedId(cat.id)}
                            className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedId === cat.id
                                ? 'bg-purple-500/20 border-purple-500'
                                : 'bg-[#0a0a0c] border-gray-800 hover:border-gray-600'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Activity className={`w-5 h-5 ${selectedId === cat.id ? 'text-purple-400' : 'text-gray-500'}`} />
                                <span className={`font-medium ${selectedId === cat.id ? 'text-purple-300' : 'text-gray-300'}`}>
                                    {cat.name.replace(/_/g, ' ').toUpperCase()}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{cat.description}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium">Extra Details (Optional)</label>
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-gray-800 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none"
                    rows={3}
                    placeholder="E.g., Device fell in water, shorts after 2 seconds..."
                />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                    onClick={() => onNext(selectedId, description)}
                    disabled={!selectedId}
                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                    Continue <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
