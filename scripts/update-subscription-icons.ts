/**
 * Script to update subscription icons based on vendor names
 * Priority: Animated Social Icons > Social Icons > None
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Mapping of vendor names to icon paths
// Format: { vendorName: { animated?: string, regular?: string } }
const iconMapping: Record<string, { animated?: string; regular?: string }> = {
  Adobe: {
    regular: '/Social Icons/150+ Social Media Icons & Company Logos/150+ social media icons & company logos.iconjar/icons/adobe-original.svg',
  },
  Figma: {
    animated: '/Animated Social Icons/social_icons_pack/color/Figma/demo/Figma.html',
    regular: '/Social Icons/150+ Social Media Icons & Company Logos/150+ social media icons & company logos.iconjar/icons/figma-original.svg',
  },
  GitHub: {
    animated: '/Animated Social Icons/social_icons_pack/color/Github/demo/Github.html',
    regular: '/Social Icons/150+ Social Media Icons & Company Logos/150+ social media icons & company logos.iconjar/icons/github-original.svg',
  },
  Notion: {
    animated: '/Animated Social Icons/social_icons_pack/color/Notion/demo/Notion.html',
    regular: '/Social Icons/150+ Social Media Icons & Company Logos/150+ social media icons & company logos.iconjar/icons/notion-original.svg',
  },
  Slack: {
    animated: '/Animated Social Icons/social_icons_pack/color/Slack/demo/Slack.html',
    regular: '/Social Icons/150+ Social Media Icons & Company Logos/150+ social media icons & company logos.iconjar/icons/slack-original.svg',
  },
  Stripe: {
    regular: '/Social Icons/150+ Social Media Icons & Company Logos/150+ social media icons & company logos.iconjar/icons/stripe-original.svg',
  },
  AWS: {
    regular: '/Social Icons/150+ Social Media Icons & Company Logos/150+ social media icons & company logos.iconjar/icons/amazon-original.svg',
  },
  Zoom: {
    animated: '/Animated Social Icons/social_icons_pack/color/Zoom/demo/Zoom.html',
    regular: '/Social Icons/150+ Social Media Icons & Company Logos/150+ social media icons & company logos.iconjar/icons/zoom-original.svg',
  },
}

function getIconPath(vendorName: string | null): string | null {
  if (!vendorName) return null

  // Normalize vendor name (case-insensitive, trim whitespace)
  const normalized = vendorName.trim()
  const mapping = iconMapping[normalized]

  if (!mapping) return null

  // Prefer animated icon if available, otherwise use regular icon
  return mapping.animated || mapping.regular || null
}

async function updateSubscriptionIcons() {
  console.log('Fetching subscriptions...')

  // Fetch all subscriptions
  const { data: subscriptions, error: fetchError } = await supabase
    .from('subscriptions')
    .select('id, subscription_name, vendor_name')
    .is('deleted_at', null)

  if (fetchError) {
    console.error('Error fetching subscriptions:', fetchError)
    return
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.log('No subscriptions found')
    return
  }

  console.log(`Found ${subscriptions.length} subscriptions`)

  // Update each subscription with icon
  let updated = 0
  let skipped = 0

  for (const subscription of subscriptions) {
    const iconPath = getIconPath(subscription.vendor_name)

    if (!iconPath) {
      console.log(`  ⏭️  Skipping "${subscription.subscription_name}" (${subscription.vendor_name || 'No vendor'}) - No icon found`)
      skipped++
      continue
    }

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ icon_url: iconPath })
      .eq('id', subscription.id)

    if (updateError) {
      console.error(`  ❌ Error updating "${subscription.subscription_name}":`, updateError)
    } else {
      console.log(`  ✅ Updated "${subscription.subscription_name}" (${subscription.vendor_name}) → ${iconPath}`)
      updated++
    }
  }

  console.log(`\n✅ Complete! Updated: ${updated}, Skipped: ${skipped}`)
}

// Run the script
updateSubscriptionIcons()
  .then(() => {
    console.log('Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })

