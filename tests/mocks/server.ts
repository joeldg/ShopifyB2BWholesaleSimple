import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Mock Shopify GraphQL API
const handlers = [
  http.post('https://test-shop.myshopify.com/admin/api/2024-01/graphql.json', () => {
    return HttpResponse.json({
      data: {
        // Mock GraphQL responses here
      },
    });
  }),
]

export const server = setupServer(...handlers)
