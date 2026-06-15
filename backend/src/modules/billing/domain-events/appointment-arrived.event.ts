export class AppointmentArrivedEvent {
    constructor(
      public readonly appointmentId:   string,
      public readonly patientId:       string,
      public readonly doctorId:        string,
      public readonly appointmentType: string | null,
      public readonly appointmentDate: Date,
    ) {}
  }