import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { AuctionApp } from '../AuctionApp';

export class AuctionFinishCommand implements ISlashCommand {
    public command = 'auction_finish';
    public i18nParamsExample = 'param_example_room_name';
    public i18nDescription = 'command_description_auction_finish';
    public providesPreview = false;

    constructor(private readonly app: AuctionApp) {
    }

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persistence: IPersistence): Promise<void> {
        this.app.getLogger().debug('AuctionFinishCommand.executor');
    }
}
