-- ============================================================================
-- Comprehensive Seed Data with DiceBear Micah Avatars
-- Company OS: Complete sample data across all schemas for UI development
-- ============================================================================

BEGIN;

-- Helper function to generate DiceBear Micah avatar URL
CREATE OR REPLACE FUNCTION get_dicebear_avatar(seed TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN 'https://api.dicebear.com/7.x/micah/svg?seed=' || seed;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 1. Update existing profiles with DiceBear avatars
-- ============================================================================

UPDATE core.profiles
SET avatar_url = get_dicebear_avatar(COALESCE(email, user_id, id::text))
WHERE avatar_url IS NULL;

-- ============================================================================
-- 2. CORE SCHEMA - Contacts and Companies
-- ============================================================================

-- Contacts (person type)
INSERT INTO core.contacts (name, email, phone, contact_type, notes) VALUES
  ('Alice Cooper', 'alice.cooper@email.com', '+1-555-2001', 'person', 'Decision maker at Acme Corp'),
  ('Bob Williams', 'bob.williams@email.com', '+1-555-2002', 'person', 'Technical contact'),
  ('Carol White', 'carol.white@email.com', '+1-555-2003', 'person', 'Procurement manager'),
  ('Daniel Black', 'daniel.black@email.com', '+1-555-2004', 'person', 'Sales director'),
  ('Eva Green', 'eva.green@email.com', '+1-555-2005', 'person', 'Operations lead'),
  ('Frank Blue', 'frank.blue@email.com', '+1-555-2006', 'person', 'Finance contact'),
  ('Grace Red', 'grace.red@email.com', '+1-555-2007', 'person', 'Marketing head'),
  ('Henry Brown', 'henry.brown@email.com', '+1-555-2008', 'person', 'CTO'),
  ('Ivy Purple', 'ivy.purple@email.com', '+1-555-2009', 'person', 'Product manager'),
  ('Jack Orange', 'jack.orange@email.com', '+1-555-2010', 'person', 'Business development')
ON CONFLICT DO NOTHING;

-- Organization contacts
INSERT INTO core.contacts (name, email, phone, contact_type, notes) VALUES
  ('Acme Corporation', 'contact@acme.com', '+1-555-1001', 'organization', 'Major client'),
  ('TechStart Inc', 'info@techstart.com', '+1-555-1002', 'organization', 'Tech startup'),
  ('Global Industries', 'sales@global.com', '+1-555-1003', 'organization', 'International client'),
  ('RetailMax', 'info@retailmax.com', '+1-555-1004', 'organization', 'E-commerce leader'),
  ('ServicePro', 'contact@servicepro.com', '+1-555-1005', 'organization', 'Professional services')
ON CONFLICT DO NOTHING;

-- Companies
DO $$
DECLARE
  company_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  INSERT INTO core.companies (name, legal_name, tax_id, website, industry, notes) VALUES
    ('Acme Corporation', 'Acme Corporation LLC', 'TAX-001', 'https://acme.com', 'Technology', 'Major enterprise client'),
    ('TechStart Inc', 'TechStart Incorporated', 'TAX-002', 'https://techstart.com', 'Software', 'Fast-growing startup'),
    ('Global Industries', 'Global Industries Ltd', 'TAX-003', 'https://global.com', 'Manufacturing', 'International operations'),
    ('RetailMax', 'RetailMax Corporation', 'TAX-004', 'https://retailmax.com', 'Retail', 'E-commerce leader'),
    ('ServicePro', 'ServicePro LLC', 'TAX-005', 'https://servicepro.com', 'Services', 'Professional services'),
    ('InnovateCo', 'InnovateCo Inc', 'TAX-006', 'https://innovateco.com', 'Technology', 'Innovation leader'),
    ('MegaCorp', 'MegaCorp International', 'TAX-007', 'https://megacorp.com', 'Conglomerate', 'Large enterprise')
  ON CONFLICT DO NOTHING;
  
  SELECT ARRAY_AGG(id) INTO company_ids FROM core.companies LIMIT 10;
END $$;

-- Company Contacts
INSERT INTO core.company_contacts (company_id, contact_id, role, is_primary)
SELECT 
  c.id,
  ct.id,
  CASE (ROW_NUMBER() OVER (PARTITION BY c.id) % 3)
    WHEN 0 THEN 'owner'
    WHEN 1 THEN 'manager'
    ELSE 'contact'
  END,
  (ROW_NUMBER() OVER (PARTITION BY c.id) = 1)
FROM core.companies c
CROSS JOIN LATERAL (
  SELECT id FROM core.contacts 
  WHERE contact_type = 'person' 
  ORDER BY RANDOM() 
  LIMIT 2
) ct
WHERE NOT EXISTS (
  SELECT 1 FROM core.company_contacts 
  WHERE company_id = c.id AND contact_id = ct.id
)
LIMIT 20;

-- ============================================================================
-- 3. CRM SCHEMA - Sales Data
-- ============================================================================

DO $$
DECLARE
  all_vertical_id UUID;
  usdrop_vertical_id UUID;
  legalnations_vertical_id UUID;
  olldeals_vertical_id UUID;
  profile_ids UUID[];
  contact_ids UUID[];
  company_ids UUID[];
  lead_ids UUID[] := ARRAY[]::UUID[];
  product_ids UUID[] := ARRAY[]::UUID[];
  collection_ids UUID[] := ARRAY[]::UUID[];
  lead_id UUID;
BEGIN
  SELECT id INTO all_vertical_id FROM core.verticals WHERE code = 'all' LIMIT 1;
  SELECT id INTO usdrop_vertical_id FROM core.verticals WHERE code = 'usdrop' LIMIT 1;
  SELECT id INTO legalnations_vertical_id FROM core.verticals WHERE code = 'legalnations' LIMIT 1;
  SELECT id INTO olldeals_vertical_id FROM core.verticals WHERE code = 'olldeals' LIMIT 1;

  SELECT ARRAY_AGG(id) INTO profile_ids FROM (SELECT id FROM core.profiles LIMIT 5) p;
  SELECT ARRAY_AGG(id) INTO contact_ids FROM (SELECT id FROM core.contacts WHERE contact_type = 'person' LIMIT 10) c;
  SELECT ARRAY_AGG(id) INTO company_ids FROM (SELECT id FROM core.companies LIMIT 5) co;

  -- Leads with vertical_id (probability must be 0-100)
  FOR i IN 1..30 LOOP
    IF array_length(contact_ids, 1) > 0 AND array_length(company_ids, 1) > 0 AND array_length(profile_ids, 1) > 0 THEN
      INSERT INTO crm.leads (
        contact_id, company_id, owner_id, status, source, value, probability,
        expected_close_date, notes, tags, vertical_id, created_by
      )
      VALUES (
        contact_ids[1 + (i % GREATEST(array_length(contact_ids, 1), 1))],
        company_ids[1 + (i % GREATEST(array_length(company_ids, 1), 1))],
        profile_ids[1 + (i % GREATEST(array_length(profile_ids, 1), 1))],
        (ARRAY['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'])[1 + (i % 7)],
        (ARRAY['website', 'referral', 'cold_call', 'event', 'social'])[1 + (i % 5)],
        10000 + (i * 5000),
        LEAST(10 + (i * 3), 100), -- Ensure probability stays within 0-100
        CURRENT_DATE + (i * INTERVAL '30 days'),
        'Sample lead notes for lead ' || i,
        ARRAY['hot', 'priority', 'follow-up'],
        CASE (i % 4)
          WHEN 0 THEN all_vertical_id
          WHEN 1 THEN usdrop_vertical_id
          WHEN 2 THEN legalnations_vertical_id
          ELSE olldeals_vertical_id
        END,
        NULL
      )
      ON CONFLICT DO NOTHING
      RETURNING id INTO lead_id;
      
      IF lead_id IS NOT NULL THEN
        lead_ids := array_append(lead_ids, lead_id);
      END IF;
    END IF;
  END LOOP;

  -- Products with DiceBear avatars as product images
  INSERT INTO crm.products (
    name, sku, description, category, brand, base_price, currency, cost_price,
    image_url, images, tags, is_active, created_by
  ) VALUES
    ('Premium Widget A', 'SKU-001', 'High-quality widget for enterprise use', 'Widgets', 'BrandX', 299.99, 'USD', 150.00, get_dicebear_avatar('product-001'), ARRAY[get_dicebear_avatar('product-001')], ARRAY['premium', 'enterprise'], TRUE, NULL),
    ('Standard Widget B', 'SKU-002', 'Standard widget for general use', 'Widgets', 'BrandX', 149.99, 'USD', 75.00, get_dicebear_avatar('product-002'), ARRAY[get_dicebear_avatar('product-002')], ARRAY['standard'], TRUE, NULL),
    ('Basic Widget C', 'SKU-003', 'Basic widget for budget-conscious customers', 'Widgets', 'BrandY', 79.99, 'USD', 40.00, get_dicebear_avatar('product-003'), ARRAY[get_dicebear_avatar('product-003')], ARRAY['basic', 'budget'], TRUE, NULL),
    ('Pro Widget D', 'SKU-004', 'Professional-grade widget', 'Widgets', 'BrandZ', 499.99, 'USD', 250.00, get_dicebear_avatar('product-004'), ARRAY[get_dicebear_avatar('product-004')], ARRAY['pro', 'professional'], TRUE, NULL),
    ('Enterprise Widget E', 'SKU-005', 'Enterprise widget with advanced features', 'Widgets', 'BrandX', 999.99, 'USD', 500.00, get_dicebear_avatar('product-005'), ARRAY[get_dicebear_avatar('product-005')], ARRAY['enterprise', 'advanced'], TRUE, NULL),
    ('Starter Widget F', 'SKU-006', 'Entry-level widget', 'Widgets', 'BrandY', 49.99, 'USD', 25.00, get_dicebear_avatar('product-006'), ARRAY[get_dicebear_avatar('product-006')], ARRAY['starter', 'entry'], TRUE, NULL),
    ('Advanced Widget G', 'SKU-007', 'Advanced features widget', 'Widgets', 'BrandZ', 799.99, 'USD', 400.00, get_dicebear_avatar('product-007'), ARRAY[get_dicebear_avatar('product-007')], ARRAY['advanced'], TRUE, NULL),
    ('Ultimate Widget H', 'SKU-008', 'Ultimate solution widget', 'Widgets', 'BrandX', 1299.99, 'USD', 650.00, get_dicebear_avatar('product-008'), ARRAY[get_dicebear_avatar('product-008')], ARRAY['ultimate', 'premium'], TRUE, NULL)
  ON CONFLICT DO NOTHING;
  
  SELECT ARRAY_AGG(id) INTO product_ids FROM crm.products WHERE sku LIKE 'SKU-%' LIMIT 10;

  -- Product Variants
  INSERT INTO crm.product_variants (product_id, name, sku, price, cost_price, stock_quantity, attributes, is_default, is_active)
  SELECT 
    p.id,
    p.name || ' - Variant ' || v.variant_num,
    p.sku || '-V' || v.variant_num,
    p.base_price + (v.variant_num * 10),
    p.cost_price + (v.variant_num * 5),
    100 + (v.variant_num * 50),
    jsonb_build_object('color', (ARRAY['red', 'blue', 'green', 'black'])[v.variant_num], 'size', (ARRAY['small', 'medium', 'large', 'xl'])[v.variant_num]),
    (v.variant_num = 1),
    TRUE
  FROM crm.products p
  CROSS JOIN generate_series(1, 3) v(variant_num)
  WHERE p.sku LIKE 'SKU-%'
  ON CONFLICT DO NOTHING;

  -- Collections with DiceBear avatars
  INSERT INTO crm.collections (name, description, image_url, is_active, created_by) VALUES
    ('Premium Collection', 'Our premium product line', get_dicebear_avatar('collection-premium'), TRUE, NULL),
    ('Standard Collection', 'Standard product offerings', get_dicebear_avatar('collection-standard'), TRUE, NULL),
    ('Budget Collection', 'Budget-friendly options', get_dicebear_avatar('collection-budget'), TRUE, NULL),
    ('Enterprise Collection', 'Enterprise solutions', get_dicebear_avatar('collection-enterprise'), TRUE, NULL)
  ON CONFLICT DO NOTHING;
  
  SELECT ARRAY_AGG(id) INTO collection_ids FROM crm.collections LIMIT 10;

  -- Product Collections
  INSERT INTO crm.product_collections (product_id, collection_id, created_by)
  SELECT p.id, c.id, NULL
  FROM crm.products p
  CROSS JOIN crm.collections c
  WHERE p.sku LIKE 'SKU-%'
  AND (p.base_price > 200 AND c.name LIKE '%Premium%' OR
       p.base_price BETWEEN 100 AND 200 AND c.name LIKE '%Standard%' OR
       p.base_price < 100 AND c.name LIKE '%Budget%')
  ON CONFLICT DO NOTHING;

  -- Quotations
  FOR i IN 1..20 LOOP
    IF array_length(lead_ids, 1) > 0 AND array_length(product_ids, 1) > 0 THEN
      INSERT INTO crm.quotations (
        lead_id, quote_number, items, status, total_amount, currency, tax_amount,
        discount_amount, valid_until, terms, notes, created_by
      )
      VALUES (
        lead_ids[1 + (i % GREATEST(array_length(lead_ids, 1), 1))],
        'QUO-' || LPAD(i::TEXT, 6, '0'),
        jsonb_build_array(
          jsonb_build_object('product_id', product_ids[1 + (i % GREATEST(array_length(product_ids, 1), 1))], 'quantity', 10, 'price', 299.99, 'total', 2999.90)
        ),
        (ARRAY['draft', 'sent', 'accepted', 'rejected'])[1 + (i % 4)],
        2999.90 + (i * 100),
        'USD',
        300.00,
        0.00,
        CURRENT_DATE + INTERVAL '30 days',
        'Standard payment terms',
        'Sample quotation ' || i,
        NULL
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- Calls
  FOR i IN 1..25 LOOP
    IF array_length(lead_ids, 1) > 0 AND array_length(contact_ids, 1) > 0 AND array_length(profile_ids, 1) > 0 THEN
      INSERT INTO crm.calls (
        lead_id, contact_id, caller_id, call_type, duration_seconds, outcome,
        notes, started_at, created_by
      )
      VALUES (
        lead_ids[1 + (i % GREATEST(array_length(lead_ids, 1), 1))],
        contact_ids[1 + (i % array_length(contact_ids, 1))],
        profile_ids[1 + (i % array_length(profile_ids, 1))],
        (ARRAY['inbound', 'outbound', 'missed'])[1 + (i % 3)],
        (5 + (i * 5)) * 60, -- Convert minutes to seconds
        (ARRAY['answered', 'voicemail', 'busy', 'no_answer'])[1 + (i % 4)],
        'Call notes for lead discussion ' || i,
        CURRENT_TIMESTAMP - (i * INTERVAL '1 day'),
        NULL
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- Interactions
  FOR i IN 1..35 LOOP
    IF array_length(lead_ids, 1) > 0 THEN
      INSERT INTO crm.interactions (
        entity_type, entity_id, type, subject, notes, scheduled_at, duration_minutes,
        outcome, created_by
      )
      VALUES (
        'lead',
        lead_ids[1 + (i % GREATEST(array_length(lead_ids, 1), 1))],
        (ARRAY['call', 'email', 'meeting', 'note', 'task'])[1 + (i % 5)],
        'Interaction subject ' || i,
        'Interaction notes for interaction ' || i,
        CURRENT_DATE - (i * INTERVAL '2 days'),
        30,
        'completed',
        NULL
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 4. COMMON_UTIL SCHEMA - Tasks and Knowledge
-- ============================================================================

DO $$
DECLARE
  all_vertical_id UUID;
  usdrop_vertical_id UUID;
  profile_ids UUID[];
  task_ids UUID[] := ARRAY[]::UUID[];
  dept_ids UUID[];
  task_id UUID;
BEGIN
  SELECT id INTO all_vertical_id FROM core.verticals WHERE code = 'all' LIMIT 1;
  SELECT id INTO usdrop_vertical_id FROM core.verticals WHERE code = 'usdrop' LIMIT 1;
  SELECT ARRAY_AGG(id) INTO profile_ids FROM (SELECT id FROM core.profiles LIMIT 5) p;
  SELECT ARRAY_AGG(id) INTO dept_ids FROM (SELECT id FROM core.departments LIMIT 3) d;

  -- Tasks with vertical_id
  FOR i IN 1..40 LOOP
    IF array_length(profile_ids, 1) > 0 AND array_length(dept_ids, 1) > 0 THEN
      INSERT INTO common_util.tasks (
        title, description, status, priority, assignee_id, reporter_id, department_id,
        due_date, vertical_id, created_by
      )
      VALUES (
        'Task ' || i,
        'Task description for task number ' || i || '. This task involves multiple steps and requires attention to detail.',
        (ARRAY['pending', 'in_progress', 'completed', 'cancelled'])[1 + (i % 4)],
        (ARRAY['low', 'medium', 'high', 'urgent'])[1 + (i % 4)],
        profile_ids[1 + (i % GREATEST(array_length(profile_ids, 1), 1))],
        profile_ids[1 + (i % array_length(profile_ids, 1))],
        dept_ids[1 + (i % array_length(dept_ids, 1))],
        CURRENT_DATE + (i * INTERVAL '7 days'),
        CASE (i % 2)
          WHEN 0 THEN all_vertical_id
          ELSE usdrop_vertical_id
        END,
        NULL
      )
      ON CONFLICT DO NOTHING
      RETURNING id INTO task_id;
      
      IF task_id IS NOT NULL THEN
        task_ids := array_append(task_ids, task_id);
      END IF;
    END IF;
  END LOOP;

  -- Task Assignees
  FOR i IN 1..25 LOOP
    IF array_length(task_ids, 1) > 0 AND array_length(profile_ids, 1) > 0 THEN
      INSERT INTO common_util.task_assignees (task_id, profile_id, role)
      VALUES (
        task_ids[1 + (i % GREATEST(array_length(task_ids, 1), 1))],
        profile_ids[1 + (i % array_length(profile_ids, 1))],
        (ARRAY['owner', 'assignee', 'watcher'])[1 + (i % 3)]
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- Knowledge Categories
  INSERT INTO common_util.knowledge_categories (name, description, order_no, created_by) VALUES
    ('Getting Started', 'Basic guides for new users', 1, NULL),
    ('Sales', 'Sales processes and best practices', 2, NULL),
    ('Operations', 'Operational procedures', 3, NULL),
    ('Technical', 'Technical documentation', 4, NULL),
    ('HR', 'Human resources guides', 5, NULL)
  ON CONFLICT DO NOTHING;

  -- Knowledge Articles with vertical_id
  FOR i IN 1..20 LOOP
    IF array_length(profile_ids, 1) > 0 THEN
      INSERT INTO common_util.knowledge_articles (
        title, slug, content, excerpt, category_id, author_id, tags,
        is_published, is_featured, vertical_id, created_by
      )
      SELECT 
        'Article ' || i,
        'article-' || i,
        'Full article content for article ' || i || '. This is a comprehensive guide covering all aspects of the topic. It includes detailed explanations, examples, and best practices.',
        'Brief excerpt for article ' || i || ' covering key points.',
        (SELECT id FROM common_util.knowledge_categories ORDER BY RANDOM() LIMIT 1),
        profile_ids[1 + (i % array_length(profile_ids, 1))],
        ARRAY['guide', 'tutorial', 'reference'],
        TRUE,
        (i % 3 = 0),
        CASE (i % 2)
          WHEN 0 THEN all_vertical_id
          ELSE usdrop_vertical_id
        END,
        NULL
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- Marketing Assets with DiceBear avatars
  INSERT INTO common_util.marketing_assets (
    name, description, asset_type, file_url, file_name, tags, category,
    is_public, created_by
  ) VALUES
    ('Product Banner', 'Main product banner image', 'image', get_dicebear_avatar('banner-001'), 'banner-001.svg', ARRAY['banner', 'product'], 'Graphics', TRUE, NULL),
    ('Company Logo', 'Primary company logo', 'image', get_dicebear_avatar('logo-001'), 'logo-001.svg', ARRAY['logo', 'branding'], 'Branding', TRUE, NULL),
    ('Sales Deck', 'Quarterly sales presentation', 'presentation', get_dicebear_avatar('deck-001'), 'sales-deck.pdf', ARRAY['sales', 'presentation'], 'Sales', TRUE, NULL),
    ('Product Catalog', 'Complete product catalog', 'document', get_dicebear_avatar('catalog-001'), 'catalog.pdf', ARRAY['catalog', 'products'], 'Marketing', TRUE, NULL),
    ('Brand Guidelines', 'Company brand guidelines', 'document', get_dicebear_avatar('brand-001'), 'brand-guidelines.pdf', ARRAY['branding', 'guidelines'], 'Branding', TRUE, NULL)
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================================
-- 5. CORE SCHEMA - Announcements
-- ============================================================================

DO $$
DECLARE
  all_vertical_id UUID;
  usdrop_vertical_id UUID;
  legalnations_vertical_id UUID;
  olldeals_vertical_id UUID;
BEGIN
  SELECT id INTO all_vertical_id FROM core.verticals WHERE code = 'all' LIMIT 1;
  SELECT id INTO usdrop_vertical_id FROM core.verticals WHERE code = 'usdrop' LIMIT 1;
  SELECT id INTO legalnations_vertical_id FROM core.verticals WHERE code = 'legalnations' LIMIT 1;
  SELECT id INTO olldeals_vertical_id FROM core.verticals WHERE code = 'olldeals' LIMIT 1;

  -- Announcements with vertical_id
  INSERT INTO core.announcements (
    title, message, announcement_type, priority, is_active, start_date, end_date,
    target_audience, dismissible, vertical_id, created_by
  ) VALUES
    ('Welcome to Company OS', 'Welcome to our new platform! Explore all the features and get started.', 'info', 'normal', TRUE, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'all', TRUE, all_vertical_id, NULL),
    ('System Maintenance', 'Scheduled maintenance this weekend from 2 AM to 4 AM EST', 'warning', 'high', TRUE, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'all', TRUE, all_vertical_id, NULL),
    ('USDrop Launch', 'New USDrop features are now available. Check them out!', 'success', 'normal', TRUE, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', 'all', TRUE, usdrop_vertical_id, NULL),
    ('LegalNations Update', 'New legal entity formation features added', 'info', 'normal', TRUE, CURRENT_DATE, CURRENT_DATE + INTERVAL '45 days', 'all', TRUE, legalnations_vertical_id, NULL),
    ('Olldeals Promotion', 'Special promotion for bulk orders this month', 'success', 'normal', TRUE, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'all', TRUE, olldeals_vertical_id, NULL)
  ON CONFLICT DO NOTHING;
END $$;

COMMIT;

-- Note: Helper function kept for future use
-- DROP FUNCTION IF EXISTS get_dicebear_avatar(TEXT);

