import {searchMembersApi} from '../config';
import ego from './ego';

import axios from 'axios';

const getInterestCounts = async (): Promise<PropertyCounts> => {
  const url = `${searchMembersApi}`;

  const token = await ego.getToken();
  const Authorization: string = `Bearer ${token}`;
  const config = {
    headers: { Authorization, 'Content-Type': 'application/json' },
  };

  return await axios
      .get(url,  config)
      .then(response => response.data)
      .catch(err => {
        throw new Error(`Error querying persona: ${err.message}`);
      });
};

export default { getInterestCounts };
