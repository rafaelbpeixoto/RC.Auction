import { AuctionApp } from '../AuctionApp';
import { AuctionBid } from './AuctionBid';

export enum AuctionStatus {
    NO_AUCTION = 'no auction',
    RUNNING = 'running',
    STOPPED = 'stopped',
    FINISHED = 'finished',
}

export enum AuctionType {
    FORWARD = 'forward',
    REVERSE = 'reverse',
}

export class AuctionData {
    protected status: AuctionStatus;
    protected winningBid: AuctionBid;
    protected questionsRoomName: string;
    protected auctionType: AuctionType;

    constructor(fromObject?: object) {
        if (fromObject) {
            Object.assign(this, fromObject);
        } else {
            this.status = AuctionStatus.NO_AUCTION;
        }
    }

    public getStatus(): AuctionStatus {
        return this.status;
    }

    public setStatus(status: AuctionStatus) {
        if (this.status === AuctionStatus.FINISHED) {
            throw new Error('Cannot change status if already finished');
        }

        this.status = status;
    }

    public getWinningBid(): AuctionBid {
        return this.winningBid;
    }

    public setWinningBid(bid: AuctionBid) {
        this.winningBid = bid;
    }

    public getQuestionsRoomName(): string {
        return this.questionsRoomName;
    }

    public setQuestionsRoomName(name: string) {
        this.questionsRoomName = name;
    }

    public getAuctionType(): AuctionType {
        return this.auctionType;
    }

    public setAuctionType(type: AuctionType) {
        this.auctionType = type;
    }
}
