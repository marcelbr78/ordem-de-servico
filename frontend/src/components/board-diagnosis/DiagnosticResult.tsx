import React from 'react';
import { ShieldCheck, RefreshCw, Cpu } from 'lucide-react';

interface Props {
    data: any; // e.g. { probabilities: [{component, probability}] }
    onNewDiagnosis: () => void;
}

export const DiagnosticResult: React.FC<Props> = ({ data, onNewDiagnosis }) => {
    const probabilities = data.probabilities || [];

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500 py-8">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-400 mb-2">
                    <ShieldCheck className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold text-white">Diagnostic Complete</h2>
                <p className="text-gray-400">The Repair Knowledge Graph has analyzed the findings.</p>
            </div>

            <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-purple-400" />
                    Likely Causes
                </h3>

                <div className="space-y-4">
                    {probabilities.map((item: any, idx: number) => (
                        <div key={idx} className="relative">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-semibold text-gray-200">{item.component}</span>
                                <span className="font-bold text-purple-400">{item.probability}%</span>
                            </div>
                            <div className="w-full bg-gray-900 rounded-full h-2.5">
                                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2.5 rounded-full" style={{ width: `${item.probability}%` }}></div>
                            </div>
                        </div>
                    ))}
                    {probabilities.length === 0 && (
                        <div className="text-center py-6 text-gray-500 italic">
                            No definitive probability could be generated. Review manual schematics.
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-center border-t border-gray-800 pt-8">
                <button
                    onClick={onNewDiagnosis}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors border border-gray-700"
                >
                    <RefreshCw className="w-5 h-5" /> Start New Diagnosis
                </button>
            </div>
        </div>
    );
};
