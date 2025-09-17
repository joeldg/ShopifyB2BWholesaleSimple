import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { PrismaClient } from "@prisma/client";
import { AppError, ErrorCodes, createErrorResponse, validateRequired, validateDiscountValue, validateCustomerTags, handleRouteError } from "../lib/error-handling";
import { measurePerformance, metrics } from "../lib/monitoring";

const prisma = new PrismaClient();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.admin(request);
    
    const pricingRules = await prisma.pricingRule.findMany({
      where: { shop: session.shop },
      orderBy: { priority: 'desc' },
    });
    
    metrics.record('pricing_rules.fetched', pricingRules.length);
    return json({ pricingRules });
  } catch (error) {
    metrics.record('pricing_rules.fetch_error', 1);
    return handleRouteError(error);
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("_action") as string;

  try {
    switch (action) {
      case "create": {
        const customerTags = JSON.parse(formData.get("customerTags") as string || "[]");
        const productIds = JSON.parse(formData.get("productIds") as string || "[]");
        const collectionIds = JSON.parse(formData.get("collectionIds") as string || "[]");
        
        const pricingRule = await prisma.pricingRule.create({
          data: {
            shop: session.shop,
            customerTags,
            productIds,
            collectionIds,
            discountType: formData.get("discountType") as string,
            discountValue: parseFloat(formData.get("discountValue") as string),
            priority: parseInt(formData.get("priority") as string) || 0,
            isActive: formData.get("isActive") === "true",
          },
        });
        
        return json({ success: true, pricingRule });
      }
      
      case "update": {
        const id = formData.get("id") as string;
        const customerTags = JSON.parse(formData.get("customerTags") as string || "[]");
        const productIds = JSON.parse(formData.get("productIds") as string || "[]");
        const collectionIds = JSON.parse(formData.get("collectionIds") as string || "[]");
        
        const pricingRule = await prisma.pricingRule.update({
          where: { id },
          data: {
            customerTags,
            productIds,
            collectionIds,
            discountType: formData.get("discountType") as string,
            discountValue: parseFloat(formData.get("discountValue") as string),
            priority: parseInt(formData.get("priority") as string) || 0,
            isActive: formData.get("isActive") === "true",
          },
        });
        
        return json({ success: true, pricingRule });
      }
      
      case "delete": {
        const id = formData.get("id") as string;
        
        await prisma.pricingRule.delete({
          where: { id },
        });
        
        return json({ success: true });
      }
      
      case "toggle": {
        const id = formData.get("id") as string;
        const isActive = formData.get("isActive") === "true";
        
        await prisma.pricingRule.update({
          where: { id },
          data: { isActive },
        });
        
        return json({ success: true });
      }
      
      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in pricing rules action:", error);
    return json({ error: "Failed to process request" }, { status: 500 });
  }
};

export default function PricingRules() {
  const { pricingRules } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  return (
    <div>
      <h1>Pricing Rules</h1>
      <p>Manage your B2B pricing rules here.</p>
      
      {/* This will be replaced with proper Polaris components */}
      <div>
        <h2>Current Rules</h2>
        {pricingRules.length === 0 ? (
          <p>No pricing rules configured yet.</p>
        ) : (
          <ul>
            {pricingRules.map((rule) => (
              <li key={rule.id}>
                <strong>Rule:</strong> {rule.customerTags.join(", ")} - {rule.discountType} {rule.discountValue}
                <button
                  onClick={() => {
                    fetcher.submit(
                      {
                        _action: "toggle",
                        id: rule.id,
                        isActive: (!rule.isActive).toString(),
                      },
                      { method: "post" }
                    );
                  }}
                >
                  {rule.isActive ? "Disable" : "Enable"}
                </button>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this rule?")) {
                      fetcher.submit(
                        { _action: "delete", id: rule.id },
                        { method: "post" }
                      );
                    }
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
