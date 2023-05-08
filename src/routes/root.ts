import { FastifyPluginAsync } from "fastify";
import { nanoid } from "nanoid/async";
import {
  CreateUrlDto,
  createUrlDtoSchema,
  getUrlDto,
  getUrlDtoSchema,
} from "../json-schema/user_schema";

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.post(
    "/",
    { schema: { body: createUrlDtoSchema } },
    async function (request, reply) {
      let url: CreateUrlDto = request.body as CreateUrlDto;
      const client = await fastify.pg.connect();

      const trustedUser = request.user ? true : false;

      if (!trustedUser && url.alias) {
        return reply.code(401).send({
          success: false,
          message: "login first to add cust0m alias",
        });
      }

      let id: string = trustedUser && url.alias ? url.alias : await nanoid(5);

      const date = new Date();
      const formattedDate = date.toISOString().slice(0, 10);
      const userId = request.user;

      try {
        if (trustedUser) {
          await client.query(
            "INSERT INTO urls(id,short_url,original_url,expired_date) VALUES ($1, $2, $3, $4)",
            [userId, id, url.link, formattedDate]
          );
        } else {
          await client.query(
            "INSERT INTO urls(short_url,original_url,expired_date) VALUES ($1, $2, $3)",
            [id, url.link, formattedDate]
          );
        }
      } catch (err) {
        return err;
      } finally {
        client.release();
      }
      const generatedUrl = `${request.protocol}://${request.hostname}/${id}`;
      return reply.code(200).send({
        success: true,
        message: "url generated successfully",
        url: generatedUrl,
      });
    }
  );

  fastify.get<{ Params: { id: string } }>(
    "/:id",
    { schema: { params: getUrlDtoSchema } },
    async function (request, reply) {
      const short = request.params as getUrlDto;
      if (!short) {
        reply.code(400).send({ success: false, message: "invalid url" });
      }
      const client = await fastify.pg.connect();
      try {
        const userinfo = await client.query(
          "select original_url from urls where short_url = $1",
          [short.id]
        );
        const originalUrl = userinfo.rows[0].original_url;
        if (originalUrl) {
          return reply.redirect(originalUrl);
        }
      } catch (err) {
        return err;
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
