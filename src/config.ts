import * as dotenv from 'dotenv';

dotenv.config();

export const egoApi = process.env.EGO_API;
export const arrangerApi = process.env.ARRANGER_API;
export const searchMembersApi = process.env.SEARCH_MEMBERS_API;

export const egoClientId = process.env.EGO_CLIENT_ID;
export const egoClientSecret = process.env.EGO_CLIENT_SECRET;

export const expressPort = parseInt(process.env.EXPRESS_PORT || '2001');

export const logLevel = process.env.LOG_LEVEL || 'error';

export const useVault = process.env.USE_VAULT === 'true';

export const vaultAuthentication =
  process.env.VAULT_AUTHENTICATION || 'AWS_IAM';
export const vaultEndpointProtocol =
  process.env.VAULT_ENDPOINT_PROTOCOL || 'https';
export const vaultHost = process.env.VAULT_HOST;
export const vaultPort = process.env.VAULT_PORT;
export const vaultApiVersion = process.env.VAULT_API_VERSION || 'v1';
export const vaultToken = process.env.VAULT_TOKEN;
export const vaultAwsIamRole = process.env.AWS_IAM_ROLE;

export const vaultPath = process.env.VAULT_PATH;
export const vaultEgoClientIdKey =
  process.env.EGO_CLIENT_ID_KEY || 'ego-client-id';
export const vaultEgoClientSecretKey =
  process.env.EGO_CLIENT_SECRET_KEY || 'ego-client-secret';
