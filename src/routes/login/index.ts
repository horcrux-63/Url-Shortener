import * as bcrypt from "bcrypt";
import { FastifyPluginAsync } from "fastify";

interface User {
  userName: string;
  password: string;
}

const login: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.post("/", async function (request, reply) {
    const user: User = request.body as User;

    const client = await fastify.pg.connect();
    try {
      const userinfo = await client.query(
        "select password from userinfo where username = $1",
        [user.userName]
      );
      const givenPassword = userinfo.rows[0].password;

      const check = await bcrypt.compare(user.password, givenPassword);
      if (check === false) {
        return reply.code(500).send("password does not match");
      } else {
        return "login succesful";
      }
    } catch (err) {
      reply.code(400).send("there is an error in the database");
    } finally {
      client.release();
    }
  });
};

export default login;
