import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatCompletionPort, ModelMessage } from './chat-completion.port';

@Injectable()
export class OpenAiChatCompletionAdapter implements ChatCompletionPort {
  private readonly client: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({ apiKey: this.configService.get<string>('OPENAI_API_KEY') || 'missing-key' });
  }

  async *stream(messages: ModelMessage[]): AsyncIterable<string> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) throw new Error('OPENAI_API_KEY is required');

    const stream = await this.client.chat.completions.create({
      model: this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini',
      messages,
      stream: true,
    });

    for await (const part of stream) {
      const content = part.choices[0]?.delta?.content;
      if (content) yield content;
    }
  }
}
