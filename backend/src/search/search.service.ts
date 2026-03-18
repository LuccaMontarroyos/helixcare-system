import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Patient } from '../modules/patients/entities/patient.entity';
import { User } from '../modules/users/entities/user.entity';
import { Appointment } from '../modules/appointments/entities/appointment.entity';
import { Role } from '../modules/roles/entities/role.entity';
import { GlobalSearchResponse } from './dtos/global-search-response.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Patient) private patientModel: typeof Patient,
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Appointment) private appointmentModel: typeof Appointment,
  ) {}

  async globalSearch(term: string): Promise<GlobalSearchResponse> {

    if (!term || term.length < 2) {
      return { patients: [], doctors: [], appointments: [] };
    }

    const limit = 5;
    const searchPattern = `%${term}%`;

    const [patients, users, appointments] = await Promise.all([
      this.patientModel.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: searchPattern } },
            { cpf: { [Op.iLike]: searchPattern } },
          ],
        },
        limit,
      }),

      this.userModel.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: searchPattern } },
            { email: { [Op.iLike]: searchPattern } },
          ],
        },
        include: [{ model: Role, attributes: ['name'] }],
        limit,
      }),

      this.appointmentModel.findAll({
        include: [
          {
            model: Patient,
            as: 'patient',
            where: { name: { [Op.iLike]: searchPattern } },
            required: true,
          },
        ],
        order: [['appointment_date', 'DESC']],
        limit,
      }),
    ]);

    return {
      patients: patients.map((p) => ({
        id: p.id,
        name: p.name,
        hint: `CPF: ${this.formatCpf(p.cpf)}`,
        type: 'PATIENT',
      })),

      doctors: users.map((u) => ({
        id: u.id,
        name: `${u.name} (${u.role?.name || 'Staff'})`,
        hint: u.email,
        type: 'DOCTOR',
      })),

      appointments: appointments.map((a) => ({
        id: a.id,
        name: `Consulta - ${a.patient?.name}`,
        hint: this.formatDate(a.appointment_date),
        type: 'APPOINTMENT',
        patient_id: a.patient_id,
      })),
    };
  }

  private formatCpf(cpf: string): string {
    if (!cpf || cpf.length !== 11) return cpf;
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  private formatDate(dateInput: Date): string {
    const d = new Date(dateInput);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} às ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}