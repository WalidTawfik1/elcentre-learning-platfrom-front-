import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

// Using flag icons from flagcdn.com or similar service
const getFlagIcon = (countryCode: string) => {
  return `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;
};

const countries: Country[] = [
  { code: "EG", name: "Egypt", flag: "EG", dialCode: "+20" },
  { code: "US", name: "United States", flag: "US", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", flag: "GB", dialCode: "+44" },
  { code: "CA", name: "Canada", flag: "CA", dialCode: "+1" },
  { code: "AU", name: "Australia", flag: "AU", dialCode: "+61" },
  { code: "DE", name: "Germany", flag: "DE", dialCode: "+49" },
  { code: "FR", name: "France", flag: "FR", dialCode: "+33" },
  { code: "IT", name: "Italy", flag: "IT", dialCode: "+39" },
  { code: "ES", name: "Spain", flag: "ES", dialCode: "+34" },
  { code: "NL", name: "Netherlands", flag: "NL", dialCode: "+31" },
  { code: "BE", name: "Belgium", flag: "BE", dialCode: "+32" },
  { code: "CH", name: "Switzerland", flag: "CH", dialCode: "+41" },
  { code: "AT", name: "Austria", flag: "AT", dialCode: "+43" },
  { code: "SE", name: "Sweden", flag: "SE", dialCode: "+46" },
  { code: "NO", name: "Norway", flag: "NO", dialCode: "+47" },
  { code: "DK", name: "Denmark", flag: "DK", dialCode: "+45" },
  { code: "FI", name: "Finland", flag: "FI", dialCode: "+358" },
  { code: "PL", name: "Poland", flag: "PL", dialCode: "+48" },
  { code: "CZ", name: "Czech Republic", flag: "CZ", dialCode: "+420" },
  { code: "SK", name: "Slovakia", flag: "SK", dialCode: "+421" },
  { code: "HU", name: "Hungary", flag: "HU", dialCode: "+36" },
  { code: "RO", name: "Romania", flag: "RO", dialCode: "+40" },
  { code: "BG", name: "Bulgaria", flag: "BG", dialCode: "+359" },
  { code: "GR", name: "Greece", flag: "GR", dialCode: "+30" },
  { code: "PT", name: "Portugal", flag: "PT", dialCode: "+351" },
  { code: "IE", name: "Ireland", flag: "IE", dialCode: "+353" },
  { code: "IS", name: "Iceland", flag: "IS", dialCode: "+354" },
  { code: "LU", name: "Luxembourg", flag: "LU", dialCode: "+352" },
  { code: "MT", name: "Malta", flag: "MT", dialCode: "+356" },
  { code: "CY", name: "Cyprus", flag: "CY", dialCode: "+357" },
  { code: "RU", name: "Russia", flag: "RU", dialCode: "+7" },
  { code: "UA", name: "Ukraine", flag: "UA", dialCode: "+380" },
  { code: "BY", name: "Belarus", flag: "BY", dialCode: "+375" },
  { code: "LT", name: "Lithuania", flag: "LT", dialCode: "+370" },
  { code: "LV", name: "Latvia", flag: "LV", dialCode: "+371" },
  { code: "EE", name: "Estonia", flag: "EE", dialCode: "+372" },
  { code: "MD", name: "Moldova", flag: "MD", dialCode: "+373" },
  { code: "AL", name: "Albania", flag: "AL", dialCode: "+355" },
  { code: "BA", name: "Bosnia and Herzegovina", flag: "BA", dialCode: "+387" },
  { code: "HR", name: "Croatia", flag: "HR", dialCode: "+385" },
  { code: "ME", name: "Montenegro", flag: "ME", dialCode: "+382" },
  { code: "MK", name: "North Macedonia", flag: "MK", dialCode: "+389" },
  { code: "RS", name: "Serbia", flag: "RS", dialCode: "+381" },
  { code: "SI", name: "Slovenia", flag: "SI", dialCode: "+386" },
  { code: "XK", name: "Kosovo", flag: "XK", dialCode: "+383" },
  { code: "JP", name: "Japan", flag: "JP", dialCode: "+81" },
  { code: "KR", name: "South Korea", flag: "KR", dialCode: "+82" },
  { code: "CN", name: "China", flag: "CN", dialCode: "+86" },
  { code: "IN", name: "India", flag: "IN", dialCode: "+91" },
  { code: "PK", name: "Pakistan", flag: "PK", dialCode: "+92" },
  { code: "BD", name: "Bangladesh", flag: "BD", dialCode: "+880" },
  { code: "LK", name: "Sri Lanka", flag: "LK", dialCode: "+94" },
  { code: "NP", name: "Nepal", flag: "NP", dialCode: "+977" },
  { code: "BT", name: "Bhutan", flag: "BT", dialCode: "+975" },
  { code: "MV", name: "Maldives", flag: "MV", dialCode: "+960" },
  { code: "TH", name: "Thailand", flag: "TH", dialCode: "+66" },
  { code: "VN", name: "Vietnam", flag: "VN", dialCode: "+84" },
  { code: "MY", name: "Malaysia", flag: "MY", dialCode: "+60" },
  { code: "SG", name: "Singapore", flag: "SG", dialCode: "+65" },
  { code: "PH", name: "Philippines", flag: "PH", dialCode: "+63" },
  { code: "ID", name: "Indonesia", flag: "ID", dialCode: "+62" },
  { code: "BN", name: "Brunei", flag: "BN", dialCode: "+673" },
  { code: "KH", name: "Cambodia", flag: "KH", dialCode: "+855" },
  { code: "LA", name: "Laos", flag: "LA", dialCode: "+856" },
  { code: "MM", name: "Myanmar", flag: "MM", dialCode: "+95" },
  { code: "SA", name: "Saudi Arabia", flag: "SA", dialCode: "+966" },
  { code: "AE", name: "United Arab Emirates", flag: "AE", dialCode: "+971" },
  { code: "QA", name: "Qatar", flag: "QA", dialCode: "+974" },
  { code: "KW", name: "Kuwait", flag: "KW", dialCode: "+965" },
  { code: "BH", name: "Bahrain", flag: "BH", dialCode: "+973" },
  { code: "OM", name: "Oman", flag: "OM", dialCode: "+968" },
  { code: "JO", name: "Jordan", flag: "JO", dialCode: "+962" },
  { code: "LB", name: "Lebanon", flag: "LB", dialCode: "+961" },
  { code: "SY", name: "Syria", flag: "SY", dialCode: "+963" },
  { code: "IQ", name: "Iraq", flag: "IQ", dialCode: "+964" },
  { code: "IR", name: "Iran", flag: "IR", dialCode: "+98" },
  { code: "AF", name: "Afghanistan", flag: "AF", dialCode: "+93" },
  { code: "TR", name: "Turkey", flag: "TR", dialCode: "+90" },
  { code: "IL", name: "Israel", flag: "IL", dialCode: "+972" },
  { code: "PS", name: "Palestine", flag: "PS", dialCode: "+970" },
  { code: "ZA", name: "South Africa", flag: "ZA", dialCode: "+27" },
  { code: "NG", name: "Nigeria", flag: "NG", dialCode: "+234" },
  { code: "KE", name: "Kenya", flag: "KE", dialCode: "+254" },
  { code: "GH", name: "Ghana", flag: "GH", dialCode: "+233" },
  { code: "ET", name: "Ethiopia", flag: "ET", dialCode: "+251" },
  { code: "TZ", name: "Tanzania", flag: "TZ", dialCode: "+255" },
  { code: "UG", name: "Uganda", flag: "UG", dialCode: "+256" },
  { code: "RW", name: "Rwanda", flag: "RW", dialCode: "+250" },
  { code: "MA", name: "Morocco", flag: "MA", dialCode: "+212" },
  { code: "DZ", name: "Algeria", flag: "DZ", dialCode: "+213" },
  { code: "TN", name: "Tunisia", flag: "TN", dialCode: "+216" },
  { code: "LY", name: "Libya", flag: "LY", dialCode: "+218" },
  { code: "SD", name: "Sudan", flag: "SD", dialCode: "+249" },
  { code: "BR", name: "Brazil", flag: "BR", dialCode: "+55" },
  { code: "AR", name: "Argentina", flag: "AR", dialCode: "+54" },
  { code: "CL", name: "Chile", flag: "CL", dialCode: "+56" },
  { code: "CO", name: "Colombia", flag: "CO", dialCode: "+57" },
  { code: "PE", name: "Peru", flag: "PE", dialCode: "+51" },
  { code: "VE", name: "Venezuela", flag: "VE", dialCode: "+58" },
  { code: "EC", name: "Ecuador", flag: "EC", dialCode: "+593" },
  { code: "UY", name: "Uruguay", flag: "UY", dialCode: "+598" },
  { code: "PY", name: "Paraguay", flag: "PY", dialCode: "+595" },
  { code: "BO", name: "Bolivia", flag: "BO", dialCode: "+591" },
  { code: "GY", name: "Guyana", flag: "GY", dialCode: "+592" },
  { code: "SR", name: "Suriname", flag: "SR", dialCode: "+597" },
  { code: "MX", name: "Mexico", flag: "MX", dialCode: "+52" },
  { code: "GT", name: "Guatemala", flag: "GT", dialCode: "+502" },
  { code: "BZ", name: "Belize", flag: "BZ", dialCode: "+501" },
  { code: "SV", name: "El Salvador", flag: "SV", dialCode: "+503" },
  { code: "HN", name: "Honduras", flag: "HN", dialCode: "+504" },
  { code: "NI", name: "Nicaragua", flag: "NI", dialCode: "+505" },
  { code: "CR", name: "Costa Rica", flag: "CR", dialCode: "+506" },
  { code: "PA", name: "Panama", flag: "PA", dialCode: "+507" },
];

export interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onCountryChange?: (countryCode: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, onCountryChange, placeholder, disabled, className, id, name, required, ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [selectedCountry, setSelectedCountry] = React.useState<Country>(countries[0]); // Default to Egypt
    const [phoneNumber, setPhoneNumber] = React.useState("");

    // Validate phone number to ensure it contains only numbers
    const validatePhoneNumber = (input: string): string => {
      // Remove all non-numeric characters
      return input.replace(/[^\d]/g, '');
    };

    // Format phone number for better display
    const formatPhoneNumber = (number: string): string => {
      // Remove all non-numeric characters first
      const cleaned = number.replace(/\D/g, '');
      
      // Format based on length - basic formatting
      if (cleaned.length <= 3) {
        return cleaned;
      } else if (cleaned.length <= 6) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
      } else if (cleaned.length <= 10) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      } else {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
      }
    };

    React.useEffect(() => {
      if (value) {
        // Try to parse the existing value to extract country code and number
        const country = countries.find(c => value.startsWith(c.dialCode));
        if (country) {
          setSelectedCountry(country);
          const phoneNumberPart = value.slice(country.dialCode.length);
          setPhoneNumber(validatePhoneNumber(phoneNumberPart));
        } else {
          setPhoneNumber(validatePhoneNumber(value));
        }
      }
    }, [value]);

    const handleCountrySelect = (country: Country) => {
      setSelectedCountry(country);
      setOpen(false);
      const newValue = country.dialCode + phoneNumber;
      onChange(newValue);
      if (onCountryChange) {
        onCountryChange(country.code);
      }
    };

    const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      
      // Validate and clean the input
      const cleanedInput = validatePhoneNumber(input);
      
      // Update phone number state with cleaned input
      setPhoneNumber(cleanedInput);
      
      // Construct the full phone number with country code
      const fullPhoneNumber = `${selectedCountry.dialCode}${cleanedInput}`;
      
      // Call the onChange callback with the full phone number
      if (onChange) {
        onChange(fullPhoneNumber);
      }
    };

    return (
      <div className={cn("flex", className)}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[140px] justify-between rounded-r-none border-r-0 bg-background h-10"
              disabled={disabled}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-4 flex items-center justify-center">
                  <img 
                    src={getFlagIcon(selectedCountry.code)} 
                    alt={`${selectedCountry.name} flag`}
                    className="w-5 h-4 object-cover rounded-sm"
                    onError={(e) => {
                      // Fallback to country code if image fails to load
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `<span class="text-xs font-medium text-muted-foreground">${selectedCountry.code}</span>`;
                    }}
                  />
                </div>
                <span className="text-sm font-medium truncate">{selectedCountry.dialCode}</span>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search countries..." />
              <CommandList>
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {countries.map((country) => (
                    <CommandItem
                      key={country.code}
                      value={`${country.name} ${country.dialCode}`}
                      onSelect={() => handleCountrySelect(country)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-5 h-4 flex items-center justify-center">
                          <img 
                            src={getFlagIcon(country.code)} 
                            alt={`${country.name} flag`}
                            className="w-5 h-4 object-cover rounded-sm"
                            onError={(e) => {
                              // Fallback to country code if image fails to load
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = `<span class="text-xs font-medium text-muted-foreground">${country.code}</span>`;
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium truncate">{country.name}</span>
                        <span className="text-sm text-muted-foreground ml-auto">{country.dialCode}</span>
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4 ml-2 flex-shrink-0",
                          selectedCountry.code === country.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Input
          ref={ref}
          id={id}
          name={name}
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          placeholder={placeholder || "Enter phone number"}
          disabled={disabled}
          required={required}
          className="rounded-l-none border-l-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
          pattern="[0-9\s\-\(\)]*"
          title="Please enter numbers only"
          inputMode="numeric"
          {...props}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
