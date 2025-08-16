// client.js
import { ethers, TypedDataEncoder } from "ethers";
import { NFT_ABI, RPC_URL, TOKEN_ABI, adminPrivateKey } from "./config.js";


export class Client {
    constructor(privateKey) {
        if (!privateKey) {
            throw new Error("Private key is required");
        }
        this.privateKey = privateKey;
        this.provider = new ethers.JsonRpcProvider(RPC_URL);
        this.wallet = new ethers.Wallet(this.privateKey, this.provider); // Создаём кошелёк
        this.address = ethers.getAddress(this.wallet.address);  // Адрес в checksum-формате
    }

    getNFTContract(contractAddress) {
        return new ethers.Contract(
            ethers.getAddress(contractAddress),
            NFT_ABI,
            this.wallet
        );
    }

    getTokenContract(contractAddress) {
        return new ethers.Contract(
            ethers.getAddress(contractAddress),
            TOKEN_ABI,
            this.wallet
        );
    }

    async getNFTBalance(contractAddress, token_id) {
        return this.getNFTContract(contractAddress).balanceOf(this.address, token_id)
    }

    async getTokenBalance(contractAddress) {
        return this.getTokenContract(contractAddress).balanceOf(this.address)
    }
    

    async getMintNFTSignature(nftContractAddress, tokenId, amount) { // получаем сигнатуру от админа на минт нфт
        const nftContract = this.getNFTContract(nftContractAddress);

        
        const nonceBigInt = await nftContract.nonces(this.address);
        const nonce = Number(nonceBigInt);

        // Получаем chainId динамически
        const network = await this.provider.getNetwork();
        const chainId = network.chainId;

        const domain = {
            name: "AdminMintableERC1155",
            version: "1",
            chainId: chainId,
            verifyingContract: nftContractAddress,
        };

        const types = {
            MintRequest: [
                { name: "to", type: "address" },
                { name: "id", type: "uint256" },
                { name: "amount", type: "uint256" },
                { name: "nonce", type: "uint256" },
            ],
        };

        const message = {
            to: this.address,
            id: Number(tokenId),
            amount: Number(amount),
            nonce: nonce,
        };

        const adminWallet = new ethers.Wallet(adminPrivateKey);
        const signature = await adminWallet.signTypedData(domain, types, message);

        return signature;
    }

    async getMintTokenSignature(tokenContractAddress, amount) { // получаем сигнатуру от админа на минт токенов
        const tokenContract = this.getTokenContract(tokenContractAddress);

        const nonceBigInt = await tokenContract.nonces(this.address);
        const nonce = Number(nonceBigInt);

        const network = await this.provider.getNetwork();
        const chainId = Number(network.chainId);

        const domain = {
            name: await tokenContract.name(),
            version: "1",
            chainId: chainId,
            verifyingContract: tokenContractAddress,
        };

        const types = {
            Mint: [
                { name: "to", type: "address" },
                { name: "amount", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "deadline", type: "uint256" },
            ],
        };

        const message = {
            to: this.address,
            amount: amount,
            nonce: nonce,
            deadline: Number(0),
        };

        const adminWallet = new ethers.Wallet(adminPrivateKey);
        const signature = await adminWallet.signTypedData(domain, types, message);

        return signature;
    }

    async getPriorityFee() {
        const feeHistory = await this.provider.send("eth_feeHistory", [
            25,       
            "latest", 
            [20.0]    
        ]);

        const nonEmptyBlockPriorityFees = feeHistory.reward
            .map(fee => Number(fee[0])) 
            .filter(fee => fee !== 0);  

        const divisorPriority = Math.max(nonEmptyBlockPriorityFees.length, 1);

        // Среднее значение
        const priorityFee = Math.round(
            nonEmptyBlockPriorityFees.reduce((sum, val) => sum + val, 0) / divisorPriority
        );

        return priorityFee;
    }

    async prepareTransaction(value = 0n) {
        try {
            const nonce = await this.provider.getTransactionCount(this.address);
            const chainId = Number((await this.provider.getNetwork()).chainId);
            const feeData = await this.provider.getFeeData();

            const txParams = {
                from: this.address,
                nonce,
                value: BigInt(value),
                chainId
            };

            // если сеть поддерживает EIP-1559
            if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
                txParams.maxFeePerGas = BigInt(feeData.maxFeePerGas.toString());
                txParams.maxPriorityFeePerGas = BigInt(feeData.maxPriorityFeePerGas.toString());
            } else if (feeData.gasPrice) {
                txParams.gasPrice = BigInt(feeData.gasPrice.toString());
            }


            return txParams;
        } catch (error) {
            console.error(`prepareTransaction error: ${error}`);
        }
    }



    // Отправка транзакции
    async sendTx({ transaction = null, to = null, data = null, value = 0n } = {}) {
        try {
            let txParams;

            // если передали готовую транзакцию
            if (transaction) {
                txParams = transaction;
            } else {
                // формируем новую транзакцию
                txParams = await this.prepareTransaction();
            }

            // подписываем и отправляем
            const txResponse = await this.wallet.sendTransaction(txParams);

            return {
                tx_hash: txResponse.hash,
                value: txParams.value,
                data: txParams.data || null,
                gas: txParams.gasLimit
            };

        } catch (error) {
            console.error(`sendTx error: ${error}`);
            throw error;
        }
    }



    async verifyTx(txData) {
        try {
            if (!txData) {
                console.error("txData = null");
                return false;
            }

            // Ждем подтверждения транзакции с таймаутом
            const receipt = await this.provider.waitForTransaction(txData.tx_hash, 1, 60_000); // 1 блок, таймаут 60 секунд

            if (receipt && receipt.status === 1) {
                console.log(`✅ transaction completed: https://sepolia.basescan.org/tx/${txData.tx_hash}`);
                return true;
            } else {
                console.error(`❌ transaction failed: https://sepolia.basescan.org/tx/${txData.tx_hash}`);
                return false;
            }

        } catch (err) {
            console.error(`${this.address} | ${err}`);
            return false;
        }
    }

}
