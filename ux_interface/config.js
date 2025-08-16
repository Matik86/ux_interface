import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import exp from 'constants';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const RPC_URL = process.env.RPC_URL || 'https://base-sepolia.drpc.org';

export const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || '0x9dFc743e45c71E24078F1a0dA670f48b25bED053';
export const NFT_ADDRESS   = process.env.NFT_ADDRESS   || '0x0846E84883d68144EAEA181E52c217551A5C5ae3';

//////////////////////////////////////////////////////////////////////////////////////////////////////

export const adminPrivateKey = 'admin_key'

//////////////////////////////////////////////////////////////////////////////////////////////////////

export function readJson(relPath) {
  const p = path.join(__dirname, '..', relPath);
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export const TOKEN_ABI = readJson('./ux_interface/ABIs/token_ABI.json'); // директория??
export const NFT_ABI   = readJson('./ux_interface/ABIs/NFT_ABI.json'); // директория??