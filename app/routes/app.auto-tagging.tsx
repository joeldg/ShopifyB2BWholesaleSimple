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
    const autoTaggingRules = await prisma.autoTaggingRule.findMany({
      where: { shop: session.shop },
      orderBy: { createdAt: 'desc' },
    });
    
    return json({ autoTaggingRules });
  } catch (error) {
    console.error("Error fetching auto-tagging rules:", error);
    return json({ autoTaggingRules: [], error: "Failed to fetch auto-tagging rules" });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("_action") as string;

  try {
    switch (action) {
      case "create": {
        const autoTaggingRule = await prisma.autoTaggingRule.create({
          data: {
            shop: session.shop,
            ruleName: formData.get("ruleName") as string,
            criteriaType: formData.get("criteriaType") as string,
            criteriaValue: parseFloat(formData.get("criteriaValue") as string),
            targetTag: formData.get("targetTag") as string,
            isActive: formData.get("isActive") === "true",
          },
        });
        
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
  const { autoTaggingRules, error } = useLoaderData<typeof loader>();
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
    if (confirm("Are you sure you want to delete this auto-tagging rule?")) {
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

  const criteriaTypeOptions = [
    { label: "Total Spend", value: "total_spend" },
    { label: "Order Count", value: "order_count" },
    { label: "Average Order Value", value: "average_order_value" },
  ];

  const rows = autoTaggingRules.map((rule) => [
    rule.ruleName,
    `${rule.criteriaType.replace('_', ' ')} ${rule.criteriaValue}`,
    rule.targetTag,
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
      <TitleBar title="Auto-Tagging Rules" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">
                  Auto-Tagging Rules
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

              <Text as="p" variant="bodyMd" color="subdued">
                Automatically tag customers based on their behavior and purchase history.
              </Text>

              {autoTaggingRules.length === 0 ? (
                <Text as="p" variant="bodyMd">
                  No auto-tagging rules configured yet. Create your first rule to get started.
                </Text>
              ) : (
                <DataTable
                  columnContentTypes={["text", "text", "text", "text", "text"]}
                  headings={["Rule Name", "Criteria", "Target Tag", "Status", "Actions"]}
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
        title={editingRule ? "Edit Auto-Tagging Rule" : "Create Auto-Tagging Rule"}
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
              label="Rule Name"
              value={editingRule?.ruleName || ""}
              onChange={() => {}}
              helpText="A descriptive name for this rule"
            />
            <Select
              label="Criteria Type"
              options={criteriaTypeOptions}
              value={editingRule?.criteriaType || "total_spend"}
              onChange={() => {}}
            />
            <TextField
              label="Criteria Value"
              type="number"
              value={editingRule?.criteriaValue?.toString() || ""}
              onChange={() => {}}
              helpText="The threshold value (e.g., 1000 for $1000 total spend)"
            />
            <TextField
              label="Target Tag"
              value={editingRule?.targetTag || ""}
              onChange={() => {}}
              helpText="The tag to apply when criteria is met"
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


