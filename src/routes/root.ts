import { FastifyPluginAsync } from "fastify";
import { nanoid } from "nanoid/async";
import { expire } from "../expiration";
import {
  CreateUrlDto,
  createUrlDtoSchema,
  getUrlDto,
  getUrlDtoSchema,
} from "../json-schema/user_schema";

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.post(
    "/",

    {
      preHandler: fastify.rateLimit({
        max: async (request, key) => {
          if (request.user) return 10;
          return 5;
        },
        timeWindow: "1 day",
      }),
      schema: { body: createUrlDtoSchema },
    },
    async function (request, reply) {
      let url: CreateUrlDto = request.body as CreateUrlDto;
      const client = await fastify.pg.connect();

      const trustedUser = request.user ? true : false;

      // return request.user;

      if (!trustedUser && url.alias) {
        return reply.code(401).send({
          success: false,
          message: "login first to add custom alias",
        });
      }

      let id: string = trustedUser && url.alias ? url.alias : await nanoid(5);
      const userId = request.user;

      try {
        if (trustedUser) {
          await client.query(
            "INSERT INTO urls(id,short_url,original_url) VALUES ($1, $2, $3)",
            [userId, id, url.link]
          );
          if (url.expire) {
            expire.add(id, { key: id }, { delay: url.expire * 1000 });
          }
        } else {
          await client.query(
            "INSERT INTO urls(short_url,original_url) VALUES ($1, $2)",
            [id, url.link]
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
