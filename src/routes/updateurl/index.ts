import { FastifyPluginAsync } from "fastify";
import {
  shortUrlDto,
  shortUrlDtoSchema,
  updateUrlDto,
  updateUrlDtoSchema,
} from "../../json-schema/user_schema";

const updateurl: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.put<{ Params: { id: string } }>(
    "/:id",
    {
      schema: {
        params: shortUrlDtoSchema,
        body: updateUrlDtoSchema,
      },
    },
    async function (request, reply) {
      const client = await fastify.pg.connect();

      const shortUrl = request.params as shortUrlDto;
      const newUrl = request.body as updateUrlDto;

      const currentUserId = request.user;

      if (!currentUserId) {
        reply.code(400).send({
          success: false,
          message: "login to update urls",
        });
      }

      try {
        const updated = await client.query(
          "update urls set short_url=$1 where short_url = $2 AND id = $3",
          [newUrl.alias, shortUrl.id, currentUserId]
        );

        if (updated["rowCount"]) {
          return reply.code(200).send({
            success: true,
            message: "url updated sucessfully",
          });
        } else {
          return reply.code(500).send({
            success: false,
            message: "No such url found",
          });
        }
      } catch (err) {
        return reply.code(401).send("something went wrong");
      } finally {
        client.release();
      }
    }
  );
};

export default updateurl;
