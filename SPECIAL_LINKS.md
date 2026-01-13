# FocusFlow Special Registration Links

This document explains how to use special registration links that automatically grant upgraded account access to new users.

## Two Types of Registration Links

FocusFlow supports two types of special registration links:

1. **Simple Plan Links** - Easy to remember, good for general use
2. **Secure Code Links** - Random alphanumeric codes, ideal for tracking and controlled distribution

## How It Works

When users sign up through a special registration link, they automatically receive the specified account level (Pro or Enterprise) without requiring payment.

---

## Type 1: Simple Plan Links

### Special Link Formats

### Pro Plan Registration Link
```
https://xdgand7q4eudo.mocha.app/?plan=pro
```

Users who sign up through this link will automatically receive **Pro plan access** with all Pro features:
- Unlimited tasks and focus sessions
- Advanced analytics and insights
- Custom themes
- Priority support
- All Pro features unlocked

### Enterprise Plan Registration Link
```
https://xdgand7q4eudo.mocha.app/?plan=enterprise
```

Users who sign up through this link will automatically receive **Enterprise plan access** with all Enterprise features:
- Everything in Pro
- Dedicated account manager
- Custom integrations
- Advanced team features
- All Enterprise features unlocked

## Use Cases

These special links are perfect for:

1. **Promotional Campaigns**: Offer limited-time Pro/Enterprise access
2. **Partnerships**: Give partners special access links to share with their audience
3. **Beta Testing**: Provide beta testers with Pro/Enterprise features
4. **Influencer Marketing**: Give influencers special links for their followers
5. **Event Attendees**: Reward conference or event attendees with upgraded access
6. **Affiliate Programs**: Track and reward affiliate partners with special registration links

## Technical Details

- The `plan` parameter is passed through the OAuth flow
- Upon successful registration, the user's `subscription_plan` field is automatically set to the specified plan
- Only valid for new users (doesn't upgrade existing users)
- Valid plans: `pro` and `enterprise` (case-sensitive)
- Invalid or missing plan parameters default to `free` plan

## Visual Indicators

When users access the app through a special link:
- A special banner appears on the welcome page indicating the plan they'll receive
- The banner shows different styling for Pro (red-gold gradient) vs Enterprise (purple gradient)
- After signing up, they immediately see their plan badge in the top bar

## Tracking

Special registrations are logged in the backend with:
- User email
- Plan granted (Pro or Enterprise)
- Timestamp
- Source indication ("special link")

Check the server logs for entries like:
```
🎁 [Special Registration] User user@example.com registered with PRO plan via special link
```

## Security Notes

- Links are public and can be shared freely
- No authentication required - anyone with the link gets the specified plan
- Only works for NEW registrations (existing users won't be upgraded)
- Consider implementing link expiration or usage limits for sensitive campaigns

## Custom Landing Pages

You can combine these links with custom UTM parameters for tracking:
```
https://xdgand7q4eudo.mocha.app/?plan=pro&utm_source=partner&utm_medium=email&utm_campaign=launch
```

The plan parameter will still work correctly alongside other query parameters.

---

## Type 2: Secure Registration Codes (Recommended)

### Overview

For better security, tracking, and control, you can generate unique registration codes with the following features:
- 32-character random alphanumeric codes
- Usage limits (e.g., one-time use, 10 uses, unlimited)
- Expiration dates
- Ability to deactivate at any time
- Usage tracking and analytics
- Notes/labels for organization

### How to Generate Codes

1. Log into the admin dashboard: `/admin`
2. Click "Registration Codes" in the top navigation
3. Click "Create Code"
4. Configure:
   - **Plan Type**: Pro or Enterprise
   - **Max Uses**: Leave empty for unlimited, or set a specific limit
   - **Expiration Date**: Optional expiration
   - **Notes**: Optional description (e.g., "Q1 2025 Partner Campaign")
5. Click "Create Code"
6. The registration URL will be automatically copied to your clipboard

### Example Registration Codes

Generated codes look like this:
```
https://xdgand7q4eudo.mocha.app/?code=A7K9X2M4N8P1Q5R3T6V2W9Y4Z7B
https://focusflow.biz/?code=J3H8F2K9L4M7N1P5Q8R2S6T3V9W
```

### Code Features

**Usage Tracking**
- See how many times each code has been used
- Monitor which codes are most popular
- Track conversion rates

**Expiration Control**
- Set expiration dates (e.g., "Valid until end of Q1 2025")
- Codes automatically become invalid after expiration
- Perfect for limited-time promotions

**Usage Limits**
- One-time use codes for exclusive access
- Limited use codes (e.g., "First 50 users")
- Unlimited codes for ongoing campaigns

**Deactivation**
- Instantly deactivate any code
- Prevents further use while preserving analytics
- Useful if a code is leaked or campaign ends early

### Managing Codes

Access the Registration Codes dashboard at `/admin/registration-codes` to:
- View all generated codes
- See usage statistics
- Copy registration URLs
- Deactivate codes
- Monitor active vs inactive codes

### Code Validation

Before showing the special plan banner, the app validates the code to ensure:
- Code exists and is active
- Has not exceeded usage limits
- Has not expired
- Returns the correct plan type

### Security Benefits

Compared to simple `?plan=pro` links, registration codes offer:
- **Trackability**: Know exactly which link was used
- **Revocability**: Deactivate compromised codes instantly
- **Scarcity**: Control exactly how many users can use each code
- **Attribution**: Identify which campaigns drive signups
- **Professional**: Looks more legitimate than ?plan=pro

### Best Practices

1. **Use descriptive notes**: Label codes with campaign info
2. **Set expiration dates**: For time-limited promotions
3. **Limit uses**: For exclusive access or scarcity
4. **Monitor regularly**: Check the dashboard for usage patterns
5. **Deactivate when done**: Clean up old campaign codes

### Use Cases

- **Partner Referrals**: Give each partner a unique code to track signups
- **Influencer Campaigns**: Track which influencers drive conversions
- **Event Attendees**: Limited-use codes for conference attendees
- **Beta Programs**: Controlled rollout with usage limits
- **Time-Limited Offers**: Codes that expire after promotion ends
- **A/B Testing**: Different codes for different marketing channels

---

## Comparison: Simple vs Secure

| Feature | Simple Links | Secure Codes |
|---------|-------------|--------------|
| Format | `?plan=pro` | `?code=A7K9X2M4...` |
| Security | Low | High |
| Tracking | None | Full analytics |
| Usage Limits | No | Yes (configurable) |
| Expiration | No | Yes (optional) |
| Revocable | No | Yes (instant) |
| Professional | Basic | Advanced |
| Best For | General use | Campaigns, partners, tracking |

### Recommendation

- Use **Simple Links** for general marketing, social media, or quick sharing
- Use **Secure Codes** for partnerships, paid campaigns, influencer tracking, or when you need analytics and control
