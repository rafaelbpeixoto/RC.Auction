export class AuctionUtils {
    // TODO Is there a better solution?
    // Taken from PollApp/lib/uuid.ts
    public static createUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            // tslint:disable-next-line: no-bitwise
            const r = Math.random() * 16 | 0;
            // tslint:disable-next-line: no-bitwise
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    public static getI18N(key: string): string {
        // TODO use real i18n
        const keyStrings = {
            abc: 'A Bê Cê',
            def: 'Dê É Efe',
            msg_auction_finished: 'Leilão finalizado. Não é mais possível fazer qualquer ação.',
            msg_only_auctioneer_can_perform_action: 'Esta é uma sala de leilão. Apenas o leiloeiro pode fazer esta ação.',
            send_bid: 'Enviar Lance',
            confirm_bid: 'Confirmar Lance',
        };

        return keyStrings[key];
    }
}
