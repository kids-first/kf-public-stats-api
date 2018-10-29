import { arrangerApi } from '../config';
import ego from './ego';

import axios from 'axios';

const OTHER = '__missing__';

const query = async (
  project: string,
  query: string,
  variables: any = {},
): Promise<any> => {
  const url = `${arrangerApi}/${project}/graphql`;

  const token = await ego.getToken();
  const Authorization: string = `Bearer ${token}`;
  const config = { headers: { Authorization } };

  return await axios
    .post(url, { query, variables }, config)
    .then(response => response.data)
    .catch(err => console.log(err));
};

export default { query, OTHER };
