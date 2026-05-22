/** Mock Copilot reply (markdown) for the “send” flow in `AIAgentSidebar`. */
export const ASSISTANT_MOCK_REPLY = `## How to change prices for customers in a specific plan

Based on the documentation, changing a **plan's price** affects **only new subscriptions**. Existing customers on that plan **keep their old price** unless you update their subscriptions separately.

### Recommended approach

1. **Update the plan price for future customers**
   - Go to [Plans](#)
   - Open the plan and its price point, then edit the price
   - This applies to **new subscriptions only**

2. **Update existing customers on that plan**
   - For one customer: go to [Subscriptions](#) → open the subscription → **Edit Subscription**
   - Override the unit price at the subscription level

3. **For many customers on the same plan, use bulk update**
   - Go to [Import & Export Data](#)
   - Then open [Choose a bulk operation](#)
   - Use **Subscriptions > Update Subscription for items**
   - Filter subscriptions for the target plan from [Subscriptions](#), export them, update the CSV, and use \`plan_unit_price\`

### Important prerequisite

If price override is not available, enable it here:
- [Price override](#)

### Important notes

- Plan price changes affect **future signups only**
- Existing subscriptions need **subscription-level override**
- Bulk update is the recommended approach for **all customers in one plan**
- Mid-term changes may create **proration credits/charges** depending on setup
- Docs note price override applies to **flat-fee** or **per-unit** plans

## Related documentation

- [Will a new plan price affect the existing subscriptions?](#)
- [How to change plan pricing in Product Catalog?](#)
- [I am not able to change the price of an existing subscription](#)
- [How to perform a bulk operation to override subscription price for a specific plan?](#)

If you want, I can next turn this into a **step-by-step runbook for your exact dashboard flow**.`;
