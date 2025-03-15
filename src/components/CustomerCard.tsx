import React from 'react';
import { User, Mail, Phone, MapPin, Trash2 } from 'lucide-react';
import type { Customer } from '../types/customer';

interface CustomerCardProps {
  customer: Customer;
  onDelete: (id: string) => Promise<void>;
}

export const CustomerCard: React.FC<CustomerCardProps> = React.memo(({ customer, onDelete }) => {
  const handleDelete = async () => {
    if (window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
      await onDelete(customer.id);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <User className="h-10 w-10 text-purple-500" aria-hidden="true" />
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">{customer.name}</h3>
            <p className="text-sm text-gray-500">
              Eklenme: {new Date(customer.created_at).toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="text-gray-400 hover:text-red-500 transition-colors"
          aria-label={`${customer.name} müşterisini sil`}
        >
          <Trash2 className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
          <a href={`mailto:${customer.email}`} className="hover:text-purple-600">
            {customer.email}
          </a>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Phone className="h-4 w-4 mr-2" aria-hidden="true" />
          <a href={`tel:${customer.phone}`} className="hover:text-purple-600">
            {customer.phone}
          </a>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-2" aria-hidden="true" />
          <address className="not-italic">{customer.address}</address>
        </div>
      </div>
    </div>
  );
});

CustomerCard.displayName = 'CustomerCard';