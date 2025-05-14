import Link from 'next/link';
import { School, Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-gray-300 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <School className="h-8 w-8 text-accent" />
              <span className="text-xl font-bold text-white">Sibiah Star School</span>
            </div>
            <p className="text-sm">
              Nurturing young minds for a bright future. Serving Pre-school, Primary, and Junior Secondary levels.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-accent transition-colors">About Us</Link></li>
              <li><Link href="/admissions" className="hover:text-accent transition-colors">Admissions</Link></li>
              <li><Link href="/curriculum" className="hover:text-accent transition-colors">Curriculum</Link></li>
              <li><Link href="/contact" className="hover:text-accent transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Contact Info</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 mt-0.5 text-accent flex-shrink-0" />
                <span>123 Education Lane, Knowledge City, KC 12345</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-accent flex-shrink-0" />
                <a href="tel:+1234567890" className="hover:text-accent transition-colors">(123) 456-7890</a>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-accent flex-shrink-0" />
                <a href="mailto:info@sibiahstar.edu" className="hover:text-accent transition-colors">info@sibiahstar.edu</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm">
          <p>&copy; {currentYear} Sibiah Star Pre-school, Primary & Junior School. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
