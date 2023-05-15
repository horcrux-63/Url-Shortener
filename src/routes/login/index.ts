import fastifyPassport from "@fastify/passport";
import { FastifyPluginAsync } from "fastify";

import { loginUserDtoSchema } from "../../json-schema/user_schema";

const login: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get("/", async function (request, reply) {
    return "login Page";
  });
  fastify.post(
    "/",
    {
      schema: { body: loginUserDtoSchema },
      preValidation: fastifyPassport.authenticate(
        "local",
        {
          authInfo: false,
        },
        async (request, reply, _, user) => {
          // if (request.user) {
          //   reply.code(401).send({
          //     success: false,
          //     message: "logout first",
          //   });
          // }
          if (!user) {
            return reply
              .code(400)
              .send({ massage: "Invalid Email or Password" });
          }
          request.login(user);
        }
      ),
    },
    async function (request, reply) {
      return reply.code(200).send({
        message: "Successfully logged in",
      });
    }
  );
};

export default login;
