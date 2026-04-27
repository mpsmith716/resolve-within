import type { App } from "../index.js";
import type { FastifyRequest, FastifyReply } from "fastify";

interface CrisisResources {
  warning: string;
  resources: Array<{
    region: string;
    name: string;
    description: string;
    phone?: string;
    url?: string;
  }>;
}

export function registerCrisisRoutes(app: App) {
  // GET /api/crisis-resources - Get crisis resources
  app.fastify.get(
    "/api/crisis-resources",
    {
      schema: {
        description: "Get crisis support resources",
        tags: ["crisis"],
        response: {
          200: {
            type: "object",
            properties: {
              warning: { type: "string" },
              resources: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    region: { type: "string" },
                    name: { type: "string" },
                    description: { type: "string" },
                    phone: { type: "string" },
                    url: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, "Fetching crisis resources");

      const resources: CrisisResources = {
        warning: "If you are in immediate danger, contact emergency services.",
        resources: [
          {
            region: "United States",
            name: "988 Suicide & Crisis Lifeline",
            description: "Free and confidential support for people in suicidal crisis or emotional distress, 24/7",
            phone: "988",
          },
          {
            region: "International",
            name: "Find a Helpline",
            description: "International crisis support resources",
            url: "https://findahelpline.com",
          },
        ],
      };

      app.logger.info({}, "Crisis resources fetched");
      return resources;
    }
  );
}
