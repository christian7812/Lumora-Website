import { createSimpleRestDataProvider } from "@refinedev/rest/simple-rest";
import type { DataProvider } from "@refinedev/core";
import { API_URL } from "./constants";

class ApiResponseError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApiResponseError";
    this.statusCode = statusCode;
  }
}

async function throwApiError(response: Response): Promise<never> {
  const body: { message?: unknown } | undefined = await response
    .clone()
    .json()
    .catch(() => undefined);
  const message = typeof body?.message === "string"
    ? body.message
    : `Request failed with HTTP ${response.status}.`;
  throw new ApiResponseError(message, response.status);
}

const simpleRest = createSimpleRestDataProvider({
  apiURL: API_URL,
  kyOptions: {
    credentials: "include",
    hooks: {
      afterResponse: [
        async (_request, _options, response) => {
          if (!response.ok) await throwApiError(response);
        },
      ],
    },
  },
});

const restDataProvider = simpleRest.dataProvider;

export const dataProvider: DataProvider = {
  ...restDataProvider,
  getList: (params: Parameters<typeof restDataProvider.getList>[0]) =>
    restDataProvider.getList({
      ...params,
      resource: params.resource === "products"
        ? "products/admin"
        : params.resource === "categories"
          ? "categories/admin"
          : params.resource === "customers"
            ? "customers/admin"
            : params.resource === "contact"
              ? "contact/admin"
              : params.resource,
    }),
};

export const { kyInstance } = simpleRest;
