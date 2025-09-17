import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  try {
    const applications = await prisma.wholesaleApplication.findMany({
      where: { shop: session.shop },
      orderBy: { createdAt: 'desc' },
    });
    
    return json({ applications });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return json({ applications: [], error: "Failed to fetch applications" });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("_action") as string;

  try {
    switch (action) {
      case "approve": {
        const id = formData.get("id") as string;
        
        const application = await prisma.wholesaleApplication.update({
          where: { id },
          data: { 
            status: "approved",
            reviewedAt: new Date(),
            reviewedBy: session.shop, // In a real app, this would be the admin user ID
          },
        });
        
        // TODO: Add customer tag via Shopify API
        // This would require calling the Shopify Admin API to add the tag to the customer
        
        return json({ success: true, application });
      }
      
      case "reject": {
        const id = formData.get("id") as string;
        
        const application = await prisma.wholesaleApplication.update({
          where: { id },
          data: { 
            status: "rejected",
            reviewedAt: new Date(),
            reviewedBy: session.shop, // In a real app, this would be the admin user ID
          },
        });
        
        return json({ success: true, application });
      }
      
      case "delete": {
        const id = formData.get("id") as string;
        
        await prisma.wholesaleApplication.delete({
          where: { id },
        });
        
        return json({ success: true });
      }
      
      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in applications action:", error);
    return json({ error: "Failed to process request" }, { status: 500 });
  }
};

export default function Applications() {
  const { applications } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const pendingApplications = applications.filter(app => app.status === "pending");
  const approvedApplications = applications.filter(app => app.status === "approved");
  const rejectedApplications = applications.filter(app => app.status === "rejected");

  return (
    <div>
      <h1>Wholesale Applications</h1>
      <p>Review and manage wholesale applications from customers.</p>
      
      <div>
        <h2>Pending Applications ({pendingApplications.length})</h2>
        {pendingApplications.length === 0 ? (
          <p>No pending applications.</p>
        ) : (
          <ul>
            {pendingApplications.map((app) => (
              <li key={app.id}>
                <strong>{app.businessName || app.customerEmail}</strong>
                <p>Email: {app.customerEmail}</p>
                <p>Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
                <button
                  onClick={() => {
                    fetcher.submit(
                      { _action: "approve", id: app.id },
                      { method: "post" }
                    );
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    fetcher.submit(
                      { _action: "reject", id: app.id },
                      { method: "post" }
                    );
                  }}
                >
                  Reject
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2>Approved Applications ({approvedApplications.length})</h2>
        {approvedApplications.length === 0 ? (
          <p>No approved applications.</p>
        ) : (
          <ul>
            {approvedApplications.map((app) => (
              <li key={app.id}>
                <strong>{app.businessName || app.customerEmail}</strong>
                <p>Email: {app.customerEmail}</p>
                <p>Approved: {app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : 'Unknown'}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2>Rejected Applications ({rejectedApplications.length})</h2>
        {rejectedApplications.length === 0 ? (
          <p>No rejected applications.</p>
        ) : (
          <ul>
            {rejectedApplications.map((app) => (
              <li key={app.id}>
                <strong>{app.businessName || app.customerEmail}</strong>
                <p>Email: {app.customerEmail}</p>
                <p>Rejected: {app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : 'Unknown'}</p>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this application?")) {
                      fetcher.submit(
                        { _action: "delete", id: app.id },
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


