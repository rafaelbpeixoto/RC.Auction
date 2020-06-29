import { ILogger, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { AuctionApp } from '../AuctionApp';
import { AuctionData, AuctionStatus, AuctionType } from './AuctionData';

export { AuctionData  };
export { AuctionStatus };
export { AuctionType };

export enum AuctionUserRole {
    ADMIN = 'admin',
    APP = 'app',
    AUCTIONEER = 'auctioneer',
    COMPETITOR = 'competitor',
    OTHER = 'other',
}

export class AuctionModel {
    protected app: AuctionApp;

    constructor(app: AuctionApp) {
        this.app = app;
    }

    public async getAuctionData(room: IRoom, read: IRead): Promise<AuctionData> {
        const associationWithRoom = new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, room.id);
        const recordList = await read.getPersistenceReader().readByAssociation(associationWithRoom);

        if (!recordList || recordList.length === 0) {
            const auctionData = new AuctionData();
            auctionData.setQuestionsRoomName('questions_' + room.slugifiedName); // i18n

            return auctionData;
        } else {
            return new AuctionData(recordList[0]);
        }
    }

    public async upsertAuctionData(auctionData: AuctionData, room: IRoom, persistence: IPersistence): Promise<void> {
        const associationWithRoom = new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, room.id);
        await persistence.updateByAssociation(associationWithRoom, auctionData, true);
    }

    public getAuctionUserRole(user: IUser): AuctionUserRole {
        if (user.roles.includes('admin')) {
            return AuctionUserRole.ADMIN;
        } else if (user.roles.includes('app')) {
            return AuctionUserRole.APP;
        } else if (user.username === 'leiloeiro') {
            return AuctionUserRole.AUCTIONEER;
        } else if (user.username === 'usutst') {
            return AuctionUserRole.COMPETITOR;
        } else {
            return AuctionUserRole.OTHER;
        }
    }
}
