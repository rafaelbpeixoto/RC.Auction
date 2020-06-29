import {
    IAppAccessors,
    IConfigurationExtend,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IMessage, IPostMessageSent, IPreMessageSentPrevent } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { IUIKitInteractionHandler, IUIKitResponse, UIKitBlockInteractionContext, UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { AuctionCommand } from './commands/AuctionCommand';
import { AuctionFinishCommand } from './commands/AuctionFinishCommand';
import { AuctionController } from './lib/AuctionController';

export class AuctionApp extends App implements IPreMessageSentPrevent, IPostMessageSent, IUIKitInteractionHandler {
    protected auctionController: AuctionController;

    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public getController(): AuctionController {
        return this.auctionController;
    }

    public async initialize(configuration: IConfigurationExtend): Promise<void> {
        await configuration.slashCommands.provideSlashCommand(new AuctionCommand(this));
        await configuration.slashCommands.provideSlashCommand(new AuctionFinishCommand(this));

        this.getLogger().debug('Initializing controller');
        this.auctionController = new AuctionController(this);
    }

    public async executePreMessageSentPrevent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence): Promise<boolean> {
        this.getLogger().debug('executePreMessageSentPrevent');
        return false;
    }

    public async executePostMessageSent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void> {
        this.getLogger().debug('executePostMessageSent');
    }

    // No ViewSubmitHandler não vem a sala, no BlockActionHandler vem
    public async executeViewSubmitHandler(context: UIKitViewSubmitInteractionContext,
                                          read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<IUIKitResponse> {
        this.getLogger().debug('executeViewSubmitHandler');

        let executionSucceded = false;

        const view = context.getInteractionData().view;
        const triggerId = context.getInteractionData().triggerId;
        const user = context.getInteractionData().user;
        const submit = view.submit;

        this.getLogger().debug('view state', view.state);

        if (submit) {
            executionSucceded = await this.auctionController.processModalSubmit(submit.actionId, view.state, triggerId, user, read, persistence, modify);
        }

        return {
            success: executionSucceded,
        };
    }

    public async executeBlockActionHandler(context: UIKitBlockInteractionContext,
                                           read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<IUIKitResponse> {
        let executionSucceded = false;

        const data = context.getInteractionData();
        const room = data.room;
        const user = data.user;
        const actionId = data.actionId;
        const triggerId = context.getInteractionData().triggerId;

        this.getLogger().debug('actionId', actionId);
        this.getLogger().debug('room', room);
        this.getLogger().debug('user', user);
        this.getLogger().debug('triggerId', triggerId);

        if (room) {
            executionSucceded = await this.auctionController.processButtonClick(actionId, triggerId, room, user, modify);
        } else {
            this.getLogger().error('AuctionApp.executeBlockActionHandler: no room');
        }

        return {
            success: executionSucceded,
        };
    }
}
