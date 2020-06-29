import { ILogger, IMessageBuilder, IModify, INotifier } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { ButtonStyle } from '@rocket.chat/apps-engine/definition/uikit';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { AuctionApp } from '../AuctionApp';
import { AuctionActions } from './AuctionActions';
import { AuctionData, AuctionStatus, AuctionType } from './AuctionModel';
import { AuctionUtils } from './AuctionUtils';

export class AuctionUI {
    protected app: AuctionApp;

    constructor(app: AuctionApp) {
        this.app = app;
    }

    public async sendSimpleMessage(messageText: string, targetRoom: IRoom, modify: IModify): Promise<void> {
        const messageBuilder: IMessageBuilder = modify.getCreator().startMessage();

        messageBuilder.setText(messageText);
        messageBuilder.setRoom(targetRoom);

        await modify.getCreator().finish(messageBuilder);
    }

    public async sendSimpleNotification(notificationText: string, targetRoom: IRoom, targetUser: IUser, notifier: INotifier): Promise<void> {
        const messageBuilder: IMessageBuilder = notifier.getMessageBuilder();

        // TODO is it possibile to use app bot as sender, instead of rocket.cat?
        messageBuilder.setRoom(targetRoom);
        messageBuilder.setText(notificationText);

        await notifier.notifyUser(targetUser, messageBuilder.getMessage());
    }

    public async sendBidActionsMessage(messageMarkDown: string, targetRoom: IRoom, modify: IModify): Promise<void> {
        const messageBuilder: IMessageBuilder = modify.getCreator().startMessage();

        messageBuilder.setRoom(targetRoom);

        const block = modify.getCreator().getBlockBuilder();

        block.addSectionBlock({ text: block.newMarkdownTextObject(messageMarkDown) });

        block.addActionsBlock({
            blockId: 'bidActions',
            elements: [
                block.newButtonElement({
                    actionId: AuctionActions.START_BID,
                    text: block.newPlainTextObject('Fazer Lance'), // i18n
                    style: ButtonStyle.PRIMARY,
                }),
                block.newButtonElement({
                    actionId: AuctionActions.HELP,
                    text: block.newPlainTextObject('Ajuda'), // i18n
                    style: ButtonStyle.DANGER,
                }),
            ],
        });

        messageBuilder.setBlocks(block);

        await modify.getCreator().finish(messageBuilder);
    }

    public async createAuctionConfigModal(room: IRoom, auctionData: AuctionData, modify: IModify, id?: string): Promise<IUIKitModalViewParam> {
        const viewId = id || AuctionUtils.createUUID();

        const submitActionIdObject = {
            actionTag: AuctionActions.CONFIG_AUCTION,
            roomId: room.id,
        };

        const block = modify.getCreator().getBlockBuilder();

        // i18n
        block.addInputBlock({
            blockId: 'auctionQuestionsRoomBlock',
            label: block.newPlainTextObject('Questions will be directed to room'),
            element: block.newPlainTextInputElement({
                initialValue: auctionData.getQuestionsRoomName(),
                actionId: 'questionsRoomName',
            }),
        });

        block.addInputBlock({
            blockId: 'auctionStatusBlock',
            label: block.newPlainTextObject('Auction status'), // i18n
            element: block.newStaticSelectElement({
                actionId: 'auctionStatus',
                initialValue: auctionData.getStatus(),
                options: [
                    {
                        text: block.newPlainTextObject(AuctionStatus.RUNNING), // i18n
                        value: AuctionStatus.RUNNING,
                    },
                    {
                        text: block.newPlainTextObject(AuctionStatus.STOPPED), // i18n
                        value: AuctionStatus.STOPPED,
                    },
                ],
            }),
        });

        block.addInputBlock({
            blockId: 'auctionTypeBlock',
            label: block.newPlainTextObject('Auction type'), // i18n
            element: block.newStaticSelectElement({
                actionId: 'auctionType',
                initialValue: auctionData.getAuctionType(),
                options: [
                    {
                        text: block.newPlainTextObject(AuctionType.FORWARD), // i18n
                        value: AuctionType.FORWARD,
                    },
                    {
                        text: block.newPlainTextObject(AuctionType.REVERSE), // i18n
                        value: AuctionType.REVERSE,
                    },
                ],
            }),
        });

        // TODO extract
        return {
            id: viewId,
            title: block.newPlainTextObject('Auction Configuration'), // i18n
            submit: block.newButtonElement({
                actionId: JSON.stringify(submitActionIdObject),
                text: block.newPlainTextObject('Confirm'), // i18n
            }),
            close: block.newButtonElement({
                text: block.newPlainTextObject('Dismiss'), // i18n
            }),
            blocks: block.getBlocks(),
        };
    }

    public async createBidModal(submitActionIdObject: any, modify: IModify, id?: string): Promise<IUIKitModalViewParam> {
        const viewId = id || AuctionUtils.createUUID();

        const modalTitle = AuctionUtils.getI18N(submitActionIdObject.actionTag);

        const block = modify.getCreator().getBlockBuilder();

        block.addSectionBlock({
            blockId: 'previousBid',
            text: block.newMarkdownTextObject('Seu lance anterior: *' + submitActionIdObject.previousBidValue + '*'), // i18n
        });

        block.addSectionBlock({
            blockId: 'winningBid',
            text: block.newMarkdownTextObject('Lance vencedor até o momento: *' + submitActionIdObject.winningBidValue + '*'), // i18n
        });

        if (submitActionIdObject.actionTag === AuctionActions.SEND_BID) {
            block.addInputBlock({
                blockId: 'sendBid',
                label: block.newPlainTextObject('Seu novo lance'), // i18n
                element: block.newPlainTextInputElement({
                    initialValue: submitActionIdObject.newBidValue,
                    actionId: 'bidValue',
                }),
            });
        } else if (submitActionIdObject.actionTag === AuctionActions.CONFIRM_BID) {
            block.addSectionBlock({
                blockId: 'confirmBid',
                text: block.newMarkdownTextObject('Seu novo lance: *' + submitActionIdObject.newBidValue + '*'),
            });
        } else {
            throw new Error(`ActionUI.createBidModal: Unsupported action ${submitActionIdObject.actionTag}`);
        }

        // TODO extract
        return {
            id: viewId,
            title: block.newPlainTextObject(modalTitle), // i18n
            submit: block.newButtonElement({
                actionId: JSON.stringify(submitActionIdObject),
                text: block.newPlainTextObject('Confirm'), // i18n
            }),
            close: block.newButtonElement({
                text: block.newPlainTextObject('Dismiss'), // i18n
            }),
            blocks: block.getBlocks(),
        };
    }

    public async createHelpModal(room: IRoom, modify: IModify): Promise<IUIKitModalViewParam> {
        const viewId = AuctionUtils.createUUID();
        const modalTitle = 'Ajuda'; // i18n

        const submitActionIdObject = {
            actionTag: AuctionActions.SEND_QUESTION,
            roomId: room.id,
        };

        const block = modify.getCreator().getBlockBuilder();

        block.addSectionBlock({ text: block.newMarkdownTextObject('Text da *ajuda*') }); // i18n

        block.addInputBlock({
            blockId: 'helpBlock',
            label: block.newPlainTextObject('Pergunta para Leiloeiro'), // i18n
            element: block.newPlainTextInputElement({
                placeholder: block.newPlainTextObject('Digite sua questão'),
                actionId: 'helpQuestion',
            }),
        });

        // TODO extract
        return {
            id: viewId,
            title: block.newPlainTextObject(modalTitle), // i18n
            submit: block.newButtonElement({
                actionId: JSON.stringify(submitActionIdObject),
                text: block.newPlainTextObject('Confirm'), // i18n
            }),
            close: block.newButtonElement({
                text: block.newPlainTextObject('Dismiss'), // i18n
            }),
            blocks: block.getBlocks(),
        };
    }
}
