export class ExamCompletedEvent {
    constructor(
      public readonly examId:    string,
      public readonly patientId: string,
      public readonly examType:  string,
      public readonly clinicId:  string | null,
    ) {}
  }