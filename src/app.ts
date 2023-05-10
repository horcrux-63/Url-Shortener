import AutoLoad, { AutoloadPluginOptions } from "@fastify/autoload";
import fastifyPassport from "@fastify/passport";
import { fastifyPostgres } from "@fastify/postgres";
import { fastifySecureSession } from "@fastify/secure-session";
import * as dotenv from "dotenv";
import { FastifyPluginAsync } from "fastify";
import * as fs from "fs";
import { join } from "path";
import { configurePassport } from "./configs/passport";
import { schedule } from "./expiration";
dotenv.config();

export type AppOptions = {
  // Place your custom options for app below here.
} & Partial<AutoloadPluginOptions>;

// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {};

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  // Place here your custom code!
  fastify.register(fastifyPostgres, {
    connectionString: process.env.SECURED_PASSWORD,
  });

  void fastify.register(fastifySecureSession, {
    key: fs.readFileSync(join(__dirname, "secret-key")),
  });
  void fastify.register(fastifyPassport.initialize());
  void fastify.register(fastifyPassport.secureSession());

  configurePassport(fastify, opts);

  schedule(fastify, opts);
  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  void fastify.register(AutoLoad, {
    dir: join(__dirname, "plugins"),
    options: opts,
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  void fastify.register(AutoLoad, {
    dir: join(__dirname, "routes"),
    options: opts,
  });
};

export default app;
export { app, options };
