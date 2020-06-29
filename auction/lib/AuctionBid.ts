import { IUser } from '@rocket.chat/apps-engine/definition/users';

export class AuctionBid {
    protected bidder: IUser;
    protected bidValue: number;

    constructor(fromObject?: object) {
        if (fromObject) {
            Object.assign(this, fromObject);
        }
    }

    public getBidder(): IUser {
        return this.bidder;
    }

    public setBidder(bidder: IUser) {
        this.bidder = bidder;
    }

    public getBidValue(): number {
        return this.bidValue;
    }

    public setBidValue(bidValue: number) {
        this.bidValue = bidValue;
    }
}
