import { Injectable } from '@nestjs/common';
import { DiagnosticSession } from '../entities/diagnostic-session.entity';
import { DiagnosticStep } from '../entities/diagnostic-step.entity';
import { SymptomCategory } from '../entities/symptom-category.entity';

@Injectable()
export class GuidedDiagnosisEngine {

    /**
     * Follows the Universal Electronic Diagnostic Flow:
     * 1. Power
     * 2. Clock
     * 3. Reset / Enable
     * 4. Data / Communication
     */
    public determineNextStep(
        session: DiagnosticSession,
        currentStep: DiagnosticStep | null,
        symptom: SymptomCategory
    ): Partial<DiagnosticStep> | null {
        // Only implementing 'no_power' flow right now
        if (symptom?.name !== 'no_power') {
            return null; // For other symptoms, return null so UI handles as not implemented yet
        }

        if (!currentStep) {
            return {
                step_number: 1,
                question: 'What is the voltage on VBUS?',
                measurement_type: 'voltage',
                expected_range: '20V',
                next_step_if_fail: 'Possible charger or USB-C controller fault.',
                next_step_if_ok: 'Go to next step.'
            };
        }

        if (currentStep.step_number === 1) {
            if (currentStep.result === 'fail') return null;

            return {
                step_number: 2,
                question: 'What is the voltage on PPBUS_AON?',
                measurement_type: 'voltage',
                expected_range: '12V – 13V',
                next_step_if_fail: 'Suggest input circuit failure (CD3217, fuse, MOSFET).',
                next_step_if_ok: 'Go to next step.'
            };
        }

        if (currentStep.step_number === 2) {
            if (currentStep.result === 'fail') return null;

            return {
                step_number: 3,
                question: 'What is the voltage on PP3V8_AON?',
                measurement_type: 'voltage',
                expected_range: '3.8V',
                next_step_if_fail: 'Suggest PMIC or regulator failure.',
                next_step_if_ok: 'Go to next step.'
            };
        }

        if (currentStep.step_number === 3) {
            if (currentStep.result === 'fail') return null;

            return {
                step_number: 4,
                question: 'What is the voltage on PP1V8_AON?',
                measurement_type: 'voltage',
                expected_range: '1.8V',
                next_step_if_fail: 'Suggest PMIC regulator issue.',
                next_step_if_ok: 'Return diagnostic summary.'
            };
        }

        // End of standard universal flow
        return null;
    }
}
