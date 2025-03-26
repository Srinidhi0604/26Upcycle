import { useState, useEffect } from 'react';
import { withAuth } from '@/components/auth/withAuth';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface SavedItem {
  id: string;
  product_id: string;
  user_id: string;
  created_at: string;
  product: {
    id: string;
    title: string;
    price: number;
    images: string[];
    seller_id: string;
    sold: boolean;
  };
}

function SavedItemsPage() {
  const { user } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSavedItems() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('saved_items')
          .select(`
            id,
            product_id,
            user_id,
            created_at,
            product:products(
              id,
              title,
              price,
              images,
              seller_id,
              sold
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSavedItems((data as unknown) as SavedItem[] || []);
      } catch (error) {
        console.error('Error loading saved items:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSavedItems();
  }, [user]);

  const removeSavedItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Remove the item from the state
      setSavedItems(savedItems.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing saved item:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Saved Items</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          {loading ? (
            <div className="py-10 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading your saved items...</p>
            </div>
          ) : savedItems.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-gray-600">You haven't saved any items yet.</p>
              <p className="mt-2">
                <Link href="/products" className="text-indigo-600 hover:underline">
                  Browse products
                </Link>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedItems.map((item) => (
                <div key={item.id} className="border rounded-lg overflow-hidden shadow-sm">
                  {item.product.images && item.product.images.length > 0 && (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={item.product.images[0]} 
                        alt={item.product.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-medium text-lg mb-1">{item.product.title}</h3>
                    <p className="text-gray-500 mb-2">${(item.product.price / 100).toFixed(2)}</p>
                    <div className="flex justify-between items-center mt-4">
                      <span className={`px-2 py-1 rounded text-xs ${item.product.sold ? 'bg-gray-200' : 'bg-green-100 text-green-800'}`}>
                        {item.product.sold ? 'Sold' : 'Available'}
                      </span>
                      <div className="space-x-2">
                        <Link href={`/products/${item.product_id}`} passHref>
                          <button className="text-sm text-indigo-600 hover:underline">
                            View
                          </button>
                        </Link>
                        <button 
                          onClick={() => removeSavedItem(item.id)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export with auth protection, only allowing collectors and users with "both" role
export default withAuth(SavedItemsPage, {
  requireAuth: true,
  allowedUserTypes: ['collector', 'both']
}); 