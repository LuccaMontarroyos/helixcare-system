export class ExamCompletedEvent {
    constructor(
      public readonly examId:    string,
      public readonly patientId: string,
      public readonly examType:  string,
    ) {}
  }