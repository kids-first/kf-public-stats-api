import {searchMembersApi} from '../config';
import keycloak from './keycloak';

import axios from 'axios';

const getInterestCounts = async (): Promise<PropertyCounts> => {
  const url = `${searchMembersApi}/interests_stats`;

  const token = await keycloak.getToken();
  const Authorization: string = `Bearer ${token}`;
  const config = {
    headers: { Authorization, 'Content-Type': 'application/json' },
  };

  return axios
      .get(url,  config)
      .then(response => response.data)
      .catch(err => {
        throw new Error(`Error querying persona: ${err.message}`);
      });
};

export default { getInterestCounts };
