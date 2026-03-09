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
        // If no step yet, start with basic power
        if (!currentStep) {
            return {
                step_number: 1,
                question: 'What is the voltage on the main power rail (e.g. PPBUS_AON)?',
                measurement_type: 'voltage',
                expected_range: '12V - 13V',
            };
        }

        // Logic based on previous steps
        if (currentStep.step_number === 1) {
            if (currentStep.result === 'fail') {
                return null; // Stop flow, issue found
            }
            return {
                step_number: 2,
                question: 'Check the main clock signal (e.g., 32kHz RTC clock). Is it present?',
                measurement_type: 'frequency',
                expected_range: '32kHz',
            };
        }

        if (currentStep.step_number === 2) {
            if (currentStep.result === 'fail') {
                return null;
            }
            return {
                step_number: 3,
                question: 'Check the PMU Reset / Enable lines. Are they high?',
                measurement_type: 'voltage',
                expected_range: '1.8V - 3.3V',
            };
        }

        if (currentStep.step_number === 3) {
            if (currentStep.result === 'fail') {
                return null;
            }
            return {
                step_number: 4,
                question: 'Check data communication lines (I2C/SPI - SDA/SCL). Is there activity?',
                measurement_type: 'activity',
                expected_range: 'Active oscillation',
            };
        }

        // End of standard universal flow
        return null;
    }
}
