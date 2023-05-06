import type { FromSchema, JSONSchema } from "json-schema-to-ts";

export const createUserDtoSchema = {
  type: "object",
  properties: {
    email: { type: "string", pattern: "@", maxLength: 255, minLength: 6 },
    password: { type: "string", maxLength: 255, minLength: 8 },
    confirm_password: { type: "string", maxLength: 255, minLength: 8 },
  },
  required: ["email", "password", "confirm_password"],
  maxProperties: 3,
  additionalProperties: false,
} as const satisfies JSONSchema;

export const loginUserDtoSchema = {
  type: "object",
  properties: {
    email: createUserDtoSchema.properties.email,
    password: createUserDtoSchema.properties.password,
  },
  required: ["email", "password"],
  maxProperties: 2,
  additionalProperties: false,
} as const satisfies JSONSchema;

export type CreateUserDto = FromSchema<typeof createUserDtoSchema>;
export type LoginUserDto = FromSchema<typeof loginUserDtoSchema>;
