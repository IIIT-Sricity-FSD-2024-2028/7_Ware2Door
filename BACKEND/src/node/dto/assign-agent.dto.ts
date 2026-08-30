import { IsNotEmpty, IsString } from 'class-validator';

export class AssignAgentDto {
    @IsString()
    @IsNotEmpty({ message: 'Tracking ID is required' })
    trackingId!: string;

    @IsString()
    @IsNotEmpty({ message: 'Agent ID is required' })
    agentId!: string;

    @IsString()
    @IsNotEmpty({ message: 'Agent name is required' })
    agentName!: string;
}
