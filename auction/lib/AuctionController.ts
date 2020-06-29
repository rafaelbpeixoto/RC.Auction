import { ILogger, IModify, INotifier, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { AuctionApp } from '../AuctionApp';
import { AuctionActions } from './AuctionActions';
import { AuctionData, AuctionModel, AuctionStatus, AuctionUserRole } from './AuctionModel';
import { AuctionUI } from './AuctionUI';
import { AuctionUtils } from './AuctionUtils';

export class AuctionController {
    protected app: AuctionApp;
    protected auctionModel: AuctionModel;
    protected auctionUI: AuctionUI;

    constructor(app: AuctionApp) {
        this.app = app;

        this.auctionModel = new AuctionModel(app);
        this.auctionUI = new AuctionUI(app);
    }

    public async processCommand(context: SlashCommandContext, read: IRead, modify: IModify): Promise<void> {
        this.app.getLogger().debug('AuctionController.processAuctionCommand');

        const room = context.getRoom();
        const user = context.getSender();
        const triggerId = context.getTriggerId();
        const notifier = modify.getNotifier();

        const userRole = this.auctionModel.getAuctionUserRole(user);
        const auctionData = await this.auctionModel.getAuctionData(room, read);

        this.app.getLogger().debug('userRole', userRole);
        this.app.getLogger().debug('auctionData', auctionData);

        if (auctionData.getStatus() === AuctionStatus.FINISHED) {
            this.auctionUI.sendSimpleNotification(AuctionUtils.getI18N('msg_auction_finished'), room, user, notifier);
        } else {
            if ((userRole === AuctionUserRole.ADMIN) || (userRole === AuctionUserRole.AUCTIONEER)) {
                if (triggerId) {
                    const modal = await this.auctionUI.createAuctionConfigModal(room, auctionData, modify);
                    await modify.getUiController().openModalView(modal, { triggerId }, context.getSender());
                } else {
                    throw new Error('AuctionController.processAuctionCommand could not get triggerId');
                }
            } else {
                this.auctionUI.sendSimpleNotification(AuctionUtils.getI18N('msg_only_auctioneer_can_perform_action'), room, user, notifier);
            }
        }
    }

    public async processModalSubmit(actionId: string,
                                    viewState: any,
                                    triggerId: string,
                                    user: IUser,
                                    read: IRead,
                                    persistence: IPersistence,
                                    modify: IModify): Promise<boolean> {
        const actionIdObject = JSON.parse(actionId);

        const action = actionIdObject.actionTag;
        const room = await read.getRoomReader().getById(actionIdObject.roomId);

        if (!room) {
            this.app.getLogger().error(`AuctionController.processModalSubmit: Could not get room with id ${actionIdObject.roomId}`);
            return false;
        }

        const auctionData = await this.auctionModel.getAuctionData(room, read);

        switch (action) {
            case AuctionActions.CONFIG_AUCTION:
                await this.configAuction(auctionData, viewState, room, modify, persistence);
                return true;
            case AuctionActions.SEND_QUESTION:
                await this.sendQuestion(viewState, room, user, read, modify);
                return true;
            case AuctionActions.SEND_BID:
                await this.sendBid(actionIdObject, viewState, room, user, triggerId, modify);
                return true;
            case AuctionActions.CONFIRM_BID:
                await this.confirmBid(actionIdObject, room, user, modify, persistence);
                return true;
            default:
                this.app.getLogger().error(`AuctionController.processModalSubmit: Unsupported actionTag: ${actionIdObject.actionTag}`);
                return false;
        }

        return true;
    }

    public async processButtonClick(actionId: string, triggerId: string, room: IRoom, user: IUser, modify: IModify): Promise<boolean> {
        switch (actionId) {
            case AuctionActions.START_BID:
                await this.startBid(triggerId, room, user, modify);
                return true;
            case AuctionActions.HELP:
                await this.help(triggerId, room, user, modify);
                return true;
            default:
                this.app.getLogger().error(`AuctionController.processButtonClick: Unsupported actionId: ${actionId}`);
                return false;
        }
    }

    public async configAuction(auctionData: AuctionData, viewState: any, room: IRoom, modify: IModify, persistence: IPersistence): Promise<void> {
        auctionData.setStatus(viewState.auctionStatusBlock.auctionStatus);
        auctionData.setAuctionType(viewState.auctionTypeBlock.auctionType);
        auctionData.setQuestionsRoomName(viewState.auctionQuestionsRoomBlock.questionsRoomName);

        await this.auctionModel.upsertAuctionData(auctionData, room, persistence);

        // TODO sendRichMessage
        const messageMarkDown = `Room status now is ${auctionData.getStatus()} type is ${auctionData.getAuctionType()}`;
        await this.auctionUI.sendBidActionsMessage(messageMarkDown, room, modify);
    }

    public async startBid(triggerId: string, room: IRoom, user: IUser, modify: IModify): Promise<void> {
        const submitActionIdObject = {
            actionTag: AuctionActions.SEND_BID,
            roomId: room.id,
            previousBidValue: undefined,
            winningBidValue: undefined,
            newBidValue: undefined,
        };

        const modal = await this.auctionUI.createBidModal(submitActionIdObject, modify);
        await modify.getUiController().openModalView(modal, { triggerId }, user);
    }

    public async sendBid(actionIdObject: any,
                         viewState: any,
                         room: IRoom,
                         user: IUser,
                         triggerId: string,
                         modify: IModify): Promise<boolean> {
        let bidValue: number;

        try {
            bidValue = viewState.sendBid.bidValue;
        } catch (e) {
            bidValue = Number.NaN;
        }

        // TODO parsing and validation

        const submitActionIdObject = {
            actionTag: AuctionActions.CONFIRM_BID,
            roomId: room.id,
            previousBidValue: actionIdObject.previousBidValue,
            winningBidValue: actionIdObject.winningBidValue,
            newBidValue: bidValue,
        };

        const modal = await this.auctionUI.createBidModal(submitActionIdObject, modify);
        await modify.getUiController().openModalView(modal, { triggerId }, user);

        return true;
    }

    public async confirmBid(actionIdObject: any,
                            room: IRoom,
                            user: IUser,
                            modify: IModify,
                            persistence: IPersistence): Promise<boolean> {
        this.app.getLogger().debug('Confirming bid', actionIdObject);
        // const bid = new
        // auctionData.setWinningBid()
        // await this.auctionModel.upsertAuctionData(auctionData, room, persistence);

        // TODO sendRichMessage
        const messageMarkDown = `Novo lance de ${user.username} no valor de ${actionIdObject.newBidValue}`;
        await this.auctionUI.sendBidActionsMessage(messageMarkDown, room, modify);

        return true;
    }

    public async help(triggerId: string, room: IRoom, user: IUser, modify: IModify): Promise<void> {
        const modal = await this.auctionUI.createHelpModal(room, modify);
        await modify.getUiController().openModalView(modal, { triggerId }, user);
    }

    public async sendQuestion(viewState: any, room: IRoom, user: IUser, read: IRead, modify: IModify): Promise<void> {
        let questionText = '';

        this.app.getLogger().debug('sendQuestion');
        this.app.getLogger().debug(viewState);

        try {
            questionText = viewState.helpBlock.helpQuestion;
        } catch (e) {
            questionText = '';
        }

        questionText = questionText.trim();

        if (questionText === '')  {
            await this.auctionUI.sendSimpleNotification('Nenhuma questão foi enviada', room, user, modify.getNotifier());
        } else {
            const confirmationText = `Sua questão "${questionText}" foi enviada.`;
            const messageText = `user ${user.username} asked ${questionText} in room ${room.slugifiedName}`;

            const auctionData = await this.auctionModel.getAuctionData(room, read);
            const questionsRoom = await read.getRoomReader().getByName(auctionData.getQuestionsRoomName());

            if (questionsRoom) {
                this.app.getLogger().debug('quero mandar ' + messageText + ' para ' + questionsRoom.slugifiedName);

                await this.auctionUI.sendSimpleMessage(messageText, questionsRoom, modify);
                await this.auctionUI.sendSimpleNotification(confirmationText, room, user, modify.getNotifier());
            } else {
                await this.auctionUI.sendSimpleNotification('Erro enviando sua dúvida', room, user, modify.getNotifier());
                throw new Error(`Could not find questions room with name ${auctionData.getQuestionsRoomName()}`);
            }
        }
    }
}
