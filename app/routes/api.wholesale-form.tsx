import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // This endpoint can be used to render the form or get shop information
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  return json({ shop });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  
  try {
    const application = await prisma.wholesaleApplication.create({
      data: {
        shop: formData.get("shop") as string,
        customerId: formData.get("customerId") as string || null,
        customerEmail: formData.get("customerEmail") as string,
        businessName: formData.get("businessName") as string || null,
        applicationData: JSON.stringify({
          companySize: formData.get("companySize"),
          industry: formData.get("industry"),
          expectedVolume: formData.get("expectedVolume"),
          notes: formData.get("notes"),
        }),
        status: "pending",
      },
    });
    
    return json({ 
      success: true, 
      message: "Application submitted successfully! We'll review it and get back to you soon.",
      applicationId: application.id 
    });
  } catch (error) {
    console.error("Error creating wholesale application:", error);
    return json({ 
      success: false, 
      error: "Failed to submit application. Please try again." 
    }, { status: 500 });
  }
};

export default function WholesaleForm() {
  const { shop } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  if (actionData?.success) {
    return (
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          background: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          padding: '15px',
          marginBottom: '20px',
          color: '#155724'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Application Submitted!</h3>
          <p style={{ margin: 0 }}>{actionData.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
        Wholesale Application
      </h2>
      
      {actionData?.error && (
        <div style={{
          background: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          padding: '15px',
          marginBottom: '20px',
          color: '#721c24'
        }}>
          {actionData.error}
        </div>
      )}

      <form method="post" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <input type="hidden" name="shop" value={shop || ''} />
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Email Address *
          </label>
          <input
            type="email"
            name="customerEmail"
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Business Name
          </label>
          <input
            type="text"
            name="businessName"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Company Size
          </label>
          <select
            name="companySize"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          >
            <option value="">Select company size</option>
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201-500">201-500 employees</option>
            <option value="500+">500+ employees</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Industry
          </label>
          <input
            type="text"
            name="industry"
            placeholder="e.g., Retail, E-commerce, Manufacturing"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Expected Monthly Volume
          </label>
          <select
            name="expectedVolume"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          >
            <option value="">Select expected volume</option>
            <option value="under-1k">Under $1,000</option>
            <option value="1k-5k">$1,000 - $5,000</option>
            <option value="5k-10k">$5,000 - $10,000</option>
            <option value="10k-25k">$10,000 - $25,000</option>
            <option value="25k-50k">$25,000 - $50,000</option>
            <option value="50k+">$50,000+</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Additional Notes
          </label>
          <textarea
            name="notes"
            rows={4}
            placeholder="Tell us more about your business and wholesale needs..."
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              resize: 'vertical'
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            background: '#007cba',
            color: 'white',
            padding: '15px 30px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = '#005a87'}
          onMouseOut={(e) => e.target.style.background = '#007cba'}
        >
          Submit Application
        </button>
      </form>
    </div>
  );
}


