const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { FastifyAdapter } = require("@bull-board/fastify");
import { Queue, Worker } from "bullmq";
import { FastifyPluginAsync } from "fastify";

export const expire = new Queue("url-expire", {
  connection: {
    host: "localhost",
    port: 6379,
  },
});
export const schedule: FastifyPluginAsync = async (fastify) => {
  const serverAdapter = new FastifyAdapter();
  createBullBoard({
    queues: [new BullMQAdapter(expire)],
    serverAdapter,
  });

  serverAdapter.setBasePath("/ui");

  fastify.register(serverAdapter.registerPlugin(), { prefix: "/ui" });

  const worker = new Worker("url-expire", async (job) => {}, {
    connection: {
      host: "localhost",
      port: 6379,
    },
  });
  worker.on("completed", async (job) => {
    const client = await fastify.pg.connect();
    try {
      await client.query("delete from urls where short_url=$1", [job.name]);
    } catch (err) {
      console.log(err);
    } finally {
      client.release();
    }
    console.log(`${job.id} has completed!`);
  });
  worker.on("failed", (job, err) => {
    console.log(`${job?.id ?? null} has failed with ${err.message}`);
  });
};
