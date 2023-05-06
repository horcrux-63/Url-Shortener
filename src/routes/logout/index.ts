import fastifyPassport from "@fastify/passport";
import { FastifyPluginAsync } from "fastify";

const logout: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
  fastify.post(
    "/",
    {
      preValidation: fastifyPassport.authenticate(
        "local",
        { authInfo: false },
        async (request, _reply, _err, _user) => {
          request.logOut();
        }
      ),
    },
    async (_request, reply) => {
      return reply.code(200).send({
        message: "Successfully logged out",
      });
    }
  );
};

export default logout;
