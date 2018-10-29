import axios from 'axios';
import * as FormData from 'form-data';
import * as jwt from 'jsonwebtoken';

import { egoApi, egoClientId, egoClientSecret } from '../config';

let appToken: string;
let expiry: number;

const setToken = token => {
  appToken = token;
  expiry = jwt.decode(appToken).exp * 1000;
};

const fetchToken = async (): Promise<string> => {
  const tokenUrl = `${egoApi}/oauth/token`;

  const data = new FormData();
  data.append('grant_type', 'client_credentials');
  data.append('client_id', egoClientId);
  data.append('client_secret', egoClientSecret);

  return await axios
    .create({ headers: data.getHeaders() })
    .post(tokenUrl, data)
    .then(response => response.data.access_token);
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
