import * as express from 'express';
import arranger from '../services/arranger';
import * as _ from 'lodash';

const router = express.Router();

class CategoryData {
  name: string;
  participants: number;
  constructor(_name: string, _participants: number) {
    this.name = _name;
    this.participants = _participants;
  }
}

/**
 * Fetch Categories
 * ---------------
 *    Call Arranger to get all diagnosis categories
 */
const fetchCategoryNames = async (project: string): Promise<string[]> => {
  const query = `{
    participant {
      aggregations {
        diagnoses__diagnosis_category {
          buckets{
            key
          }
        }
      }
    }
  }`;

  const data = await arranger
    .query(project, query)
    .then(response => response.data);

  const buckets = _.get(
    data,
    'participant.aggregations.diagnoses__diagnosis_category.buckets',
  );
  //TODO: check buckets is an array
  return buckets.map(bucket => bucket.key);
};

/**
 * Fetch Participant Count for Categories
 * --------------------------------------
 *    Calls arranger to get total participant count for each Diagnosis Category
 *    Returns this data in a convenient array of CategoryData objects
 *
 * - probandSqon/familySqon and probandLabel/familyLabel :
 *    Generate SQON variable names, and generate labels for the arranger queries
 *
 * - probandFilter :
 *    Builds the SQON filter object, can build for proband (is_proband = true) or familyMember (is_proband = false)
 *
 * - buildParticipantQuery :
 *    Arranger query for participant data for all studies
 *
 * - buildParticipantVariables :
 *    Arranger SQON variables for all studies
 *
 * - fetchParticipantData :
 *    The actual query logic!
 *    Prepare arranger inputs, call arranger queries, and return StudyData array
 *
 */

const categoryLabel = (category: string): string =>
  category.replace(/[^a-zA-Z0-9]/g, '_');

const categoryFilter = (category: string): any => ({
  op: 'and',
  content: [
    {
      op: 'in',
      content: {
        field: 'diagnoses.diagnosis_category',
        value: [category],
      },
    },
  ],
});

const buildParticipantQuery = (categories: string[]): string => {
  //Desired output:
  /*
  query($studyIdProband: JSON, $studyIdFamily: JSON){
    participant {
      studyId_probands: hits(filters: $studyIdProband) {
        total
      }
      studyId_familyMembers: hits(filters: $studyIdFamily) {
        total 
      }
    }
  }
*/

  const queryParams = categories
    .map(category => `$${categoryLabel(category)}: JSON`)
    .join(', ');

  const queries = categories
    .map(
      category =>
        `
        ${categoryLabel(category)}: hits(filters: $${categoryLabel(
          category,
        )}) {total}
        `,
    )
    .join('');

  return `query(${queryParams}) {participant{${queries}}}`;
};

const buildParticipantVariables = (categories: string[]): any => {
  const output = {};
  categories.forEach(category => {
    output[categoryLabel(category)] = categoryFilter(category);
  });
  return output;
};

const fetchCategoryParticipantData = async (
  project: string,
  categories: string[],
): Promise<CategoryData[]> => {
  const query = buildParticipantQuery(categories);

  const variables = buildParticipantVariables(categories);

  const data = await arranger
    .query(project, query, variables)
    .then(response => response.data);

  return categories.map(category => {
    const participants = parseInt(
      _.get(data, `participant.${categoryLabel(category)}.total`, 0),
    );
    const name = category === arranger.OTHER ? 'Other' : category;
    return new CategoryData(name, participants);
  });
};

/**
 *  ----- Routes -----
 * */

router.get('/', async (req, res) => {
  const categoryIds = await fetchCategoryNames('october_10');
  const categoryData = await fetchCategoryParticipantData(
    'october_10',
    categoryIds,
  );

  const output = {
    categories: categoryData.map(category => {
      const { name, participants } = category;
      return { name, participants };
    }),
  };
  res.send(output);
});

export default router;
