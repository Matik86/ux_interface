import { ethers } from 'ethers';
import { parseUnits } from "ethers";
import { Client } from './client.js';
import { TOKEN_ADDRESS } from './config.js';


export class MintToken {
    constructor(client) {
        this.client = client;
        this.address = client.address;
        this.contract = client.getTokenContract(TOKEN_ADDRESS);
    }

    // Mint токенов (для примера)
    async mintToken(amount) {
        try {
            // Получаем nonce для минта
            const nonce = await this.contract.nonces(this.address);

            // Получаем сигнатуру от админа
            const signature = await this.client.getMintTokenSignature(
                TOKEN_ADDRESS,
                amount
            );          

            const txParams = await this.client.prepareTransaction();

            const txUnsigned = await this.contract.mintWithSignature.populateTransaction(
                amount,
                nonce,
                Number(0),
                signature
            );
            // Объединяем с базовыми параметрами
            const transaction = { ...txParams, ...txUnsigned };

            // Лог
            const tokenName = await this.contract.name();
            const humanAmount = Number(amount / 10n ** 18n)
            console.log(`${this.address} is minting📥 ${humanAmount} $${tokenName} ...`);

            // Отправка транзакции
            const txData = await this.client.sendTx({ transaction });
            return await this.client.verifyTx(txData);

        } catch (err) {
            console.error(`error during mint tokens: ${err}`);
            return false;
        }
    }

    // burn токенов (для примера)
    async burnToken(amount) {
        try {
            const txParams = await this.client.prepareTransaction();

            const txUnsigned = await this.contract.burn.populateTransaction(
                amount,
            );
            // Объединяем с базовыми параметрами
            const transaction = { ...txParams, ...txUnsigned };

            // Лог
            const tokenName = await this.contract.name();
            const humanAmount = Number(amount / 10n ** 18n)
            console.log(`${this.address} is burning🔥 ${humanAmount} $${tokenName} ...`);

            // Отправка транзакции
            const txData = await this.client.sendTx({ transaction });
            return await this.client.verifyTx(txData);

        } catch (err) {
            console.error(`error during burn tokens: ${err}`);
            return false;
        }
    }

}
