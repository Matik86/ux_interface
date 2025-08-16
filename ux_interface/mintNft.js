import { ethers } from 'ethers';
import { Client } from './client.js';
import { NFT_ADDRESS } from './config.js';


export class MintNft {
    constructor(client) {
        this.client = client;
        this.address = client.address;
        this.contract = client.getNFTContract(NFT_ADDRESS);
    }

    // Mint NFT
    async mintNft(tokenId, amount) {
        try {
            // Получаем nonce для минта
            const nonce = await this.contract.nonces(this.address);

            // Получаем сигнатуру от админа
            const signature = await this.client.getMintNFTSignature(
                NFT_ADDRESS,
                tokenId,
                amount
            );          

            const txParams = await this.client.prepareTransaction();

            const txUnsigned = await this.contract.mintWithPermit.populateTransaction(
                this.address,
                tokenId,
                amount,
                nonce,
                signature
            );

            // Объединяем с базовыми параметрами
            const transaction = { ...txParams, ...txUnsigned };

            // Лог
            const tokenName = await this.contract.token_name(tokenId);
            console.log(`${this.address} is minting📥 ${amount} ${tokenName} ...`);

            // Отправка транзакции
            const txData = await this.client.sendTx({ transaction });
            return await this.client.verifyTx(txData);

        } catch (err) {
            console.error(`error during mint nft: ${err}`);
            return false;
        }
    }

    // Burn NFT
    async burnNft(tokenId, amount) {
        try {
            const txParams = await this.client.prepareTransaction();

            const txUnsigned = await this.contract.burn.populateTransaction(
                this.address,
                tokenId,
                amount
            );

            const transaction = { ...txParams, ...txUnsigned };

            const tokenName = await this.contract.token_name(tokenId);
            console.log(`${this.address} is burning🔥 ${amount} ${tokenName} ...`);

            const txData = await this.client.sendTx({ transaction });
            return await this.client.verifyTx(txData);

        } catch (err) {
            console.error(`error during burn nft: ${err}`);
            return false;
        }
    }

    // Получить баланс конкретного токена
    async getNftBalance(tokenId) {
        return await this.contract.balanceOf(this.address, tokenId);
    }

    // Проверить балансы всех NFT адреса
    async checkNftBalance() {
        const results = {};
        for (let tokenId = 1; tokenId <= 4; tokenId++) {
            results[tokenId] = Number(await this.getNftBalance(tokenId));
        }
        return results;
    }
}



