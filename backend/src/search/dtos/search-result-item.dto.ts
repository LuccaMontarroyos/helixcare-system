export interface SearchResultItem {
    id: string;
    name: string;
    hint: string;
    type: 'PATIENT' | 'DOCTOR' | 'APPOINTMENT';
    patient_id?: string;
}