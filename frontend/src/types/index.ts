export interface UserPublic { id: string; loginId: string; name?: string }
export interface AuthResponse { accessToken: string; user: UserPublic }
export interface SignupParams { loginId: string; password: string; name?: string }
export interface LoginParams { loginId: string; password: string }
export interface ChatSession { id: string; title: string; createdAt: string; updatedAt: string }
export interface ChatMessage { id: string; sessionId: string; role: 'user' | 'assistant'; content: string; createdAt: string }
export interface ChatSessionDetail { session: ChatSession; messages: ChatMessage[] }
export interface CreateChatSessionParams { title?: string }
export interface SendChatMessageParams { content: string }
export interface ChatSseEvent { type: 'chunk' | 'done' | 'error'; data: string; messageId?: string; sessionId?: string }
