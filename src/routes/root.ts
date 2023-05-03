import { FastifyPluginAsync } from "fastify";
import { nanoid } from "nanoid/async";
import isURL = require("is-url");

interface Link {
  id: string;
  url: string;
}

const links: Record<string, Link> = {};
//const links = new Map<string, Link>();

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.post("/", async function (request, reply) {
    let url: string = request.body as string;

    if (!isURL(url)) {
      reply.status(400).send("Invalid URL");
      return;
    }

    let id = await nanoid(6);
    const link: Link = { id, url };
    links[id] = link;
    return `${request.protocol}://${request.hostname}/${id}`;
  });

  // fastify.post("/login", async function (request, reply) {
  //   const user: User = request.body as User;
  //   if (user.userName === "user" && user.password === "pass") {
  //     reply.send("login successful");
  //   }

  //   reply.status(404).send("invalid username and password");
  // });

  fastify.get<{ Params: { id: string } }>(
    "/:id",
    async function (request, reply) {
      const link = links[request.params.id];

      if (link) {
        return reply.redirect(link.url);
      }

      reply.status(404).send();
    }
  );

  fastify.get("/", async function (request, reply) {
    return { root: true };
  });
};

export default root;
