import { FastifyPluginAsync } from "fastify";
import { nanoid } from "nanoid/async";
import isURL = require("is-url");

interface userLink {
  link: string;
  alias?: string;
}

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.post("/", async function (request, reply) {
    let url: userLink = request.body as userLink;
    const client = await fastify.pg.connect();
    if (!isURL(url.link)) {
      reply.status(400).send("Invalid URL");
      return;
    }
    let id: string = await nanoid(5);
    if (url.alias) {
      id = url.alias;
    }
    const date = new Date();
    const formattedDate = date.toISOString().slice(0, 10);
    const userId = 6;
    try {
      await client.query(
        "INSERT INTO urls(id,short_url,original_url,expired_date) VALUES ($1, $2, $3, $4)",
        [userId, id, url.link, formattedDate]
      );
    } catch (err) {
      console.log(err);
      reply.code(400).send("there is an error in the database");
    } finally {
      client.release();
    }
    return `${request.protocol}://${request.hostname}/${id}`;
  });

  fastify.get<{ Params: { id: string } }>(
    "/:id",
    async function (request, reply) {
      const client = await fastify.pg.connect();

      try {
        const userinfo = await client.query(
          "select original_url from urls where short_url = $1",
          [request.params.id]
        );
        const originalUrl = userinfo.rows[0].original_url;
        if (originalUrl) {
          return reply.redirect(originalUrl);
        }
      } catch (err) {
        reply.code(400).send("there is an error in the database");
      } finally {
        client.release();
      }
    }
  );

  fastify.get("/", async function (request, reply) {
    return { root: true };
  });
};

export default root;
