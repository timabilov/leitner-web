import { Link } from "react-router-dom";
import {
  CreditCard,
  Ban,
  RefreshCcw,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGrid, FloatingBlobs } from "@/login";

export default function TermsAndConditions() {
  return (
    <main className="bg-background text-foreground min-h-screen w-full">
      <AnimatedGrid />
      <FloatingBlobs />

      <section className="py-12 md:py-24 relative z-10">
        <div className="container max-w-4xl mx-auto px-4">

          {/* Header */}
          <div className="mb-12 space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
              Terms and Conditions
            </h1>
            <p className="text-lg text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Main Content */}
          <div className="grid gap-12">

            {/* 1. Terms */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                <span className="text-primary font-mono text-lg opacity-50">01.</span> Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                By accessing the website or mobile app at <a href="https://app.bycat.ai/" className="text-foreground hover:underline underline-offset-4">https://app.bycat.ai/</a> and its pages, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site or app. The materials contained in this website or app are protected by applicable copyright and trademark law.
              </p>
            </div>

            {/* 2. Billing */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                <span className="text-primary font-mono text-lg opacity-50">02.</span> Billing and Payments
              </h2>
              <div className="p-6 rounded-2xl border border-border/50 bg-background/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <CreditCard className="size-4" />
                    </div>
                    <h3 className="font-semibold text-foreground">Payment Terms</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You shall pay all fees or charges to your account in accordance with the fees, charges, and billing terms in effect at the time a fee or charge is due and payable. Where Services are offered on a free trial basis, payment may be required after the free trial period ends. If auto-renewal is enabled, you will be charged automatically.
                    <br/><br/>
                    Sensitive and private data exchange happens over a SSL secured communication channel and is encrypted. We reserve the right to change products and pricing at any time. We also reserve the right to refuse any order you place with us.
                  </p>
              </div>
            </div>

            {/* 3. Accounts */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                <span className="text-primary font-mono text-lg opacity-50">03.</span> Accounts and Membership
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                If you create an account in the Mobile Application, you are responsible for maintaining the security of your account and you are fully responsible for all activities that occur under the account. Providing false contact information may result in termination. You must immediately notify us of any unauthorized uses of your account.
              </p>
            </div>

            {/* 4. Use License */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                <span className="text-primary font-mono text-lg opacity-50">04.</span> Use License
              </h2>
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 space-y-4">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold">
                      <Ban className="size-4" />
                      <span>Restrictions</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Permission is granted to use Bycat AI's application for personal, commercial and non-commercial use. Under this license you may not:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                      <li>Resell or redistribute any parts of any components and templates.</li>
                      <li>Manually or programmatically download generated HTML, CSS, JS code (except via "HTML export").</li>
                      <li>Use exported code for building a commercial website builder or theme.</li>
                      <li>Inject malware or JS-mining software.</li>
                      <li>Upload forbidden documents, images or files forbidden by law.</li>
                      <li>Remove copyright notations or branding badges.</li>
                      <li>Make editions to the application code.</li>
                      <li>Host websites with adult content or phishing scams.</li>
                  </ul>
                  <p className="text-xs text-red-600/80 dark:text-red-400/80 pt-2 border-t border-red-500/10">
                      This license shall automatically terminate if you violate any of these restrictions.
                  </p>
              </div>
            </div>

             {/* 5. Disclaimer & 6. Limitations */}
             <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                      <span className="text-primary font-mono text-lg opacity-50">05.</span> Disclaimer
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                      The materials on Bycat AI's website or app are provided on an 'as is' basis. Bycat AI or <a href="https://skripe.com/" target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">SKRIPE AZ LLC</a> makes no warranties, expressed or implied. Further, Bycat AI does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials.
                      </p>
                  </div>
                  <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                      <span className="text-primary font-mono text-lg opacity-50">06.</span> Limitations
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                      In no event shall Bycat AI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit) arising out of the use or inability to use the materials on Bycat AI's website or app.
                      </p>
                  </div>
             </div>

             {/* 7. Modifications & 8. Pricing */}
             <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                  <span className="text-primary font-mono text-lg opacity-50">07-08.</span> Modifications & Pricing
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                   Bycat AI may revise these terms of service at any time without notice. By using this website you are agreeing to be bound by the then current version. Pricing plans may also be changed at any time.
                  </p>
             </div>


            {/* 9. Refund Policy */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                  <RefreshCcw className="size-6 text-primary" />
                  <h2 className="text-2xl font-semibold text-foreground">Refund Policy</h2>
              </div>

              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                  <h3 className="text-lg font-semibold text-foreground mb-2">30-Day Money-Back Guarantee</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                      We stand behind our product. If you are unsatisfied with our service for any reason, we offer a full refund on your <strong>Initial Purchase</strong>, provided the request is made within 30 calendar days from the date of that purchase.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="bg-background/50 p-4 rounded-lg">
                          <span className="font-semibold text-green-600 block mb-1">Eligible:</span>
                          First-time customers requesting within 30 days of initial purchase.
                      </div>
                      <div className="bg-background/50 p-4 rounded-lg">
                           <span className="font-semibold text-red-600 block mb-1">Not Eligible:</span>
                           Subscription renewals, upgrades, or subsequent purchases.
                      </div>
                  </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>How to Request:</strong> Contact support@skripe.com with title 'Refund Request for Bycat AI'. Include your email and transaction date.</p>
                  <p><strong>Processing:</strong> Refunds take 5-10 business days to appear in your account.</p>
              </div>
            </div>

            {/* 10. Signing Up */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                <span className="text-primary font-mono text-lg opacity-50">10.</span> Signing Up
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                By creating an account in the Bycat AI service you agree your website or app URL can be published in Bycat AI social networks and other communication channels and to receive company email newsletters. You can get instantly unsubscribed though.
              </p>
            </div>

            {/* Footer / Contact */}
            <div className="border-t border-border pt-12 mt-4 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Changes to These Terms</h2>
                <p className="text-muted-foreground">
                  <a href="https://skripe.com/" target="_blank" rel="noopener noreferrer" className="text-foreground font-semibold hover:underline hover:text-primary transition-colors">SKRIPE AZ LLC</a> reserves the right to update terms of use at any time. When we do, we will post a notification on the main page of our website and send emails to our customers.
                </p>
              </div>

              <div className="rounded-2xl bg-muted/50 border border-border p-8 text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">Have questions?</h3>
                <p className="text-muted-foreground mb-6">
                  If you have any questions about these Terms, please contact us.
                </p>
                <Button asChild size="lg" className="rounded-full px-8">
                  <a href="mailto:support@skripe.com">
                    <Mail className="mr-2 size-4" />
                    Contact Support
                  </a>
                </Button>
                <p className="mt-4 text-xs text-muted-foreground/60">
                  Company: <a href="https://skripe.com/" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary transition-colors font-medium">SKRIPE AZ LLC</a>
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
