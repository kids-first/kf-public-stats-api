import * as vaultAuthAws from 'vault-auth-aws';
import * as vault from 'node-vault';

import {
  vaultEndpointProtocol,
  vaultHost,
  vaultPort,
  vaultApiVersion,
  vaultToken,
  vaultAuthentication,
  vaultAwsIamRole,
  useVault,
} from '../config';

let state: { client: any } = { client: null };
const vaultClient = async () => {
  if (!useVault) return false;

  const authOptions = {
    host: vaultHost,
    vaultAppName: vaultAwsIamRole,
    port: vaultPort,
    ssl: vaultEndpointProtocol === 'https',
  };

  const token =
    vaultAuthentication === 'AWS_IAM'
      ? await new vaultAuthAws(authOptions)
          .authenticate()
          .then(r => r.auth.client_token)
          .catch(err => {
            throw Error(`Vault unable to authenticate.`);
          })
      : vaultToken;

  state.client = vault({
    apiVersion: vaultApiVersion,
    endpoint: `${vaultEndpointProtocol}://${vaultHost}:${vaultPort}`,
    token,
  });
  return state.client;
};

export default vaultClient;
