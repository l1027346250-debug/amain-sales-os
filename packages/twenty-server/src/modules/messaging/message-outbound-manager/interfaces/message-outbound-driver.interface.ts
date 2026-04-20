import { type ConnectedAccountWorkspaceEntity } from 'src/modules/connected-account/standard-objects/connected-account.workspace-entity';
import { type SendMessageInput } from 'src/modules/messaging/message-outbound-manager/types/send-message-input.type';

export type MessageOutboundResult = {
  providerMessageId: string | null;
};

export type MessageOutboundDriver = {
  sendMessage(
    sendMessageInput: SendMessageInput,
    connectedAccount: ConnectedAccountWorkspaceEntity,
  ): Promise<MessageOutboundResult>;

  createDraft(
    sendMessageInput: SendMessageInput,
    connectedAccount: ConnectedAccountWorkspaceEntity,
  ): Promise<void>;
};
