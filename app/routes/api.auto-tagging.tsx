import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticate } from "../shopify.server";
// import { PrismaClient } from "@prisma/client"; // Removed - using memory storage
import { AppError, ErrorCodes, createErrorResponse, validateRequired, handleRouteError } from "../lib/error-handling";
import { AutoTaggingService } from "../lib/auto-tagging";
import { metrics } from "../lib/monitoring";

// const prisma = new PrismaClient(); // Removed - using memory storage

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.admin(request);
    
    const autoTaggingRules = await prisma.autoTaggingRule.findMany({
      where: { shop: session.shop },
      orderBy: { createdAt: 'desc' },
    });
    
    // Add human-readable descriptions
    const rulesWithDescriptions = autoTaggingRules.map(rule => ({
      ...rule,
      description: AutoTaggingService.getRuleDescription(rule),
    }));
    
    metrics.record('auto_tagging_rules.fetched', rulesWithDescriptions.length);
    return json({ autoTaggingRules: rulesWithDescriptions });
  } catch (error) {
    metrics.record('auto_tagging_rules.fetch_error', 1);
    return handleRouteError(error);
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();
    const action = formData.get("_action") as string;

    switch (action) {
      case "create": {
        // Validate required fields
        validateRequired(formData.get("ruleName"), "Rule name");
        validateRequired(formData.get("criteriaType"), "Criteria type");
        validateRequired(formData.get("criteriaValue"), "Criteria value");
        validateRequired(formData.get("targetTag"), "Target tag");

        const autoTaggingRule = await AutoTaggingService.createRule(session.shop, {
          ruleName: formData.get("ruleName") as string,
          criteriaType: formData.get("criteriaType") as string,
          criteriaValue: parseFloat(formData.get("criteriaValue") as string),
          targetTag: formData.get("targetTag") as string,
        });
        
        metrics.record('auto_tagging_rules.created', 1);
        return json({ success: true, autoTaggingRule });
      }
      
      case "update": {
        const id = formData.get("id") as string;
        
        const autoTaggingRule = await prisma.autoTaggingRule.update({
          where: { id },
          data: {
            ruleName: formData.get("ruleName") as string,
            criteriaType: formData.get("criteriaType") as string,
            criteriaValue: parseFloat(formData.get("criteriaValue") as string),
            targetTag: formData.get("targetTag") as string,
            isActive: formData.get("isActive") === "true",
          },
        });
        
        return json({ success: true, autoTaggingRule });
      }
      
      case "delete": {
        const id = formData.get("id") as string;
        
        await prisma.autoTaggingRule.delete({
          where: { id },
        });
        
        return json({ success: true });
      }
      
      case "toggle": {
        const id = formData.get("id") as string;
        const isActive = formData.get("isActive") === "true";
        
        await prisma.autoTaggingRule.update({
          where: { id },
          data: { isActive },
        });
        
        return json({ success: true });
      }
      
      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in auto-tagging action:", error);
    return json({ error: "Failed to process request" }, { status: 500 });
  }
};

export default function AutoTaggingRules() {
  const { autoTaggingRules } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  return (
    <div>
      <h1>Auto-Tagging Rules</h1>
      <p>Automatically tag customers based on their behavior.</p>
      
      <div>
        <h2>Current Rules</h2>
        {autoTaggingRules.length === 0 ? (
          <p>No auto-tagging rules configured yet.</p>
        ) : (
          <ul>
            {autoTaggingRules.map((rule) => (
              <li key={rule.id}>
                <strong>{rule.ruleName}:</strong> If {rule.criteriaType} {rule.criteriaValue}, then tag "{rule.targetTag}"
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
