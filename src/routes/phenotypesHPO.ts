import * as express from 'express';
import arranger from '../services/arranger';
const _ = require('lodash');

const router = express.Router({ mergeParams: true });

class PhenotypeData {
  id: string;
  name: string;
  probands: number;
  familyMembers: number;
  constructor(_name: string, _probands: number, _familyMembers: number) {
    this.name = _name;
    this.probands = _probands;
    this.familyMembers = _familyMembers;
  }
}

/**
 * Fetch Phenotypes
 * ---------------
 *    Call Arranger to get all the currently available Phenotype Observed HPO Text values
 */
const fetchPhenotypes = async (project: string): Promise<string[]> => {
  const query = `{
    participant {
      aggregations {
        phenotype__hpo_phenotype_observed_text {
          buckets
          {
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
    'participant.aggregations.phenotype__hpo_phenotype_observed_text.buckets',
  );
  return _.isArray(buckets) ? buckets.map(bucket => bucket.key) : [];
};

/**
 * Fetch Participant Data for all studies
 * --------------------------------------
 *    Calls arranger to get proband and familyMember counts for all available studies
 *    Returns this data in a convenient array of StudyData objects
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
const removeNonAlpha = (text: string): string =>
  text.replace(/[^a-zA-Z0-9]/g, '_');

const probandLabel = (phenotype: string): string =>
  `X${removeNonAlpha(phenotype)}_proband`;
const familyLabel = (phenotype: string): string =>
  `X${removeNonAlpha(phenotype)}_familyMembers`;

const probandFilter = (phenotype: string, probandValue: Boolean): any => ({
  op: 'and',
  content: [
    {
      op: 'in',
      content: {
        field: 'phenotype.hpo_phenotype_observed_text',
        value: [phenotype],
      },
    },
    {
      op: 'in',
      content: {
        field: 'is_proband',
        value: [probandValue.toString()],
      },
    },
  ],
});

const buildParticipantQuery = (phenotypes: string[]): string => {
  const queryParams = phenotypes
    .map(
      phenotype =>
        `$${probandLabel(phenotype)}: JSON, $${familyLabel(phenotype)}: JSON`,
    )
    .join(', ');

  const queries = phenotypes
    .map(
      phenotype =>
        `
        ${probandLabel(phenotype)}: aggregations(filters: $${probandLabel(
          phenotype,
        )}) {kf_id {buckets{key}}}
        ${familyLabel(phenotype)}: aggregations(filters: $${familyLabel(
          phenotype,
        )}) {kf_id {buckets{key}}}`,
    )
    .join('');

  return `query(${queryParams}) {participant{${queries}}}`;
};

const buildParticipantVariables = (phenotypes: string[]): any => {
  const output = {};
  phenotypes.forEach(phenotype => {
    output[probandLabel(phenotype)] = probandFilter(phenotype, true);
    output[familyLabel(phenotype)] = probandFilter(phenotype, false);
  });
  return output;
};

const fetchParticipantData = async (
  project: string,
  phenotypes: string[],
): Promise<PhenotypeData[]> => {
  const query = buildParticipantQuery(phenotypes);

  const variables = buildParticipantVariables(phenotypes);

  const response = await arranger.query(project, query, variables);
  const data = response.data;

  return phenotypes.map(phenotype => {
    const probands = parseInt(
      _.get(data, `participant.${probandLabel(phenotype)}.kf_id.buckets`, [])
        .length,
    );
    const familyMembers = parseInt(
      _.get(data, `participant.${familyLabel(phenotype)}.kf_id.buckets`, [])
        .length,
    );
    const name =
      phenotype === arranger.MISSING_VALUE
        ? arranger.MISSING_DISPLAY_TEXT
        : phenotype;
    return new PhenotypeData(name, probands, familyMembers);
  });
};

/**
 *  ----- Routes -----
 * */

router.get('/', async (req, res, next) => {
  try {
    const { project } = req.params;
    const phenotypes = await fetchPhenotypes(project);
    const phenotypeData = await fetchParticipantData(project, phenotypes);

    const output = {
      phenotypes: phenotypeData.map(study => {
        const { name, probands, familyMembers } = study;
        return { name, probands, familyMembers };
      }),
    };
    res.send(output);
  } catch (e) {
    next(e);
  }
});

export default router;
