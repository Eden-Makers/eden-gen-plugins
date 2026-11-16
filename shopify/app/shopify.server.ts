export interface AdminClient {
  graphql(query: string, options?: { variables?: Record<string, unknown> }): Promise<{ json(): Promise<GraphqlResult> }>;
}

export interface GraphqlResult {
  data?: Record<string, unknown>;
  errors?: Array<{ message: string }>;
}

/**
 * The official Remix template replaces this file with `shopifyApp` from
 * `@shopify/shopify-app-remix/server`. The route in `app/routes/app.generate.tsx`
 * only needs `authenticate.admin(request)`.
 */
export const authenticate = {
  admin: async (_request: Request): Promise<{ admin: AdminClient; session: { shop: string } }> => {
    throw new Error("Wire @shopify/shopify-app-remix authenticate.admin before running the embedded app. See README.");
  },
};
