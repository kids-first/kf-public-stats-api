import { personaApi } from '../config';
import ego from './ego';

import axios from 'axios';
import * as _ from 'lodash';

export const query = async (
  query: string,
  variables: Object = {},
): Promise<any> => {
  const url = `${personaApi}/graphql`;

  const token = await ego.getToken();
  const Authorization: string = `Bearer ${token}`;
  const config = {
    headers: { Authorization, 'Content-Type': 'application/json' },
  };

  return await axios
    .post(url, { query, variables }, config)
    .then(response => response.data)
    .catch(err => {
      throw new Error(`Error querying persona: ${err.message}`);
    });
};

const PER_PAGE_LIMIT = 1000;
const INTERESTS_QUERY = `query($page: Int) {
  users (perPage:${PER_PAGE_LIMIT} page:$page) {
    pageInfo {
      hasNextPage
    }   
    items {
      interests
    }
  }
}`;

const queryPagedInterests = async (
  page: number = 1,
  counts: PropertyCounts = {},
): Promise<PropertyCounts> => {
  const response = await query(INTERESTS_QUERY, { page });
  const hasNextPage = _.get(response, 'data.users.pageInfo.hasNextPage', false);

  const items = _.get(response, 'data.users.items', []);
  items.forEach(item => {
    const interests: string[] = _.get(item, 'interests', []);

    interests.forEach(interest => {
      if (!counts[interest]) {
        counts[interest] = 1;
      } else {
        counts[interest] += 1;
      }
    });
  });

  return hasNextPage ? queryPagedInterests(page + 1, counts) : counts;
};

const getInterestCounts = async (): Promise<PropertyCounts> => {
  return await queryPagedInterests();
};

export default { query, getInterestCounts };
