import React, { useState } from 'react';
import { BoardSelector } from '../components/board-diagnosis/BoardSelector';
import { SymptomInput } from '../components/board-diagnosis/SymptomInput';
import { InitialMeasurements } from '../components/board-diagnosis/InitialMeasurements';
import { GuidedDiagnosticPanel } from '../components/board-diagnosis/GuidedDiagnosticPanel';
import { DiagnosticResult } from '../components/board-diagnosis/DiagnosticResult';
import { boardDiagnosisApi } from '../services/apiBoardDiagnosis';
import { Cpu } from 'lucide-react';

export const DiagnosticoPlaca: React.FC = () => {
    const [step, setStep] = useState<number>(1);

    // State
    const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
    const [selectedSymptomId, setSelectedSymptomId] = useState<string | null>(null);
    const [symptomDescription, setSymptomDescription] = useState<string>('');
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Result State
    const [resultData, setResultData] = useState<any>(null);

    const handleBoardSelect = (boardId: string) => {
        setSelectedBoardId(boardId);
        setStep(2);
    };

    const handleSymptomSelect = (symptomId: string, description: string) => {
        setSelectedSymptomId(symptomId);
        setSymptomDescription(description);
        setStep(3);
    };

    const handleMeasurementsSubmit = async (measurements: any) => {
        if (!selectedBoardId || !selectedSymptomId) return;

        try {
            const session = await boardDiagnosisApi.startSession({
                board_id: selectedBoardId,
                symptom_category_id: selectedSymptomId,
                symptom_description: symptomDescription,
                charger_current: measurements.charger_current,
                bench_current: measurements.bench_current,
                power_button_current: measurements.power_button_current
            });
            setSessionId(session.id);
            setStep(4);
        } catch (error) {
            console.error('Error starting session:', error);
            alert('Failed to start session');
        }
    };

    const handleDiagnosisComplete = (result: any) => {
        setResultData(result);
        setStep(5);
    };

    return (
        <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Cpu className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">AI Board Diagnosis</h1>
                    <p className="text-gray-400">Intelligent step-by-step logic board repair</p>
                </div>
            </div>

            <div className="bg-[#1a1a24] rounded-xl border border-gray-800 p-6 min-h-[500px]">
                {step === 1 && <BoardSelector onSelected={handleBoardSelect} />}

                {step === 2 && <SymptomInput onNext={handleSymptomSelect} onBack={() => setStep(1)} />}

                {step === 3 && <InitialMeasurements onSubmit={handleMeasurementsSubmit} onBack={() => setStep(2)} />}

                {step === 4 && sessionId && (
                    <GuidedDiagnosticPanel
                        sessionId={sessionId}
                        onComplete={handleDiagnosisComplete}
                        onBack={() => setStep(3)}
                    />
                )}

                {step === 5 && resultData && (
                    <DiagnosticResult
                        data={resultData}
                        onNewDiagnosis={() => setStep(1)}
                    />
                )}
            </div>
        </div>
    );
};
