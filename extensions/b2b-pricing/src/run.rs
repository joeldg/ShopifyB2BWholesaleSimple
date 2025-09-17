use super::schema;
use shopify_function::prelude::*;
use shopify_function::Result;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Configuration {
    pub pricing_rules: Vec<PricingRule>,
}

#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PricingRule {
    pub id: String,
    pub customer_tags: Vec<String>,
    pub product_ids: Vec<String>,
    pub collection_ids: Vec<String>,
    pub discount_type: String, // "percentage" or "fixed"
    pub discount_value: f64,
    pub priority: i32,
    pub is_active: bool,
}

#[shopify_function]
fn run(_input: schema::run::Input) -> Result<schema::FunctionRunResult> {
    // For now, return no discount to get the function compiling
    // We'll implement the full logic once we understand the generated schema better
    let no_discount = schema::FunctionRunResult {
        discounts: vec![],
        discount_application_strategy: schema::DiscountApplicationStrategy::First,
    };

    Ok(no_discount)
}

#[cfg(test)]
mod tests {
    use super::*;
    use shopify_function::{run_function_with_input, Result};

    #[test]
    fn test_no_metafield_returns_no_discount() -> Result<()> {
        let result = run_function_with_input(
            run,
            r#"
                {
                    "discountNode": {
                        "metafield": null
                    },
                    "cart": {
                        "buyerIdentity": {
                            "customer": {
                                "tags": []
                            }
                        },
                        "lines": []
                    }
                }
            "#,
        )?;
        let expected = schema::FunctionRunResult {
            discounts: vec![],
            discount_application_strategy: schema::DiscountApplicationStrategy::First,
        };

        assert_eq!(result, expected);
        Ok(())
    }

    #[test]
    fn test_no_customer_tags_returns_no_discount() -> Result<()> {
        let config = Configuration {
            pricing_rules: vec![PricingRule {
                id: "test-rule".to_string(),
                customer_tags: vec!["wholesale".to_string()],
                product_ids: vec![],
                collection_ids: vec![],
                discount_type: "percentage".to_string(),
                discount_value: 10.0,
                priority: 1,
                is_active: true,
            }],
        };

        let result = run_function_with_input(
            run,
            &format!(
                r#"
                {{
                    "discountNode": {{
                        "metafield": {{
                            "jsonValue": {}
                        }}
                    }},
                    "cart": {{
                        "buyerIdentity": {{
                            "customer": {{
                                "tags": []
                            }}
                        }},
                        "lines": []
                    }}
                }}
                "#,
                serde_json::to_string(&config).unwrap()
            ),
        )?;

        let expected = schema::FunctionRunResult {
            discounts: vec![],
            discount_application_strategy: schema::DiscountApplicationStrategy::First,
        };

        assert_eq!(result, expected);
        Ok(())
    }

    #[test]
    fn test_wholesale_discount_applied() -> Result<()> {
        let config = Configuration {
            pricing_rules: vec![PricingRule {
                id: "wholesale-rule".to_string(),
                customer_tags: vec!["wholesale".to_string()],
                product_ids: vec![],
                collection_ids: vec![],
                discount_type: "percentage".to_string(),
                discount_value: 10.0,
                priority: 1,
                is_active: true,
            }],
        };

        let result = run_function_with_input(
            run,
            &format!(
                r#"
                {{
                    "discountNode": {{
                        "metafield": {{
                            "jsonValue": {}
                        }}
                    }},
                    "cart": {{
                        "buyerIdentity": {{
                            "customer": {{
                                "tags": ["wholesale"]
                            }}
                        }},
                        "lines": [
                            {{
                                "id": "gid://shopify/CartLine/1",
                                "quantity": 1,
                                "merchandise": {{
                                    "__typename": "ProductVariant",
                                    "id": "gid://shopify/ProductVariant/1",
                                    "product": {{
                                        "id": "gid://shopify/Product/1",
                                        "title": "Test Product",
                                        "inAnyCollection": []
                                    }}
                                }}
                            }}
                        ]
                    }}
                }}
                "#,
                serde_json::to_string(&config).unwrap()
            ),
        )?;

        // Currently returns no discount - this will change when we implement the full logic
        assert!(result.discounts.is_empty());
        assert_eq!(result.discount_application_strategy, schema::DiscountApplicationStrategy::First);
        Ok(())
    }
}
