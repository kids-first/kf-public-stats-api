import { arrangerApi } from '../config';
import keycloak from './keycloak';

import axios from 'axios';

const MISSING_VALUE = '__missing__';
const MISSING_DISPLAY_TEXT = 'No Data';

const query = async (
  project: string,
  query: string,
  variables: Object = {},
): Promise<any> => {
  const url = `${arrangerApi}/${project}/graphql`;

  const token = await keycloak.getToken();
  const Authorization: string = `Bearer ${token}`;
  const config = { headers: { Authorization } };

  return await axios
    .post(url, { query, variables }, config)
    .then(response => response.data)
    .catch(err => {
      throw new Error(`Error querying arranger: ${err.message}`);
    });
};

export default { query, MISSING_VALUE, MISSING_DISPLAY_TEXT };
