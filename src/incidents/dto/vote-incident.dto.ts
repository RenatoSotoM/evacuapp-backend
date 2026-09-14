import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum VoteAction {
  CONFIRM = 'CONFIRM',
  REJECT = 'REJECT',
}

export class VoteIncidentDto {
  @ApiProperty({ enum: VoteAction })
  @IsEnum(VoteAction)
  vote: VoteAction;
}
