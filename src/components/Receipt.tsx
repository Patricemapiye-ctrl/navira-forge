import { forwardRef } from "react";
import { Wrench } from "lucide-react";

interface ReceiptProps {
  sale: {
    sale_number: string;
    sale_date: string;
    total_amount: number;
    payment_method: string;
    customer_name?: string;
    customer_contact?: string;
    items: Array<{
      item_name: string;
      quantity: number;
      unit_price: number;
      subtotal: number;
    }>;
  };
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ sale }, ref) => {
  return (
    <div ref={ref} className="p-8 max-w-md mx-auto bg-white text-black">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Wrench className="h-8 w-8 text-orange-500" />
          <h1 className="text-2xl font-bold">NAVIRA HARDWARE</h1>
        </div>
        <p className="text-sm text-gray-600">Hardware Management System</p>
        <div className="border-b-2 border-dashed border-gray-300 my-4"></div>
      </div>

      <div className="mb-4 text-sm">
        <div className="flex justify-between mb-1">
          <span className="font-semibold">Sale #:</span>
          <span>{sale.sale_number}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span className="font-semibold">Date:</span>
          <span>{new Date(sale.sale_date).toLocaleString()}</span>
        </div>
        {sale.customer_name && (
          <div className="flex justify-between mb-1">
            <span className="font-semibold">Customer:</span>
            <span>{sale.customer_name}</span>
          </div>
        )}
        {sale.customer_contact && (
          <div className="flex justify-between mb-1">
            <span className="font-semibold">Contact:</span>
            <span>{sale.customer_contact}</span>
          </div>
        )}
        <div className="flex justify-between mb-1">
          <span className="font-semibold">Payment:</span>
          <span className="uppercase">{sale.payment_method}</span>
        </div>
      </div>

      <div className="border-b-2 border-dashed border-gray-300 my-4"></div>

      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="text-left py-2">Item</th>
            <th className="text-center py-2">Qty</th>
            <th className="text-right py-2">Price</th>
            <th className="text-right py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-2">{item.item_name}</td>
              <td className="text-center py-2">{item.quantity}</td>
              <td className="text-right py-2">R{item.unit_price.toFixed(2)}</td>
              <td className="text-right py-2">R{item.subtotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t-2 border-gray-300 pt-4 mb-6">
        <div className="flex justify-between text-xl font-bold">
          <span>TOTAL:</span>
          <span>R{sale.total_amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-center text-xs text-gray-600 space-y-1">
        <p>Thank you for your business!</p>
        <p className="border-t border-gray-300 pt-2 mt-2">Powered by Tyger</p>
      </div>
    </div>
  );
});

Receipt.displayName = "Receipt";

export default Receipt;
