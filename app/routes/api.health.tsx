import { json, type LoaderFunctionArgs } from '@remix-run/node';

/**
 * Simple health check endpoint
 * Returns basic app status without complex dependencies
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Simple health check - just verify the app is running
    const health = {
      status: 'healthy',
      checks: {
        app: true,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    };
    
    return json(health, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return json({
      status: 'unhealthy',
      checks: {
        app: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date(),
    }, { status: 500 });
  }
}
