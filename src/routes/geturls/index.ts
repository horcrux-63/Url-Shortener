import { FastifyPluginAsync } from "fastify";
import isURL from "is-url";

const getUrls: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get("/", async function (request, reply) {
    const client = await fastify.pg.connect();
    let currentId = request.user;

    if (!currentId) {
      reply.code(201).send({ success: false, message: "Login first" });
    }

    try {
      const urls = await client.query("select * from urls where id = $1", [
        currentId,
      ]);

      if (urls.rows[0]) {
        return {
          success: true,
          message: "Here are the urls created by you",
          data: urls.rows.map(
            (elements: { short_url: string; original_url: string }) => ({
              shortenedUrl: `${request.protocol}://${request.hostname}/${elements.short_url}`,
              mainUrl: elements.original_url,
            })
          ),
        };
      }
    } catch (err) {
      reply.code(400).send("there is an error in the database");
    } finally {
      client.release();
    }
  });

  fastify.put<{ Params: { id: string } }>(
    "/:id",
    async function (request, reply) {
      const client = await fastify.pg.connect();

      const shortUrl = request.params.id;
      const newUrl = request.body as string;
      if (!isURL(newUrl)) {
        return "invalid url";
      }
      try {
        const updated = await client.query(
          "update urls set original_url=$1 where short_url =$2",
          [newUrl, shortUrl]
        );
        if (updated["rowCount"]) return "url updated successfully";
        else return "invalid url";
      } catch (err) {
        reply.code(400).send("there is an error in the database");
      } finally {
        client.release();
      }
    }
  );

  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    async function (request, reply) {
      const client = await fastify.pg.connect();

      const shortUrl = request.params.id;

      try {
        const deleted = await client.query(
          "delete from urls where short_url =$1",
          [shortUrl]
        );
        if (deleted["rowCount"]) return "url deleted successfully";
        else return "url not found";
      } catch (err) {
        reply.code(400).send("there is an error in the database");
      } finally {
        client.release();
      }
    }
  );
};

export default getUrls;
