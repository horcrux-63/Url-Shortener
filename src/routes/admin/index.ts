import { FastifyPluginAsync } from "fastify";

import { shortUrlDto, shortUrlDtoSchema } from "../../json-schema/user_schema";

const admin: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get("/", async function (request, reply) {
    let client = await fastify.pg.connect();
    let currentId = request.user;
    if (!currentId) {
      reply.code(401).send({ success: false, message: "unauthorize access" });
    }

    try {
      const userinfo = await client.query(
        "select * from userinfo where id = $1",
        [currentId]
      );
      if (userinfo.rows[0].role != "admin") {
        reply
          .code(401)
          .send({ success: false, message: "unauthorized access" });
      }
    } catch (err) {
      return err;
    } finally {
      client.release();
    }

    client = await fastify.pg.connect();

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

  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    {
      schema: {
        params: shortUrlDtoSchema,
      },
    },
    async function (request, reply) {
      let client = await fastify.pg.connect();

      const shortUrl = request.params as shortUrlDto;
      const currentUserId = request.user;

      if (!currentUserId) {
        reply.code(400).send({
          success: false,
          message: "unauthorized access",
        });
      }

      try {
        const userinfo = await client.query(
          "select * from userinfo where id = $1",
          [currentUserId]
        );
        if (userinfo.rows[0].role != "admin") {
          reply
            .code(401)
            .send({ success: false, message: "unauthorized access" });
        }
      } catch (err) {
        return err;
      } finally {
        client.release();
      }
      client = await fastify.pg.connect();

      try {
        const deleted = await client.query(
          "delete from urls where short_url =$1",
          [shortUrl.id]
        );
        if (deleted["rowCount"]) {
          return reply.code(200).send({
            success: true,
            message: "url deleted sucessfully",
          });
        } else {
          return reply.code(500).send({
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

export default admin;
