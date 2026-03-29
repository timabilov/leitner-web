import { Link } from "react-router-dom";
import {
  Shield,
  Mail,
  User,
  CreditCard,
  FileImage,
  Activity,
  Lock,
  Trash2,
  Cookie,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGrid, FloatingBlobs } from "@/login";

export default function PrivacyPolicy() {
  return (
    <main className="bg-background text-foreground min-h-screen w-full flex flex-col relative overflow-hidden">
      <AnimatedGrid />
      <FloatingBlobs />

      <section className="py-12 md:py-24 relative z-10">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Navigation */}
          <div className="mb-12">
            <Button
              variant="ghost"
              asChild
              className="hover:text-primary pl-0 transition-colors hover:bg-transparent"
            >
              <Link
                to="/"
                className="text-muted-foreground flex items-center gap-2"
              >
                <ArrowLeft className="size-4" />
                Back to Home
              </Link>
            </Button>
          </div>

          {/* Header */}
          <div className="mb-12 space-y-4">
            <div className="border-primary/20 bg-primary/5 text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
              <Shield className="size-3.5" />
              Legal Documentation
            </div>
            <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground text-lg">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Main Content */}
          <div className="grid gap-12">
            {/* 1. General Statement */}
            <div className="text-muted-foreground space-y-6 text-lg leading-relaxed">
              <p>
                At{" "}
                <a
                  href="https://skripe.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground decoration-primary/50 font-bold underline-offset-4 transition-all hover:underline"
                >
                  SKRIPE AZ LLC
                </a>
                , we are committed to protecting your privacy and ensuring you
                have a positive experience, as we may collect the necessary data
                from you across our website,{" "}
                <a
                  href="https://app.bycat.ai/"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  https://app.bycat.ai/
                </a>
                , mobile apps, and other sites we own and operate for
                functionality of Bycat AI.
              </p>
              <p>
                We only ask for personal information when we truly need it to
                provide a service to you. We collect it by fair and lawful
                means, with your knowledge and consent. We also let you know why
                we're collecting it and how it will be used.
              </p>
              <p>
                We only retain collected information for as long as necessary to
                provide you with your requested service. What data we store,
                we'll protect within commercially acceptable means to prevent
                loss and theft, as well as unauthorised access, disclosure,
                copying, use or modification.
              </p>
              <p>
                We don't share any personally identifying information publicly
                or with third-parties, except when required to by law.
              </p>
            </div>

            {/* 2. Data Collection Grid */}
            <div className="space-y-6">
              <h2 className="text-foreground text-2xl font-semibold">
                Data We Collect
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Name */}
                <div className="border-border/50 bg-background/50 rounded-2xl border p-6 backdrop-blur-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                      <User className="size-4" />
                    </div>
                    <h3 className="text-foreground font-semibold">Name</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    We collect your full name to personalize your experience and
                    allow us to better service your needs in relation to our
                    products.
                  </p>
                </div>

                {/* Email */}
                <div className="border-border/50 bg-background/50 rounded-2xl border p-6 backdrop-blur-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-violet-500/10 text-violet-500">
                      <Mail className="size-4" />
                    </div>
                    <h3 className="text-foreground font-semibold">
                      Email Address
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Required for authentication and secure access. We may also
                    use it to communicate important information about our
                    services.
                  </p>
                </div>

                {/* Media */}
                <div className="border-border/50 bg-background/50 rounded-2xl border p-6 backdrop-blur-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                      <FileImage className="size-4" />
                    </div>
                    <h3 className="text-foreground font-semibold">
                      Media & Recordings
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Photos, voices, and documents you upload as part of product
                    services so you can access your notes at any time.
                  </p>
                </div>

                {/* Financial */}
                <div className="border-border/50 bg-background/50 rounded-2xl border p-6 backdrop-blur-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                      <CreditCard className="size-4" />
                    </div>
                    <h3 className="text-foreground font-semibold">
                      Financial Data
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Purchase history, date, and time of transactions to
                    understand consumer behavior and improve our offerings.
                  </p>
                </div>

                {/* Crash Reports */}
                <div className="border-border/50 bg-background/50 rounded-2xl border p-6 backdrop-blur-sm md:col-span-2">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                      <Activity className="size-4" />
                    </div>
                    <h3 className="text-foreground font-semibold">
                      App Activity & Crash Reports
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    We monitor app performance to identify and fix potential
                    issues swiftly, ensuring stability and a better user
                    experience.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Security Section */}
            <div className="bg-muted/30 space-y-6 rounded-3xl p-8">
              <div className="flex items-start gap-4">
                <div className="bg-background border-border mt-1 flex size-10 shrink-0 items-center justify-center rounded-full border">
                  <Lock className="text-foreground size-5" />
                </div>
                <div>
                  <h2 className="text-foreground mb-2 text-xl font-semibold">
                    Data Protection & Security
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We implement robust security measures to protect your
                    personal data against unauthorized access, alteration,
                    disclosure, or destruction. We restrict access to personal
                    information to{" "}
                    <a
                      href="https://skripe.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-primary font-medium transition-colors hover:underline"
                    >
                      SKRIPE AZ LLC
                    </a>{" "}
                    employees, contractors, and agents who need to know that
                    information in order to process it for us and who are
                    subject to strict contractual confidentiality obligations.
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Account Retention */}
            <div className="bg-muted/30 space-y-6 rounded-3xl p-8">
              <div className="flex items-start gap-4">
                <div className="bg-background border-border mt-1 flex size-10 shrink-0 items-center justify-center rounded-full border">
                  <Trash2 className="text-foreground size-5" />
                </div>
                <div>
                  <h2 className="text-foreground mb-2 text-xl font-semibold">
                    Account & Data Retention
                  </h2>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    You can delete your account and all associated data by visiting your account settings and pressing the "Delete account" button. Due to regulatory compliance your data will be deleted after not logging in to your account for 90 days. Please contact us{" "}
                    <Link to="/account-removal" className="text-primary hover:underline font-medium hover:text-primary/80 transition-colors">
                      here
                    </Link>{" "}
                    to request account deletion or if you have any questions.
                  </p>
                  <div className="inline-block rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400">
                    Warning: Due to regulatory compliance, your data will be
                    automatically deleted after not logging in to your account
                    for 90 days.
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Cookie Policy */}
            <div className="space-y-4">
              <div className="mb-2 flex items-center gap-2">
                <Cookie className="text-primary size-5" />
                <h2 className="text-foreground text-2xl font-semibold">
                  Cookie Policy
                </h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files sent by the server to the user's
                device. Cookies perform many functions, for example, they allow
                to save the settings made by the user, allow the user to move
                between pages after signing in and, on the whole, make working
                on a website easier.
              </p>
              <ul className="text-muted-foreground list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-foreground">Identification:</strong>{" "}
                  Cookie files allow website providers to recognise your device
                  and your Account so they don't have to request your login
                  details and password every time you go to another page.
                </li>
                <li>
                  <strong className="text-foreground">Analytics:</strong> Cookie
                  files allow us to obtain information about how many times this
                  or that page was viewed.
                </li>
              </ul>
              <p className="text-muted-foreground mt-2 text-sm italic">
                The user has the right to set the browser to refuse cookies but
                this will substantially limit their ability to use the Platform.
              </p>
            </div>

            {/* 6. Footer / Contact */}
            <div className="border-border mt-4 space-y-6 border-t pt-12">
              <div>
                <h2 className="text-foreground mb-2 text-xl font-semibold">
                  Changes to This Privacy Policy
                </h2>
                <p className="text-muted-foreground">
                  <a
                    href="https://skripe.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-primary font-semibold transition-colors hover:underline"
                  >
                    SKRIPE AZ LLC
                  </a>{" "}
                  reserves the right to update this privacy policy at any time.
                  When we do, we will post a notification on the main page of
                  our website and send emails to our customers. We encourage
                  Users to frequently check this page for any changes.
                </p>
              </div>

              <div className="bg-primary/5 border-primary/10 rounded-2xl border p-8 text-center">
                <h3 className="text-foreground mb-2 text-lg font-semibold">
                  Have questions?
                </h3>
                <p className="text-muted-foreground mb-6">
                  If you have any questions about this Privacy Policy, please
                  contact us.
                </p>
                <Button asChild size="lg" className="rounded-full px-8">
                  <a href="mailto:support@skripe.com">
                    <Mail className="mr-2 size-4" />
                    Contact Support
                  </a>
                </Button>
                <p className="text-muted-foreground/60 mt-4 text-xs">
                  Company:{" "}
                  <a
                    href="https://skripe.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary font-medium transition-colors hover:underline"
                  >
                    SKRIPE AZ LLC
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
