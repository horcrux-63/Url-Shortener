import { FastifyPluginAsync } from "fastify";
import { shortUrlDto, shortUrlDtoSchema } from "../../json-schema/user_schema";

const deleteurl: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    {
      schema: {
        params: shortUrlDtoSchema,
      },
    },
    async function (request, reply) {
      const client = await fastify.pg.connect();

      const shortUrl = request.params as shortUrlDto;
      const currentUserId = request.user;

      if (!currentUserId) {
        reply.code(400).send({
          success: false,
          message: "login to delete urls",
        });
      }
      try {
        const deleted = await client.query(
          "delete from urls where short_url =$1 AND id = $2",
          [shortUrl.id, currentUserId]
        );
        if (deleted["rowCount"]) {
          return reply.code(200).send({
            success: true,
            message: "url deleted sucessfully",
          });
        } else {
          return reply.code(401).send({
            success: false,
            message: "No such url found",
          });
        }
      } catch (err) {
        return err;
      } finally {
        client.release();
      }
    }
  );
};

export default deleteurl;
