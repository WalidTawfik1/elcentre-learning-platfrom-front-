import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Wallet, Loader2 } from "lucide-react";
import { PaymentMethod } from "@/services/payment-service";

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethods: PaymentMethod[];
  onPaymentMethodSelected: (method: 'card' | 'wallet') => void;
  isLoading?: boolean;
  courseTitle?: string;
  coursePrice?: number;
}

export function PaymentMethodDialog({
  open,
  onOpenChange,
  paymentMethods,
  onPaymentMethodSelected,
  isLoading = false,
  courseTitle,
  coursePrice
}: PaymentMethodDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'wallet'>('card');

  const handleProceed = () => {
    onPaymentMethodSelected(selectedMethod);
  };

  const getIcon = (method: 'card' | 'wallet') => {
    switch (method) {
      case 'card':
        return <CreditCard className="h-5 w-5" />;
      case 'wallet':
        return <Wallet className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Payment Method</DialogTitle>
          <DialogDescription>
            {courseTitle && coursePrice && (
              <span>
                Complete your enrollment for <strong>{courseTitle}</strong> 
                {" "}({coursePrice.toFixed(2)} LE)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup 
            value={selectedMethod} 
            onValueChange={(value) => setSelectedMethod(value as 'card' | 'wallet')}
            className="space-y-3"
          >
            {paymentMethods.map((method) => (
              <Label 
                key={method.value}
                htmlFor={method.value} 
                className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedMethod === method.value 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedMethod(method.value)}
              >
                <RadioGroupItem value={method.value} id={method.value} />
                <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                  {getIcon(method.value)}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{method.label}</div>
                  <div className="text-sm text-muted-foreground">{method.description}</div>
                </div>
              </Label>
            ))}
          </RadioGroup>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleProceed}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Proceed to Payment"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
