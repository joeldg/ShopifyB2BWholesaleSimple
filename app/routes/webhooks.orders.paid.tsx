import { json, type ActionFunctionArgs } from '@remix-run/node';
import { authenticate } from '../shopify.server';
import { AutoTaggingService } from '../lib/auto-tagging';

/**
 * Webhook handler for order paid events
 * Triggers auto-tagging when a customer completes a purchase
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const { topic, shop, session, payload } = await authenticate.webhook(request);

    if (topic !== 'orders/paid') {
      return json({ success: false, error: 'Invalid topic' }, { status: 400 });
    }

    const order = payload as any;
    const customerId = order.customer?.id;

    if (!customerId) {
      // Guest checkout - no customer to tag
      return json({ success: true, message: 'No customer to process' });
    }

    // Get customer data from Shopify
    const customerData = await AutoTaggingService.getCustomerData(shop, customerId.toString());
    
    if (!customerData) {
      return json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    // Process auto-tagging rules
    const newTags = await AutoTaggingService.processCustomer(shop, customerData);
    
    if (newTags.length > 0) {
      // Apply new tags to customer
      const success = await AutoTaggingService.applyTagsToCustomer(
        shop,
        customerId.toString(),
        newTags
      );
      
      if (success) {
        console.log(`Applied tags ${newTags.join(', ')} to customer ${customerId} in shop ${shop}`);
        return json({ 
          success: true, 
          message: `Applied tags: ${newTags.join(', ')}`,
          tags: newTags
        });
      } else {
        return json({ 
          success: false, 
          error: 'Failed to apply tags to customer' 
        }, { status: 500 });
      }
    }

    return json({ 
      success: true, 
      message: 'No new tags to apply' 
    });

  } catch (error) {
    console.error('Auto-tagging webhook error:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}


