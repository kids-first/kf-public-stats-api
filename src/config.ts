import * as dotenv from 'dotenv';

dotenv.config();

export const egoApi = process.env.EGO_API;
export const arrangerApi = process.env.ARRANGER_API;
export const searchMembersApi = process.env.SEARCH_MEMBERS_API;

export const egoClientId = process.env.EGO_CLIENT_ID;
export const egoClientSecret = process.env.EGO_CLIENT_SECRET;

export const expressPort = parseInt(process.env.EXPRESS_PORT || '2001');

export const logLevel = process.env.LOG_LEVEL || 'error';
