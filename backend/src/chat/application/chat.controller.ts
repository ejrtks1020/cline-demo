import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateChatSessionCommand, SendChatMessageCommand } from './dto/chat.command';
import { ChatSessionDetailResponse, ChatSessionResponse } from './dto/chat.response';

@ApiTags('chats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'chats', version: '1' })
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  listSessions(@CurrentUser() user: CurrentUserPayload): Promise<ChatSessionResponse[]> {
    return this.chatService.listSessions(user);
  }

  @Get(':id')
  getSession(@Param('id', new ParseUUIDPipe({ version: '7', optional: false })) id: string, @CurrentUser() user: CurrentUserPayload): Promise<ChatSessionDetailResponse> {
    return this.chatService.getSession(id, user);
  }

  @Post()
  createSession(@Body() command: CreateChatSessionCommand, @CurrentUser() user: CurrentUserPayload): Promise<ChatSessionResponse> {
    return this.chatService.createSession(command, user);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteSession(@Param('id', new ParseUUIDPipe({ version: '7', optional: false })) id: string, @CurrentUser() user: CurrentUserPayload): Promise<void> {
    return this.chatService.deleteSession(id, user);
  }

  @Post(':id/messages/stream')
  async streamMessage(
    @Param('id', new ParseUUIDPipe({ version: '7', optional: false })) id: string,
    @Body() command: SendChatMessageCommand,
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // SSE는 응답이 길게 유지되므로 가능한 빨리 header를 flush한다.
    res.flushHeaders?.();
    await this.chatService.streamMessage(id, command, user, (event) => res.write(`data: ${JSON.stringify(event)}\n\n`));
    res.end();
  }
}
