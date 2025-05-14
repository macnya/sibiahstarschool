import { PageHeader } from '@/components/shared/page-header';
import { ContactForm } from '@/components/shared/contact-form';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Sibiah Star School. Find our address, contact details, and send us a message.',
};

export default function ContactPage() {
  return (
    <div>
      <PageHeader
        title="Contact Us"
        subtitle="We're here to help and answer any questions you might have. We look forward to hearing from you!"
      />

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form Section */}
            <div>
              <h2 className="text-2xl font-bold text-primary mb-6">Send Us a Message</h2>
              <ContactForm />
            </div>

            {/* Contact Details Section */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-6">Our Contact Information</h2>
                <div className="bg-card p-6 rounded-lg shadow-lg space-y-4">
                  <div className="flex items-start">
                    <MapPin className="h-6 w-6 mr-3 mt-1 text-accent flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-primary">Address</h3>
                      <p className="text-foreground/80">Sibiah Star School, Baraka Mowlem, Behind Kinyago Secondary School, Nairobi.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Phone className="h-6 w-6 mr-3 mt-1 text-accent flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-primary">Phone</h3>
                      <a href="tel:+1234567890" className="text-foreground/80 hover:text-accent">(123) 456-7890</a>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Mail className="h-6 w-6 mr-3 mt-1 text-accent flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-primary">Email</h3>
                      <a href="mailto:info@sibiahstar.edu" className="text-foreground/80 hover:text-accent">sibiahstarschool@gmail.com</a>
                    </div>
                  </div>
                   <div className="flex items-start">
                    <Clock className="h-6 w-6 mr-3 mt-1 text-accent flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-primary">Office Hours</h3>
                      <p className="text-foreground/80">Monday - Friday: 8:00 AM - 4:00 PM</p>
                      <p className="text-foreground/80">Saturday: 9:00 AM - 12:00 PM (Admissions Office Only)</p>
                      <p className="text-foreground/80">Sunday: Closed</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Map Placeholder */}
              <div>
                <h2 className="text-2xl font-bold text-primary mb-6">Find Us On Map</h2>
                <div className="bg-card rounded-lg shadow-lg overflow-hidden">
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
