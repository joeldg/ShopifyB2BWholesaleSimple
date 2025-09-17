import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  DataTable,
  Badge,
  ButtonGroup,
  Modal,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useState, useCallback } from "react";
import { authenticate } from "../shopify.server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  try {
    const pricingRules = await prisma.pricingRule.findMany({
      where: { shop: session.shop },
      orderBy: { priority: 'desc' },
    });
    
    return json({ pricingRules });
  } catch (error) {
    console.error("Error fetching pricing rules:", error);
    return json({ pricingRules: [], error: "Failed to fetch pricing rules" });
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
  const { pricingRules, error } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [modalActive, setModalActive] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const handleModalClose = useCallback(() => {
    setModalActive(false);
    setEditingRule(null);
  }, []);

  const handleCreateRule = useCallback(() => {
    setEditingRule(null);
    setModalActive(true);
  }, []);

  const handleEditRule = useCallback((rule) => {
    setEditingRule(rule);
    setModalActive(true);
  }, []);

  const handleDeleteRule = useCallback((ruleId) => {
    if (confirm("Are you sure you want to delete this pricing rule?")) {
      fetcher.submit(
        { _action: "delete", id: ruleId },
        { method: "post" }
      );
    }
  }, [fetcher]);

  const handleToggleRule = useCallback((rule) => {
    fetcher.submit(
      {
        _action: "toggle",
        id: rule.id,
        isActive: (!rule.isActive).toString(),
      },
      { method: "post" }
    );
  }, [fetcher]);

  const rows = pricingRules.map((rule) => [
    rule.customerTags.join(", ") || "All customers",
    rule.discountType === "percentage" ? `${rule.discountValue}%` : `$${rule.discountValue}`,
    rule.priority,
    <Badge status={rule.isActive ? "success" : "critical"}>
      {rule.isActive ? "Active" : "Inactive"}
    </Badge>,
    <ButtonGroup>
      <Button size="slim" onClick={() => handleEditRule(rule)}>
        Edit
      </Button>
      <Button size="slim" onClick={() => handleToggleRule(rule)}>
        {rule.isActive ? "Disable" : "Enable"}
      </Button>
      <Button size="slim" destructive onClick={() => handleDeleteRule(rule.id)}>
        Delete
      </Button>
    </ButtonGroup>,
  ]);

  return (
    <Page>
      <TitleBar title="Pricing Rules" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">
                  B2B Pricing Rules
                </Text>
                <Button primary onClick={handleCreateRule}>
                  Create Rule
                </Button>
              </InlineStack>
              
              {error && (
                <Banner status="critical">
                  <p>{error}</p>
                </Banner>
              )}

              {pricingRules.length === 0 ? (
                <Text as="p" variant="bodyMd">
                  No pricing rules configured yet. Create your first rule to get started.
                </Text>
              ) : (
                <DataTable
                  columnContentTypes={["text", "text", "numeric", "text", "text"]}
                  headings={["Customer Tags", "Discount", "Priority", "Status", "Actions"]}
                  rows={rows}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
        open={modalActive}
        onClose={handleModalClose}
        title={editingRule ? "Edit Pricing Rule" : "Create Pricing Rule"}
        primaryAction={{
          content: editingRule ? "Update Rule" : "Create Rule",
          onAction: () => {
            // Handle form submission
            handleModalClose();
          },
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleModalClose,
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Customer Tags (comma-separated)"
              value={editingRule?.customerTags?.join(", ") || ""}
              onChange={() => {}}
              helpText="Leave empty to apply to all customers"
            />
            <Select
              label="Discount Type"
              options={[
                { label: "Percentage", value: "percentage" },
                { label: "Fixed Amount", value: "fixed" },
              ]}
              value={editingRule?.discountType || "percentage"}
              onChange={() => {}}
            />
            <TextField
              label="Discount Value"
              type="number"
              value={editingRule?.discountValue?.toString() || ""}
              onChange={() => {}}
              helpText="Enter percentage (e.g., 10) or fixed amount (e.g., 5.00)"
            />
            <TextField
              label="Priority"
              type="number"
              value={editingRule?.priority?.toString() || "0"}
              onChange={() => {}}
              helpText="Higher numbers have higher priority"
            />
            <Checkbox
              label="Active"
              checked={editingRule?.isActive ?? true}
              onChange={() => {}}
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}


