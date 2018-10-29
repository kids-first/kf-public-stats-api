import * as express from 'express';
import arranger from '../services/arranger';
import * as _ from 'lodash';

const router = express.Router();

class StudyData {
  id: string;
  name: string;
  probands: number;
  familyMembers: number;
  constructor(
    _id: string,
    _name: string,
    _probands: number,
    _familyMembers: number,
  ) {
    this.id = _id;
    this.name = _name;
    this.probands = _probands;
    this.familyMembers = _familyMembers;
  }
}

/**
 * Fetch Study IDs
 * ---------------
 *    Call Arranger to get all the currently available study IDs
 */
const fetchStudyIds = async (project: string): Promise<string[]> => {
  const query = `{
    participant {
      aggregations {
        study__kf_id {
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

  const buckets = _.get(data, 'participant.aggregations.study__kf_id.buckets');
  //TODO: check buckets is an array
  return buckets.map(bucket => bucket.key);
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
const probandSqon = (studyId: string): string => `${studyId}Proband`;
const familySqon = (studyId: string): string => `${studyId}Family`;

const probandLabel = (studyId: string): string => `${studyId}_proband`;
const familyLabel = (studyId: string): string => `${studyId}_familyMembers`;
const nameLabel = (studyId: string): string => `${studyId}_name`;

const probandFilter = (studyId: string, probandValue: Boolean): any => ({
  op: 'and',
  content: [
    {
      op: 'in',
      content: {
        field: 'study.kf_id',
        value: [studyId],
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

const buildParticipantQuery = (studyIds: string[]): string => {
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

  const queryParams = studyIds
    .map(
      studyId =>
        `$${probandSqon(studyId)}: JSON, $${familySqon(studyId)}: JSON`,
    )
    .join(', ');

  const queries = studyIds
    .map(
      studyId =>
        `
        ${probandLabel(studyId)}: hits(filters: $${probandSqon(
          studyId,
        )}) {total}
        ${familyLabel(studyId)}: hits(filters: $${familySqon(studyId)}) {total}
        ${nameLabel(studyId)}: aggregations(filters: $${familySqon(
          studyId,
        )}) {study__short_name{buckets{key}}}
        `,
    )
    .join('');

  return `query(${queryParams}) {participant{${queries}}}`;
};

const buildParticipantVariables = (studyIds: string[]): any => {
  const output = {};
  studyIds.forEach(studyId => {
    output[probandSqon(studyId)] = probandFilter(studyId, true);
    output[familySqon(studyId)] = probandFilter(studyId, false);
  });
  return output;
};

const fetchParticipantData = async (
  project: string,
  studyIds: string[],
): Promise<StudyData[]> => {
  const query = buildParticipantQuery(studyIds);

  const variables = buildParticipantVariables(studyIds);

  const data = await arranger
    .query(project, query, variables)
    .then(response => response.data);

  return studyIds.map(studyId => {
    const probands = parseInt(
      _.get(data, `participant.${probandLabel(studyId)}.total`, 0),
    );
    const familyMembers = parseInt(
      _.get(data, `participant.${familyLabel(studyId)}.total`, 0),
    );
    const name = _.get(
      data,
      `participant.${nameLabel(studyId)}.study__short_name.buckets[0].key`,
      studyId,
    );
    return new StudyData(studyId, name, probands, familyMembers);
  });
};

/**
 *  ----- Routes -----
 * */

router.get('/', async (req, res) => {
  const studyIds = await fetchStudyIds('october_10');
  const studyData = await fetchParticipantData('october_10', studyIds);

  const output = {
    studies: studyData.map(study => {
      const { id, name, probands, familyMembers } = study;
      return { id, name, probands, familyMembers };
    }),
  };
  res.send(output);
});

export default router;
