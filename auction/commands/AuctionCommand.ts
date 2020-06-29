import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { AuctionApp } from '../AuctionApp';

export class AuctionCommand implements ISlashCommand {
    public command = 'auction';
    public i18nParamsExample = 'param_example_no_param';
    public i18nDescription = 'command_description_auction';
    public providesPreview = false;

    constructor(private readonly app: AuctionApp) {
    }

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persistence: IPersistence): Promise<void> {
        this.app.getLogger().debug('AuctionCommand.executor');

        await this.app.getController().processCommand(context, read, modify);
    }
}
