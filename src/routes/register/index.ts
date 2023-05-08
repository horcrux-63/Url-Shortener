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

      if (user.password !== user.confirm_password) {
        return reply
          .code(400)
          .send({ success: false, message: "Password Didn't Match" });
      }
      try {
        await client.query(
          "INSERT INTO userinfo(email,password,role) VALUES ($1, $2, $3)",
          [user.email, password, "user"]
        );
      } catch (err) {
        return err;
      } finally {
        client.release();
      }
      return reply
        .code(200)
        .send({ success: true, message: "Registration Complete" });
    }
  );
};

export default register;
