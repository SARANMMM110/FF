export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[#E50914] via-[#FF6B6B] to-[#FFD400] bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: December 2024
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Welcome to FocusFlow. By accessing or using our productivity application, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our service.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              These Terms constitute a legally binding agreement between you and FocusFlow. We reserve the right to update these Terms at any time, and your continued use of the service after such changes constitutes acceptance of the updated Terms.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">2. Description of Service</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              FocusFlow is a productivity application that provides:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Task management and organization tools</li>
              <li>Focus timer with Pomodoro and custom timing options</li>
              <li>Weekly planning and scheduling features</li>
              <li>Productivity analytics and insights</li>
              <li>Goal tracking and progress monitoring</li>
              <li>Google Calendar integration (optional)</li>
              <li>Customizable themes and settings</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              We reserve the right to modify, suspend, or discontinue any aspect of the service at any time, with or without notice.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">3. User Accounts</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white mt-6">Account Creation</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              To use FocusFlow, you must create an account using Google OAuth. By creating an account, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
              <li>Be at least 13 years of age</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white mt-6">Account Termination</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              You may delete your account at any time through the settings page. We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent, abusive, or illegal activities.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">4. Subscription Plans</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              FocusFlow offers multiple subscription tiers:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Free Plan:</strong> Basic features with limited functionality</li>
              <li><strong>Pro Plan:</strong> Enhanced features including goals tracking, custom themes, and advanced analytics</li>
              <li><strong>Enterprise Plan:</strong> All features with priority support and custom configurations</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              Subscription details, pricing, and features are subject to change. We will provide notice of any material changes to paid subscription plans. Refunds may be provided at our discretion on a case-by-case basis.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">5. Acceptable Use Policy</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You agree not to use FocusFlow to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Transmit harmful, offensive, or inappropriate content</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the service</li>
              <li>Use automated systems to access the service without permission</li>
              <li>Impersonate another person or entity</li>
              <li>Collect or harvest user data without consent</li>
              <li>Upload malicious code, viruses, or harmful software</li>
              <li>Reverse engineer or attempt to extract source code</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              Violation of this policy may result in immediate termination of your account and legal action if necessary.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">6. Intellectual Property</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white mt-6">Our Content</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              All content, features, and functionality of FocusFlow, including but not limited to text, graphics, logos, icons, images, audio clips, digital downloads, data compilations, and software, are the exclusive property of FocusFlow and are protected by copyright, trademark, and other intellectual property laws.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white mt-6">Your Content</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              You retain all rights to the content you create in FocusFlow (tasks, notes, goals, etc.). By using our service, you grant us a limited license to store, process, and display your content solely for the purpose of providing the service to you.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">7. Google Calendar Integration</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you choose to connect your Google Calendar:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>You authorize FocusFlow to access your calendar data (read-only)</li>
              <li>You can revoke this access at any time through your account settings</li>
              <li>We will use calendar data only to display upcoming events in your dashboard</li>
              <li>We will not modify, delete, or share your calendar events</li>
              <li>Our use of Google Calendar data complies with Google's API Services User Data Policy</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              See our{' '}
              <a 
                href="/privacy-policy" 
                className="text-[#E50914] hover:underline font-semibold"
              >
                Privacy Policy
              </a>
              {' '}for more information about how we handle your calendar data.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">8. Privacy and Data Protection</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Your privacy is important to us. Our collection and use of personal information is governed by our{' '}
              <a 
                href="/privacy-policy" 
                className="text-[#E50914] hover:underline font-semibold"
              >
                Privacy Policy
              </a>
              . By using FocusFlow, you consent to the collection and use of information as described in our Privacy Policy.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">9. Disclaimers and Limitations of Liability</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white mt-6">Service Availability</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              FocusFlow is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white mt-6">Limitation of Liability</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              To the maximum extent permitted by law, FocusFlow shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, or other intangible losses, resulting from:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mt-4">
              <li>Your use or inability to use the service</li>
              <li>Any unauthorized access to or use of our servers and/or personal information</li>
              <li>Any interruption or cessation of transmission to or from the service</li>
              <li>Any bugs, viruses, or harmful code transmitted through the service</li>
              <li>Any errors or omissions in content or any loss or damage incurred from use of content</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">10. Indemnification</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              You agree to indemnify, defend, and hold harmless FocusFlow and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses, including reasonable legal fees, arising out of or in any way connected with:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mt-4">
              <li>Your access to or use of the service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Any content you submit, post, or transmit through the service</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">11. Third-Party Services</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              FocusFlow may integrate with third-party services such as Google Calendar. Your use of these third-party services is subject to their respective terms of service and privacy policies. We are not responsible for the practices of third-party services.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">12. Termination</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We reserve the right to suspend or terminate your access to FocusFlow at any time, with or without cause or notice, including but not limited to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Violation of these Terms</li>
              <li>Fraudulent or illegal activity</li>
              <li>Requests by law enforcement or government agencies</li>
              <li>Extended periods of inactivity</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              Upon termination, your right to use the service will immediately cease. All provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">13. Changes to Terms</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on this page and updating the "Last updated" date. Your continued use of FocusFlow after such changes constitutes acceptance of the updated Terms. We encourage you to review these Terms periodically.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">14. Governing Law and Dispute Resolution</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which FocusFlow operates, without regard to conflict of law principles. Any disputes arising from these Terms or your use of the service shall be resolved through binding arbitration, except where prohibited by law.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">15. Severability</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">16. Entire Agreement</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and FocusFlow regarding the use of our service and supersede all prior agreements and understandings.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">17. Contact Information</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Email:</strong>{' '}
                <a href="mailto:legal@focusflow.app" className="text-[#E50914] hover:underline">
                  legal@focusflow.app
                </a>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-2">
                <strong>Support:</strong>{' '}
                <a href="mailto:support@focusflow.app" className="text-[#E50914] hover:underline">
                  support@focusflow.app
                </a>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-2">
                <strong>Website:</strong>{' '}
                <a href="https://focusflow.app" className="text-[#E50914] hover:underline" target="_blank" rel="noopener noreferrer">
                  https://focusflow.app
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            By using FocusFlow, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-4">
            © 2024 FocusFlow. All rights reserved.
          </p>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        .prose h2 {
          margin-top: 0;
        }
        
        .prose h3 {
          margin-bottom: 0.5rem;
        }
        
        .prose ul {
          margin-top: 0.5rem;
        }
        
        .prose a {
          text-decoration: none;
        }
        
        .prose a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
