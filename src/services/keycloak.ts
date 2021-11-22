import axios, { AxiosBasicCredentials } from 'axios';
import * as jwt from 'jsonwebtoken';
import * as qs from 'query-string';

import { keycloakApi, keycloakClientId, keycloakClientSecret, keycloakRealm } from '../config';

let appToken: string;
let expiry: number;

const setToken = (token) => {
  appToken = token;
  expiry = jwt.decode(appToken).exp * 1000;
};

const fetchToken = async (): Promise<string> => {
  const data = qs.stringify({
    'grant_type': 'client_credentials',
    'scope': 'openid' 
  });
  const config = {
    method: 'post',
    url: `${keycloakApi}/realms/${keycloakRealm}/protocol/openid-connect/token`,
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    auth: {
      username: keycloakClientId,
      password: keycloakClientSecret
    } as AxiosBasicCredentials,
    data : data
  };
  
  try{
    const response = await axios(config);

    return response.data.access_token;
  } catch(err){
    throw new Error(`Error authenticating with keycloak: ${err.message}`);
  }
};

const isTokenExpired = (): boolean => {
  return !expiry || Date.now() > expiry;
};

const getToken = async (): Promise<string> => {
  if (!appToken || isTokenExpired()) {
    setToken(await fetchToken());
  }

  return appToken;
};

export default { getToken };
