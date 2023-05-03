import * as bcrypt from "bcrypt";
import { FastifyPluginAsync } from "fastify";

interface User {
  userName: string;
  email: string;
  phone: string;
  password: string;
}

const register: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.post("/", async function (request, reply) {
    const user: User = request.body as User;

    const client = await fastify.pg.connect();
    const password = await bcrypt.hash(user.password, 10);
    if (user.password.length < 6) {
      return "minimum password length should be six";
    }
    try {
      await client.query(
        "INSERT INTO userinfo(username,email,phone,password) VALUES ($1, $2, $3, $4)",
        [user.userName, user.email, user.phone, password]
      );
    } catch (err) {
      reply.code(400).send("there is an error in the database");
    } finally {
      client.release();
    }

    return request.body;
  });
};

export default register;
