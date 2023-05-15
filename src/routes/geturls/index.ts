import { FastifyPluginAsync } from "fastify";

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
      } else {
        reply.code(201).send({ message: "You are yet to create an url" });
      }
    } catch (err) {
      return err;
    } finally {
      client.release();
    }
  });
};

export default getUrls;
