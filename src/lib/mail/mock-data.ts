import { MailFolder, MailCategory, Email, EmailContent } from '@/components/mail/types'

// Mock folders
export const mockFolders: MailFolder[] = [
  { id: 'inbox', name: 'Inbox', icon: 'Inbox', unreadCount: 128, isActive: true },
  { id: 'drafts', name: 'Drafts', icon: 'FileText', unreadCount: 9 },
  { id: 'sent', name: 'Sent', icon: 'Send' },
  { id: 'junk', name: 'Junk', icon: 'Ban', unreadCount: 23 },
  { id: 'trash', name: 'Trash', icon: 'Trash2' },
  { id: 'archive', name: 'Archive', icon: 'Archive' },
]

// Mock categories
export const mockCategories: MailCategory[] = [
  { id: 'social', name: 'Social', color: 'bg-purple-500', count: 972 },
  { id: 'updates', name: 'Updates', color: 'bg-teal-500', count: 342 },
  { id: 'forums', name: 'Forums', color: 'bg-orange-500', count: 128 },
  { id: 'shopping', name: 'Shopping', color: 'bg-green-500', count: 8 },
  { id: 'promotions', name: 'Promotions', color: 'bg-pink-500', count: 21 },
]

// Mock emails
export const mockEmails: Email[] = [
  {
    id: 'email-1',
    sender: { name: 'William Smith', email: 'williamsmith@example.com' },
    subject: 'Meeting Tomorrow',
    preview:
      "Hi, let's have a meeting tomorrow to discuss the project. I've been reviewing the project details and have some ideas I'd like to share. It's crucial that we align on our next steps to ensure the project's success. Please come prepared with any questions or insights you may have. Looking forward to",
    timestamp: 'about 2 years ago',
    isUnread: false,
    tags: ['meeting', 'work', 'important'],
    folder: 'inbox',
  },
  {
    id: 'email-2',
    sender: { name: 'Alice Smith', email: 'alicesmith@example.com' },
    subject: 'Re: Project Update',
    preview:
      "Thank you for the project update. It looks great! I've gone through the report, and the progress is impressive. The team has done a fantastic job, and I appreciate the hard work everyone has put in. I have a few minor suggestions that I'll include in the attached document. Let's discuss these duri",
    timestamp: 'about 2 years ago',
    isUnread: false,
    tags: ['work', 'important'],
    folder: 'inbox',
  },
  {
    id: 'email-3',
    sender: { name: 'Bob Johnson', email: 'bobjohnson@example.com' },
    subject: 'Weekend Plans',
    preview:
      'Any plans for the weekend? I was thinking of going hiking in the nearby mountains. It\'s been a while since we had some outdoor fun. If you\'re interested, let me know, and we can plan the details. It\'ll be a great way to unwind and enjoy nature. Looking forward to your response! Best, Bob',
    timestamp: 'over 2 years ago',
    isUnread: false,
    tags: ['personal'],
    folder: 'inbox',
  },
  {
    id: 'email-4',
    sender: { name: 'Emily Davis', email: 'emilydavis@example.com' },
    subject: 'Re: Question about Budget',
    preview:
      "I have a question about the budget for the upcoming project. It seems like there's a discrepancy in the allocation of resources. I've reviewed the budget report and identified a few areas where we might be able to optimize our spending without compromising the project's quality. I've attached a de",
    timestamp: 'over 2 years ago',
    isUnread: true,
    tags: ['work', 'budget'],
    folder: 'inbox',
  },
  {
    id: 'email-5',
    sender: { name: 'Michael Wilson', email: 'michaelwilson@example.com' },
    subject: 'Important Announcement',
    preview:
      "I have an important announcement to make during our team meeting. It pertains to a strategic shift in our approach to the upcoming product launch. We've received valuable feedback from our beta testers, and I believe it's time to make some adjustments to better meet our customers' needs. This chang",
    timestamp: 'over 2 years ago',
    isUnread: false,
    tags: ['meeting', 'work', 'important'],
    folder: 'inbox',
  },
  {
    id: 'email-6',
    sender: { name: 'Sarah Brown', email: 'sarahbrown@example.com' },
    subject: 'Re: Feedback on Proposal',
    preview:
      "Thank you for your feedback on the proposal. It looks great! I'm pleased to hear that you found it promising. The team worked diligently to address all the key points you raised, and I believe we now have a strong foundation for the project. I've attached the revised proposal for your review. Plea",
    timestamp: 'over 2 years ago',
    isUnread: false,
    tags: ['work'],
    folder: 'inbox',
  },
  {
    id: 'email-7',
    sender: { name: 'David Lee', email: 'davidlee@example.com' },
    subject: 'New Project Idea',
    preview:
      "I have an exciting new project idea to discuss with you. It involves expanding our services to target a niche market that has shown considerable growth in recent months. I've prepared a detailed proposal outlining the potential benefits and the strategy for execution. This project has the potentia",
    timestamp: 'almost 3 years ago',
    isUnread: false,
    tags: ['meeting', 'work', 'important'],
    folder: 'inbox',
  },
  {
    id: 'email-8',
    sender: { name: 'Olivia Wilson', email: 'oliviawilson@example.com' },
    subject: 'Vacation Plans',
    preview:
      "Let's plan our vacation for next month. What do you think? I've been thinking of visiting a tropical paradise, and I've put together some destination options. I believe it's time for us to unwind and recharge. Please take a look at the options and let me know your preferences. We can start making ",
    timestamp: 'almost 3 years ago',
    isUnread: false,
    tags: ['personal'],
    folder: 'inbox',
  },
  {
    id: 'email-9',
    sender: { name: 'James Martin', email: 'jamesmartin@example.com' },
    subject: 'Re: Conference Registration',
    preview:
      "I've completed the registration for the conference next month. The event promises to be a great networking opportunity, and I'm looking forward to attending the various sessions and connecting with industry experts. I've also attached the conference schedule for your reference. If there are any sp",
    timestamp: 'almost 3 years ago',
    isUnread: false,
    tags: ['work', 'conference'],
    folder: 'inbox',
  },
  {
    id: 'email-10',
    sender: { name: 'Sophia White', email: 'sophiawhite@example.com' },
    subject: 'Team Dinner',
    preview:
      "Let's have a team dinner next week to celebrate our success. We've achieved some significant milestones, and it's time to acknowledge our hard work and dedication. I've made reservations at a lovely restaurant, and I'm sure it'll be an enjoyable evening. Please confirm your availability and any di",
    timestamp: 'almost 3 years ago',
    isUnread: false,
    tags: ['meeting', 'work'],
    folder: 'inbox',
  },
  {
    id: 'email-11',
    sender: { name: 'Daniel Johnson', email: 'danieljohnson@example.com' },
    subject: 'Feedback Request',
    preview:
      "I'd like your feedback on the latest project deliverables. We've made significant progress, and I value your input to ensure we're on the right track. I've attached the deliverables for your review, and I'm particularly interested in any areas where you think we can further enhance the quality or e",
    timestamp: 'about 3 years ago',
    isUnread: false,
    tags: ['work'],
    folder: 'inbox',
  },
]

// Mock email content (full email details)
export const mockEmailContent: Record<string, EmailContent> = {
  'email-1': {
    id: 'email-1',
    sender: { name: 'William Smith', email: 'williamsmith@example.com' },
    subject: 'Meeting Tomorrow',
    date: 'Oct 22, 2023, 9:00:00 AM',
    body: `Hi,

Let's have a meeting tomorrow to discuss the project. I've been reviewing the project details and have some ideas I'd like to share.

It's crucial that we align on our next steps to ensure the project's success. Please come prepared with any questions or insights you may have.

Looking forward to our meeting!

Best regards,
William`,
  },
  'email-2': {
    id: 'email-2',
    sender: { name: 'Alice Smith', email: 'alicesmith@example.com' },
    subject: 'Re: Project Update',
    date: 'Oct 21, 2023, 2:30:00 PM',
    body: `Thank you for the project update. It looks great!

I've gone through the report, and the progress is impressive. The team has done a fantastic job, and I appreciate the hard work everyone has put in.

I have a few minor suggestions that I'll include in the attached document. Let's discuss these during our next sync meeting.

Best,
Alice`,
  },
  'email-3': {
    id: 'email-3',
    sender: { name: 'Bob Johnson', email: 'bobjohnson@example.com' },
    subject: 'Weekend Plans',
    date: 'Oct 15, 2023, 11:00:00 AM',
    body: `Hey!

Any plans for the weekend? I was thinking of going hiking in the nearby mountains. It's been a while since we had some outdoor fun.

If you're interested, let me know, and we can plan the details. It'll be a great way to unwind and enjoy nature.

Looking forward to your response!

Best,
Bob`,
  },
  'email-4': {
    id: 'email-4',
    sender: { name: 'Emily Davis', email: 'emilydavis@example.com' },
    subject: 'Re: Question about Budget',
    date: 'Oct 10, 2023, 4:15:00 PM',
    body: `Hi there,

I have a question about the budget for the upcoming project. It seems like there's a discrepancy in the allocation of resources.

I've reviewed the budget report and identified a few areas where we might be able to optimize our spending without compromising the project's quality. I've attached a detailed breakdown for your review.

Let me know your thoughts.

Thanks,
Emily`,
  },
  'email-5': {
    id: 'email-5',
    sender: { name: 'Michael Wilson', email: 'michaelwilson@example.com' },
    subject: 'Important Announcement',
    date: 'Oct 5, 2023, 10:30:00 AM',
    body: `Team,

I have an important announcement to make during our team meeting. It pertains to a strategic shift in our approach to the upcoming product launch.

We've received valuable feedback from our beta testers, and I believe it's time to make some adjustments to better meet our customers' needs. This change will require our collective effort and commitment.

Please review the attached document before the meeting.

Best,
Michael`,
  },
}

