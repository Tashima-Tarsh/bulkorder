import { Queue } from "bullmq";
import { Redis } from "ioredis";

export function createImportQueue(redisUrl:string) {
  const connection = new Redis(redisUrl,{maxRetriesPerRequest:null});
  const queue = new Queue("bulkorder-rows",{
    connection,
    defaultJobOptions:{
      attempts:5,
      backoff:{type:"exponential",delay:2000},
      removeOnComplete:{count:1000},
      removeOnFail:{count:2000}
    }
  });
  return {connection,queue};
}
