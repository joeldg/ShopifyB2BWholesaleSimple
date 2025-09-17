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
  Banner,
  Tabs,
  EmptyState,
  ResourceList,
  ResourceItem,
  Avatar,
  TextStyle,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useState, useCallback } from "react";
import { authenticate } from "../shopify.server";
// Temporarily disabled database queries - using memory session storage
// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  // Return empty data for now since we're using memory session storage
  // TODO: Set up database properly or implement alternative storage
  return json({ applications: [] });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("_action") as string;

  // Temporarily disabled database operations - using memory session storage
  // TODO: Set up database properly or implement alternative storage
  return json({ error: "Database operations temporarily disabled" }, { status: 503 });
};

export default function Applications() {
  const { applications, error } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = useCallback((selectedTabIndex) => {
    setSelectedTab(selectedTabIndex);
  }, []);

  const handleApprove = useCallback((applicationId) => {
    fetcher.submit(
      { _action: "approve", id: applicationId },
      { method: "post" }
    );
  }, [fetcher]);

  const handleReject = useCallback((applicationId) => {
    fetcher.submit(
      { _action: "reject", id: applicationId },
      { method: "post" }
    );
  }, [fetcher]);

  const handleDelete = useCallback((applicationId) => {
    if (confirm("Are you sure you want to delete this application?")) {
      fetcher.submit(
        { _action: "delete", id: applicationId },
        { method: "post" }
      );
    }
  }, [fetcher]);

  const pendingApplications = applications.filter(app => app.status === "pending");
  const approvedApplications = applications.filter(app => app.status === "approved");
  const rejectedApplications = applications.filter(app => app.status === "rejected");

  const tabs = [
    {
      id: 'pending',
      content: `Pending (${pendingApplications.length})`,
      panelID: 'pending-panel',
    },
    {
      id: 'approved',
      content: `Approved (${approvedApplications.length})`,
      panelID: 'approved-panel',
    },
    {
      id: 'rejected',
      content: `Rejected (${rejectedApplications.length})`,
      panelID: 'rejected-panel',
    },
  ];

  const renderApplicationItem = (application) => (
    <ResourceItem
      id={application.id}
      url="#"
      media={
        <Avatar
          customer
          size="medium"
          name={application.businessName || application.customerEmail}
        />
      }
      accessibilityLabel={`View details for ${application.businessName || application.customerEmail}`}
    >
      <InlineStack align="space-between">
        <BlockStack gap="200">
          <Text variant="bodyMd" fontWeight="bold" as="h3">
            {application.businessName || application.customerEmail}
          </Text>
          <div>{application.customerEmail}</div>
          <Text variant="bodySm" color="subdued">
            Applied: {new Date(application.createdAt).toLocaleDateString()}
          </Text>
        </BlockStack>
        <ButtonGroup>
          {application.status === "pending" && (
            <>
              <Button size="slim" onClick={() => handleApprove(application.id)}>
                Approve
              </Button>
              <Button size="slim" onClick={() => handleReject(application.id)}>
                Reject
              </Button>
            </>
          )}
          <Button size="slim" destructive onClick={() => handleDelete(application.id)}>
            Delete
          </Button>
        </ButtonGroup>
      </InlineStack>
    </ResourceItem>
  );

  const renderEmptyState = (status) => (
    <EmptyState
      heading={`No ${status} applications`}
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>There are no {status} wholesale applications at this time.</p>
    </EmptyState>
  );

  return (
    <Page>
      <TitleBar title="Wholesale Applications" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Wholesale Applications
              </Text>
              
              {error && (
                <Banner status="critical">
                  <p>{error}</p>
                </Banner>
              )}

              <Text as="p" variant="bodyMd" color="subdued">
                Review and manage wholesale applications from customers.
              </Text>

              <Tabs
                tabs={tabs}
                selected={selectedTab}
                onSelect={handleTabChange}
              >
                <div style={{ padding: '16px 0' }}>
                  {selectedTab === 0 && (
                    pendingApplications.length === 0 ? (
                      renderEmptyState("pending")
                    ) : (
                      <ResourceList
                        resourceName={{ singular: 'application', plural: 'applications' }}
                        items={pendingApplications}
                        renderItem={renderApplicationItem}
                      />
                    )
                  )}
                  
                  {selectedTab === 1 && (
                    approvedApplications.length === 0 ? (
                      renderEmptyState("approved")
                    ) : (
                      <ResourceList
                        resourceName={{ singular: 'application', plural: 'applications' }}
                        items={approvedApplications}
                        renderItem={renderApplicationItem}
                      />
                    )
                  )}
                  
                  {selectedTab === 2 && (
                    rejectedApplications.length === 0 ? (
                      renderEmptyState("rejected")
                    ) : (
                      <ResourceList
                        resourceName={{ singular: 'application', plural: 'applications' }}
                        items={rejectedApplications}
                        renderItem={renderApplicationItem}
                      />
                    )
                  )}
                </div>
              </Tabs>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
