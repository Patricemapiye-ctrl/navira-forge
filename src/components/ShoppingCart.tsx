import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCart as CartIcon, Trash2, Plus, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface CartItem {
  id: string;
  item_name: string;
  item_code: string;
  unit_price: number;
  quantity: number;
  available_stock: number;
}

interface ShoppingCartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

const ShoppingCart = ({ items, onUpdateQuantity, onRemoveItem, onCheckout }: ShoppingCartProps) => {
  const total = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative border-primary text-primary hover:bg-primary hover:text-white">
          <CartIcon className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-primary text-white">
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-hardware-dark border-primary/20 text-white w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-primary">Shopping Cart ({itemCount} items)</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-hardware-light">
              <CartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-hardware-steel/20 border border-primary/10 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{item.item_name}</h4>
                        <p className="text-sm text-hardware-light">{item.item_code}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveItem(item.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-primary/20"
                          onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-12 text-center font-semibold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-primary/20"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.available_stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-hardware-light">${item.unit_price.toFixed(2)} each</p>
                        <p className="font-semibold text-primary">
                          ${(item.unit_price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {item.available_stock <= 5 && (
                      <p className="text-xs text-orange-400 mt-2">Only {item.available_stock} left in stock</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t border-primary/20 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-white">Total:</span>
                  <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
                </div>
                <Button
                  onClick={onCheckout}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  size="lg"
                >
                  Proceed to Checkout
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ShoppingCart;
