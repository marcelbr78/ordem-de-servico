import React, { useEffect, useState } from 'react';
import { boardDiagnosisApi } from '../../services/apiBoardDiagnosis';
import { Target, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
    sessionId: string;
    onComplete: (data: any) => void;
    onBack?: () => void;
}

export const GuidedDiagnosticPanel: React.FC<Props> = ({ sessionId, onComplete }) => {
    const [currentStep, setCurrentStep] = useState<any>(null);
    const [measurement, setMeasurement] = useState('');
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        loadNextStep();
    }, []);

    const loadNextStep = async () => {
        setLoading(true);
        try {
            const data = await boardDiagnosisApi.getNextStep(sessionId);
            if (data.finished) {
                onComplete(data);
            } else {
                setCurrentStep(data);
                setMeasurement(''); // clear input
            }
        } catch (error) {
            console.error('Failed to load next step', error);
        } finally {
            setLoading(false);
        }
    };

    const submitMeasurement = async (forceResult?: 'pass' | 'fail') => {
        if (!currentStep) return;
        setLoading(true);
        try {
            // Keep history
            setHistory(prev => [...prev, { ...currentStep, result: forceResult || 'measured', value: measurement }]);

            await boardDiagnosisApi.submitMeasurement(sessionId, {
                step_id: currentStep.id,
                measurement: measurement,
                result: forceResult
            });
            await loadNextStep();
        } catch (error) {
            console.error('Failed to submit measurement', error);
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto flex gap-6">
            <div className="flex-1 space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-white">Step 4: AI Guided Diagnosis</h2>
                    <p className="text-gray-400 text-sm">Perform the exact measurements guided by logic board schematics.</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-12 text-purple-400 animate-pulse">
                        <Target className="w-8 h-8 animate-spin mr-3" /> Processing intelligence engine calculation...
                    </div>
                ) : currentStep ? (
                    <div className="bg-[#12121a] border border-purple-900 rounded-xl p-6 shadow-[0_0_15px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/20">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">
                                STEP {currentStep.step_number}
                            </span>
                            <span className="text-gray-400 text-sm">{currentStep.measurement_type?.toUpperCase()} CHECK</span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">{currentStep.question}</h3>

                        {currentStep.expected_range && (
                            <div className="text-green-400 bg-green-900/20 px-3 py-2 rounded-lg text-sm inline-block mb-6 border border-green-900/50">
                                Target Range: <span className="font-bold">{currentStep.expected_range}</span>
                            </div>
                        )}

                        <div className="space-y-4 pt-4 border-t border-gray-800">
                            <label className="text-gray-400 text-sm block">Enter your reading:</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={measurement}
                                    onChange={e => setMeasurement(e.target.value)}
                                    className="flex-1 bg-[#0a0a0c] border border-gray-700 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none"
                                    placeholder="e.g. 12.5V, OL, 0 ohms"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => submitMeasurement('fail')}
                                    className="flex-1 flex justify-center items-center gap-2 bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/50 py-3 rounded-lg transition-colors"
                                >
                                    <XCircle className="w-5 h-5" /> Fail / Missing
                                </button>
                                <button
                                    onClick={() => submitMeasurement('pass')}
                                    className="flex-1 flex justify-center items-center gap-2 bg-green-900/20 text-green-400 hover:bg-green-900/40 border border-green-900/50 py-3 rounded-lg transition-colors"
                                >
                                    <CheckCircle2 className="w-5 h-5" /> Pass / Ok
                                </button>
                            </div>
                            <div className="text-center pt-2">
                                <button
                                    onClick={() => submitMeasurement()}
                                    className="text-gray-500 hover:text-white text-sm"
                                >
                                    Submit value & Let AI decide
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-8 text-gray-400">No active step found.</div>
                )}
            </div>

            {/* Path visualization side panel */}
            <div className="w-64 border-l border-gray-800 pl-6 h-[400px] overflow-y-auto hidden md:block">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">Diagnostic Path</h4>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-800 before:to-transparent">
                    {history.map((h, i) => (
                        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-gray-800 bg-[#0a0a0c] text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                {h.result === 'pass' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                            </div>
                            <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-2 rounded-lg border border-gray-800 bg-[#12121a]">
                                <div className="flex items-center justify-between space-x-2 mb-1">
                                    <div className="font-bold text-gray-300 text-xs">Step {h.step_number}</div>
                                </div>
                                <div className="text-gray-500 text-xs">{h.question?.substring(0, 30)}...</div>
                                <div className="text-purple-400 text-xs font-mono mt-1">{h.value || h.result}</div>
                            </div>
                        </div>
                    ))}
                    {currentStep && (
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-purple-500 bg-purple-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-20"></span>
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                            </div>
                            <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-2">
                                <div className="text-purple-400 text-xs font-bold">ACTIVE</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
