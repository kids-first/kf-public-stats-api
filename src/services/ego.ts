import axios from 'axios';
import * as FormData from 'form-data';
import * as jwt from 'jsonwebtoken';

import {
  egoApi,
  egoClientId,
  egoClientSecret,
  useVault,
  vaultEgoClientIdKey,
  vaultEgoClientSecretKey,
  vaultPath,
} from '../config';
import vaultClient from './vault';

let appToken: string;
let expiry: number;

class Credentials {
  clientId: string | undefined;
  clientSecret: string | undefined;
  constructor(_id: string | undefined, _secret: string | undefined) {
    this.clientId = _id;
    this.clientSecret = _secret;
  }
}

const setToken = token => {
  appToken = token;
  expiry = jwt.decode(appToken).exp * 1000;
};

const getApplicationCredentials = async (): Promise<Credentials> => {
  if (!useVault) {
    return new Credentials(egoClientId, egoClientSecret);
  } else {
    const client = await vaultClient();
    const { data } = await client.read();
    return new Credentials(
      data[vaultEgoClientIdKey],
      data[vaultEgoClientSecretKey],
    );
  }
};

const fetchToken = async (): Promise<string> => {
  const { clientId, clientSecret } = await getApplicationCredentials();

  const tokenUrl = `${egoApi}/oauth/token`;

  const data = new FormData();
  data.append('grant_type', 'client_credentials');
  data.append('client_id', clientId);
  data.append('client_secret', clientSecret);

  return await axios
    .create({ headers: data.getHeaders() })
    .post(tokenUrl, data)
    .then(response => response.data.access_token)
    .catch(err => {
      throw new Error(`Error authenticating with EGO: ${err.message}`);
    });
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
