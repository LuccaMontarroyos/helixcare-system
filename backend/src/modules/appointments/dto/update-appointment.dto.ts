import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateAppointmentDto } from './create-appointment.dto';
import { AppointmentStatusEnum } from '../enums/appointment-status.enum';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
    @ApiPropertyOptional({ example: AppointmentStatusEnum.COMPLETED })
    status?: AppointmentStatusEnum;
}