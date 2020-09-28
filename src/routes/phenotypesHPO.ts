import * as express from 'express';
import arranger from '../services/arranger';

const _ = require('lodash');

class PhenotypesCount {
  name: string;
  probands: number;
  familyMembers: number;

  constructor(_name: string, _probands: number, _familyMembers: number) {
    this.name = _name;
    this.probands = _probands;
    this.familyMembers = _familyMembers;
  }
}

const phenotypesQuery = `
  query($sqon: JSON) {
    participant{
      proband_only: aggregations(filters:$sqon) {
        phenotype__hpo_phenotype_observed_text {
          buckets
          {
            key
            doc_count

          }
        }
      }
      all: aggregations {
        phenotype__hpo_phenotype_observed_text {
          buckets
          {
            key
            doc_count

          }
        }
      }      
    }
  }`;
const fetchPhenotypes = async (project: string): Promise<PhenotypesCount[]> => {

  const variables = {sqon: {content: [{content: {field: "is_proband", value: ["true"]}, op: "in"}], op: "and"}}
  const data = await arranger
      .query(project, phenotypesQuery, variables)
      .then(response => response.data);

  const probandBuckets = _.get(
      data,
      'participant.proband_only.phenotype__hpo_phenotype_observed_text.buckets',
  );
  const probandBucketsMap = bucketAsMap(probandBuckets)
  const allBuckets = _.get(
      data,
      'participant.all.phenotype__hpo_phenotype_observed_text.buckets',
  );
  const allBucketsMap = bucketAsMap(allBuckets);

  const merged =  _.mergeWith(probandBucketsMap, allBucketsMap, function customizer(probands, all, key) {
    if (probands) {
      if (all) {
        return new PhenotypesCount(key, probands.doc_count, all.doc_count);
      } else {
        return new PhenotypesCount(key, probands.doc_count, 0);
      }
    } else {
      return new PhenotypesCount(key, 0, all.doc_count);
    }
  });
  return _.values(merged)


};

/**
 * const buckets = [
 *  {'bucket': 'd1', 'bucket_count': 10},
 *  {'bucket': 'd2', 'bucket_count': 15}
 * ];
 *
 * bucketAsMap(buckets)
 * {
 *  d1: {'bucket': 'd1', 'bucket_count': 10},
 *  d2: {'bucket': 'd2', 'bucket_count': 15}
 * }
 * @param buckets
 */
const bucketAsMap = buckets => {
  const bucketArray = buckets.map(b => {
    return {[b.key]: b};
  });
  return Object.assign({}, ...bucketArray)
}

const router = express.Router({mergeParams: true});

router.get('/', async (req, res, next) => {
  try {
    const {project} = req.params;
    const phenotypes = await fetchPhenotypes(project);
    res.send(phenotypes);
  } catch (e) {
    next(e);
  }
});



export default router;
