import * as bcrypt from "bcrypt";
import { FastifyPluginAsync } from "fastify";

import {
  CreateUserDto,
  createUserDtoSchema,
} from "../../json-schema/user_schema";

const register: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.post(
    "/",
    { schema: { body: createUserDtoSchema } },
    async function (request, reply) {
      const user: CreateUserDto = request.body as CreateUserDto;

      const client = await fastify.pg.connect();
      const password = await bcrypt.hash(user.password, 10);

      if (user.password != user.confirm_password) {
        return "password doesnt match";
      }
      try {
        await client.query(
          "INSERT INTO userinfo(email,password) VALUES ($1, $2)",
          [user.email, password]
        );
      } catch (err) {
        reply.code(400).send("there is an error in the database");
      } finally {
        client.release();
      }

      return request.body;
    }
  );
};

export default register;
