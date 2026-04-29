import { ApiProperty } from '@nestjs/swagger';
import { ChatMessageRole } from './chat.dto';

export class ChatSessionResponse {
  @ApiProperty()
  id: string;
  @ApiProperty()
  title: string;
  @ApiProperty()
  createdAt: string;
  @ApiProperty()
  updatedAt: string;
}

export class ChatMessageResponse {
  @ApiProperty()
  id: string;
  @ApiProperty()
  sessionId: string;
  @ApiProperty({ enum: ['user', 'assistant'] })
  role: ChatMessageRole;
  @ApiProperty()
  content: string;
  @ApiProperty()
  createdAt: string;
}

export class ChatSessionDetailResponse {
  @ApiProperty({ type: ChatSessionResponse })
  session: ChatSessionResponse;
  @ApiProperty({ type: [ChatMessageResponse] })
  messages: ChatMessageResponse[];
}
