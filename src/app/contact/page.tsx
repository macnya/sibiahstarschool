import { PageHeader } from '@/components/shared/page-header';
import { ContactForm } from '@/components/shared/contact-form';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import type { Metadata } from 'next';
import { getPageContent } from '@/lib/site-content/queries';

// Content on this page is admin-editable via /admin/content/contact and
// stored in Supabase, so it must be fetched fresh on every request
// rather than baked into a static build-time page.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Sibiah Star School. Find our address, contact details, and send us a message.',
};

export default async function ContactPage() {
  const content = await getPageContent('contact');

  return (
    <div>
      <PageHeader
        eyebrow={content.header.eyebrow}
        title={content.header.title}
        subtitle={content.header.subtitle}
      />

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form Section */}
            <div>
              <h2 className="text-2xl font-bold text-primary mb-6">Send Us a Message</h2>
              <ContactForm />
            </div>

            {/* Contact Details Section */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-6">Our Contact Information</h2>
                <div className="bg-card border-t-4 border-accent rounded-md p-6 space-y-4">
                  <div className="flex items-start">
                    <MapPin className="h-6 w-6 mr-3 mt-1 text-accent flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-primary">Address</h3>
                      <p className="text-foreground/80">{content.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Phone className="h-6 w-6 mr-3 mt-1 text-accent flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-primary">Phone</h3>
                      <a href={`tel:${content.phoneHref}`} className="text-foreground/80 hover:text-accent">{content.phoneDisplay}</a>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Mail className="h-6 w-6 mr-3 mt-1 text-accent flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-primary">Email</h3>
                      <a href={`mailto:${content.email}`} className="text-foreground/80 hover:text-accent">{content.email}</a>
                    </div>
                  </div>
                   <div className="flex items-start">
                    <Clock className="h-6 w-6 mr-3 mt-1 text-accent flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-primary">Office Hours</h3>
                      <p className="text-foreground/80">{content.officeHours.weekday}</p>
                      <p className="text-foreground/80">{content.officeHours.saturday}</p>
                      <p className="text-foreground/80">{content.officeHours.sunday}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Map Placeholder */}
              <div>
                <h2 className="text-2xl font-bold text-primary mb-6">Find Us On Map</h2>
                <div className="bg-card border-t-4 border-accent rounded-md overflow-hidden">
                  {/* Replace with actual map embed code later */}
                  <div className="aspect-[16/9] bg-secondary flex items-center justify-center">
                    <p className="text-muted-foreground">Google Map will be embedded here.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
