# Dashboard Implementation Plan

## Overview
This document outlines the detailed plan for implementing comprehensive dashboards for each tab (Overview, Sales, Operations, HR, Clients) with relevant metrics, charts, and visualizations based on our database schema.

---

## 1. OVERVIEW DASHBOARD

### Purpose
High-level cross-module metrics and trends for quick business health check.

### Key Metrics Cards (Top Row)
1. **Tasks**
   - Total tasks
   - Completed count
   - Overdue count
   - Trend: % change from last period

2. **Leads**
   - Total leads
   - New leads (last 7 days)
   - Converted count
   - Trend: % change from last period

3. **Orders**
   - Total orders
   - Revenue (sum of order amounts)
   - Pending orders
   - Trend: % change from last period

4. **Applications (ATS)**
   - Total applications
   - New applications (last 7 days)
   - Interviews scheduled
   - Trend: % change from last period

### Visualizations

#### Chart 1: Activity Trend (Line Chart)
- **Data**: Daily activity count across all modules (tasks, leads, orders, applications)
- **X-axis**: Date (last 30 days)
- **Y-axis**: Count
- **Lines**: 4 lines (Tasks, Leads, Orders, Applications)
- **Purpose**: Show overall business activity trends

#### Chart 2: Module Distribution (Pie/Donut Chart)
- **Data**: Count of items by module
- **Segments**: Tasks, Leads, Orders, Applications, Quotations, Shipments
- **Purpose**: Visual breakdown of activity across modules

#### Chart 3: Status Overview (Bar Chart - Stacked)
- **Data**: Status distribution across key entities
- **Bars**: Tasks (by status), Leads (by status), Orders (by status)
- **Purpose**: Quick view of status distribution

#### Recent Activity Feed
- **Data**: `core.activity_events` (polymorphic)
- **Display**: Last 10-15 activities
- **Fields**: Entity type, action, user, timestamp
- **Purpose**: Real-time activity monitoring

---

## 2. SALES DASHBOARD

### Purpose
Sales pipeline performance, conversion metrics, and revenue tracking.

### Key Metrics Cards (Top Row)
1. **Leads**
   - Total leads
   - New leads (last 7 days)
   - Converted leads
   - Total pipeline value

2. **Opportunities**
   - Total opportunities
   - Open opportunities
   - Won opportunities
   - Total opportunity value

3. **Quotations**
   - Total quotations
   - Sent quotations
   - Approved quotations
   - Total quotation value

4. **Calls**
   - Total calls
   - Completed calls
   - Scheduled calls
   - Average call duration

### Visualizations

#### Chart 1: Sales Pipeline Funnel (Funnel/Bar Chart)
- **Data**: Leads → Opportunities → Quotations → Won
- **Stages**: 
  - Leads (total)
  - Opportunities (converted from leads)
  - Quotations (sent)
  - Won/Approved
- **Purpose**: Visualize conversion funnel

#### Chart 2: Revenue Trend (Area Chart)
- **Data**: Daily/weekly revenue from won opportunities and approved quotations
- **X-axis**: Date (date range)
- **Y-axis**: Revenue amount
- **Purpose**: Revenue growth trend

#### Chart 3: Lead Source Distribution (Pie Chart)
- **Data**: Leads grouped by `source` field
- **Segments**: Website, Referral, Cold Call, Event, Social, Other
- **Purpose**: Identify best lead sources

#### Chart 4: Sales Performance by Owner (Bar Chart)
- **Data**: Leads/Opportunities grouped by `owner_id`
- **X-axis**: Owner name
- **Y-axis**: Count and value
- **Purpose**: Sales rep performance

#### Chart 5: Conversion Rates (Progress Bars/Cards)
- **Metrics**:
  - Lead to Opportunity: (opportunities / leads) * 100
  - Opportunity to Won: (won / total opportunities) * 100
  - Quotation Approval: (approved / total quotations) * 100
- **Purpose**: Key conversion metrics

#### Chart 6: Quotation Status Timeline (Line Chart)
- **Data**: Quotations by status over time
- **Lines**: Draft, Sent, Approved, Rejected, Expired
- **Purpose**: Track quotation lifecycle

---

## 3. OPERATIONS DASHBOARD

### Purpose
Order fulfillment, shipment tracking, and operational efficiency.

### Key Metrics Cards (Top Row)
1. **Orders**
   - Total orders
   - Pending orders
   - Completed orders
   - Total revenue

2. **Quotations (Ops)**
   - Total quotations (all types)
   - Pending quotations
   - Approved quotations
   - Total quotation value

3. **Shipments**
   - Total shipments
   - In transit
   - Delivered
   - Pending

4. **Payments**
   - Total payments
   - Pending payments
   - Completed payments
   - Total amount

### Visualizations

#### Chart 1: Order Status Distribution (Donut Chart)
- **Data**: Orders grouped by status
- **Segments**: Pending, Processing, Completed, Cancelled, etc.
- **Purpose**: Order status overview

#### Chart 2: Shipment Status Timeline (Stacked Area Chart)
- **Data**: Shipments by status over time
- **Layers**: Pending, In Transit, Delivered, Returned, Cancelled
- **X-axis**: Date
- **Y-axis**: Count
- **Purpose**: Track shipment lifecycle

#### Chart 3: Quotation Types Breakdown (Bar Chart)
- **Data**: Quotations grouped by `quotation_type`
- **Types**: Factory, Freight, Client, Warehouse
- **X-axis**: Type
- **Y-axis**: Count and value
- **Purpose**: Understand quotation distribution

#### Chart 4: Shipment Types (Pie Chart)
- **Data**: Shipments grouped by `shipment_type`
- **Types**: Amazon India, Website India, Freight Forwarding
- **Purpose**: Shipment type distribution

#### Chart 5: Order Revenue Trend (Line Chart)
- **Data**: Daily order revenue
- **X-axis**: Date
- **Y-axis**: Revenue
- **Purpose**: Revenue trends

#### Chart 6: Payment Status (Progress Card)
- **Data**: Payment status breakdown
- **Metrics**: Pending vs Completed
- **Purpose**: Cash flow visibility

#### Chart 7: Order Fulfillment Rate (Gauge/Progress)
- **Metric**: (Completed Orders / Total Orders) * 100
- **Purpose**: Operational efficiency

---

## 4. HR DASHBOARD

### Purpose
Employee attendance, leave management, and workforce analytics.

### Key Metrics Cards (Top Row)
1. **Employees**
   - Total employees
   - Active employees
   - On leave (current)
   - New hires (this month)

2. **Attendance Today**
   - Present count
   - Absent count
   - Late arrivals
   - Attendance rate

3. **Leave Requests**
   - Total requests
   - Pending requests
   - Approved requests
   - Rejected requests

4. **Attendance Rate**
   - Overall attendance %
   - Present count
   - Late count
   - Trend from last period

### Visualizations

#### Chart 1: Attendance Trend (Line Chart)
- **Data**: Daily attendance over date range
- **Lines**: Present, Absent, Late
- **X-axis**: Date
- **Y-axis**: Count
- **Purpose**: Attendance patterns

#### Chart 2: Leave Request Status (Donut Chart)
- **Data**: Leave requests by status
- **Segments**: Pending, Approved, Rejected
- **Purpose**: Leave request overview

#### Chart 3: Attendance by Department (Bar Chart)
- **Data**: Attendance grouped by department
- **X-axis**: Department name
- **Y-axis**: Attendance rate %
- **Purpose**: Department-wise attendance

#### Chart 4: Leave Types Distribution (Pie Chart)
- **Data**: Leave requests by `leave_type`
- **Purpose**: Most common leave types

#### Chart 5: Monthly Attendance Calendar (Heatmap/Grid)
- **Data**: Daily attendance for current month
- **Visual**: Calendar grid with color coding
- **Purpose**: Visual attendance calendar

#### Chart 6: Attendance Rate Trend (Area Chart)
- **Data**: Daily attendance rate % over time
- **X-axis**: Date
- **Y-axis**: Attendance rate %
- **Purpose**: Attendance trend analysis

---

## 5. CLIENTS DASHBOARD

### Purpose
Client relationship metrics, company growth, and revenue by client.

### Key Metrics Cards (Top Row)
1. **Companies**
   - Total companies
   - Active companies (with recent activity)
   - New companies (last 30 days)
   - Top client revenue

2. **Contacts**
   - Total contacts
   - Active contacts
   - New contacts (last 30 days)
   - Contacts per company (avg)

3. **Client Leads**
   - Total leads
   - Active leads
   - Converted leads
   - Lead value

4. **Client Revenue**
   - Total revenue
   - This month revenue
   - Last month revenue
   - % change

### Visualizations

#### Chart 1: Client Growth Trend (Line Chart)
- **Data**: New companies and contacts over time
- **Lines**: New Companies, New Contacts
- **X-axis**: Date
- **Y-axis**: Count
- **Purpose**: Client acquisition trend

#### Chart 2: Top Clients by Revenue (Bar Chart - Horizontal)
- **Data**: Companies sorted by total revenue
- **X-axis**: Revenue amount
- **Y-axis**: Company name (top 10)
- **Purpose**: Identify top clients

#### Chart 3: Client Activity Distribution (Pie Chart)
- **Data**: Companies by activity status
- **Segments**: Active, Inactive, New
- **Purpose**: Client engagement overview

#### Chart 4: Revenue by Client (Bar Chart)
- **Data**: Revenue grouped by company
- **X-axis**: Company name
- **Y-axis**: Revenue amount
- **Purpose**: Revenue distribution

#### Chart 5: Lead Conversion by Client (Scatter/Bubble Chart)
- **Data**: Companies with lead count vs conversion rate
- **X-axis**: Total leads
- **Y-axis**: Conversion rate %
- **Bubble size**: Revenue
- **Purpose**: Identify high-value conversion patterns

#### Chart 6: Contact Distribution (Bar Chart)
- **Data**: Contacts per company
- **X-axis**: Company name
- **Y-axis**: Contact count
- **Purpose**: Relationship depth

---

## Implementation Notes

### Data Fetching
- All metrics should respect date range filter
- Use Supabase RPC functions for complex aggregations
- Cache frequently accessed data
- Implement loading states for all charts

### Chart Library
- Use **recharts** (already installed)
- Consider shadcn ChartContainer wrapper if available
- Ensure responsive design for all charts
- Use consistent color scheme from design system

### Performance
- Paginate large datasets
- Use server-side aggregation where possible
- Implement proper loading states
- Cache chart data appropriately

### Visual Design
- Follow shadcn design patterns
- Use Card components for all sections
- Consistent spacing and typography
- Responsive grid layouts
- Proper skeleton loaders

---

## Next Steps
1. ✅ Create dashboard structure with tabs
2. ✅ Add date range picker
3. ⏳ Implement Overview dashboard
4. ⏳ Implement Sales dashboard
5. ⏳ Implement Operations dashboard
6. ⏳ Implement HR dashboard
7. ⏳ Implement Clients dashboard
8. ⏳ Add real-time data fetching
9. ⏳ Add error handling and loading states
10. ⏳ Polish and optimize

