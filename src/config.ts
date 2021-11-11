import * as dotenv from 'dotenv';

dotenv.config();

export const keycloakApi = process.env.KEYCLOAK_API;
export const arrangerApi = process.env.ARRANGER_API;
export const searchMembersApi = process.env.SEARCH_MEMBERS_API;

export const keycloakRealm = process.env.KEYCLOAK_REALM;
export const keycloakApiClientId = process.env.KEYCLOAK_API_CLIENT_ID;
export const keycloakClientId = process.env.KEYCLOAK_CLIENT_ID;
export const keycloakClientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

export const expressPort = parseInt(process.env.EXPRESS_PORT || '2001');

export const logLevel = process.env.LOG_LEVEL || 'error';
