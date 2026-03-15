import React, { useState } from 'react';
import { Battery, Zap, Power, ArrowLeft, ArrowRight } from 'lucide-react';

interface Props {
    onSubmit: (measurements: { charger_current?: number, bench_current?: number, power_button_current?: number }) => void;
    onBack: () => void;
}

export const InitialMeasurements: React.FC<Props> = ({ onSubmit, onBack }) => {
    const [chargerCurrent, setChargerCurrent] = useState('');
    const [benchCurrent, setBenchCurrent] = useState('');
    const [powerButtonCurrent, setPowerButtonCurrent] = useState('');

    const handleSubmit = () => {
        onSubmit({
            charger_current: parseFloat(chargerCurrent) || undefined,
            bench_current: parseFloat(benchCurrent) || undefined,
            power_button_current: parseFloat(powerButtonCurrent) || undefined,
        });
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h2 className="text-xl font-semibold text-white">Step 3: Initial Measurements</h2>
                <p className="text-gray-400 text-sm">To establish the baseline state, enter the preliminary current readings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0a0a0c] border border-gray-800 rounded-xl p-5 hover:border-purple-500/50 transition-colors">
                    <div className="flex items-center gap-2 mb-4">
                        <Battery className="w-5 h-5 text-green-400" />
                        <span className="font-medium text-gray-200">Charger (Amps)</span>
                    </div>
                    <input
                        type="number"
                        step="0.001"
                        value={chargerCurrent}
                        onChange={e => setChargerCurrent(e.target.value)}
                        placeholder="e.g. 0.045"
                        className="w-full bg-transparent border-b border-gray-700 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-center text-lg"
                    />
                </div>

                <div className="bg-[#0a0a0c] border border-gray-800 rounded-xl p-5 hover:border-purple-500/50 transition-colors">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        <span className="font-medium text-gray-200">Bench (Amps)</span>
                    </div>
                    <input
                        type="number"
                        step="0.001"
                        value={benchCurrent}
                        onChange={e => setBenchCurrent(e.target.value)}
                        placeholder="e.g. 0.003"
                        className="w-full bg-transparent border-b border-gray-700 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-center text-lg"
                    />
                </div>

                <div className="bg-[#0a0a0c] border border-gray-800 rounded-xl p-5 hover:border-purple-500/50 transition-colors">
                    <div className="flex items-center gap-2 mb-4">
                        <Power className="w-5 h-5 text-red-500" />
                        <span className="font-medium text-gray-200">Power Btn Prompt</span>
                    </div>
                    <input
                        type="number"
                        step="0.001"
                        value={powerButtonCurrent}
                        onChange={e => setPowerButtonCurrent(e.target.value)}
                        placeholder="e.g. 0.120"
                        className="w-full bg-transparent border-b border-gray-700 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-center text-lg"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-800">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                    Start Guided Engine <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
