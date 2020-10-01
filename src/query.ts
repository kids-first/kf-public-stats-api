import arranger from './services/arranger';

type Bucket = {
  key: string;
  doc_count: number;
  top_hits?: {
    study: {
      kf_id: string;
    };
  };
};

type CountValues = {
  familyMembers: number;
  probands: number;
};

type CountsByName = {
  name: string;
  id?: string;
} & CountValues;

export const fetchCountsQuery = async (
  project: string,
  targetField: string,
  includeStudiesTopHits?: boolean,
) => {
  const studyTopHits = includeStudiesTopHits
    ? `top_hits(_source:"study.kf_id", size:1)`
    : '';

  const gqlQuery = `
    query {
      participant {
        probands_only: aggregations(
          filters: {
            content: [{ content: { field: "is_proband", value: ["true"] }, op: "in" }]
            op: "and"
          }
        ) {
          ${targetField} {
            buckets {
              key
              doc_count
              ${studyTopHits}
            }
          }
        }
        others: aggregations(
          filters: {
            content: [
              { content: { field: "is_proband", value: ["false", "__missing__"] }, op: "in" }
            ]
            op: "and"
          }
        ) {
          ${targetField} {
            buckets {
              key
              doc_count
              ${studyTopHits}
            }
          }
        }
      }
    }
  `;

  const response = await arranger.query(project, gqlQuery, {});
  const data = response.data;

  const probandsBuckets: Array<Bucket> =
    data.participant.probands_only[targetField].buckets;
  const othersBuckets: Array<Bucket> =
    data.participant.others[targetField].buckets;

  const labelToCounts = {};
  probandsBuckets.forEach(
    (bucket) =>
      (labelToCounts[bucket.key] = {
        probands: bucket.doc_count,
        familyMembers: 0,
      }),
  );

  othersBuckets.forEach((bucket) => {
    const label = bucket.key;
    const labelAlreadyExists = !!labelToCounts[label];
    const probandsCount = labelAlreadyExists
      ? labelToCounts[label].probands
      : 0;

    labelToCounts[label] = {
      familyMembers: bucket.doc_count,
      probands: probandsCount,
    };
  });

  const resultsWithoutTopHits = Object.entries(labelToCounts).reduce<
    Array<CountsByName>
  >((accumulator, [name, counts]) => {
    const { familyMembers, probands } = counts as CountValues;
    return [...accumulator, { name, probands, familyMembers }];
  }, []);

  if (includeStudiesTopHits) {
    const mergedBuckets = [...probandsBuckets, ...othersBuckets];
    return resultsWithoutTopHits.map((countsByName: CountsByName) => {
      const currentName = countsByName.name;
      const foundBucket = mergedBuckets.find((b) => b.key === currentName);
      if (foundBucket) {
        // @ts-ignore we assumes there s always an id. Otherwise, it's a bug
        const id = foundBucket.top_hits.study.kf_id;
        return { id, ...countsByName };
      }
      return { ...countsByName };
    });
  }
  return resultsWithoutTopHits;
};
